// Order service — every read + write goes through here so the API
// routes, server components, and admin actions all enforce the same
// shape, money model, and audit invariants.
//
// Money model: integer minor units in Postgres. The customer-facing
// flows still think in MAD whole units, so this module exposes a
// "DisplayOrder" type that's pre-converted for rendering. Server
// components that just need to display data should consume the
// DisplayOrder shape rather than raw Prisma rows.

import { z } from "zod";

import { db } from "@/server/db";
import { generateOrderRef } from "@/lib/refs";
import { VAT_RATE } from "@/lib/commerceConstants";
import {
  canSeeOrder,
  customerScopeFor,
  dispatcherScopeFor,
  loadActor,
  type Actor,
} from "@/server/policy";
import {
  FULFILMENT_STATUSES,
  UNPAID_STATUSES,
  canTransitionTo,
  initialStatusForMethod,
} from "./status";
import type { Order, OrderItem, OrderStatus, OrderType, PaymentMethod } from "@prisma/client";

// ── Display shape ──────────────────────────────────────────────────────
// What server components render. Money is pre-converted to whole MAD
// units; nested arrays are populated; embedded payment proof JSON is
// typed.

export type DisplayPaymentProof = Readonly<{
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** base64 data: URI for now. Production swaps to an R2 signed URL. */
  dataUrl: string;
  uploadedAt: number;
}>;

export type DisplayOrderItem = Readonly<{
  id: string;
  slug: string;
  name: string;
  subline: string | null;
  qty: number;
  unitPrice: number; // MAD (whole)
  lineTotal: number; // MAD (whole)
}>;

export type DisplayOrder = Readonly<{
  id: string;
  ref: string;
  customerId: string;
  status: OrderStatus;
  /** STANDARD vs FINANCING. Drives visibility + UI labels — the
   *  admin/customer order pages can show a "Financing pending"
   *  badge instead of a generic status when orderType=FINANCING. */
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  contact: { fullName: string; email: string; phone: string };
  company: { name: string | null; ice: string | null };
  shipping: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    notes: string | null;
  };
  items: DisplayOrderItem[];
  totals: {
    itemCount: number;
    subtotal: number;
    vat: number;
    shipping: number;
    total: number;
  };
  trackingNumber: string | null;
  internalNotes: string | null;
  paymentProof: DisplayPaymentProof | null;
  createdAt: number; // ms
  updatedAt: number; // ms
}>;

const minorToWhole = (minor: number): number => Math.round(minor) / 100;
const wholeToMinor = (whole: number): number => Math.round(whole * 100);

function toDisplay(
  row: Order & { items: OrderItem[] },
): DisplayOrder {
  const items = row.items.map((it) => ({
    id: it.id,
    slug: it.productSlug,
    name: it.name,
    subline: it.subline,
    qty: it.qty,
    unitPrice: minorToWhole(it.unitPriceMinor),
    lineTotal: minorToWhole(it.lineTotalMinor),
  }));
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const proof = (row.paymentProofJson ?? null) as DisplayPaymentProof | null;
  return {
    id: row.id,
    ref: row.ref,
    customerId: row.customerId,
    status: row.status,
    orderType: row.orderType,
    paymentMethod: row.paymentMethod,
    contact: {
      fullName: row.contactFullName,
      email: row.contactEmail,
      phone: row.contactPhone,
    },
    company: {
      name: row.contactCompanyName,
      ice: row.contactCompanyIce,
    },
    shipping: {
      street: row.shippingStreet,
      city: row.shippingCity,
      postalCode: row.shippingPostalCode,
      country: row.shippingCountry,
      notes: row.shippingNotes,
    },
    items,
    totals: {
      itemCount,
      subtotal: minorToWhole(row.subtotalMinor),
      vat: minorToWhole(row.taxTotalMinor),
      shipping: minorToWhole(row.shippingTotalMinor),
      total: minorToWhole(row.grandTotalMinor),
    },
    trackingNumber: row.trackingNumber,
    internalNotes: row.internalNotes,
    paymentProof: proof,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

// ── Create ─────────────────────────────────────────────────────────────

export const CreateOrderInput = z.object({
  customerId: z.string().min(1),
  paymentMethod: z.enum([
    "CMI",
    "BANK_TRANSFER",
    "CASH_ON_DELIVERY",
    "WAFASALAF_FINANCING",
  ]),
  contact: z.object({
    fullName: z.string().min(1).max(120),
    email: z.string().email().max(160),
    phone: z.string().min(1).max(40),
  }),
  company: z.object({
    name: z.string().max(120).nullable().optional(),
    ice: z.string().max(40).nullable().optional(),
  }),
  shipping: z.object({
    street: z.string().min(1).max(240),
    city: z.string().min(1).max(80),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(2).max(2).default("MA"),
    notes: z.string().max(500).nullable().optional(),
  }),
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(80),
        name: z.string().min(1).max(160),
        subline: z.string().max(160).nullable().optional(),
        // qty capped at 9999 — generous for B2B hardware (no
        // legitimate buyer needs more, and stops integer-overflow
        // shenanigans on the totals downstream).
        qty: z.number().int().positive().max(9999),
        unitPrice: z.number().nonnegative().max(1_000_000),
      }),
    )
    .min(1)
    // Per-order line cap. Real orders rarely exceed 20 unique SKUs;
    // 100 leaves room for power buyers and stops abuse.
    .max(100),
  /** Override the initial status (rare — typically derived from method). */
  initialStatus: z
    .enum([
      "PENDING",
      "AWAITING_PAYMENT",
      "PAYMENT_VERIFICATION",
      "PROCESSING",
      "SENT_TO_ODOO",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ])
    .optional(),
});

