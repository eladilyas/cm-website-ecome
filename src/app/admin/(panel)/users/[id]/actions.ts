"use server";

// Server actions for /admin/users/[id]. Mutations only — the page
// itself is a server component that re-fetches after revalidation.
//
// Every action runs `requireSuperAdmin` so even if a stale form
// submits without the visitor still being a super-admin, the action
// rejects with a redirect (not silent success).

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/server/db";
import { requireSuperAdmin } from "@/server/auth-helpers";
import { ROLE_SLUGS, ROLES, type RoleSlug } from "@/server/rbac/catalog";

const RoleSlugSchema = z.enum(
  ROLES.map((r) => r.slug) as [RoleSlug, ...RoleSlug[]],
);

export async function setUserRoles(
  userId: string,
  selectedSlugs: RoleSlug[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSuperAdmin(`/admin/users/${userId}`);

  // Parse + dedupe.
  const parsed = z.array(RoleSlugSchema).safeParse(selectedSlugs);
  if (!parsed.success) {
    return { ok: false, error: "Invalid role selection." };
  }
  const slugs = Array.from(new Set(parsed.data));

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };

  const roles = await db.role.findMany({
    where: { slug: { in: slugs } },
  });
  const targetRoleIds = roles.map((r) => r.id);

  // Replace the user's role set in one transaction.
  await db.$transaction([
    db.userRole.deleteMany({ where: { userId } }),
    db.userRole.createMany({
      data: targetRoleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true,
    }),
  ]);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function setUserDisabled(
  userId: string,
  disabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId: actorId } = await requireSuperAdmin(
    `/admin/users/${userId}`,
  );

  if (disabled && userId === actorId) {
    // Don't let a super-admin lock themselves out.
    return { ok: false, error: "You cannot disable your own account." };
  }

  // Also assert there is at least one OTHER super-admin if we're
  // disabling a super-admin. Prevents "no admins at all" state.
  if (disabled) {
    const targetIsSuper = await db.userRole.count({
      where: { userId, role: { slug: ROLE_SLUGS.superAdmin } },
    });
    if (targetIsSuper > 0) {
      const otherActiveSupers = await db.userRole.count({
        where: {
          role: { slug: ROLE_SLUGS.superAdmin },
          userId: { not: userId },
          user: { disabledAt: null },
        },
      });
      if (otherActiveSupers === 0) {
        return {
          ok: false,
          error:
            "This is the only active Super Admin. Grant another user the role first.",
        };
      }
    }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { disabledAt: disabled ? new Date() : null },
    });
    // Disabling — purge active sessions so the existing cookie stops
    // resolving immediately (loadActor reads disabledAt as a second
    // line, but session deletion is the authoritative cut).
    // Re-enabling — no session changes; the user signs in again.
    if (disabled) {
      await tx.session.deleteMany({ where: { userId } });
    }
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}
