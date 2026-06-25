// GET /api/orders/[ref] — fetch a single order, scoped via the policy
// layer. Returns 404 to anyone who can't see this order (so existence
// can't be probed across users).

import { NextResponse } from "next/server";

import { loadActor } from "@/server/policy";
import {
  actorCanSeeOrder,
  getOrderByRef,
} from "@/server/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const actor = await loadActor();
  if (!actor) {
    return NextResponse.json(
      { error: "Sign-in required" },
      { status: 401 },
    );
  }

  const order = await getOrderByRef(ref);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const allowed = await actorCanSeeOrder(order, actor);
  if (!allowed) {
    // Hide existence — same response shape as "not found" so attackers
    // can't enumerate refs across users.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
