"use server";

// Lead assignment actions — owned by super-admin.
//
// One assignment per customer email. Pre-sales users see all orders +
// financing whose contact email matches an assignment row keyed to
// their user id.
//
// Auto round-robin: distribute every customer that doesn't yet have an
// assignment evenly across the active pre-sales pool. Existing
// assignments are NEVER reshuffled — once a customer has an owner,
// that ownership stays put until manually changed.

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/server/db";
import { requireSuperAdmin } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";

const AssignInput = z.object({
  customerEmail: z.string().email(),
  assignedToUserId: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
});

export async function assignLead(
  input: z.infer<typeof AssignInput>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId: actorId } = await requireSuperAdmin("/admin/assignments");
  const parsed = AssignInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  // Sanity: the assignee must be an active pre-sales user.
  const presales = await db.user.findFirst({
    where: {
      id: d.assignedToUserId,
      disabledAt: null,
      userRoles: { some: { role: { slug: ROLE_SLUGS.presales } } },
    },
  });
  if (!presales) {
    return {
      ok: false,
      error: "Selected user isn't an active pre-sales rep.",
    };
  }

  await db.leadAssignment.upsert({
    where: { customerEmail: d.customerEmail.toLowerCase() },
    create: {
      customerEmail: d.customerEmail.toLowerCase(),
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

  revalidatePath("/admin/assignments");
  return { ok: true };
}

export async function unassignLead(
  customerEmail: string,
): Promise<{ ok: true }> {
  await requireSuperAdmin("/admin/assignments");
  await db.leadAssignment.deleteMany({
    where: { customerEmail: customerEmail.toLowerCase() },
  });
  revalidatePath("/admin/assignments");
  return { ok: true };
}

// ── Auto round-robin ───────────────────────────────────────────────────
// Distributes provided emails across the pool. Skips emails that
// already have an assignment. Returns a breakdown so the UI can show
// what was done.

export async function distributeLeads(
  customerEmails: string[],
): Promise<
  | { ok: true; created: number; skipped: number; perUser: Record<string, number> }
  | { ok: false; error: string }
> {
  const { userId: actorId } = await requireSuperAdmin("/admin/assignments");

  const presales = await db.user.findMany({
    where: {
      disabledAt: null,
      userRoles: { some: { role: { slug: ROLE_SLUGS.presales } } },
    },
    select: { id: true, fullName: true, name: true },
  });
  if (presales.length === 0) {
    return {
      ok: false,
      error: "No active pre-sales users. Create one or grant the role first.",
    };
  }

  // Current load — emails per presales user, so the round-robin starts
  // from whoever has the fewest assigned customers.
  const currentLoad = new Map<string, number>();
  for (const p of presales) currentLoad.set(p.id, 0);
  const existing = await db.leadAssignment.groupBy({
    by: ["assignedToUserId"],
    _count: { _all: true },
  });
  for (const row of existing) {
    if (currentLoad.has(row.assignedToUserId)) {
      currentLoad.set(row.assignedToUserId, row._count._all);
    }
  }

  const normalized = Array.from(
    new Set(customerEmails.map((e) => e.toLowerCase().trim())),
  ).filter(Boolean);

  let created = 0;
  let skipped = 0;
  const perUser: Record<string, number> = {};

  for (const email of normalized) {
    const exists = await db.leadAssignment.findUnique({
      where: { customerEmail: email },
    });
    if (exists) {
      skipped++;
      continue;
    }
    // Pick the rep with the lowest current count (ties broken by id).
    const next = presales
      .slice()
      .sort((a, b) => {
        const la = currentLoad.get(a.id) ?? 0;
        const lb = currentLoad.get(b.id) ?? 0;
        return la === lb ? a.id.localeCompare(b.id) : la - lb;
      })[0]!;
    await db.leadAssignment.create({
      data: {
        customerEmail: email,
        assignedToUserId: next.id,
        assignedByUserId: actorId,
      },
    });
    currentLoad.set(next.id, (currentLoad.get(next.id) ?? 0) + 1);
    perUser[next.id] = (perUser[next.id] ?? 0) + 1;
    created++;
  }

  revalidatePath("/admin/assignments");
  return { ok: true, created, skipped, perUser };
}
