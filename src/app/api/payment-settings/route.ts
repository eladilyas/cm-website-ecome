// GET /api/payment-settings — returns the storefront-visible
// payment-method configuration as JSON. Public read access: the
// shape contains only customer-facing strings (labels, bank details,
// reference hints) — nothing sensitive.
//
// Used by /checkout to decide which PaymentCard blocks to render
// and how to label them. Admin writes happen through the server
// action at /admin/payment-methods.

import { NextResponse } from "next/server";

import { getPaymentSettings } from "@/server/payment-settings/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getPaymentSettings();
  return NextResponse.json(config, {
    headers: {
      // Settings are toggled rarely but matter critically — when an
      // admin disables CMI we cannot keep serving a stale
      // `enabled: true` from an edge cache. Force every request
      // through the DB; the lookup is a single row, cheap.
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
