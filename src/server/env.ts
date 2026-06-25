// Environment validation — fail fast at boot, never silently at runtime.
//
// Every env var the platform reads goes through this file. The schema is
// the single source of truth for what config the app needs. If a required
// var is missing or malformed, the process dies at startup with a clear
// error — never produces "undefined is not a function" deep in a handler.
//
// Conventions:
//   • Required vars use `z.string().min(1, "…")` so empty strings fail.
//   • Vars only used in certain phases use `.optional()` with a guard
//     check at the consumer (so devs see "set DATABASE_URL to enable X").
//   • Server-only secrets must never start with NEXT_PUBLIC_ — anything
//     prefixed that way is exposed to the browser bundle.

import { z } from "zod";

const EnvSchema = z.object({
  // ── Runtime ────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // ── Database (Phase 2A) ────────────────────────────────────────────
  // Neon serverless Postgres. Optional during Phase 1 (contracts-only).
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid Postgres URL")
    .optional(),

  // Direct (unpooled) connection URL — required for Prisma migrations.
  DIRECT_DATABASE_URL: z
    .string()
    .url("DIRECT_DATABASE_URL must be a valid Postgres URL")
    .optional(),

  // ── Auth (Phase 2B) ────────────────────────────────────────────────
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
    .optional(),

  BETTER_AUTH_URL: z
    .string()
    .url()
    .optional(),

  // ── File storage (Phase 2C) ────────────────────────────────────────
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_PUBLIC_HOSTNAME: z
    .string()
    .url()
    .optional()
    .describe(
      "Optional CDN/custom-domain hostname for serving public-signed files",
    ),

  // ── Email (Phase 3A) ───────────────────────────────────────────────
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  EMAIL_FROM: z.string().email().optional(),

  // ── Observability ──────────────────────────────────────────────────
  SENTRY_DSN: z.string().url().optional(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),

  // ── Integrations ───────────────────────────────────────────────────
  // Odoo (Phase 4A). All optional until Odoo cutover.
  ODOO_URL: z.string().url().optional(),
  ODOO_DB: z.string().optional(),
  ODOO_USERNAME: z.string().optional(),
  ODOO_PASSWORD: z.string().optional(),

  // Wafasalaf (Phase 4B). All optional until live financing.
  WAFASALAF_API_URL: z.string().url().optional(),
  WAFASALAF_API_KEY: z.string().optional(),

  // CMI payments. Optional until checkout is live.
  CMI_MERCHANT_ID: z.string().optional(),
  CMI_STORE_KEY: z.string().optional(),

  // ── AI (Phase 3B) ──────────────────────────────────────────────────
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),

  // ── Public-exposed (browser-readable) ──────────────────────────────
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("https://caissemanager.com"),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // Throw at module-load. Next.js surfaces this clearly in dev,
    // and crashes the process in production — both correct behaviours.
    throw new Error(
      `Invalid environment variables:\n${issues}\n\n` +
        `See src/server/env.ts for the full schema.`,
    );
  }
  return parsed.data;
}

/**
 * Validated environment. Import this anywhere in `server/` to read env
 * vars; never reach into `process.env` directly (loses type safety +
 * skips validation).
 */
export const env: Env = parseEnv();

// ── Capability flags — what's actually configured this deploy ──────────

/**
 * Phase guard — `isFeatureReady("database")` returns true only when the
 * env vars that feature needs are set. UI / service code uses this to
 * gracefully degrade rather than crash.
 */
export function isFeatureReady(
  feature:
    | "database"
    | "auth"
    | "files"
    | "email"
    | "observability"
    | "odoo"
    | "wafasalaf"
    | "cmi"
    | "ai",
): boolean {
  switch (feature) {
    case "database":
      return Boolean(env.DATABASE_URL);
    case "auth":
      return Boolean(env.BETTER_AUTH_SECRET && env.BETTER_AUTH_URL);
    case "files":
      return Boolean(
        env.R2_ACCOUNT_ID &&
          env.R2_ACCESS_KEY_ID &&
          env.R2_SECRET_ACCESS_KEY &&
          env.R2_BUCKET,
      );
    case "email":
      return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
    case "observability":
      return Boolean(env.SENTRY_DSN);
    case "odoo":
      return Boolean(
        env.ODOO_URL && env.ODOO_DB && env.ODOO_USERNAME && env.ODOO_PASSWORD,
      );
    case "wafasalaf":
      return Boolean(env.WAFASALAF_API_URL && env.WAFASALAF_API_KEY);
    case "cmi":
      return Boolean(env.CMI_MERCHANT_ID && env.CMI_STORE_KEY);
    case "ai":
      return Boolean(env.ANTHROPIC_API_KEY);
  }
}
