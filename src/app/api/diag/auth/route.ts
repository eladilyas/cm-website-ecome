// Auth diagnostic endpoint — used to triage the "500 from /api/auth"
// class of failures. Reports whether each prerequisite is satisfied
// without leaking secret values.
//
// Visit http://localhost:3000/api/diag/auth in the browser; it returns
// a JSON shape that points at the broken prerequisite.

import { NextResponse } from "next/server";

import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Env vars present? (booleans only — never echo secrets.)
  checks.env = {
    BETTER_AUTH_SECRET_set: Boolean(process.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_SECRET_length: process.env.BETTER_AUTH_SECRET?.length ?? 0,
    BETTER_AUTH_URL_set: Boolean(process.env.BETTER_AUTH_URL),
    BETTER_AUTH_URL_value: process.env.BETTER_AUTH_URL ?? null,
    DATABASE_URL_set: Boolean(process.env.DATABASE_URL),
    DIRECT_DATABASE_URL_set: Boolean(process.env.DIRECT_DATABASE_URL),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  };

  // 2. Can we import the auth module? (Triggers all module-load checks.)
  try {
    const mod = await import("@/server/auth");
    checks.authModule = {
      ok: true,
      hasAuth: typeof mod.auth === "object",
    };
  } catch (err) {
    checks.authModule = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 6) : undefined,
    };
  }

  // 3. Can we reach the Postgres DB? (Catches misconfigured DATABASE_URL.)
  try {
    const count = await db.user.count();
    checks.database = { ok: true, userCount: count };
  } catch (err) {
    checks.database = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 4. Verify the auth tables exist with the expected columns.
  //    Skipped if the DB ping above already failed.
  if ((checks.database as { ok: boolean }).ok) {
    try {
      const cols = await db.$queryRaw<Array<{ table_name: string; column_name: string }>>`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('User', 'Session', 'Account', 'Verification')
        ORDER BY table_name, ordinal_position
      `;
      const byTable: Record<string, string[]> = {};
      for (const c of cols) {
        if (!byTable[c.table_name]) byTable[c.table_name] = [];
        byTable[c.table_name].push(c.column_name);
      }
      checks.schema = { ok: true, tables: byTable };
    } catch (err) {
      checks.schema = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json(checks, { status: 200 });
}
