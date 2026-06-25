// Admin route group layout.
//
// Server-side role gate:
//   • Cookie presence is enforced one layer up by src/middleware.ts.
//   • This layout adds the role check: admin OR super-admin OR
//     presales. Anyone else gets redirected to /403.
//
// Pre-sales users do see /admin — the sidebar exposes only the
// "Assigned" surfaces for them. The page-level guards inside each
// admin route can tighten further (e.g. /admin/users → super-admin
// only).

import { ROLE_SLUGS } from "@/server/rbac/catalog";
import { requireRole } from "@/server/auth-helpers";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin · Caisse Manager",
  // Admin must never be indexed.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email, roles } = await requireRole(
    "/admin",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
    ROLE_SLUGS.dispatcher,
  );

  return (
    <AdminShell email={email} roles={roles}>
      {children}
    </AdminShell>
  );
}
