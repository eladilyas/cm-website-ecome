"use server";

// Order assignment actions — keyed by orderRef (string).
//
// Order data lives in localStorage today (the Postgres Order model is
// scaffolded but unwired in customer checkout). That is fine: this
// table only needs the ref to do its job — it's a join between an
// order identifier and a dispatcher user. When the orderStore →
// Postgres migration lands, no change is required here.
//
// All writes require admin tier (super-admin OR admin). Reads can
// happen through the read-only page + the dispatcher's own scope
// resolved via `dispatcherScopeFor` in src/server/policy.

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";

const AssignOrderInput = z.object({
  orderRef: z.string().min(3).max(40),
  assignedToUserId: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
});

/** Assign one order to a dispatcher (create or reassign). */
export async function assignOrder(
  input: z.infer<typeof AssignOrderInput>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId: actorId } = await requireAdmin("/admin/order-assignments");
  const parsed = AssignOrderInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  // Sanity: target user must be an active dispatcher.
  const dispatcher = await db.user.findFirst({
    where: {
      id: d.assignedToUserId,
      disabledAt: null,
      userRoles: { some: { role: { slug: ROLE_SLUGS.dispatcher } } },
    },
  });
  if (!dispatcher) {
    return {
      ok: false,
      error: "Selected user isn't an active dispatcher.",
    };
  }

  await db.orderAssignment.upsert({
    where: { orderRef: d.orderRef.toLowerCase() },
    create: {
      orderRef: d.orderRef.toLowerCase(),
      assignedToUserId: d.assignedToUserId,
      assignedByUserId: actorId,
      notes: d.notes ?? null,
    },
    update: {
      assignedToUserId: d.assignedToUserId,
      assignedByUserId: actorId,
      notes: d.notes ?? null,
    },
  });

  revalidatePath("/admin/order-assignments");
  return { ok: true };
}

export async function unassignOrder(orderRef: string): Promise<{ ok: true }> {
  await requireAdmin("/admin/order-assignments");
  await db.orderAssignment.deleteMany({
    where: { orderRef: orderRef.toLowerCase() },
  });
  revalidatePath("/admin/order-assignments");
  return { ok: true };
}

/** Bulk distribute order refs across active dispatchers. Same
 *  round-robin shape as `distributeLeads`, but order-keyed. Existing
 *  assignments are NEVER reshuffled — admins can manually reassign
 *  through the per-row dropdown. */
export async function distributeOrders(
  orderRefs: string[],
): Promise<
  | { ok: true; created: number; skipped: number }
  | { ok: false; error: string }
> {
  const { userId: actorId } = await requireAdmin("/admin/order-assignments");

  const dispatchers = await db.user.findMany({
    where: {
      disabledAt: null,
      userRoles: { some: { role: { slug: ROLE_SLUGS.dispatcher } } },
    },
    select: { id: true },
  });
  if (dispatchers.length === 0) {
    return {
      ok: false,
      error: "No active dispatchers. Create one or grant the role first.",
    };
  }

  // Current load — number of assigned orders per dispatcher.
  const load = new Map<string, number>();
  for (const d of dispatchers) load.set(d.id, 0);
  const counts = await db.orderAssignment.groupBy({
    by: ["assignedToUserId"],
    _count: { _all: true },
  });
  for (const c of counts) {
    if (load.has(c.assignedToUserId)) {
      load.set(c.assignedToUserId, c._count._all);
    }
  }

  const normalized = Array.from(
    new Set(orderRefs.map((r) => r.toLowerCase().trim())),
  ).filter(Boolean);

  let created = 0;
  let skipped = 0;

  for (const ref of normalized) {
    const exists = await db.orderAssignment.findUnique({
      where: { orderRef: ref },
    });
    if (exists) {
      skipped++;
      continue;
    }
    // Pick the dispatcher with the lowest current load (ties by id).
    const next = dispatchers
      .slice()
      .sort((a, b) => {
        const la = load.get(a.id) ?? 0;
        const lb = load.get(b.id) ?? 0;
        return la === lb ? a.id.localeCompare(b.id) : la - lb;
      })[0]!;
    await db.orderAssignment.create({
      data: {
        orderRef: ref,
        assignedToUserId: next.id,
        assignedByUserId: actorId,
      },
    });
    load.set(next.id, (load.get(next.id) ?? 0) + 1);
    created++;
  }

  revalidatePath("/admin/order-assignments");
  return { ok: true, created, skipped };
}
