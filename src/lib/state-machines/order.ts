// Order state machine — the canonical source of truth for legal status
// transitions. Pure function, zero I/O. Imported by every OrderService
// implementation (demo, platform, future Odoo) — the implementations
// differ in storage, but the rule for "can this status follow that one?"
// must never differ.
//
// Diagram (ARCHITECTURE.md v2 §9):
//
//   Pending
//      ↓
//   Awaiting Payment
//      ↓
//   Payment Verification
//      ↓
//   Processing
//      ↓
//   Sent To Odoo
//      ↓
//   Confirmed
//      ↓
//   Shipped
//      ↓
//   Delivered (terminal)
//
//   Cancelled  ← reachable from any non-terminal state.

import type { OrderStatus } from "@/services/contracts";

/** All legal forward transitions in the lifecycle. */
const FORWARD: Record<OrderStatus, OrderStatus[]> = {
  pending: ["awaiting-payment", "cancelled"],
  "awaiting-payment": ["payment-verification", "cancelled"],
  "payment-verification": ["processing", "awaiting-payment", "cancelled"],
  processing: ["sent-to-odoo", "cancelled"],
  "sent-to-odoo": ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [], // terminal
  cancelled: [], // terminal
};

/** Returns true if `next` is a legal successor of `current`. */
export function canTransitionOrder(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return FORWARD[current]?.includes(next) ?? false;
}

/** All statuses that legally follow `current`. UI uses this to render
 *  the "Move to…" picker without hardcoding each option. */
export function nextOrderStatuses(current: OrderStatus): OrderStatus[] {
  return [...(FORWARD[current] ?? [])];
}

/** True if the status is a terminal state — no further transitions. */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return FORWARD[status]?.length === 0;
}
