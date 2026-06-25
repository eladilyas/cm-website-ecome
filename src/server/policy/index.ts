// Central authorization policy.
//
// One file decides every "can this actor see / mutate this resource"
// question. Page-level guards (requireAdmin / requireSuperAdmin) deal
// with route protection; this layer deals with ROW-LEVEL ownership
// (e.g. "pre-sales reps only see their assigned customers").
//
// Design:
//   • Actor = { userId, roles[] } resolved from the Better-Auth session
//     via `loadActor()`.
//   • Predicates return `true | false`; scope helpers return either
//     `null` (no restriction — see everything) or a filter the caller
//     applies to its query.
//   • Pre-sales scoping is keyed by **customer email** because that's
//     the single stable identifier shared by every customer surface
//     (User row, Order.contact.email, FinancingRequest.contact.email,
//     LeadAssignment.customerEmail).
//
// Keep authorization decisions HERE. Don't sprinkle `if (role === ...)`
// checks across pages — call into this module instead.

import { cache } from "react";

import { db } from "@/server/db";
import {
  getServerSession,
  getUserRoles,
} from "@/server/auth-helpers";
import {
  ROLE_SLUGS,
  isAdminRole,
  type RoleSlug,
} from "@/server/rbac/catalog";

// ── Actor ──────────────────────────────────────────────────────────────

export type Actor = Readonly<{
  userId: string;
  email: string;
  roles: RoleSlug[];
  isSuperAdmin: boolean;
  /** Admin tier — super-admin OR admin. */
  isAdmin: boolean;
  /** Pre-sales rep (and NOT admin tier). Owns customers. */
  isPresales: boolean;
  /** Dispatcher (and NOT admin tier). Owns orders. */
  isDispatcher: boolean;
}>;

export const loadActor = cache(async (): Promise<Actor | null> => {
  const session = await getServerSession();
  if (!session?.user) return null;
  const roles = await getUserRoles();
  const isSuper = roles.includes(ROLE_SLUGS.superAdmin);
  const isAdminRoleAssigned = roles.some(isAdminRole);
  return {
    userId: session.user.id,
    email: session.user.email,
    roles,
    isSuperAdmin: isSuper,
    isAdmin: isAdminRoleAssigned,
    isPresales: !isAdminRoleAssigned && roles.includes(ROLE_SLUGS.presales),
    isDispatcher: !isAdminRoleAssigned && roles.includes(ROLE_SLUGS.dispatcher),
  };
});

// ── Customer scope ─────────────────────────────────────────────────────
// "Which customer-emails can this actor see?" Used by every admin page
// that lists customer-keyed data (orders, financing, leads). Returns
// `null` for super-admin / admin (no scope restriction) and a string[]
// for pre-sales (the emails they own via LeadAssignment).

export type CustomerScope =
  | { kind: "all" } // no restriction
  | { kind: "by-email"; emails: string[] }; // restricted set

/** Resolve the customer-email scope for the current actor. */
export const customerScopeFor = cache(
  async (actor: Actor | null): Promise<CustomerScope> => {
    if (!actor) return { kind: "by-email", emails: [] }; // signed-out → nothing
    if (actor.isAdmin) return { kind: "all" };
    if (actor.isPresales) {
      const rows = await db.leadAssignment.findMany({
        where: { assignedToUserId: actor.userId },
        select: { customerEmail: true },
      });
      return { kind: "by-email", emails: rows.map((r) => r.customerEmail) };
    }
    return { kind: "by-email", emails: [] };
  },
);

/** Whether the actor can see the customer at this email. */
export async function canSeeCustomer(
  actor: Actor | null,
  customerEmail: string,
): Promise<boolean> {
  const scope = await customerScopeFor(actor);
  if (scope.kind === "all") return true;
  return scope.emails.includes(customerEmail.toLowerCase());
}

// ── Order scope (dispatcher) ───────────────────────────────────────────
// Dispatchers own ORDERS via OrderAssignment, keyed by orderRef. This
// is distinct from customer scope (LeadAssignment) — pre-sales reps see
// every UNPAID order from their assigned customers; dispatchers see
// every PAID-and-beyond order assigned to them, regardless of which
// customer placed it.

export type OrderScope =
  | { kind: "all" } // admin / super-admin
  | { kind: "by-ref"; refs: string[] }; // dispatcher / nobody

/** Resolve the order-ref scope for the current actor. */
export const dispatcherScopeFor = cache(
  async (actor: Actor | null): Promise<OrderScope> => {
    if (!actor) return { kind: "by-ref", refs: [] };
    if (actor.isAdmin) return { kind: "all" };
    if (actor.isDispatcher) {
      const rows = await db.orderAssignment.findMany({
        where: { assignedToUserId: actor.userId },
        select: { orderRef: true },
      });
      return { kind: "by-ref", refs: rows.map((r) => r.orderRef) };
    }
    return { kind: "by-ref", refs: [] };
  },
);

