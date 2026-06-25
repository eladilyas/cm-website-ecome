// Production data wipe — Phase 1 of the migration plan.
//
// What it wipes:
//   • All Orders (+ OrderItem, OrderStatusTransition via cascade)
//   • All FinancingRequests (+ FinancingStatusTransition via cascade)
//   • All OrderAssignments
//   • All LeadAssignments
//   • All non-staff Users (customers / leads only — anyone whose roles
//     are empty OR consist solely of the "customer" role)
//
// What it PRESERVES:
//   • Internal staff (super-admin, admin, presales, dispatcher)
//   • Products, Categories, Roles, Permissions, RolePermission grants
//   • System tables (Sessions etc. on staff)
//
// Safety:
//   • Dry-run by default. Prints what would be deleted, makes no changes.
//   • Pass `--confirm` to actually execute. The flag is intentionally
//     verbose so it can't be tripped by autocomplete.
//
// Usage:
//   npm run wipe-data              # dry-run, prints counts
//   npm run wipe-data -- --confirm # actually delete

import { PrismaClient } from "@prisma/client";

import { ROLE_SLUGS } from "../src/server/rbac/catalog";

const db = new PrismaClient();

const INTERNAL_STAFF_SLUGS = [
  ROLE_SLUGS.superAdmin,
  ROLE_SLUGS.admin,
  ROLE_SLUGS.presales,
  ROLE_SLUGS.dispatcher,
];

async function main(): Promise<void> {
  const confirm = process.argv.includes("--confirm");
  const label = confirm ? "DELETING" : "DRY-RUN — would delete";

  console.log(`[wipe-data] mode: ${confirm ? "CONFIRM ✋" : "dry-run"}\n`);

  // Counts before action — what the wipe targets.
  const [
    orderCount,
    orderItemCount,
    orderTransitionCount,
    financingCount,
    financingTransitionCount,
    orderAssignmentCount,
    leadAssignmentCount,
  ] = await Promise.all([
    db.order.count(),
    db.orderItem.count(),
    db.orderStatusTransition.count(),
    db.financingRequest.count(),
    db.financingStatusTransition.count(),
    db.orderAssignment.count(),
    db.leadAssignment.count(),
  ]);

  // External user accounts — anyone with NO internal staff role.
  const externalUsers = await db.user.findMany({
    where: {
      userRoles: {
        none: { role: { slug: { in: INTERNAL_STAFF_SLUGS } } },
      },
    },
    select: { id: true, email: true },
  });

  console.log("[wipe-data] target counts:");
  console.log(`  • Orders                       ${orderCount}`);
  console.log(`  • OrderItems                   ${orderItemCount}`);
  console.log(`  • OrderStatusTransitions       ${orderTransitionCount}`);
  console.log(`  • FinancingRequests            ${financingCount}`);
  console.log(`  • FinancingStatusTransitions   ${financingTransitionCount}`);
  console.log(`  • OrderAssignments             ${orderAssignmentCount}`);
  console.log(`  • LeadAssignments              ${leadAssignmentCount}`);
  console.log(`  • External user accounts       ${externalUsers.length}`);
  if (externalUsers.length > 0) {
    console.log(`    (preserving internal staff: ${INTERNAL_STAFF_SLUGS.join(", ")})`);
  }
  console.log("");

  if (!confirm) {
    console.log("[wipe-data] dry-run complete. Re-run with --confirm to execute.");
    return;
  }

  // Ordered deletes — children before parents where Prisma's cascade
  // isn't explicit. (Prisma DOES cascade Order→items/transitions via
  // `onDelete: Cascade` on the relations, but we delete explicitly
  // here so the log is honest about what gets touched.)

  console.log(`[wipe-data] ${label}…`);
  const result = await db.$transaction(async (tx) => {
    const t1 = await tx.orderStatusTransition.deleteMany();
    const t2 = await tx.orderItem.deleteMany();
    const t3 = await tx.order.deleteMany();
    const t4 = await tx.financingStatusTransition.deleteMany();
    const t5 = await tx.financingRequest.deleteMany();
    const t6 = await tx.orderAssignment.deleteMany();
    const t7 = await tx.leadAssignment.deleteMany();
    const t8 = await tx.user.deleteMany({
      where: { id: { in: externalUsers.map((u) => u.id) } },
    });
    return {
      orderTransitions: t1.count,
      orderItems: t2.count,
      orders: t3.count,
      financingTransitions: t4.count,
      financingRequests: t5.count,
      orderAssignments: t6.count,
      leadAssignments: t7.count,
      externalUsers: t8.count,
    };
  });

  console.log("[wipe-data] done.");
  for (const [k, v] of Object.entries(result)) {
    console.log(`  ✓ deleted ${k}: ${v}`);
  }
}

main()
  .catch((err) => {
    console.error("[wipe-data] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
