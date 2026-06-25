// Grant a role to an existing user.
//
// Usage:
//   npm run grant-role -- <email> <role-slug>
//
// Example:
//   npm run grant-role -- e.ilyas@caissemanager.com super-admin
//
// Idempotent — running twice for the same (user, role) pair is a no-op.
// Use this to bootstrap the first super-admin after sign-up; subsequent
// grants happen via the admin UI.

import { PrismaClient } from "@prisma/client";

import { ROLES, type RoleSlug } from "../src/server/rbac/catalog";

const db = new PrismaClient();

async function main(): Promise<void> {
  const [emailRaw, roleSlugRaw] = process.argv.slice(2);
  if (!emailRaw || !roleSlugRaw) {
    console.error("Usage: npm run grant-role -- <email> <role-slug>");
    console.error(
      "Available role slugs: " + ROLES.map((r) => r.slug).join(", "),
    );
    process.exit(1);
  }

  const email = emailRaw.toLowerCase().trim();
  const roleSlug = roleSlugRaw.trim() as RoleSlug;

  if (!ROLES.some((r) => r.slug === roleSlug)) {
    console.error(
      `Unknown role slug "${roleSlug}". Available: ${ROLES.map((r) => r.slug).join(", ")}`,
    );
    process.exit(1);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email "${email}".`);
    console.error(
      "User must sign up at /signup first; this script only grants roles.",
    );
    process.exit(1);
  }

  const role = await db.role.findUnique({ where: { slug: roleSlug } });
  if (!role) {
    console.error(
      `Role "${roleSlug}" is not seeded. Run \`npm run rbac:seed\` first.`,
    );
    process.exit(1);
  }

  await db.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });

  console.log(
    `[grant-role] ✓ granted "${role.slug}" (${role.name}) to ${user.email}`,
  );
}

main()
  .catch((err) => {
    console.error("[grant-role] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
