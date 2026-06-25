# RBAC

Role catalog, permission matrix, and how to grant a role.

The authoritative source is [src/server/rbac/catalog.ts](../src/server/rbac/catalog.ts). This doc summarises and explains.

## Roles

| Slug | Tier | What it can do |
|---|---|---|
| `super-admin` | Operator | Everything. Includes user/role management. Only super-admins can grant or revoke super-admin. |
| `admin` | Operator | All admin pages and mutations EXCEPT user/role management. Cannot grant/revoke roles. |
| `pre-sales` | Operator | Sees their assigned customers + every financing file. Can advance financing decisions. Cannot access orders outside their scope. |
| `dispatcher` | Operator | Sees orders assigned to them, in the fulfilment bucket (`PROCESSING` → `SHIPPED`). Cannot see pre-fulfilment or terminal-rejected orders. |
| `customer` | Customer | Public default. Sees the storefront, their cart, their orders, their financing, their profile. No admin chrome. |

"Operator" is shorthand for any of the first four. `isOperatorRole(slug)` is the predicate; the customer site uses it to redirect operators out of `/account` and into `/admin`.

## Permissions

Permissions are slug strings on `Role` rows joined via `RolePermission`. They're enforced by helpers (`requireAdmin`, `requireSuperAdmin`, `requireRole`, `canSeeOrder`, etc.) — never by sprinkling `if (role === ...)` across pages.

A short selection of permission slugs (full list in [catalog.ts](../src/server/rbac/catalog.ts)):

| Slug | Granted to |
|---|---|
| `admin.view` | super-admin, admin, pre-sales, dispatcher (entry to `/admin`) |
| `admin.users.read` | super-admin |
| `admin.users.write` | super-admin |
| `admin.products.write` | super-admin, admin |
| `admin.orders.advance` | super-admin, admin, dispatcher |
| `admin.financing.decide` | super-admin, admin, pre-sales |

## How a request gets authorized

```
HTTP request
   │
   ▼
src/middleware.ts          ─ checks cookie presence; redirects unauth to /signin
   │                         (does NOT verify the cookie — that's the layout's job)
   ▼
src/app/admin/layout.tsx     ─ calls requireAdmin() → 403 if not an operator
  or
src/app/[locale]/account/    ─ calls loadActor() → redirect if not signed-in
   layout.tsx                 → redirect to /admin if operator
   │
   ▼
src/server/policy/index.ts ─ loadActor() reads session + roles + User.disabledAt
   │                         Rejects disabled users (returns null).
   ▼
Route-level guards         ─ requireRole(actor, slug) / canSeeOrder(actor, order)
   │
   ▼
Service-layer scoping      ─ customerScopeFor(actor) / dispatcherScopeFor(actor)
                             — pre-sales sees only assigned customers,
                               dispatchers see only assigned orders.
```

`loadActor()` is cached per request, so multiple guards in one request hit the DB once.

## Granting a role

```bash
npm run grant-role -- <user-email> <role-slug>
```

For example:

```bash
npm run grant-role -- newdispatcher@example.com dispatcher
npm run grant-role -- e.ilyas@caissemanager.com super-admin
```

The script is idempotent — re-running it is a no-op. It refuses to grant unknown slugs or unknown emails.

## Bootstrapping the first super-admin

There's no UI flow for self-promotion. On a fresh DB:

```bash
# 1. Apply schema + permissions
npm run db:deploy
npm run rbac:seed

# 2. Sign up via /signup in the browser. You get the `customer` role.

# 3. From your dev machine, promote yourself:
npm run grant-role -- your-email@example.com super-admin
```

The first super-admin is the entrypoint for everything else — they can grant other operator roles from `/admin/users`.

## Disabling a user

`/admin/users/[id]` exposes a "disable account" toggle for super-admins. When triggered:

1. `User.disabledAt` is stamped.
2. All `Session` rows for that user are deleted in the same transaction.
3. `loadActor()` reads `disabledAt` on every request and rejects disabled users.

The combination guarantees a disabled user loses access on the next HTTP request, not at cookie expiry.

To re-enable: same toggle, opposite direction. No sessions are restored — the user signs in fresh.

## Cannot-lock-yourself-out invariants

- A super-admin cannot revoke their own super-admin role if they're the only active super-admin.
- A super-admin cannot disable their own account.
- These checks live in [src/app/admin/(panel)/users/[id]/actions.ts](../src/app/admin/(panel)/users/[id]/actions.ts).

## Mental model

- **Roles** are coarse identity buckets ("I am a dispatcher").
- **Permissions** are fine-grained capabilities ("can advance an order to SHIPPED").
- A role is a bag of permissions. Permissions are enforced; roles are only used to *describe* groups of permissions to humans.
- Scopes (customer-email scope for pre-sales, order-ref scope for dispatchers) layer on top — even with the right permission, you can only act on rows inside your scope.