// ── Per-order predicates ───────────────────────────────────────────────
// One predicate per (role, order-lifecycle-bucket). These are the
// single source of truth the admin pages call into — never duplicate
// the role-check elsewhere.

/** Order lifecycle bucket. Re-exports the classifier from
 *  `src/server/orders/status` so policy + service speak one language. */
export { classifyOrderStatus, type OrderBucket } from "@/server/orders/status";
import { classifyOrderStatus as classify } from "@/server/orders/status";
import type { OrderStatus } from "@prisma/client";

import type { OrderType } from "@prisma/client";

type OrderForPolicy = Readonly<{
  ref: string;
  status: OrderStatus;
  /** Order classification — STANDARD vs FINANCING. Drives the
   *  dispatcher exclusion: financing orders are invisible to
   *  dispatchers until the financing decision clears them into the
   *  fulfilment bucket. */
  orderType?: OrderType;
  contact: { email: string };
}>;

/**
 * Whether the actor can see this particular order.
 *
 * Admin tier: yes.
 * Pre-sales:  • Standard orders in the "unpaid" bucket, scoped to
 *               their LeadAssignment customers.
 *             • EVERY financing order regardless of customer scope
 *               (pre-sales is the validation layer; assigning
 *               financing files per-customer would hide queue items
 *               from the only team that can clear them).
 * Dispatcher: order ref is in their OrderAssignment scope AND the
 *             order is in the "fulfilment" bucket. Financing orders
 *             in PENDING_FINANCING_APPROVAL never reach dispatchers
 *             because that status is in the "unpaid" bucket.
 *             FINANCING_REJECTED is terminal and also excluded.
 */
export async function canSeeOrder(
  actor: Actor | null,
  order: OrderForPolicy,
): Promise<boolean> {
  if (!actor) return false;
  if (actor.isAdmin) return true;

  const bucket = classify(order.status);
  const isFinancing = order.orderType === "FINANCING";

  if (actor.isPresales) {
    // Pre-sales sees every financing order (validation layer).
    if (isFinancing) return true;
    // For standard orders, fall back to the customer-scope rule.
    if (bucket !== "unpaid") return false;
    return canSeeCustomer(actor, order.contact.email);
  }

  if (actor.isDispatcher) {
    // Dispatchers never see financing orders that haven't cleared
    // into fulfilment, AND never see terminal-rejected financing.
    if (bucket !== "fulfilment") return false;
    const scope = await dispatcherScopeFor(actor);
    if (scope.kind === "all") return true;
    return scope.refs.includes(order.ref);
  }

  return false;
}

/**
 * Whether the actor can transition the order's status. Admin tier
 * always; dispatcher only on orders they own; pre-sales never.
 */
export async function canUpdateOrderStatus(
  actor: Actor | null,
  order: OrderForPolicy,
): Promise<boolean> {
  if (!actor) return false;
  if (actor.isAdmin) return true;
  if (actor.isDispatcher) {
    const scope = await dispatcherScopeFor(actor);
    if (scope.kind === "all") return true;
    return scope.refs.includes(order.ref);
  }
  return false;
}

// ── Per-resource decisions ─────────────────────────────────────────────
// Helpers used by pages + future API routes. Each returns boolean so
// the caller decides how to respond (404, 403, hide UI, etc.).

/** Catalog read — products + categories — is open to ALL admin-side
 *  users (super-admin / admin / pre-sales). Customers (no admin role)
 *  read the public catalog through the unauthenticated /shop route. */
export function canReadCatalog(actor: Actor | null): boolean {
  return Boolean(
    actor &&
      (actor.isAdmin ||
        actor.isPresales ||
        actor.roles.length > 0),
  );
}

/** Mutating the catalog — only admin OR super-admin. */
export function canWriteCatalog(actor: Actor | null): boolean {
  return Boolean(actor?.isAdmin);
}

/** User management is super-admin only. Don't broaden this without
 *  a deliberate decision — even admins can't grant roles. */
export function canManageUsers(actor: Actor | null): boolean {
  return Boolean(actor?.isSuperAdmin);
}

/** Lead (customer) assignments — read by everyone with an admin-side
 *  role, write by super-admin only. */
export function canReadAssignments(actor: Actor | null): boolean {
  return Boolean(actor?.isAdmin || actor?.isPresales);
}
export function canWriteAssignments(actor: Actor | null): boolean {
  return Boolean(actor?.isSuperAdmin);
}

/** Order assignments — read by admin tier + dispatchers (their own).
 *  Write by admin tier (super-admin or admin). */
export function canReadOrderAssignments(actor: Actor | null): boolean {
  return Boolean(actor?.isAdmin || actor?.isDispatcher);
}
export function canWriteOrderAssignments(actor: Actor | null): boolean {
  return Boolean(actor?.isAdmin);
}
