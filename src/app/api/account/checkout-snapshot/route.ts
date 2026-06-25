// GET /api/account/checkout-snapshot
//
// Returns everything the checkout form should pre-fill for the
// currently signed-in user:
//
//   • contact + company — from the User row (their saved profile)
//   • shipping address  — from their most-recent order, falling
//                         back to null when they've never ordered
//
// Used by the /checkout page to skip re-typing data the buyer has
// already given us. Fields stay editable; this just removes the
// burden of typing the same details on every order.

import { NextResponse } from "next/server";

import { getServerSession } from "@/server/auth-helpers";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type CheckoutSnapshot = {
  contact: {
    fullName: string;
    email: string;
    /** Combined dial+number from the most-recent order, if any. */
    phone: string | null;
  };
  company: { name: string | null; ice: string | null };
  shipping: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    notes: string | null;
  } | null;
};

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign-in required" }, { status: 401 });
  }

  // Profile fields — single user-row read.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      name: true,
      email: true,
      phone: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Most-recent order — gives us shipping address + company that
  // were captured at the time. We deliberately read from any order
  // (not just delivered) so a buyer who placed one and hasn't yet
  // received it still gets their info auto-filled on the second
  // order.
  const lastOrder = await db.order.findFirst({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      contactPhone: true,
      contactCompanyName: true,
      contactCompanyIce: true,
      shippingStreet: true,
      shippingCity: true,
      shippingPostalCode: true,
      shippingCountry: true,
      shippingNotes: true,
    },
  });

  const snapshot: CheckoutSnapshot = {
    contact: {
      fullName: user.fullName ?? user.name ?? "",
      email: user.email,
      phone: user.phone ?? lastOrder?.contactPhone ?? null,
    },
    company: {
      name: lastOrder?.contactCompanyName ?? null,
      ice: lastOrder?.contactCompanyIce ?? null,
    },
    shipping: lastOrder
      ? {
          street: lastOrder.shippingStreet,
          city: lastOrder.shippingCity,
          postalCode: lastOrder.shippingPostalCode,
          country: lastOrder.shippingCountry,
          notes: lastOrder.shippingNotes,
        }
      : null,
  };

  return NextResponse.json(snapshot, {
    headers: {
      // Private to this user — never serve from a shared cache.
      "Cache-Control": "private, no-store",
    },
  });
}
