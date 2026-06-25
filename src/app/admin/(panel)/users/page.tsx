// Admin / Users — super-admin only.
//
// Lists every user with current role badges and an in-row action to
// edit roles. New users are created here too — Better-Auth's admin
// signup endpoint provisions the account; this page wires the
// post-creation role assignment.

import Link from "next/link";

import { db } from "@/server/db";
import { ROLE_SLUGS, type RoleSlug } from "@/server/rbac/catalog";
import { requireSuperAdmin } from "@/server/auth-helpers";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  EmptyState,
  StatsStrip,
} from "@/components/admin/AdminPrimitives";
import { UserActiveToggle } from "./UserActiveToggle";

export const dynamic = "force-dynamic";

// Internal staff role slugs — these define who shows up in the Users
// panel. Anyone else (signed-up customers with no internal role) is
// surfaced in /admin/leads instead. Keeping the set here keeps the
// "who counts as staff" decision in one obvious place.
const INTERNAL_STAFF_SLUGS = [
  ROLE_SLUGS.superAdmin,
  ROLE_SLUGS.admin,
  ROLE_SLUGS.presales,
  ROLE_SLUGS.dispatcher,
];

export default async function AdminUsersPage() {
  await requireSuperAdmin("/admin/users");

  const users = await db.user.findMany({
    where: {
      // Internal staff only — every user must carry at least one of
      // the staff role slugs. Customer-only accounts live in /admin/leads.
      userRoles: {
        some: { role: { slug: { in: INTERNAL_STAFF_SLUGS } } },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      userRoles: { include: { role: { select: { slug: true, name: true } } } },
    },
  });

  // Per-role counts for the CRM-style stats strip at the top of the page.
  const counts = {
    total: users.length,
    super: users.filter((u) =>
      u.userRoles.some((r) => r.role.slug === ROLE_SLUGS.superAdmin),
    ).length,
    admin: users.filter((u) =>
      u.userRoles.some((r) => r.role.slug === ROLE_SLUGS.admin),
    ).length,
    presales: users.filter((u) =>
      u.userRoles.some((r) => r.role.slug === ROLE_SLUGS.presales),
    ).length,
    dispatcher: users.filter((u) =>
      u.userRoles.some((r) => r.role.slug === ROLE_SLUGS.dispatcher),
    ).length,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Identity"
        title="Users & roles"
        description="Internal staff only — Super Admins, Admins, Pre-sales, and Dispatchers. Customer-side accounts live under Leads."
        actions={
          <Link
            href="/admin/users/new"
            className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft transition-colors"
          >
            New user
          </Link>
        }
      />

      <StatsStrip
        items={[
          { label: "Internal staff", value: counts.total },
          { label: "Super Admins", value: counts.super, tone: "info" },
          { label: "Admins", value: counts.admin, tone: "info" },
          { label: "Pre-sales", value: counts.presales, tone: "neutral" },
          { label: "Dispatchers", value: counts.dispatcher, tone: "neutral" },
        ]}
      />

      <SectionCard
        title={`Accounts (${users.length})`}
        description="Click any row to edit roles."
      >
        {users.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No internal staff yet"
              description="Customer signups land in Leads. Use New user to invite Super Admins, Admins, Pre-sales, or Dispatchers."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="admin-thead text-ink-mute text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Account</th>
                  <th className="text-left font-medium px-5 py-3">Roles</th>
                  <th className="text-left font-medium px-5 py-3">Joined</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="w-12 px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {users.map((u) => {
                  const roleSlugs = u.userRoles.map(
                    (r) => r.role.slug as RoleSlug,
                  );
                  const isSuper = roleSlugs.includes(ROLE_SLUGS.superAdmin);
                  const isAdmin = roleSlugs.includes(ROLE_SLUGS.admin);
                  const isPresales = roleSlugs.includes(ROLE_SLUGS.presales);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-canvas/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="block"
                        >
                          <p className="font-medium text-ink">
                            {u.fullName || u.name}
                          </p>
                          <p className="text-[11.5px] text-ink-mute">
                            {u.email}
                          </p>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {isSuper && (
                            <StatusPill label="Super Admin" tone="info" />
                          )}
                          {isAdmin && !isSuper && (
                            <StatusPill label="Admin" tone="info" />
                          )}
                          {isPresales && (
                            <StatusPill label="Pre-sales" tone="neutral" />
                          )}
                          {roleSlugs.length === 0 && (
                            <span className="text-[11.5px] text-ink-mute italic">
                              Customer only
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft tabular-nums">
                        {new Date(u.createdAt).toLocaleDateString("en-CA")}
                      </td>
                      <td className="px-5 py-3.5">
                        <UserActiveToggle
                          userId={u.id}
                          initialActive={u.disabledAt === null}
                          userLabel={u.email}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-ink-mute hover:text-ink"
                          aria-label="Edit user"
                        >
                          →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
