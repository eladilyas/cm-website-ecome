// Financing service — now backed entirely by the unified Order
// model (orderType = FINANCING + financingStatus + financing*
// monetary columns). The legacy FinancingRequest table is no longer
// read from or written to.
//
// What the service exposes (URL contracts unchanged):
//   • createFinancingRequest(input) — creates a single Order with
//     orderType=FINANCING, status=PENDING_FINANCING_APPROVAL,
//     financingStatus=SUBMITTED.
//   • getFinancingByRef(ref) — Order with orderType=FINANCING.
//   • listFinancingForActor / listMyFinancing — Order queries with
//     the orderType filter.
//   • transitionFinancingStatus — flips financingStatus AND cascades
//     order status (APPROVED → PROCESSING, REJECTED → FINANCING_REJECTED).
//
// The DisplayFinancingRequest shape is preserved so all consumers
// (admin pages, customer portal, financing success page, dashboard)
// keep working without changes.

import { z } from "zod";
import { Prisma } from "@prisma/client";

import { db } from "@/server/db";
import { generateOrderRef } from "@/lib/refs";
import { VAT_RATE } from "@/lib/commerceConstants";
import { resolveOrderableProducts } from "@/server/catalog/orderable";
import { loadActor, type Actor } from "@/server/policy";
import { canTransitionTo, PENDING_STATUSES } from "./status";
import type {
  Order as DbOrder,
  OrderItem as DbOrderItem,
  FinancingStatus,
  FinancingAgeBracket,
} from "@prisma/client";

// ── Display shape ──────────────────────────────────────────────────────

export type DisplayFinancingItem = Readonly<{
  slug: string;
  name: string;
  subline: string | null;
  qty: number;
  unitPrice: number; // MAD whole
  lineTotal: number;
}>;

export type DisplayFinancingRequest = Readonly<{
  id: string;
  ref: string;
  applicantUserId: string;
  status: FinancingStatus;
  ageBracket: FinancingAgeBracket;
  contact: { fullName: string; email: string; phone: string };
  company: { name: string | null; ice: string | null };
  shipping: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    notes: string | null;
  };
  items: DisplayFinancingItem[];
  totals: { itemCount: number; subtotal: number; vat: number; total: number };
  financing: {
    months: number;
    financingAmount: number;
    monthly: number;
    firstMonthly: number;
    fileFee: number;
    totalCost: number;
    offeredMonthly: number | null;
    offeredMonths: number | null;
  };
  decisionReason: string | null;
  internalNotes: string | null;
  createdAt: number;
  updatedAt: number;
}>;

const minorToWhole = (m: number): number => Math.round(m) / 100;
const wholeToMinor = (w: number): number => Math.round(w * 100);

/** Map an Order row (with items joined) → DisplayFinancingRequest.
 *  Only valid for orderType=FINANCING — callers should filter first. */
function orderToDisplay(
  row: DbOrder & { items: DbOrderItem[] },
): DisplayFinancingRequest {
  return {
    id: row.id,
    ref: row.ref,
    applicantUserId: row.customerId,
    // financingStatus is nullable on the schema (only set for
    // orderType=FINANCING). For a financing order it's always
    // populated, but we fall back to DRAFT for safety so the shape
    // contract holds.
    status: (row.financingStatus ?? "DRAFT") as FinancingStatus,
    ageBracket: (row.financingAgeBracket ?? "UNDER_60") as FinancingAgeBracket,
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
    items: row.items.map((it) => ({
      slug: it.productSlug,
      name: it.name,
      subline: it.subline,
      qty: it.qty,
      unitPrice: minorToWhole(it.unitPriceMinor),
      lineTotal: minorToWhole(it.lineTotalMinor),
    })),
    totals: {
      itemCount: row.items.reduce((s, i) => s + i.qty, 0),
      subtotal: minorToWhole(row.subtotalMinor),
      vat: minorToWhole(row.taxTotalMinor),
      total: minorToWhole(row.grandTotalMinor),
    },
    financing: {
      months: row.financingRequestedTermMonths ?? 0,
      financingAmount: minorToWhole(row.grandTotalMinor),
      monthly: minorToWhole(row.financingMonthlyPaymentMinor ?? 0),
      firstMonthly: minorToWhole(row.financingFirstMonthlyPaymentMinor ?? 0),
      fileFee: minorToWhole(row.financingFileFeeMinor ?? 0),
      totalCost: minorToWhole(row.financingTotalCostMinor ?? 0),
      offeredMonthly:
        row.financingOfferedMonthlyPaymentMinor != null
          ? minorToWhole(row.financingOfferedMonthlyPaymentMinor)
          : null,
      offeredMonths: row.financingOfferedTermMonths ?? null,
    },
    decisionReason: row.financingDecisionReason,
    internalNotes: row.internalNotes,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

// ── Create ─────────────────────────────────────────────────────────────

// Public schema accepted at /api/financing. Critically: items carry
// slug + qty only — name + unitPrice are looked up server-side from
// the catalog. The Wafasalaf quote (monthly/firstMonthly/fileFee/
// totalCost) is recomputed server-side from the subtotal so a hostile
// client can't bias it.
export const CreateFinancingInput = z.object({
  applicantUserId: z.string().min(1),
  ageBracket: z.enum(["UNDER_60", "SIXTY_PLUS"]),
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
        qty: z.number().int().positive().max(9999),
      }),
    )
    .min(1)
    .max(100),
  // Term in months — the only quote dimension the customer chooses.
  // Monthly / firstMonthly / fileFee / totalCost are recomputed
  // server-side from the resolved subtotal + ageBracket.
  termMonths: z.number().int().positive().max(60),
});

