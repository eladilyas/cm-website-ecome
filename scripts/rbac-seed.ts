// RBAC seeder — idempotent upsert of Role + Permission + RolePermission
// rows from the catalog in `src/server/rbac/catalog.ts`.
//
// Run via:  npm run rbac:seed
//
// Safe to run repeatedly. Adds new permissions / roles, never removes
// existing rows (so manual additions in production survive a re-seed).

import { PrismaClient } from "@prisma/client";

import { PERMISSIONS, ROLES } from "../src/server/rbac/catalog";

const db = new PrismaClient();

async function main(): Promise<void> {
  console.log("[rbac:seed] upserting permissions…");
  for (const p of Object.values(PERMISSIONS)) {
    await db.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      create: { resource: p.resource, action: p.action },
      update: {},
    });
  }

  console.log("[rbac:seed] upserting roles…");
  for (const r of ROLES) {
    await db.role.upsert({
      where: { slug: r.slug },
      create: { slug: r.slug, name: r.name, description: r.description },
      update: { name: r.name, description: r.description },
    });
  }

  console.log("[rbac:seed] wiring role → permission grants…");
  for (const r of ROLES) {
    const role = await db.role.findUniqueOrThrow({ where: { slug: r.slug } });
    // Re-derive the full grant set so removed permissions get pruned
    // for this specific role.
    const targetPermissionIds: string[] = [];
    for (const key of r.permissions) {
      const p = PERMISSIONS[key];
      const dbPerm = await db.permission.findUniqueOrThrow({
        where: { resource_action: { resource: p.resource, action: p.action } },
      });
      targetPermissionIds.push(dbPerm.id);
    }

    // Add missing grants.
    for (const pid of targetPermissionIds) {
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: pid } },
        create: { roleId: role.id, permissionId: pid },
        update: {},
      });
    }

    // Prune grants that no longer belong to this role.
    const existing = await db.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const toPrune = existing
      .map((e) => e.permissionId)
      .filter((pid) => !targetPermissionIds.includes(pid));
    if (toPrune.length > 0) {
      await db.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { in: toPrune } },
      });
    }

    console.log(
      `[rbac:seed]   ${r.slug}: ${targetPermissionIds.length} permissions, pruned ${toPrune.length}`,
    );
  }

  console.log("[rbac:seed] done.");
}

main()
  .catch((err) => {
    console.error("[rbac:seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
