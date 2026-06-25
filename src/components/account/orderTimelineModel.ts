// Maps a DisplayOrder into its 5-stage display timeline. Stage dates
// are synthesised so the demo shows a believable progression, but the
// SHAPE is correct for production: each milestone has either a settled
// date (in the past) or an ETA (in the future), never both, never
// neither.
//
// Lead-time handling — when any item is "En arrivage" the dispatch
// date is pushed by the max leadWeeks across all items.

import type { OrderStatus } from "@prisma/client";

import type { ProductIndex } from "@/lib/cartStore";
import type { DisplayOrder } from "@/server/orders/service";
import type { OrderStage } from "./OrderTimeline";

// Map Postgres OrderStatus → stage index in the 5-stage display.
const STATUS_TO_INDEX: Record<OrderStatus, number> = {
  PENDING: 0,
  AWAITING_PAYMENT: 0,
  // Financing-reserved orders sit pre-paid: same stage as PENDING
  // so the timeline shows "Order placed" filled and the rest
  // greyed-out until the financing decision lands.
  PENDING_FINANCING_APPROVAL: 0,
  // Terminal rejection — the timeline shows up to stage 1, the
  // status badge takes over with a clear "Financing refused".
  FINANCING_REJECTED: 1,
  PAYMENT_VERIFICATION: 1,
  PROCESSING: 2,
  SENT_TO_ODOO: 2,
  CONFIRMED: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 1, // shown up to "paid", then a cancelled badge takes over
};

const DAY = 86_400_000;

/** Max lead time in weeks across all incoming items in the order. */
export function maxLeadWeeks(
  order: DisplayOrder,
  productsBySlug: ProductIndex,
): number {
  let max = 0;
  for (const item of order.items) {
    const product = productsBySlug[item.slug];
    const avail = product?.availability;
    if (avail?.status === "incoming") {
      const lw = avail.leadWeeks ?? 3;
      if (lw > max) max = lw;
    }
  }
  return max;
}

/** True when at least one item in the order ships "En arrivage". */
export function hasIncomingItems(
  order: DisplayOrder,
  productsBySlug: ProductIndex,
): boolean {
  return order.items.some(
    (item) =>
      productsBySlug[item.slug]?.availability?.status === "incoming",
  );
}

export type TimelineModel = {
  stages: OrderStage[];
  currentIndex: number;
  estimatedDeliveryISO: string;
  estimatedDeliveryLabel: string;
  isBackOrdered: boolean;
};

export function buildOrderTimeline(
  order: DisplayOrder,
  productsBySlug: ProductIndex,
): TimelineModel {
  const created = order.createdAt;
  const incomingWeeks = maxLeadWeeks(order, productsBySlug);
  const isBackOrdered = incomingWeeks > 0;

  const offsets = {
    placed: 0,
    paid: 0,
    dispatched: isBackOrdered ? incomingWeeks * 7 : 2,
    inTransit: isBackOrdered ? incomingWeeks * 7 + 1 : 3,
    delivered: isBackOrdered ? incomingWeeks * 7 + 5 : 7,
  };

  const dateFor = (offsetDays: number) =>
    new Date(created + offsetDays * DAY).toISOString();

  const currentIndex = STATUS_TO_INDEX[order.status] ?? 1;

  const stages: OrderStage[] = [
    { id: "placed", label: "Commande passée", date: dateFor(offsets.placed) },
    { id: "paid", label: "Paiement confirmé", date: dateFor(offsets.paid) },
    {
      id: "dispatched",
      label: isBackOrdered ? "Expédition (en arrivage)" : "Expédition",
      date: currentIndex >= 2 ? dateFor(offsets.dispatched) : null,
      eta: currentIndex < 2 ? formatShort(dateFor(offsets.dispatched)) : null,
    },
    {
      id: "in-transit",
      label: "En transit",
      date: currentIndex >= 3 ? dateFor(offsets.inTransit) : null,
      eta: currentIndex < 3 ? formatShort(dateFor(offsets.inTransit)) : null,
    },
    {
      id: "delivered",
      label: "Livré",
      date: currentIndex >= 4 ? dateFor(offsets.delivered) : null,
      eta: currentIndex < 4 ? formatShort(dateFor(offsets.delivered)) : null,
    },
  ];

  return {
    stages,
    currentIndex,
    estimatedDeliveryISO: dateFor(offsets.delivered),
    estimatedDeliveryLabel: new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateFor(offsets.delivered))),
    isBackOrdered,
  };
}

function formatShort(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}
