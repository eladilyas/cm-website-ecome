// Better-Auth configuration — the auth server that runs inside Next.js.
//
// Schema ownership:
//   • Better-Auth owns User, Session, Account, Verification tables
//     (mapped via the Prisma adapter against `db`).
//   • Our RBAC layer (Role / Permission / UserRole / RolePermission)
//     stays our own — Better-Auth doesn't manage roles.
//   • Business fields on User (fullName, phone, odooContactId, etc.)
//     are declared as `additionalFields` so Better-Auth knows about
//     them and surfaces them through its API.
//
// The Cloud dashboard (https://better-auth.com) is a separate
// management UI that calls back into this server — it doesn't replace
// the auth library, it visualizes it.

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "./db";
import { env } from "./env";

// Auth only initializes when this module is imported (by the auth route).
// Assert the required secrets are set here, so an unconfigured deploy
// fails loudly the first time `/api/auth/*` is hit rather than silently
// returning bogus sessions.
if (!env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET is not set. Generate a 32-byte secret " +
      "with `openssl rand -base64 32` and add it to .env.local.",
  );
}
if (!env.BETTER_AUTH_URL) {
  throw new Error(
    "BETTER_AUTH_URL is not set. Set it to the URL where this app " +
      "is reachable (e.g. http://localhost:3000 in dev).",
  );
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),

  // Secret used to sign session tokens. MUST be a 32+ byte secret.
  // Generate locally: `openssl rand -base64 32`.
  secret: env.BETTER_AUTH_SECRET,

  // Where this auth server is reachable. Drives cookie domain + redirect
  // origin checks. Localhost for dev, your prod URL once deployed.
  baseURL: env.BETTER_AUTH_URL,

  // Email + password is the primary path. Social / OAuth providers
  // (Google, Apple, etc.) can be added later by extending `socialProviders`.
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // We use short-lived sessions plus refresh — Better-Auth handles
    // refresh transparently if `session.expiresIn` is bumped later.
  },

  // Custom session config — 7 days, refresh in last 24 hours.
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  // Business-specific fields on the User table. Better-Auth handles
  // create/update/read for these — declare here so the library and the
  // Prisma schema stay in lockstep.
  user: {
    additionalFields: {
      fullName: { type: "string", required: false },
      phone: { type: "string", required: false },
      odooContactId: { type: "string", required: false },
      disabledAt: { type: "date", required: false },
      lastLoginAt: { type: "date", required: false },
    },
  },

  // Trust the deployed origin — Better-Auth rejects requests from
  // origins not in this list. Add additional origins (ngrok, prod
  // domain) as needed.
  trustedOrigins: [
    env.BETTER_AUTH_URL ?? "http://localhost:3000",
    env.NEXT_PUBLIC_SITE_URL,
  ].filter((u): u is string => Boolean(u)),

  // Every brand-new account gets the `customer` role automatically
  // so the signup flow lands in /account instead of /403. Admin/
  // dispatcher/presales grants stay manual (npm scripts in
  // /scripts/grant-role.ts) — they're privileged roles, not
  // self-service. Best-effort: if the seed hasn't run yet and the
  // "customer" role row doesn't exist, we swallow the error so the
  // signup transaction itself doesn't fail; the user can still sign
  // in, they'll just hit /403 until the seed runs.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const role = await db.role.findUnique({
              where: { slug: "customer" },
              select: { id: true },
            });
            if (!role) {
              console.warn(
                "[auth] customer role missing — run `npm run rbac:seed`",
              );
              return;
            }
            await db.userRole.upsert({
              where: { userId_roleId: { userId: user.id, roleId: role.id } },
              create: { userId: user.id, roleId: role.id },
              update: {},
            });
          } catch (err) {
            console.error("[auth] failed to grant default customer role", err);
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;
