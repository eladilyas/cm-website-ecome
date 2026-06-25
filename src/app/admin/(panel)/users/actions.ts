"use server";

// List-level user actions. Per-user role + disable actions live in
// /admin/users/[id]/actions.ts; this file holds quick toggles called
// from the inline list buttons.

import { revalidatePath } from "next/cache";

import { db } from "@/server/db";
import { requireSuperAdmin } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import { recordAuditEvent } from "@/server/audit/log";

/**
 * Flip a user's active state from the list view. Same safety rails as
 * the detail-page button:
 *   • Can't disable yourself
 *   • Can't disable the last active super-admin
 */
export async function toggleUserActive(
  userId: string,
): Promise<{ ok: true; isActive: boolean } | { ok: false; error: string }> {
  const { userId: actorId } = await requireSuperAdmin("/admin/users");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };

  const willDisable = user.disabledAt === null;

  if (willDisable) {
    if (userId === actorId) {
      return { ok: false, error: "You cannot disable your own account." };
    }
    // If the target is a super-admin, refuse if they're the last active one.
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

  await db.user.update({
    where: { id: userId },
    data: { disabledAt: willDisable ? new Date() : null },
  });

  await recordAuditEvent({
    action: willDisable ? "user.disable" : "user.enable",
    actorUserId: actorId,
    resourceType: "user",
    resourceId: userId,
    before: { disabledAt: user.disabledAt?.toISOString() ?? null },
    after: { disabledAt: willDisable ? new Date().toISOString() : null },
    metadata: { email: user.email },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true, isActive: !willDisable };
}