export type CreateOrderInputT = z.infer<typeof CreateOrderInput>;

/**
 * Create an order + line items + initial status transition row in ONE
 * transaction. Money values are stored as integer minor units; totals
 * are computed server-side so the client can't smuggle a discount.
 */
export async function createOrder(
  input: CreateOrderInputT,
): Promise<{ ok: true; order: DisplayOrder } | { ok: false; error: string }> {
  const parsed = CreateOrderInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  // Recompute totals server-side. The customer-facing receipt has
  // already shown these numbers; treating client input as advisory.
  const subtotal = d.items.reduce(
    (s, i) => s + i.unitPrice * i.qty,
    0,
  );
  const subtotalMinor = wholeToMinor(subtotal);
  const taxTotalMinor = Math.round(subtotalMinor * VAT_RATE);
  const shippingTotalMinor = 0;
  const grandTotalMinor = subtotalMinor + taxTotalMinor + shippingTotalMinor;

  const status = d.initialStatus ?? initialStatusForMethod(d.paymentMethod);

  try {
    const created = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ref: generateOrderRef(),
          customerId: d.customerId,
          status,
          paymentMethod: d.paymentMethod,
          contactFullName: d.contact.fullName,
          contactEmail: d.contact.email.toLowerCase(),
          contactPhone: d.contact.phone,
          contactCompanyName: d.company.name ?? null,
          contactCompanyIce: d.company.ice ?? null,
          shippingStreet: d.shipping.street,
          shippingCity: d.shipping.city,
          shippingPostalCode: d.shipping.postalCode,
          shippingCountry: d.shipping.country,
          shippingNotes: d.shipping.notes ?? null,
          subtotalMinor,
          taxTotalMinor,
          shippingTotalMinor,
          grandTotalMinor,
          items: {
            create: d.items.map((it) => ({
              productSlug: it.slug,
              name: it.name,
              subline: it.subline ?? null,
              qty: it.qty,
              unitPriceMinor: wholeToMinor(it.unitPrice),
              lineTotalMinor: wholeToMinor(it.unitPrice * it.qty),
            })),
          },
          // Initial status transition row — PENDING → <initial>. We
          // model this as `fromStatus: PENDING, toStatus: status` so
          // the audit trail starts at order creation, not after the
          // first manual transition.
          transitions: {
            create: [
              {
                fromStatus: "PENDING",
                toStatus: status,
                actorUserId: d.customerId,
                reason: "Order created",
              },
            ],
          },
        },
        include: { items: true },
      });
      return order;
    });
    return { ok: true, order: toDisplay(created) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not create order.",
    };
  }
}

// ── Reads ──────────────────────────────────────────────────────────────

export async function getOrderByRef(
  ref: string,
): Promise<DisplayOrder | null> {
  const row = await db.order.findUnique({
    where: { ref },
    include: { items: true },
  });
  return row ? toDisplay(row) : null;
}

/** Owner check — used by the customer portal. The order is owned by
 *  the user whose customerId matches. */
export function orderBelongsTo(
  order: DisplayOrder,
  userId: string,
): boolean {
  return order.customerId === userId;
}

