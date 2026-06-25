// POST /api/financing — create a financing request. Same auth shape
// as /api/orders: customer signed in, applicantUserId taken from the
// session.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getServerSession } from "@/server/auth-helpers";
import {
  createFinancingRequest,
  CreateFinancingInput,
} from "@/server/financing/service";
import { enforceRateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = enforceRateLimit("financingCreate", req);
  if (blocked) return blocked;

  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign-in required" }, { status: 401 });
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
  const parsed = CreateFinancingInput.omit({ applicantUserId: true }).safeParse(
    body,
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const result = await createFinancingRequest({
    ...parsed.data,
    applicantUserId: session.user.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ request: result.request }, { status: 201 });
}
