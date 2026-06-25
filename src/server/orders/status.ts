// Order status helpers — single source of truth for everything the
// platform does with `OrderStatus`. Keep mapping logic here so the
// admin pages, the customer portal, the policy layer, and the
// transition validator all speak the same language.
//
// Lifecycle (Postgres OrderStatus enum):
//
//   PENDING                       ─┐
//   AWAITING_PAYMENT              ─┤  unpaid bucket — pre-sales scope
//   PENDING_FINANCING_APPROVAL    ─┤
//   PAYMENT_VERIFICATION          ─┘
//
//   PROCESSING                    ─┐
//   SENT_TO_ODOO                  ─┤  fulfilment bucket — dispatcher scope
//   CONFIRMED                     ─┤
//   SHIPPED                       ─┘
//
//   DELIVERED                     ─┐  terminal bucket — no further work
//   FINANCING_REJECTED            ─┤
//   CANCELLED                     ─┘
//
// PENDING_FINANCING_APPROVAL is dedicated to orderType = FINANCING.
// Pre-sales reviews the file; dispatchers cannot see it. The
// financing decision (Order.financingStatus) cascades the order
// status — APPROVED → PROCESSING, REJECTED → FINANCING_REJECTED.

import type { OrderStatus, PaymentMethod } from "@prisma/client";

export type OrderBucket = "unpaid" | "fulfilment" | "terminal";

export const UNPAID_STATUSES: OrderStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PENDING_FINANCING_APPROVAL",
  "PAYMENT_VERIFICATION",
];

export const FULFILMENT_STATUSES: OrderStatus[] = [
  "PROCESSING",
  "SENT_TO_ODOO",
  "CONFIRMED",
  "SHIPPED",
];

export const TERMINAL_STATUSES: OrderStatus[] = [
  "DELIVERED",
  "FINANCING_REJECTED",
  "CANCELLED",
];

export function classifyOrderStatus(status: OrderStatus): OrderBucket {
  if (UNPAID_STATUSES.includes(status)) return "unpaid";
  if (FULFILMENT_STATUSES.includes(status)) return "fulfilment";
  return "terminal";
}

// ── Display labels + tones ─────────────────────────────────────────────

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  AWAITING_PAYMENT: "Awaiting payment",
  PENDING_FINANCING_APPROVAL: "Financing pending approval",
  FINANCING_REJECTED: "Financing rejected",
  PAYMENT_VERIFICATION: "Verifying payment",
  PROCESSING: "Processing",
  SENT_TO_ODOO: "Sent to Odoo",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  "neutral" | "good" | "warn" | "bad" | "info"
> = {
  PENDING: "neutral",
  AWAITING_PAYMENT: "warn",
  PENDING_FINANCING_APPROVAL: "warn",
  FINANCING_REJECTED: "bad",
  PAYMENT_VERIFICATION: "warn",
  PROCESSING: "info",
  SENT_TO_ODOO: "info",
  CONFIRMED: "info",
  SHIPPED: "info",
  DELIVERED: "good",
  CANCELLED: "bad",
};

export const ORDER_STATUSES: OrderStatus[] = [
  ...UNPAID_STATUSES,
  ...FULFILMENT_STATUSES,
  ...TERMINAL_STATUSES,
];

// ── Payment method labels ──────────────────────────────────────────────

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CMI: "CMI · Online card",
  BANK_TRANSFER: "Bank transfer",
  CASH_ON_DELIVERY: "Cash on delivery",
  WAFASALAF_FINANCING: "Wafasalaf financing",
};

// ── State machine ──────────────────────────────────────────────────────
// Legal transitions. Anything not listed throws InvalidTransition.

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["AWAITING_PAYMENT", "PROCESSING", "CANCELLED"],
  AWAITING_PAYMENT: ["PAYMENT_VERIFICATION", "CANCELLED"],
  // Financing decision cascades the order: PROCESSING on approval,
  // FINANCING_REJECTED on rejection. CANCELLED is also reachable if
  // the customer or admin walks away during review.
  PENDING_FINANCING_APPROVAL: ["PROCESSING", "FINANCING_REJECTED", "CANCELLED"],
  PAYMENT_VERIFICATION: ["PROCESSING", "AWAITING_PAYMENT", "CANCELLED"],
  PROCESSING: ["SENT_TO_ODOO", "CONFIRMED", "CANCELLED"],
  SENT_TO_ODOO: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  FINANCING_REJECTED: [],
  CANCELLED: [],
};

export function canTransitionTo(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatusesFrom(from: OrderStatus): OrderStatus[] {
  return [...TRANSITIONS[from]];
}

// ── Payment-method → initial status ────────────────────────────────────
// What status a brand-new order lands in based on the chosen method.

export function initialStatusForMethod(method: PaymentMethod): OrderStatus {
  switch (method) {
    case "BANK_TRANSFER":
      // Customer pays after order — admin verifies via the proof.
      return "AWAITING_PAYMENT";
    case "CMI":
      // CMI integration is stubbed today (no live merchant credentials,
      // no signed callback). Until a verified payment signal (signed
      // CMI postback or staff manual confirmation) advances the order,
      // it must NOT be marked PROCESSING — that would let any
      // authenticated buyer mint a "paid" order by POSTing to the API.
      // See docs/PAYMENTS.md for the planned CMI → PROCESSING handoff.
      return "AWAITING_PAYMENT";
    case "CASH_ON_DELIVERY":
      // Payment happens at delivery; nothing to verify pre-shipment.
      // Goes straight into the fulfilment bucket.
      return "PROCESSING";
    case "WAFASALAF_FINANCING":
      // Financing-backed orders wait for pre-sales review. The
      // approve/reject decision cascades the status forward.
      return "PENDING_FINANCING_APPROVAL";
  }
}
