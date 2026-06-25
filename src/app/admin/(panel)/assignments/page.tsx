// Admin / Assignments — pre-sales lead ownership.
//
// Each row is one customer (by email). One pre-sales rep owns each
// customer; the assignment lets them see ALL of that customer's
// orders + financing inside /admin (when the order/financing data
// layer migrates to Postgres in the next wave).

import Link from "next/link";

import { db } from "@/server/db";
import { requireSuperAdmin } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import {
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/admin/AdminPrimitives";
import { AssignmentsTable } from "./AssignmentsTable";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage() {
  await requireSuperAdmin("/admin/assignments");

  // Fetch in parallel: assignments + presales pool + counts per rep.
  const [assignments, presales] = await Promise.all([
    db.leadAssignment.findMany({ orderBy: { createdAt: "desc" } }),
    db.user.findMany({
      where: {
        disabledAt: null,
        userRoles: { some: { role: { slug: ROLE_SLUGS.presales } } },
      },
      select: { id: true, fullName: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Build a lookup of user-id → display name for the table.
  const userById = new Map(
    presales.map((u) => [
      u.id,
      { name: u.fullName || u.name || u.email, email: u.email },
    ]),
  );

  // Count per rep for the load summary up top.
  const loadByRep = new Map<string, number>();
  for (const p of presales) loadByRep.set(p.id, 0);
  for (const a of assignments) {
    loadByRep.set(
      a.assignedToUserId,
      (loadByRep.get(a.assignedToUserId) ?? 0) + 1,
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Identity"
        title="Lead assignments"
        description="Each row is one customer email. The assigned pre-sales rep sees every order + financing request from that customer."
        actions={
          <Link
            href="/admin/users?role=presales"
            className="inline-flex h-10 items-center justify-center rounded-full border border-hairline-strong bg-paper px-4 text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-fog transition-colors"
          >
            Manage pre-sales
          </Link>
        }
      />

      {presales.length === 0 ? (
        <SectionCard title="No pre-sales reps">
          <div className="p-5">
            <EmptyState
              title="Create a pre-sales user to start assigning leads"
              description="Lead assignments need an active user with the pre-sales role. Create one from the Users page."
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
          {/* Load summary */}
          <SectionCard
            title="Pre-sales load"
            description={`${presales.length} active rep${presales.length === 1 ? "" : "s"} · ${assignments.length} assigned customer${assignments.length === 1 ? "" : "s"}`}
          >
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-5">
              {presales.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-hairline bg-canvas/60 px-4 py-3"
                >
                  <p className="text-[13px] font-medium text-ink truncate">
                    {p.fullName || p.name || p.email}
                  </p>
                  <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink-mute mt-1">
                    {loadByRep.get(p.id) ?? 0} customer
                    {(loadByRep.get(p.id) ?? 0) === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="h-5" />

          <AssignmentsTable
            assignments={assignments.map((a) => ({
              id: a.id,
              customerEmail: a.customerEmail,
              assignedToUserId: a.assignedToUserId,
              assignedToLabel:
                userById.get(a.assignedToUserId)?.name ?? "Unknown",
              notes: a.notes,
              updatedAt: a.updatedAt.toISOString(),
            }))}
            presales={presales.map((p) => ({
              id: p.id,
              label: p.fullName || p.name || p.email,
              email: p.email,
            }))}
          />
        </>
      )}
    </div>
  );
}
