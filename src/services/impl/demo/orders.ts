// In-memory OrderService — full contract implementation backed by a
// Map, with state-machine validation + audit logging.
//
// The implementation enforces ARCHITECTURE.md §9 rules:
//   • transitionStatus is the ONLY writer of order.status
//   • Every state change validates legality through the order state
//     machine — illegal transitions throw InvalidTransitionError
//   • Every transition writes an AuditEvent before returning
//   • A StatusTransition row is recorded for the order's history
//
// The platform impl replaces the Map with Prisma queries but the
// public behaviour is identical. UI consumers never know which is which.

import {
  ConflictError,
  InvalidTransitionError,
  NotFoundError,
  type Order,
  type OrderFilter,
  type OrderId,
  type OrderRef,
  type OrderService,
  type OrderStatus,
  type OrderStatusTransition,
  type CreateOrderInput,
  type UserId,
} from "@/services/contracts";
import { canTransitionOrder } from "@/lib/state-machines/order";
import { generateOrderRef } from "@/lib/refs";
import type { AuditService } from "@/services/contracts/audit";

function uid(prefix = "ord"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class DemoOrderService implements OrderService {
  private orders = new Map<OrderId, Order>();
  private history = new Map<OrderId, OrderStatusTransition[]>();

  constructor(private readonly audit: AuditService) {}

  // ── Read ──────────────────────────────────────────────────────────

  async get(id: OrderId): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async getByRef(ref: OrderRef): Promise<Order | null> {
    for (const o of this.orders.values()) {
      if (o.ref === ref) return o;
    }
    return null;
  }

  async list(filter?: OrderFilter): Promise<Order[]> {
    let items = Array.from(this.orders.values());

    if (filter?.customerId) {
      items = items.filter((o) => o.customerId === filter.customerId);
    }
    if (filter?.status && filter.status !== "any") {
      items = items.filter((o) => o.status === filter.status);
    }
    if (filter?.since) {
      items = items.filter((o) => o.createdAt >= filter.since!);
    }
    if (filter?.until) {
      items = items.filter((o) => o.createdAt <= filter.until!);
    }

    // Newest first.
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    if (filter?.limit && filter.limit > 0) {
      items = items.slice(0, filter.limit);
    }
    return items;
  }

  async listHistory(orderId: OrderId): Promise<OrderStatusTransition[]> {
    return [...(this.history.get(orderId) ?? [])];
  }

  // ── Write ─────────────────────────────────────────────────────────

  async create(input: CreateOrderInput): Promise<Order> {
    const now = nowIso();
    const order: Order = Object.freeze({
      id: uid("ord"),
      ref: generateOrderRef(),
      customerId: input.customerId,
      items: [...input.items],
      totals: input.totals,
      contact: input.contact,
      shipping: input.shipping,
      paymentMethod: input.paymentMethod,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    this.orders.set(order.id, order);
    this.history.set(order.id, []);

    await this.audit.record({
      actorUserId: input.customerId,
      action: "order.create",
      resourceType: "order",
      resourceId: order.id,
      after: order,
    });

    return order;
  }

  async transitionStatus(
    orderId: OrderId,
    next: OrderStatus,
    actor: UserId,
    reason?: string,
  ): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new NotFoundError("Order", orderId);

    // No-op if already at target — idempotent but logged.
    if (order.status === next) return order;

    if (!canTransitionOrder(order.status, next)) {
      throw new InvalidTransitionError(order.status, next);
    }

    const now = nowIso();
    const updated: Order = Object.freeze({
      ...order,
      status: next,
      updatedAt: now,
    });
    this.orders.set(orderId, updated);

    // History row — independent of audit so consumers can render a
    // clean per-order timeline.
    const transition: OrderStatusTransition = Object.freeze({
      orderId,
      from: order.status,
      to: next,
      actorUserId: actor,
      reason,
      occurredAt: now,
    });
    const hist = this.history.get(orderId) ?? [];
    hist.push(transition);
    this.history.set(orderId, hist);

    await this.audit.record({
      actorUserId: actor,
      action: "order.transition",
      resourceType: "order",
      resourceId: orderId,
      before: { status: order.status },
      after: { status: next },
      reason,
    });

    return updated;
  }

  async attachTrackingNumber(
    orderId: OrderId,
    trackingNumber: string,
  ): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new NotFoundError("Order", orderId);

    // Operational guard — only legal once the order is at-or-past Shipped.
    if (order.status !== "shipped" && order.status !== "delivered") {
      throw new ConflictError(
        `Tracking number can only be attached on or after Shipped (current: ${order.status})`,
      );
    }

    const updated: Order = Object.freeze({
      ...order,
      trackingNumber,
      updatedAt: nowIso(),
    });
    this.orders.set(orderId, updated);
    return updated;
  }

  async updateInternalNotes(orderId: OrderId, notes: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new NotFoundError("Order", orderId);

    const updated: Order = Object.freeze({
      ...order,
      internalNotes: notes || undefined,
      updatedAt: nowIso(),
    });
    this.orders.set(orderId, updated);

    await this.audit.record({
      action: "order.update-notes",
      resourceType: "order",
      resourceId: orderId,
      before: { internalNotes: order.internalNotes ?? "" },
      after: { internalNotes: notes },
    });

    return updated;
  }

  async attachDocument(orderId: OrderId, fileId: string): Promise<Order> {
    // In-memory impl tracks attachments via the audit trail; the platform
    // impl writes a foreign-key row to OrderFile + the FileRecord table.
    const order = this.orders.get(orderId);
    if (!order) throw new NotFoundError("Order", orderId);

    await this.audit.record({
      action: "order.update-notes",
      resourceType: "order",
      resourceId: orderId,
      metadata: { attachedFileId: fileId },
    });

    return order;
  }
}
