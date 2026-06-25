// Admin / Users / New — create an account + assign initial roles.

import Link from "next/link";

import { requireSuperAdmin } from "@/server/auth-helpers";
import { ROLES, type RoleSlug } from "@/server/rbac/catalog";
import {
  PageHeader,
  SectionCard,
} from "@/components/admin/AdminPrimitives";
import { CreateUserForm } from "./CreateUserForm";

export const dynamic = "force-dynamic";

export default async function AdminUserNewPage() {
  await requireSuperAdmin("/admin/users/new");

  return (
    <div>
      <Link
        href="/admin/users"
        className="text-[12px] text-ink-mute hover:text-ink mb-3 inline-block"
      >
        ← All users
      </Link>

      <PageHeader
        eyebrow="Identity"
        title="Create user"
        description="Provisions a Better-Auth account + assigns one or more roles. The user receives no email — share the credentials manually for now (email-verify flow lands later)."
      />

      <SectionCard title="Account details">
        <CreateUserForm
          allRoles={ROLES.filter((r) => r.slug !== "customer").map((r) => ({
            slug: r.slug as RoleSlug,
            name: r.name,
            description: r.description,
          }))}
        />
      </SectionCard>
    </div>
  );
}
