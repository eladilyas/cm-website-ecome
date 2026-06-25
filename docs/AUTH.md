# Authentication

Better-Auth wiring, session model, and the two-surface (customer / operator) split.

## Stack

- **[Better-Auth](https://www.better-auth.com/)** self-hosted on the Next.js app — catch-all route at [src/app/api/auth/[...all]/route.ts](../src/app/api/auth/[...all]/route.ts).
- Session **cookies** (HttpOnly, SameSite=Lax, Secure when behind HTTPS).
- Email + password only today. No OAuth, no magic links, no MFA.
- Prisma adapter — `User`, `Session`, `Account`, `Verification` tables in the same schema as the rest of the app.

The Better-Auth instance is constructed in [src/server/auth.ts](../src/server/auth.ts). The client bridge (for `signIn.email`, `signUp.email`, `signOut`) lives in [src/lib/auth-client.ts](../src/lib/auth-client.ts).

## Required env

```
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000        # or https://your-domain in prod
```

Both required. The secret signs session cookies; rotating it invalidates every active session immediately. The URL must match the public origin so cookie scoping works.

## The two surfaces

The site has two distinct user populations sharing one Better-Auth instance:

| Surface | Who | URL path | Sign-in page |
|---|---|---|---|
| Customer portal | Buyers (`customer` role) | `/account/*` | `/signin` |
| Admin panel | Operators (super-admin / admin / pre-sales / dispatcher) | `/admin/*` | `/admin/signin` |

`/admin/signin` is a deliberately separate page outside the `(panel)` route group so it can render WITHOUT triggering the operator-gate that protects everything else under `/admin`.

## Sign-in flow (customer)

```
GET /signin
   ├─ Renders SigninContent (client component)
   ├─ reads ?next= via safeNext() — rejects //evil.com, /\, CRLF, /admin/*
   │
POST signIn.email() → /api/auth/sign-in/email
   ├─ Better-Auth verifies credentials, sets session cookie
   ├─ on success → router.push(nextHref) — defaults to /account
   │
GET /account (or whatever ?next= resolved to)
   ├─ middleware.ts checks cookie presence → redirects to /signin if missing
   ├─ /account layout calls loadActor() → re-verifies session, reads roles
   │  ├─ if no session → redirect to /signin?next=/account
   │  ├─ if operator role → redirect to /admin
   │  └─ otherwise → render AccountShell
```

## Sign-in flow (operator)

```
GET /admin/signin
   ├─ Different page, dark themed, never gated by the (panel) layout
   │
POST signIn.email() → /api/auth/sign-in/email
   ├─ same Better-Auth backend; same session cookie format
   ├─ on success → router.push("/admin")
   │
GET /admin → /admin/(panel)/...
   ├─ middleware.ts BYPASSES next-intl for /admin/*
   ├─ /admin/(panel)/layout.tsx calls requireAdmin()
   │  ├─ if not an operator → 403 / redirect to /admin/signin
   │  └─ otherwise → render the admin shell
```

The crucial bit: customers and operators sign in through the same Better-Auth endpoint, but they LAND in different places based on which page they used. A customer who happens to know `/admin/signin` will still be rejected at the panel layout because their role doesn't include any operator slug.

## Sign-up flow

`/signup` only exists for customers. Operators are minted by a super-admin in `/admin/users`, never by self-signup. Sign-up unconditionally assigns the `customer` role and routes to `?next=` (defaulting to `/account`).

Better-Auth treats the email field as the unique identifier; duplicate signups return the provider's verbatim error.

## Session model

- Sessions live in the `Session` table with `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`.
- Default expiry is Better-Auth's standard (7 days rolling).
- `loadActor()` reads the session via the standard Better-Auth API and joins `User.disabledAt`. A disabled user with a still-valid cookie returns null. See [RBAC.md](RBAC.md#disabling-a-user) for the disable flow.
- Cookies are set as `__Secure-better-auth.session_token` (or the dev-mode equivalent) — HttpOnly always.

## CSRF posture

- Better-Auth uses **same-site cookies**, which blocks the vast majority of CSRF attempts.
- Mutating endpoints under `/api/*` require authentication (session cookie) AND are rate-limited (`src/server/rate-limit.ts`).
- The catch-all `/api/auth/[...all]` handler delegates to Better-Auth's own CSRF protection on state-changing routes.

## Diagnostics

`/api/diag/auth` returns a JSON dump of:
- env-var presence (booleans only — no values)
- auth-module load status
- DB ping

It's **disabled in production** unless `?token=<BETTER_AUTH_SECRET>` matches (constant-time compare). The previous version returned schema dumps and value-bearing env fields — that's now removed.

## Where the implementation lives

- [src/server/auth.ts](../src/server/auth.ts) — Better-Auth instance + Prisma adapter
- [src/server/auth-helpers.ts](../src/server/auth-helpers.ts) — `getServerSession`, `getUserRoles`, `requireAdmin`, `requireSuperAdmin`, `requireRole`
- [src/server/policy/index.ts](../src/server/policy/index.ts) — `loadActor`, `customerScopeFor`, `dispatcherScopeFor`, etc.
- [src/app/api/auth/[...all]/route.ts](../src/app/api/auth/[...all]/route.ts) — Better-Auth catch-all
- [src/app/[locale]/(auth)/signin/page.tsx](../src/app/[locale]/(auth)/signin/page.tsx) — customer signin
- [src/app/[locale]/(auth)/signup/page.tsx](../src/app/[locale]/(auth)/signup/page.tsx) — customer signup
- [src/app/admin/signin/page.tsx](../src/app/admin/signin/page.tsx) — operator signin
- [src/lib/safeNext.ts](../src/lib/safeNext.ts) — `?next=` validator
- [src/middleware.ts](../src/middleware.ts) — route-level redirect logic

## Not implemented (yet)

- OAuth providers (Google / Microsoft) — feasible, not requested.
- Email verification — Better-Auth supports it; not wired.
- Password reset — Better-Auth supports it; not wired.
- 2FA — Better-Auth has a plugin; not enabled.

When these land, document them here.
