// Auth diagnostic endpoint — used to triage the "500 from /api/auth"
// class of failures. Reports whether each prerequisite is satisfied
// without leaking secret values.
//
// Access policy:
//   • Disabled in production by default — the original implementation
//     returned an env summary + DB connectivity + the auth-table column
//     list, which is a reconnaissance jackpot for any attacker.
//   • In non-production it remains open so a dev can hit it directly.
//   • Super-admins can still reach it in production by sending the
//     `?token=<BETTER_AUTH_SECRET>` query param. Knowing the secret
//     is equivalent to full admin access already.
//
// Tightening notes for the audit-conscious reader:
//   • Schema dump removed entirely. If you need columns, query the DB.
//   • Boolean env checks only — no values, lengths, or URLs.
//   • Raw error messages live in server logs, never the response body.

import { NextResponse } from "next/server";

import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function gateInProduction(req: Request): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  const token = new URL(req.url).searchParams.get("token");
  if (!token || !process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Constant-time-ish comparison — token length first, then char-wise.
  if (token.length !== process.env.BETTER_AUTH_SECRET.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let mismatch = 0;
  for (let i = 0; i < token.length; i += 1) {
    mismatch |= token.charCodeAt(i) ^ process.env.BETTER_AUTH_SECRET.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export async function GET(req: Request) {
  const gate = gateInProduction(req);
  if (gate) return gate;

  const checks: Record<string, unknown> = {};

  // 1. Env vars present? Booleans only — no values, no lengths.
  checks.env = {
    BETTER_AUTH_SECRET_set: Boolean(process.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL_set: Boolean(process.env.BETTER_AUTH_URL),
    DATABASE_URL_set: Boolean(process.env.DATABASE_URL),
    DIRECT_DATABASE_URL_set: Boolean(process.env.DIRECT_DATABASE_URL),
    NEXT_PUBLIC_SITE_URL_set: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  };

  // 2. Can we import the auth module? (Triggers all module-load checks.)
  try {
    const mod = await import("@/server/auth");
    checks.authModule = {
      ok: true,
      hasAuth: typeof mod.auth === "object",
    };
  } catch (err) {
    console.error("[diag/auth] authModule import failed", err);
    checks.authModule = { ok: false };
  }

  // 3. Can we reach the Postgres DB?
  try {
    await db.user.count();
    checks.database = { ok: true };
  } catch (err) {
    console.error("[diag/auth] database ping failed", err);
    checks.database = { ok: false };
  }

  return NextResponse.json(checks, { status: 200 });
}