export type CreateFinancingInputT = z.infer<typeof CreateFinancingInput>;

const FINANCING_REF_RETRY_LIMIT = 5;

export async function createFinancingRequest(
  input: CreateFinancingInputT,
): Promise<
  | { ok: true; request: DisplayFinancingRequest }
  | { ok: false; error: string }
> {
  const parsed = CreateFinancingInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  // Resolve every slug against Postgres — rejects OUT_OF_STOCK +
  // DISABLED + missing products and pulls authoritative price + name.
  const resolution = await resolveOrderableProducts(
    d.items.map((i) => i.slug),
  );
  if (!resolution.ok) return { ok: false, error: resolution.error };

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
  const grandTotalMinor = subtotalMinor + taxTotalMinor;

  // Wafasalaf quote — recomputed server-side from the authoritative
  // grand total + term + age bracket. `computeClassique` throws if the
  // requested term is not in the Wafasalaf tariff; everything else
  // (amount range, age bracket) is the buyer's concern.
  let quote;
  try {
    const { computeClassique } = await import("@/lib/wafasalaf");
    quote = computeClassique(
      minorToWhole(grandTotalMinor),
      d.termMonths,
      d.ageBracket === "UNDER_60" ? "under60" : "over60",
    );
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Financing quote unavailable for this term.",
    };
  }

  for (let attempt = 0; attempt < FINANCING_REF_RETRY_LIMIT; attempt += 1) {
    try {
      const created = await db.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            ref: generateOrderRef(),
            customerId: d.applicantUserId,
            orderType: "FINANCING",
            status: "PENDING_FINANCING_APPROVAL",
            paymentMethod: "WAFASALAF_FINANCING",
            // Financing-specific columns — all server-computed.
            financingStatus: "SUBMITTED",
            financingAgeBracket: d.ageBracket,
            financingRequestedTermMonths: d.termMonths,
            financingMonthlyPaymentMinor: wholeToMinor(quote.monthly),
            financingFirstMonthlyPaymentMinor: wholeToMinor(quote.firstMonthly),
            financingFileFeeMinor: wholeToMinor(quote.fileFee),
            financingTotalCostMinor: wholeToMinor(quote.totalCost),
            // Snapshot contact + shipping (same shape as a standard order).
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
            shippingTotalMinor: 0,
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
            transitions: {
              create: [
                {
                  fromStatus: "PENDING",
                  toStatus: "PENDING_FINANCING_APPROVAL",
                  actorUserId: d.applicantUserId,
                  reason: "Financing application submitted",
                },
              ],
            },
          },
          include: { items: true },
        });
        return order;
      });
      return { ok: true, request: orderToDisplay(created) };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < FINANCING_REF_RETRY_LIMIT - 1
      ) {
        continue;
      }
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Could not create financing request.",
      };
    }
  }
  return {
    ok: false,
    error: "Could not generate a unique financing reference.",
  };
}

