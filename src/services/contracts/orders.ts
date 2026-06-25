// OrderService — order lifecycle contract.
//
// The contract enforces the state machine documented in ARCHITECTURE.md
// §9. The `transitionStatus` method is the ONLY way to change an order's
// status — direct writes are an architectural error.

import type {
  Order,
  OrderContact,
  OrderId,
  OrderItem,
  OrderRef,
  OrderShipping,
  OrderStatus,
  OrderTotals,
  PaymentMethod,
  UserId,
} from "./types";

export type OrderFilter = Readonly<{
  customerId?: UserId;
  status?: OrderStatus | "any";
  /** Inclusive lower bound on createdAt. */
  since?: string;
  /** Inclusive upper bound on createdAt. */
  until?: string;
  limit?: number;
  cursor?: string;
}>;

export type CreateOrderInput = Readonly<{
  customerId: UserId;
  items: OrderItem[];
  totals: OrderTotals;
  contact: OrderContact;
  shipping: OrderShipping;
  paymentMethod: PaymentMethod;
}>;

export type OrderStatusTransition = Readonly<{
  orderId: OrderId;
  from: OrderStatus;
  to: OrderStatus;
  actorUserId: UserId;
  reason?: string;
  occurredAt: string;
}>;

export interface OrderService {
  // Read ────────────────────────────────────────────────────────────────
  get(id: OrderId): Promise<Order | null>;
  getByRef(ref: OrderRef): Promise<Order | null>;
  list(filter?: OrderFilter): Promise<Order[]>;
  listHistory(orderId: OrderId): Promise<OrderStatusTransition[]>;

  // Write ───────────────────────────────────────────────────────────────
  create(input: CreateOrderInput): Promise<Order>;

  /** The single authoritative status writer. Validates the transition is
   *  legal per the state machine, writes a StatusTransition row, emits
   *  an AuditEvent, and triggers any side effects (stock reserve,
   *  notification, Odoo push). */
  transitionStatus(
    orderId: OrderId,
    next: OrderStatus,
    actor: UserId,
    reason?: string,
  ): Promise<Order>;

  attachTrackingNumber(orderId: OrderId, trackingNumber: string): Promise<Order>;
  updateInternalNotes(orderId: OrderId, notes: string): Promise<Order>;

  /** Admin only — attaches an uploaded file (e.g. wire-transfer receipt)
   *  to the order's document set. Routes through FileService. */
  attachDocument(orderId: OrderId, fileId: string): Promise<Order>;
}
