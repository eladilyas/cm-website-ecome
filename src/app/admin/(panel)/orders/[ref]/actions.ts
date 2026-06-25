"use server";

// Status-transition action used by the admin order detail page.
// Validation + audit + cache invalidation all go through
// `transitionOrderStatus` in the order service; this is just the
// auth gate + revalidation glue.

import { revalidatePath } from "next/cache";

import { getServerSession } from "@/server/auth-helpers";
import { canUpdateOrderStatus, loadActor } from "@/server/policy";
import {
  getOrderByRef,
  transitionOrderStatus,
} from "@/server/orders/service";
import type { OrderStatus } from "@prisma/client";
import { recordAuditEvent } from "@/server/audit/log";

export async function adminTransitionOrder(
  ref: string,
  toStatus: OrderStatus,
  reason?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession();
  if (!session?.user) {
    return { ok: false, error: "Sign-in required." };
  }
  const order = await getOrderByRef(ref);
  if (!order) return { ok: false, error: "Order not found." };

  const actor = await loadActor();
  const allowed = await canUpdateOrderStatus(actor, {
    ref: order.ref,
    status: order.status,
    contact: { email: order.contact.email },
  });
  if (!allowed) {
    return { ok: false, error: "Not permitted to update this order." };
  }

  const res = await transitionOrderStatus({
    orderId: order.id,
    toStatus,
    actorUserId: session.user.id,
    reason,
  });
  if (!res.ok) return res;
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${ref}`);
  revalidatePath(`/account/orders/${ref}`);
  await recordAuditEvent({
    action: "order.transition",
    actorUserId: session.user.id,
    resourceType: "order",
    resourceId: order.ref,
    before: { status: order.status },
    after: { status: toStatus },
    metadata: { customerEmail: order.contact.email },
    reason: reason ?? null,
  });
  return { ok: true };
}
