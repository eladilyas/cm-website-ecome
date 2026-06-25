// Lightweight sliding-window rate limiter.
//
// Purpose: throttle the public-facing POST endpoints (`/api/orders`,
// `/api/financing`) so a single client can't open the floodgate on
// either DB writes or downstream emails.
//
// Implementation: in-memory Map keyed by `${bucket}:${ip}`. The
// instance is the Node.js process — fine for the current single-
// region Vercel deployment + low B2B traffic. Multi-instance is
// the swap point — replace `bucketStore` with an Upstash Redis
// client (REST API works from Edge) and the rest of the file is
// unchanged.
//
// Why not Next middleware: middleware runs on every request,
// including static assets. The cost of touching the limiter on
// every JPEG isn't worth it. We attach explicitly at the handler.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Bucket = {
  /** Allowed hits per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

type Hit = { count: number; resetAt: number };

const bucketStore = new Map<string, Hit>();

/** Pre-defined buckets — one per protected endpoint group. Easier
 *  to reason about than ad-hoc numbers at call sites. */
export const BUCKETS = {
  /** Order creation — 5 attempts per minute. A normal buyer
   *  submits once; 5/min is generous for retries on a flaky
   *  connection but blocks scripted abuse. */
  orderCreate: { limit: 5, windowMs: 60_000 },
  /** Financing application — 5 per 5 minutes. Each one triggers
   *  manual review; even slower than orders. */
  financingCreate: { limit: 5, windowMs: 5 * 60_000 },
  /** Payment-proof upload — 10 per minute. Buyers occasionally
   *  re-upload a clearer photo. */
  proofUpload: { limit: 10, windowMs: 60_000 },
} as const satisfies Record<string, Bucket>;

/** Best-effort client identifier. Vercel and most proxies set
 *  X-Forwarded-For; we read the first hop (closest to the client).
 *  Falls back to a UA hash if nothing else is available — better
 *  than nothing for a per-instance limiter. */
function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  // Cloudflare passthrough.
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return req.headers.get("user-agent") ?? "anon";
}

/** Sample the limiter without consuming a slot. Useful for read
 *  paths where you want a hint but not a charge. */
export function peekRateLimit(
  bucket: keyof typeof BUCKETS,
  req: NextRequest,
): { allowed: boolean; remaining: number; resetAt: number } {
  const { limit, windowMs } = BUCKETS[bucket];
  const key = `${bucket}:${clientKey(req)}`;
  const now = Date.now();
  const hit = bucketStore.get(key);
  if (!hit || hit.resetAt <= now) {
    return { allowed: true, remaining: limit, resetAt: now + windowMs };
  }
  return {
    allowed: hit.count < limit,
    remaining: Math.max(0, limit - hit.count),
    resetAt: hit.resetAt,
  };
}

/** Consume one slot for the given bucket. Returns null when the
 *  request is allowed; returns a 429 NextResponse when blocked.
 *  Call sites do `const blocked = enforceRateLimit(...); if (blocked) return blocked;` */
export function enforceRateLimit(
  bucket: keyof typeof BUCKETS,
  req: NextRequest,
): NextResponse | null {
  const { limit, windowMs } = BUCKETS[bucket];
  const key = `${bucket}:${clientKey(req)}`;
  const now = Date.now();
  const hit = bucketStore.get(key);

  let count: number;
  let resetAt: number;
  if (!hit || hit.resetAt <= now) {
    count = 1;
    resetAt = now + windowMs;
    bucketStore.set(key, { count, resetAt });
  } else {
    count = hit.count + 1;
    resetAt = hit.resetAt;
    hit.count = count;
  }

  // Periodically prune expired entries so the Map can't grow
  // unbounded if the process runs for weeks. Cheap O(n) sweep
  // that fires roughly once every 256 calls.
  if ((bucketStore.size & 255) === 0) {
    for (const [k, v] of bucketStore.entries()) {
      if (v.resetAt <= now) bucketStore.delete(k);
    }
  }

  if (count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return NextResponse.json(
      {
        error: "Too many requests. Please wait and try again.",
        retryAfterSeconds: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
        },
      },
    );
  }

  return null;
}
