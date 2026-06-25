// Catch-all Better-Auth route — handles sign-in, sign-up, sign-out,
// session refresh, password reset, email verification, OAuth callbacks,
// and admin endpoints. All under `/api/auth/*`.
//
// Per Better-Auth's Next.js integration: every method (GET / POST) is
// delegated to the auth handler, which inspects the path internally.
//
// We wrap the handler so that any unhandled error gets logged + echoed
// in the response body during development. In production the response
// stays clean; the stack is server-side only.

import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

import { auth } from "@/server/auth";

const handler = toNextJsHandler(auth);

async function withDebug(
  fn: (req: NextRequest) => Promise<Response>,
  req: NextRequest,
) {
  try {
    return await fn(req);
  } catch (err) {
    // Server-side stack for the terminal.
    console.error("[/api/auth] unhandled error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const dev = process.env.NODE_ENV !== "production";
    return new Response(
      JSON.stringify({
        error: "auth_handler_threw",
        message,
        ...(dev ? { stack: stack?.split("\n").slice(0, 8) } : {}),
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}

export async function GET(req: NextRequest) {
  return withDebug(handler.GET as (r: NextRequest) => Promise<Response>, req);
}
export async function POST(req: NextRequest) {
  return withDebug(handler.POST as (r: NextRequest) => Promise<Response>, req);
}
