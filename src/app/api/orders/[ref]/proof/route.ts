// POST /api/orders/[ref]/proof — upload wire-transfer payment proof.
//
// Body shape:
//   { fileName, mimeType, sizeBytes, dataUrl (base64), uploadedAt }
//
// Only the order's owner can attach proof. Admins also can (e.g. when
// fixing a customer's submission), but pre-sales / dispatchers cannot.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { getServerSession } from "@/server/auth-helpers";
import { loadActor } from "@/server/policy";
import {
  attachPaymentProof,
  getOrderByRef,
  orderBelongsTo,
} from "@/server/orders/service";
import { enforceRateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Input = z.object({
  fileName: z.string().min(1).max(240),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024), // 20 MB ceiling
  // Base64 inflates the wire payload by ~33%. Allow 28 MB so a 20 MB
  // file fits with the "data:image/jpeg;base64," prefix overhead.
  // Caps the per-request body Next has to parse — without it, a
  // malicious client could send a gigabyte string.
  dataUrl: z.string().min(8).max(28 * 1024 * 1024),
  uploadedAt: z.number().int().positive(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const blocked = enforceRateLimit("proofUpload", req);
  if (blocked) return blocked;

  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign-in required" },
      { status: 401 },
    );
  }
  const { ref } = await params;

  const order = await getOrderByRef(ref);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Owner OR admin tier may attach. Pre-sales / dispatcher cannot.
  const actor = await loadActor();
  const isOwner = orderBelongsTo(order, session.user.id);
  const isAdmin = actor?.isAdmin ?? false;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid" },
      { status: 400 },
    );
  }

  const result = await attachPaymentProof(ref, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
