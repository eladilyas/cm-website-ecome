"use server";

import { revalidatePath } from "next/cache";
import type { FinancingStatus } from "@prisma/client";

import { getServerSession } from "@/server/auth-helpers";
import { loadActor } from "@/server/policy";
import {
  actorCanSeeFinancing,
  addFollowupNote,
  getFinancingByRef,
  transitionFinancingStatus,
} from "@/server/financing/service";
import { recordAuditEvent } from "@/server/audit/log";

function canActFinancing(actor: Awaited<ReturnType<typeof loadActor>>): boolean {
  // Pre-sales is the validation layer for financing files; admins +
  // super-admins inherit. Dispatchers + plain customers cannot move
  // the status.
  return Boolean(actor && (actor.isAdmin || actor.isPresales));
}

/** Transition a financing request status. Admin tier + pre-sales. */
export async function adminTransitionFinancing(
  ref: string,
  toStatus: FinancingStatus,
  reason?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession();
  if (!session?.user) return { ok: false, error: "Sign-in required." };
  const actor = await loadActor();
  if (!canActFinancing(actor)) {
    return { ok: false, error: "Pre-sales or admin role required." };
  }
  const request = await getFinancingByRef(ref);
  if (!request) return { ok: false, error: "Request not found." };
  const allowed = await actorCanSeeFinancing(request, actor);
  if (!allowed) {
    return { ok: false, error: "Not permitted to update this request." };
  }
  const res = await transitionFinancingStatus({
    requestId: request.id,
    toStatus,
    actorUserId: session.user.id,
    reason,
  });
  if (!res.ok) return res;
  revalidatePath("/admin/financing");
  revalidatePath(`/admin/financing/${ref}`);
  revalidatePath(`/admin/orders/${ref}`);
  revalidatePath(`/account/financing/${ref}`);
  revalidatePath(`/account/orders/${ref}`);
  await recordAuditEvent({
    action: "financing.transition",
    actorUserId: session.user.id,
    resourceType: "financing",
    resourceId: request.ref,
    before: { status: request.status },
    after: { status: toStatus },
    reason: reason ?? null,
  });
  return { ok: true };
}

/** Append a follow-up note to a financing order. Pre-sales + admin. */
export async function addFinancingFollowupNote(
  ref: string,
  body: string,
  kind?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getServerSession();
  if (!session?.user) return { ok: false, error: "Sign-in required." };
  const actor = await loadActor();
  if (!canActFinancing(actor)) {
    return { ok: false, error: "Pre-sales or admin role required." };
  }
  const request = await getFinancingByRef(ref);
  if (!request) return { ok: false, error: "Request not found." };
  const allowed = await actorCanSeeFinancing(request, actor);
  if (!allowed) {
    return { ok: false, error: "Not permitted to update this request." };
  }
  const res = await addFollowupNote({
    orderId: request.id,
    actorUserId: session.user.id,
    body,
    kind,
  });
  if (!res.ok) return res;
  revalidatePath(`/admin/financing/${ref}`);
  return { ok: true };
}
