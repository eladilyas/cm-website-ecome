// Admin / Order assignments — dispatcher ownership of orders.
//
// Each row is one order ref. One dispatcher owns each order; the
// dispatcher then sees that order inside /admin/orders (when the
// order-data-layer migration lands) and can progress its fulfilment
// state machine.
//
// Mirrors /admin/assignments (which owns customer-level pre-sales
// assignments) but operates at the order grain.

import Link from "next/link";

import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import {
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/admin/AdminPrimitives";
import { OrderAssignmentsTable } from "./OrderAssignmentsTable";

export const dynamic = "force-dynamic";

export default async function AdminOrderAssignmentsPage() {
  await requireAdmin("/admin/order-assignments");

  const [assignments, dispatchers] = await Promise.all([
    db.orderAssignment.findMany({ orderBy: { createdAt: "desc" } }),
    db.user.findMany({
      where: {
        disabledAt: null,
        userRoles: { some: { role: { slug: ROLE_SLUGS.dispatcher } } },
      },
      select: { id: true, fullName: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const dispatcherById = new Map(
    dispatchers.map((u) => [
      u.id,
      { name: u.fullName || u.name || u.email, email: u.email },
    ]),
  );

  const loadByDispatcher = new Map<string, number>();
  for (const d of dispatchers) loadByDispatcher.set(d.id, 0);
  for (const a of assignments) {
    loadByDispatcher.set(
      a.assignedToUserId,
      (loadByDispatcher.get(a.assignedToUserId) ?? 0) + 1,
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Order assignments"
        description="Each row is one order ref. The assigned dispatcher sees that order in the fulfilment queue once the order data layer migrates to Postgres."
        actions={
          <Link
            href="/admin/users?role=dispatcher"
            className="inline-flex h-10 items-center justify-center rounded-full border border-hairline-strong bg-paper px-4 text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-fog transition-colors"
          >
            Manage dispatchers
          </Link>
        }
      />

      {dispatchers.length === 0 ? (
        <SectionCard title="No dispatchers">
          <div className="p-5">
            <EmptyState
              title="Create a dispatcher to start distributing orders"
              description="Order assignments need an active user with the dispatcher role. Create one from the Users page."
              cta={
                <Link
                  href="/admin/users/new"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-medium text-paper hover:bg-ink-soft transition-colors"
                >
                  Create user
                </Link>
              }
            />
          </div>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Dispatcher load"
            description={`${dispatchers.length} active dispatcher${dispatchers.length === 1 ? "" : "s"} · ${assignments.length} assigned order${assignments.length === 1 ? "" : "s"}`}
          >
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-5">
              {dispatchers.map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-hairline bg-canvas/60 px-4 py-3"
                >
                  <p className="text-[13px] font-medium text-ink truncate">
                    {d.fullName || d.name || d.email}
                  </p>
                  <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink-mute mt-1">
                    {loadByDispatcher.get(d.id) ?? 0} order
                    {(loadByDispatcher.get(d.id) ?? 0) === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="h-5" />

          <OrderAssignmentsTable
            assignments={assignments.map((a) => ({
              id: a.id,
              orderRef: a.orderRef,
              assignedToUserId: a.assignedToUserId,
              assignedToLabel:
                dispatcherById.get(a.assignedToUserId)?.name ?? "Unknown",
              notes: a.notes,
              updatedAt: a.updatedAt.toISOString(),
            }))}
            dispatchers={dispatchers.map((d) => ({
              id: d.id,
              label: d.fullName || d.name || d.email,
              email: d.email,
            }))}
          />
        </>
      )}
    </div>
  );
}