// ── Reads ──────────────────────────────────────────────────────────────

export async function getFinancingByRef(
  ref: string,
): Promise<DisplayFinancingRequest | null> {
  const row = await db.order.findFirst({
    where: { ref, orderType: "FINANCING" },
    include: { items: true },
  });
  return row ? orderToDisplay(row) : null;
}

export function financingBelongsTo(
  request: DisplayFinancingRequest,
  userId: string,
): boolean {
  return request.applicantUserId === userId;
}

export async function actorCanSeeFinancing(
  request: DisplayFinancingRequest,
  actor: Actor | null,
): Promise<boolean> {
  if (!actor) return false;
  if (financingBelongsTo(request, actor.userId)) return true; // owner
  if (actor.isAdmin) return true;
  if (actor.isPresales) {
    // Pre-sales is the validation layer for financing — they see
    // every financing order regardless of customer assignment.
    // Assignment-based filtering would silently hide files in
    // queue from the team responsible for clearing them.
    return true;
  }
  // Dispatchers have no business in financing reviews; they only see
  // orders that have already cleared into fulfilment via the standard
  // order surfaces.
  return false;
}

/**
 * List financing orders scoped to an actor.
 *   • admin       → every financing order
 *   • pre-sales   → every financing order (validation layer scope)
 *   • dispatcher  → none (they see approved orders through the
 *                   regular order list, which already includes
 *                   the now-PROCESSING financing ones)
 *   • other       → empty
 */
export async function listFinancingForActor(
  actor: Actor | null,
  opts: { limit?: number } = {},
): Promise<DisplayFinancingRequest[]> {
  if (!actor) return [];
  const take = opts.limit ?? 500;
  if (!actor.isAdmin && !actor.isPresales) return [];

  const rows = await db.order.findMany({
    where: { orderType: "FINANCING" },
    orderBy: { createdAt: "desc" },
    take,
    include: { items: true },
  });
  return rows.map(orderToDisplay);
}

/** Customer's own financing orders. */
export async function listMyFinancing(
  userId: string,
): Promise<DisplayFinancingRequest[]> {
  const rows = await db.order.findMany({
    where: { customerId: userId, orderType: "FINANCING" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: true },
  });
  return rows.map(orderToDisplay);
}

// ── Transitions ────────────────────────────────────────────────────────

/** Map a financing status change → the order status that should
 *  cascade. Returns null when the financing change shouldn't move
 *  the order (e.g. UNDER_REVIEW, DOCUMENTS_REQUIRED). */
function orderStatusForFinancingDecision(
  toStatus: FinancingStatus,
): "PROCESSING" | "FINANCING_REJECTED" | "CANCELLED" | null {
  if (toStatus === "APPROVED" || toStatus === "ACTIVE" || toStatus === "PAID_OFF") {
    return "PROCESSING";
  }
  if (toStatus === "REJECTED") return "FINANCING_REJECTED";
  if (toStatus === "CANCELLED") return "CANCELLED";
  return null;
}

export async function transitionFinancingStatus(input: {
  requestId: string;
  toStatus: FinancingStatus;
  actorUserId: string;
  reason?: string;
  offeredMonthly?: number;
  offeredMonths?: number;
}): Promise<
  | { ok: true; request: DisplayFinancingRequest }
  | { ok: false; error: string }
