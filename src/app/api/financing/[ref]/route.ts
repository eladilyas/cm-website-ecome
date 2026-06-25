// GET /api/financing/[ref] — auth-aware single fetch.
//
// Same sanitization contract as /api/orders/[ref]: operators see
// `internalNotes`; the financing applicant does not. The service
// layer stays caller-agnostic — stripping happens at the boundary.

import { NextResponse } from "next/server";

import { loadActor } from "@/server/policy";
import {
  actorCanSeeFinancing,
  getFinancingByRef,
  type DisplayFinancingRequest,
} from "@/server/financing/service";
import { isOperatorRole } from "@/server/rbac/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function customerView(
  request: DisplayFinancingRequest,
): DisplayFinancingRequest {
  return { ...request, internalNotes: null };
}

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
  const isOperator = actor.roles.some(isOperatorRole);
  return NextResponse.json({
    request: isOperator ? request : customerView(request),
  });
}
