// POST /api/orders — create an order.
//
// The customer must be signed in (Better-Auth session). The customerId
// is taken from the session, not the body — clients can't impersonate.
// Money, totals, and initial status are recomputed server-side via
// `createOrder` so the wire input is advisory.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getServerSession } from "@/server/auth-helpers";
import {
  createOrder,
  CreateOrderInput,
} from "@/server/orders/service";
import { enforceRateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Throttle anonymous spam BEFORE touching auth — keeps the DB
  // and email pipeline insulated from drive-by traffic.
  const blocked = enforceRateLimit("orderCreate", req);
  if (blocked) return blocked;

  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign-in required" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body must be valid JSON" },
      { status: 400 },
    );
  }

  // Strip / override the customerId — it's always the session user.
  const parsed = CreateOrderInput.omit({ customerId: true })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await createOrder({
    ...parsed.data,
    customerId: session.user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ order: result.order }, { status: 201 });
}