/** Visibility check — wraps `canSeeOrder` from the policy layer. */
export async function actorCanSeeOrder(
  order: DisplayOrder,
  actor: Actor | null,
): Promise<boolean> {
  if (!actor) return false;
  if (orderBelongsTo(order, actor.userId)) return true; // customer's own order
  return canSeeOrder(actor, {
    ref: order.ref,
    status: order.status,
    contact: { email: order.contact.email },
  });
}

/**
 * List orders scoped to an actor.
 *
 *   • admin tier  → all orders (no scope)
 *   • pre-sales   → orders whose contact email is in their customer
 *                    scope AND whose status is in the unpaid bucket
 *   • dispatcher  → orders whose ref is in their dispatcher scope AND
 *                    whose status is in the fulfilment bucket
 *   • other       → empty
 */
export async function listOrdersForActor(
  actor: Actor | null,
  opts: { limit?: number } = {},
): Promise<DisplayOrder[]> {
  if (!actor) return [];
  const take = opts.limit ?? 500;

  if (actor.isAdmin) {
    const rows = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take,
    });
    return rows.map(toDisplay);
  }

  if (actor.isPresales) {
    // Pre-sales sees two sets:
    //   1. STANDARD orders in the unpaid bucket, scoped to their
    //      assigned customers (existing behaviour).
    //   2. EVERY FINANCING order — validation layer scope. Hiding
    //      financing files behind customer assignment would leave
    //      the queue with no responsible reviewer.
    const scope = await customerScopeFor(actor);
    const hasEmailScope =
      scope.kind === "by-email" && scope.emails.length > 0;
    const rows = await db.order.findMany({
      where: hasEmailScope
        ? {
            OR: [
              {
                orderType: "STANDARD",
                contactEmail: { in: scope.emails },
                status: { in: UNPAID_STATUSES },
              },
              { orderType: "FINANCING" },
            ],
          }
        : { orderType: "FINANCING" },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take,
    });
    return rows.map(toDisplay);
  }

  if (actor.isDispatcher) {
    const scope = await dispatcherScopeFor(actor);
    if (scope.kind === "all") {
      const rows = await db.order.findMany({
        where: { status: { in: FULFILMENT_STATUSES } },
        orderBy: { createdAt: "desc" },
        include: { items: true },
        take,
      });
      return rows.map(toDisplay);
    }
    if (scope.refs.length === 0) return [];
    const rows = await db.order.findMany({
      where: {
        ref: { in: scope.refs },
        status: { in: FULFILMENT_STATUSES },
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take,
    });
    return rows.map(toDisplay);
  }

  return [];
}

/** List the signed-in user's own orders. */
export async function listMyOrders(
  userId: string,
): Promise<DisplayOrder[]> {
  const rows = await db.order.findMany({
    where: { customerId: userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 200,
  });
  return rows.map(toDisplay);
}

// ── Status transition ──────────────────────────────────────────────────

export async function transitionOrderStatus(input: {
  orderId: string;
  toStatus: OrderStatus;
  actorUserId: string;
  reason?: string;
}): Promise<{ ok: true; order: DisplayOrder } | { ok: false; error: string }> {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status === input.toStatus) {
    return { ok: true, order: toDisplay(order) };
  }
  if (!canTransitionTo(order.status, input.toStatus)) {
    return {
      ok: false,
      error: `Cannot transition from ${order.status} to ${input.toStatus}.`,
    };
  }
  try {
    const updated = await db.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: input.orderId },
        data: { status: input.toStatus },
        include: { items: true },
      });
      await tx.orderStatusTransition.create({
        data: {
          orderId: input.orderId,
          fromStatus: order.status,
          toStatus: input.toStatus,
          actorUserId: input.actorUserId,
          reason: input.reason ?? null,
        },
      });
      return next;
    });
    return { ok: true, order: toDisplay(updated) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Transition failed.",
    };
  }
}

// ── Attach payment proof ──────────────────────────────────────────────

export async function attachPaymentProof(
  orderRef: string,
  proof: DisplayPaymentProof,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await db.order.findUnique({ where: { ref: orderRef } });
  if (!row) return { ok: false, error: "Order not found." };
  await db.order.update({
    where: { ref: orderRef },
    data: { paymentProofJson: proof as unknown as object },
  });
  return { ok: true };
}

// ── Re-exports for convenience ────────────────────────────────────────
// So admin pages don't have to import policy + service + status all
// separately.

export { loadActor };
export { classifyOrderStatus, nextStatusesFrom } from "./status";