> {
  // requestId is the Order.id under the new model.
  const row = await db.order.findUnique({
    where: { id: input.requestId },
    include: { items: true },
  });
  if (!row || row.orderType !== "FINANCING") {
    return { ok: false, error: "Financing order not found." };
  }
  const currentFin: FinancingStatus = row.financingStatus ?? "DRAFT";
  if (currentFin === input.toStatus) {
    return { ok: true, request: orderToDisplay(row) };
  }
  if (!canTransitionTo(currentFin, input.toStatus)) {
    return {
      ok: false,
      error: `Cannot transition from ${currentFin} to ${input.toStatus}.`,
    };
  }

  // Fail-loud cascade guard.
  //
  // If the financing decision demands an order-status move (REJECTED
  // → FINANCING_REJECTED, CANCELLED → CANCELLED, APPROVED → PROCESSING)
  // but the order has ALREADY been advanced past
  // PENDING_FINANCING_APPROVAL by a manual transition, refuse to
  // silently desync. The admin must explicitly bring the order back
  // into alignment first.
  //
  // The only flow that's safe to skip-cascade is APPROVED → PROCESSING
  // when the order is already in PROCESSING+ (a different admin path
  // arrived at the same end state). REJECTED / CANCELLED on a moving
  // order is genuinely contradictory — a shipped order whose financing
  // was later rejected is an ops emergency, not a routine state.
  const orderTarget = orderStatusForFinancingDecision(input.toStatus);
  if (
    orderTarget &&
    row.status !== "PENDING_FINANCING_APPROVAL" &&
    (input.toStatus === "REJECTED" || input.toStatus === "CANCELLED")
  ) {
    return {
      ok: false,
      error: `Cannot ${input.toStatus.toLowerCase()} financing — order has already advanced to ${row.status}. Cancel the order explicitly first.`,
    };
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: input.requestId },
        data: {
          financingStatus: input.toStatus,
          financingDecisionReason: input.reason ?? row.financingDecisionReason,
          financingOfferedMonthlyPaymentMinor:
            input.offeredMonthly != null
              ? wholeToMinor(input.offeredMonthly)
              : row.financingOfferedMonthlyPaymentMinor,
          financingOfferedTermMonths:
            input.offeredMonths ?? row.financingOfferedTermMonths ?? null,
          // Cascade the order status when the financing decision
          // demands it. Only fires if the order is still parked in
          // PENDING_FINANCING_APPROVAL — APPROVED on an already-
          // advanced order is allowed (covered by the no-op branch).
          ...(orderTarget && row.status === "PENDING_FINANCING_APPROVAL"
            ? { status: orderTarget }
            : {}),
        },
        include: { items: true },
      });

      // Always write an OrderStatusTransition row for audit, even
      // when the order status itself doesn't move. The transition
      // narrates the financing decision so the timeline reads
      // chronologically.
      if (orderTarget && row.status === "PENDING_FINANCING_APPROVAL") {
        await tx.orderStatusTransition.create({
          data: {
            orderId: row.id,
            fromStatus: "PENDING_FINANCING_APPROVAL",
            toStatus: orderTarget,
            actorUserId: input.actorUserId,
            reason: `Financing ${input.toStatus.toLowerCase()}${
              input.reason ? ` · ${input.reason}` : ""
            }`,
          },
        });
      }

      // Append a follow-up note recording the financing decision —
      // visible on the pre-sales follow-up page.
      await tx.orderFollowupNote.create({
        data: {
          orderId: row.id,
          actorUserId: input.actorUserId,
          kind: "decision",
          body: `Financing ${input.toStatus}${
            input.reason ? ` — ${input.reason}` : ""
          }`,
        },
      });

      return next;
    });
    return { ok: true, request: orderToDisplay(updated) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Transition failed.",
    };
  }
}

// ── Follow-up notes (financing only) ───────────────────────────────────

export type FollowupNote = Readonly<{
  id: string;
  body: string;
  kind: string | null;
  actorUserId: string | null;
  createdAt: number;
}>;

export async function listFollowupNotes(
  orderId: string,
): Promise<FollowupNote[]> {
  const rows = await db.orderFollowupNote.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    kind: r.kind,
    actorUserId: r.actorUserId,
    createdAt: r.createdAt.getTime(),
  }));
}

export async function addFollowupNote(input: {
  orderId: string;
  actorUserId: string;
  body: string;
  kind?: string;
}): Promise<{ ok: true; note: FollowupNote } | { ok: false; error: string }> {
  const body = input.body.trim();
  if (body.length === 0) {
    return { ok: false, error: "Note body cannot be empty." };
  }
  if (body.length > 4000) {
    return { ok: false, error: "Note is too long (4000 chars max)." };
  }
  try {
    const row = await db.orderFollowupNote.create({
      data: {
        orderId: input.orderId,
        actorUserId: input.actorUserId,
        kind: input.kind ?? null,
        body,
      },
    });
    return {
      ok: true,
      note: {
        id: row.id,
        body: row.body,
        kind: row.kind,
        actorUserId: row.actorUserId,
        createdAt: row.createdAt.getTime(),
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save note.",
    };
  }
}

// ── Convenience re-exports ────────────────────────────────────────────

export { loadActor };
export { PENDING_STATUSES };
