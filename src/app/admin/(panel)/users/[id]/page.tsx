// Admin / Users / [id] — single user view + role editor.

import { notFound } from "next/navigation";
import Link from "next/link";

import { db } from "@/server/db";
import { requireSuperAdmin } from "@/server/auth-helpers";
import { ROLES, type RoleSlug } from "@/server/rbac/catalog";
import {
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/admin/AdminPrimitives";
import { UserEditForm } from "./UserEditForm";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSuperAdmin(`/admin/users/${id}`);

  const user = await db.user.findUnique({
    where: { id },
    include: {
      userRoles: { include: { role: { select: { slug: true, name: true } } } },
    },
  });
  if (!user) notFound();

  const currentSlugs: RoleSlug[] = user.userRoles.map(
    (r) => r.role.slug as RoleSlug,
  );

  return (
    <div>
      <Link
        href="/admin/users"
        className="text-[12px] text-ink-mute hover:text-ink mb-3 inline-block"
      >
        ← All users
      </Link>

      <PageHeader
        eyebrow="User"
        title={user.fullName || user.name || user.email}
        description={user.email}
        actions={
          user.disabledAt ? (
            <StatusPill label="Disabled" tone="bad" />
          ) : (
            <StatusPill label="Active" tone="good" />
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <SectionCard
          title="Roles"
          description="Multiple roles can be assigned. The user inherits the union of all permissions."
        >
          <UserEditForm
            userId={user.id}
            currentSlugs={currentSlugs}
            allRoles={ROLES.map((r) => ({
              slug: r.slug,
              name: r.name,
              description: r.description,
              permissionCount: r.permissions.length,
            }))}
            disabled={Boolean(user.disabledAt)}
          />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Identity">
            <dl className="px-5 py-4 text-[13px] divide-y divide-hairline">
              <div className="py-2 flex items-baseline justify-between gap-4">
                <dt className="text-ink-mute">Email</dt>
                <dd className="text-ink truncate">{user.email}</dd>
              </div>
              <div className="py-2 flex items-baseline justify-between gap-4">
                <dt className="text-ink-mute">Email verified</dt>
                <dd className="text-ink">{user.emailVerified ? "Yes" : "No"}</dd>
              </div>
              <div className="py-2 flex items-baseline justify-between gap-4">
                <dt className="text-ink-mute">Phone</dt>
                <dd className="text-ink">{user.phone || "—"}</dd>
              </div>
              <div className="py-2 flex items-baseline justify-between gap-4">
                <dt className="text-ink-mute">Created</dt>
                <dd className="text-ink tabular-nums">
                  {new Date(user.createdAt).toLocaleString("en-CA")}
                </dd>
              </div>
              <div className="py-2 flex items-baseline justify-between gap-4">
                <dt className="text-ink-mute">Last login</dt>
                <dd className="text-ink tabular-nums">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString("en-CA")
                    : "—"}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
