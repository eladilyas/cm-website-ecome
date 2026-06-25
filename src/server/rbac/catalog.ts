// RBAC catalog — the source of truth for role slugs and the
// permissions each role carries.
//
// Slugs are stable identifiers; UI labels (visible names) and
// descriptions live alongside them so a single update site governs
// what the admin sees + what the backend enforces.
//
// Changing this file requires re-running `npm run rbac:seed` to push
// the new role/permission rows into Postgres.

export const ROLE_SLUGS = {
  superAdmin: "super-admin",
  admin: "admin",
  presales: "presales",
  dispatcher: "dispatcher",
  customer: "customer",
} as const;

export type RoleSlug = (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS];

export type Permission = Readonly<{
  resource: string;
  action: string;
}>;

// Permissions are flat — `resource.action`. The check is just an
// exact lookup; no wildcards.
export const PERMISSIONS = {
  // Products
  productsView: { resource: "products", action: "view" },
  productsCreate: { resource: "products", action: "create" },
  productsUpdate: { resource: "products", action: "update" },
  productsDelete: { resource: "products", action: "delete" },

  // Orders — split by purpose so role grants stay tight.
  //   • view-all              → admin/super-admin: read every order
  //   • view-assigned-unpaid  → pre-sales: read ONLY unpaid orders for
  //                             customers assigned to them
  //   • view-assigned-fulfilment → dispatcher: read orders that are in
  //                                 fulfilment scope (paid or beyond)
  //                                 AND assigned to them via OrderAssignment
  //   • update-status         → admin/super-admin: any order, any status
  //   • process-fulfilment    → dispatcher: progress the fulfilment
  //                             state machine (paid → preparing → shipped
  //                             → delivered) for their assigned orders
  ordersViewAll: { resource: "orders", action: "view-all" },
  ordersViewAssignedUnpaid: { resource: "orders", action: "view-assigned-unpaid" },
  ordersViewAssignedFulfilment: { resource: "orders", action: "view-assigned-fulfilment" },
  ordersUpdateStatus: { resource: "orders", action: "update-status" },
  ordersProcessFulfilment: { resource: "orders", action: "process-fulfilment" },

  // Financing
  financingViewAll: { resource: "financing", action: "view-all" },
  financingViewAssigned: { resource: "financing", action: "view-assigned" },
  financingDecide: { resource: "financing", action: "decide" },

  // Users + roles
  usersView: { resource: "users", action: "view" },
  usersCreate: { resource: "users", action: "create" },
  usersUpdate: { resource: "users", action: "update" },
  usersDisable: { resource: "users", action: "disable" },
  rolesAssign: { resource: "users", action: "assign-roles" },

  // Lead (customer) assignments — pre-sales ownership of customers.
  assignmentsView: { resource: "assignments", action: "view" },
  assignmentsManage: { resource: "assignments", action: "manage" },

  // Order assignments — dispatcher ownership of order refs.
  orderAssignmentsView: { resource: "order-assignments", action: "view" },
  orderAssignmentsManage: { resource: "order-assignments", action: "manage" },
} as const satisfies Record<string, Permission>;

export type PermissionKey = keyof typeof PERMISSIONS;

// ── Role definitions ───────────────────────────────────────────────────

export type RoleDefinition = Readonly<{
  slug: RoleSlug;
  name: string;
  description: string;
  permissions: PermissionKey[];
}>;

export const ROLES: readonly RoleDefinition[] = [
  {
    slug: ROLE_SLUGS.superAdmin,
    name: "Super Admin",
    description: "Unrestricted access. Owns role + user management.",
    // Every permission key.
    permissions: Object.keys(PERMISSIONS) as PermissionKey[],
  },
  {
    slug: ROLE_SLUGS.admin,
    name: "Admin",
    description:
      "Day-to-day operations: products, orders, financing across the platform. " +
      "Cannot manage users or roles.",
    permissions: [
      "productsView",
      "productsCreate",
      "productsUpdate",
      "productsDelete",
      "ordersViewAll",
      "ordersUpdateStatus",
      "ordersProcessFulfilment",
      "financingViewAll",
      "financingDecide",
      "assignmentsView",
      "orderAssignmentsView",
      "orderAssignmentsManage",
    ],
  },
  {
    slug: ROLE_SLUGS.presales,
    name: "Pre-sales",
    description:
      "Handles assigned customers, scoped to financing requests + UNPAID " +
      "orders only. Never touches fulfilment, shipping, or paid-order ops.",
    permissions: [
      "productsView",
      "ordersViewAssignedUnpaid",
      "financingViewAssigned",
    ],
  },
  {
    slug: ROLE_SLUGS.dispatcher,
    name: "Dispatcher",
    description:
      "Operational order fulfilment for assigned orders only. Updates " +
      "order status through paid → preparing → shipped → delivered. " +
      "Cannot see financing or unpaid pre-sales orders.",
    permissions: [
      "productsView",
      "ordersViewAssignedFulfilment",
      "ordersProcessFulfilment",
      "orderAssignmentsView",
    ],
  },
  {
    slug: ROLE_SLUGS.customer,
    name: "Customer",
    description: "Default role for self-signup users — owns nothing in the admin panel.",
    permissions: [],
  },
];

// ── Lookups ────────────────────────────────────────────────────────────

export function isAdminRole(slug: string): boolean {
  return slug === ROLE_SLUGS.superAdmin || slug === ROLE_SLUGS.admin;
}

export function isPresalesRole(slug: string): boolean {
  return slug === ROLE_SLUGS.presales;
}

export function isDispatcherRole(slug: string): boolean {
  return slug === ROLE_SLUGS.dispatcher;
}

/** Any internal "operator" role — staff who run the platform, as
 *  opposed to external customers. Operators belong in /admin and
 *  must never see the customer portal at /account, even if they
 *  carry the customer role alongside their staff role. */
export function isOperatorRole(slug: string): boolean {
  return (
    slug === ROLE_SLUGS.superAdmin ||
    slug === ROLE_SLUGS.admin ||
    slug === ROLE_SLUGS.presales ||
    slug === ROLE_SLUGS.dispatcher
  );
}

export function roleByslug(slug: string): RoleDefinition | undefined {
  return ROLES.find((r) => r.slug === slug);
}
