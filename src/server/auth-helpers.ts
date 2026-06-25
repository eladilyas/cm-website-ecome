// Server-side auth helpers — used by server components, route
// handlers, and middleware extensions.
//
// Pattern:
//   • `getServerSession()` → returns Better-Auth's user (or null).
//     Resolves the session from the incoming `headers()` so it works in
//     server components + route handlers without prop-drilling.
//   • `getUserRoles()` → returns the role slugs assigned to the user.
//   • `getUserPermissions()` → returns the (resource, action) pairs the
//     user holds across all their roles.
//   • `requireRole()` → throws a redirect to /signin if not signed in,
//     or a 403 if signed in but missing any of the listed roles.
//
// All helpers cache the Prisma lookup per request via React's `cache()`
// so multiple calls in one render don't multiply the DB load.

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  PERMISSIONS,
  ROLE_SLUGS,
  isAdminRole,
  type PermissionKey,
  type RoleSlug,
} from "@/server/rbac/catalog";

export type ServerSession = Awaited<
  ReturnType<typeof auth.api.getSession>
>;

/** Better-Auth session as seen from a server-side context (or null). */
export const getServerSession = cache(async (): Promise<ServerSession> => {
  return auth.api.getSession({ headers: await headers() });
});

/** Role slugs the current user holds. Empty array when signed out. */
export const getUserRoles = cache(async (): Promise<RoleSlug[]> => {
  const session = await getServerSession();
  const userId = session?.user?.id;
  if (!userId) return [];
  const rows = await db.userRole.findMany({
    where: { userId },
    include: { role: { select: { slug: true } } },
  });
  return rows.map((r) => r.role.slug as RoleSlug);
});

/** Flat list of (resource, action) the user holds across all roles. */
export const getUserPermissions = cache(
  async (): Promise<Set<string>> => {
    const session = await getServerSession();
    const userId = session?.user?.id;
    if (!userId) return new Set();
    const rows = await db.rolePermission.findMany({
      where: { role: { userRoles: { some: { userId } } } },
      include: { permission: true },
    });
    return new Set(
      rows.map((r) => `${r.permission.resource}.${r.permission.action}`),
    );
  },
);

/** Does the current user hold ANY of the given role slugs? */
export async function hasAnyRole(...slugs: RoleSlug[]): Promise<boolean> {
  const userRoles = await getUserRoles();
  return userRoles.some((r) => slugs.includes(r));
}

/** Does the current user hold the given permission? */
export async function hasPermission(key: PermissionKey): Promise<boolean> {
  const p = PERMISSIONS[key];
  const set = await getUserPermissions();
  return set.has(`${p.resource}.${p.action}`);
}

// ── Guards ──────────────────────────────────────────────────────────────
// Server components throw a redirect when access is denied. Route
// handlers should call `requireRole().catch(...)` and return a 403 if
// they need a non-redirect response shape.

/**
 * Ensures the visitor is signed in AND holds at least one of the
 * allowed roles. Redirects to /signin (with `?next=`) when signed out,
 * or to /403 when signed in but missing all roles.
 */
export async function requireRole(
  pathname: string,
  ...allowed: RoleSlug[]
): Promise<{
  userId: string;
  email: string;
  roles: RoleSlug[];
}> {
  const session = await getServerSession();
  if (!session?.user) {
    redirect(`/signin?next=${encodeURIComponent(pathname)}`);
  }
  const roles = await getUserRoles();
  const allow = allowed.length === 0 || roles.some((r) => allowed.includes(r));
  if (!allow) {
    redirect("/403");
  }
  return {
    userId: session.user.id,
    email: session.user.email,
    roles,
  };
}

/** Shorthand: super-admin OR admin. */
export async function requireAdmin(pathname: string) {
  return requireRole(pathname, ROLE_SLUGS.superAdmin, ROLE_SLUGS.admin);
}

/** Shorthand: super-admin only — for user/role management. */
export async function requireSuperAdmin(pathname: string) {
  return requireRole(pathname, ROLE_SLUGS.superAdmin);
}

/**
 * Returns true when the user's only relevant admin-side role is
 * pre-sales. Useful for narrowing list queries to assigned leads.
 */
export async function isPresalesOnly(): Promise<boolean> {
  const roles = await getUserRoles();
  if (roles.some((r) => isAdminRole(r))) return false;
  return roles.includes(ROLE_SLUGS.presales);
}
