// Admin / Leads — CRM lead list (external user accounts).
//
// "Lead" here = any signed-up user who does NOT carry an internal
// staff role. Customer-side prospects + buyers all live in this
// surface; internal staff lives under /admin/users.
//
// Scoping rules (enforced via `customerScopeFor`):
//   • Super-admin / admin — sees every lead in the platform.
//   • Pre-sales — sees only leads assigned to them via LeadAssignment.
//
// The page calls the policy layer; it never re-implements the
// authorization decision.

import Link from "next/link";

import { db } from "@/server/db";
import {
  PageHeader,
  SectionCard,
  EmptyState,
  StatusPill,
  StatsStrip,
} from "@/components/admin/AdminPrimitives";
import { requireRole } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import {
  customerScopeFor,
  loadActor,
} from "@/server/policy";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await requireRole(
    "/admin/leads",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
  );

  const actor = await loadActor();
  const scope = await customerScopeFor(actor);

  // Build the customer set under the active scope. Customers are
  // resolved off the User table — admins/super-admins/presales are
  // EXCLUDED so the list shows actual buyers, not internal staff.
  const baseWhere = {
    disabledAt: null,
    userRoles: {
      none: {
        role: {
          slug: {
            in: [
              ROLE_SLUGS.superAdmin,
              ROLE_SLUGS.admin,
              ROLE_SLUGS.presales,
            ],
          },
        },
      },
    },
  };

  const users = await db.user.findMany({
    where:
      scope.kind === "all"
        ? baseWhere
        : { ...baseWhere, email: { in: scope.emails } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Assignments map for the "Owned by" column. Pre-sales user labels
  // are looked up to make the table readable.
  const [assignments, presalesUsers] = await Promise.all([
    db.leadAssignment.findMany({
      where:
        scope.kind === "all"
          ? {}
          : { customerEmail: { in: scope.emails } },
    }),
    db.user.findMany({
      where: {
        userRoles: { some: { role: { slug: ROLE_SLUGS.presales } } },
      },
      select: { id: true, fullName: true, name: true, email: true },
    }),
  ]);

  const presalesById = new Map(
    presalesUsers.map((p) => [
      p.id,
      p.fullName || p.name || p.email,
    ]),
  );
  const assignmentByEmail = new Map(
    assignments.map((a) => [
      a.customerEmail.toLowerCase(),
      presalesById.get(a.assignedToUserId) ?? "—",
    ]),
  );

  const total = users.length;
  const verified = users.filter((u) => u.emailVerified).length;
  const assigned = users.filter((u) =>
    assignmentByEmail.has(u.email.toLowerCase()),
  ).length;
  const unassigned = total - assigned;

  const scopeLabel =
    scope.kind === "all"
      ? "Every external account on the platform — prospects, customers, and post-sale relationships."
      : `${scope.emails.length} lead${scope.emails.length === 1 ? "" : "s"} assigned to you.`;

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Leads"
        description={scopeLabel}
      />

      <StatsStrip
        items={[
          { label: "Total leads", value: total },
          { label: "Email-verified", value: verified, tone: "good" },
          { label: "Assigned", value: assigned, tone: "info" },
          { label: "Unassigned", value: unassigned, tone: "warn" },
        ]}
      />

      <SectionCard
        title={`Leads (${total})`}
        description="Each row is one external account. Click to see their full history (orders + financing pending data-layer migration)."
      >
        {total === 0 ? (
          <div className="p-5">
            <EmptyState
              title={
                scope.kind === "all"
                  ? "No leads yet"
                  : "No leads assigned to you"
              }
              description={
                scope.kind === "all"
                  ? "Once visitors sign up at /signup, they appear here as leads."
                  : "A Super Admin needs to assign leads to your account via /admin/assignments."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="admin-thead text-ink-mute text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Lead</th>
                  <th className="text-left font-medium px-5 py-3">
                    Email-verified
                  </th>
                  <th className="text-left font-medium px-5 py-3">Owned by</th>
                  <th className="text-left font-medium px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {users.map((u) => {
                  const owner = assignmentByEmail.get(u.email.toLowerCase());
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-canvas/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink">
                          {u.fullName || u.name}
                        </p>
                        <p className="text-[11.5px] text-ink-mute">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.emailVerified ? (
                          <StatusPill label="Verified" tone="good" />
                        ) : (
                          <StatusPill label="Pending" tone="warn" />
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft">
                        {owner ? (
                          owner
                        ) : (
                          <span className="text-ink-mute italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft tabular-nums">
                        {new Date(u.createdAt).toLocaleDateString("en-CA")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {scope.kind === "all" && (
        <p className="mt-6 text-[12px] text-ink-mute">
          Need to assign new leads to a pre-sales rep?{" "}
          <Link
            href="/admin/assignments"
            className="text-ink hover:underline underline-offset-[5px]"
          >
            Open Lead assignments →
          </Link>
        </p>
      )}
    </div>
  );
}
