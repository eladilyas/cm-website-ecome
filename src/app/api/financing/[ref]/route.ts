// GET /api/financing/[ref] — auth-aware single fetch.

import { NextResponse } from "next/server";

import { loadActor } from "@/server/policy";
import {
  actorCanSeeFinancing,
  getFinancingByRef,
} from "@/server/financing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const actor = await loadActor();
  if (!actor) {
    return NextResponse.json({ error: "Sign-in required" }, { status: 401 });
  }
  const request = await getFinancingByRef(ref);
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const allowed = await actorCanSeeFinancing(request, actor);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ request });
}
