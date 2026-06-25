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
import { Prisma } from "@prisma/client";

import { db } from "@/server/db";
import { generateOrderRef } from "@/lib/refs";
import { VAT_RATE } from "@/lib/commerceConstants";
import { resolveOrderableProducts } from "@/server/catalog/orderable";
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
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "@prisma/client";

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

// Public schema accepted at /api/orders. Critically: NO `unitPrice`,
// NO product name, NO initial status — those are all server-derived.
// The wire contract is intentionally minimal so a hostile client
// cannot influence money, fulfilment state, or product identity.
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
  // Items carry slug + qty only. The server looks up authoritative
  // name + unit price from Postgres at write time; OUT_OF_STOCK and
  // DISABLED products are rejected. Per-order line cap of 100; per-
  // line qty cap of 9999 to bound integer-overflow risk on totals.
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(80),
        qty: z.number().int().positive().max(9999),
      }),
    )
    .min(1)
    .max(100),
});

export type CreateOrderInputT = z.infer<typeof CreateOrderInput>;

// How many times to retry a transient ref collision before giving up.
// generateOrderRef() draws 6 alphanumeric chars from a 36-symbol
// alphabet → ~2.18e9 keys; collisions are astronomically rare but
// any concurrent retry is cheaper than surfacing a raw Prisma error
// at the most load-bearing route.
const REF_RETRY_LIMIT = 5;

/**
 * Create an order + line items + initial status transition row in ONE
 * transaction. Server-side guarantees:
 *
 *   • `unitPrice` is read from Postgres by slug — client input ignored.
 *   • `name` + `subline` are read from Postgres by slug — client input
 *     never persists.
 *   • `initialStatus` is derived from the chosen payment method via
 *     `initialStatusForMethod` — never accepted from the wire.
 *   • Totals (subtotal, VAT, shipping, grand) are recomputed from
 *     resolved prices × qty.
 *   • Ref collisions are retried up to REF_RETRY_LIMIT times.
 */
export async function createOrder(
  input: CreateOrderInputT,
): Promise<{ ok: true; order: DisplayOrder } | { ok: false; error: string }> {
  const parsed = CreateOrderInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  // Resolve every slug against Postgres before touching the DB for the
  // write. The lookup rejects out-of-stock/disabled/deleted products
  // and gives us authoritative name + price for each line.
  const resolution = await resolveOrderableProducts(
    d.items.map((i) => i.slug),
  );
  if (!resolution.ok) return { ok: false, error: resolution.error };

  // Build the authoritative line snapshot. Each line carries the
  // canonical name + unit price from the DB.
  const resolvedLines = d.items.map((it) => {
    const product = resolution.bySlug.get(it.slug)!;
    const unitPriceMinor = product.priceFromMinor;
    return {
      slug: it.slug,
      name: product.name,
      subline: product.subline,
      qty: it.qty,
      unitPriceMinor,
      lineTotalMinor: unitPriceMinor * it.qty,
    };
  });

  const subtotalMinor = resolvedLines.reduce(
    (s, l) => s + l.lineTotalMinor,
    0,
  );
  const taxTotalMinor = Math.round(subtotalMinor * VAT_RATE);
  const shippingTotalMinor = 0;
  const grandTotalMinor = subtotalMinor + taxTotalMinor + shippingTotalMinor;

  const status = initialStatusForMethod(d.paymentMethod);

  for (let attempt = 0; attempt < REF_RETRY_LIMIT; attempt += 1) {
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
              create: resolvedLines.map((it) => ({
                productSlug: it.slug,
                name: it.name,
                subline: it.subline,
                qty: it.qty,
                unitPriceMinor: it.unitPriceMinor,
                lineTotalMinor: it.lineTotalMinor,
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
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < REF_RETRY_LIMIT - 1
      ) {
        // Ref collision — regenerate and retry. Don't surface this
        // to the user.
        continue;
      }
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Could not create order.",
      };
    }
  }
  return { ok: false, error: "Could not generate a unique order reference." };
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
