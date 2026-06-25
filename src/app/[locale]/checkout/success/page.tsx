// Checkout success — server component.
//
// Reads the ref from searchParams, dispatches:
//   • ORD-*  → fetch from Postgres via getOrderByRef, render order
//              confirmation (or wire-transfer pending state)
//   • FIN-*  → render a client child that reads financingStore
//              (financing still lives in localStorage — separate migration)
//
// The visitor must be signed in (checkout flow already gates on auth).
// Orders are scoped to the signed-in user: if the ref isn't theirs
// (and they aren't admin/dispatcher with scope) we render "not found"
// rather than disclosing the order existed.

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getServerSession } from "@/server/auth-helpers";
import { loadActor } from "@/server/policy";
import {
  actorCanSeeOrder,
  getOrderByRef,
  orderBelongsTo,
} from "@/server/orders/service";
import {
  actorCanSeeFinancing,
  financingBelongsTo,
  getFinancingByRef,
} from "@/server/financing/service";
import { OrderSuccess } from "./OrderSuccess";
import { FinancingSuccess } from "./FinancingSuccess";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref: rawRef } = await searchParams;
  const orderRef = (rawRef ?? "").trim();

  if (!orderRef) return <NotFound refStr="" />;
  const session = await getServerSession();
  const actor = await loadActor();

  // Legacy FIN- refs (pre-unification) still resolve via the
  // financing service for backward compatibility on old links.
  if (orderRef.startsWith("FIN-")) {
    const request = await getFinancingByRef(orderRef);
    if (!request) return <NotFound refStr={orderRef} />;
    const isOwner =
      Boolean(session?.user) &&
      financingBelongsTo(request, session!.user.id);
    const ok = isOwner || (await actorCanSeeFinancing(request, actor));
    if (!ok) return <NotFound refStr={orderRef} />;
    return <FinancingSuccess request={request} />;
  }

  if (!orderRef.startsWith("ORD-")) {
    return <NotFound refStr={orderRef} />;
  }

  const order = await getOrderByRef(orderRef);
  if (!order) return <NotFound refStr={orderRef} />;
  const isOwner =
    Boolean(session?.user) && orderBelongsTo(order, session!.user.id);
  const allowed = isOwner || (await actorCanSeeOrder(order, actor));
  if (!allowed) return <NotFound refStr={orderRef} />;

  // ✱ Critical dispatch: a financing-backed order MUST render the
  // financing success view, not the standard "Order confirmed ·
  // We're preparing your hardware" copy (which reads as a paid /
  // CMI flow). After the unified-model refactor financing orders
  // carry an ORD- ref, so prefix alone isn't enough — we have to
  // check orderType. Re-resolve the order through the financing
  // service so the FinancingSuccess view gets its enriched shape
  // (monthly, term, decision reason, age bracket).
  if (order.orderType === "FINANCING") {
    const request = await getFinancingByRef(orderRef);
    if (!request) return <NotFound refStr={orderRef} />;
    return <FinancingSuccess request={request} />;
  }

  return <OrderSuccess order={order} />;
}

async function NotFound({ refStr }: { refStr: string }) {
  const t = await getTranslations("checkoutSuccess");
  const tAccount = await getTranslations("account");
  return (
    <section className="min-h-[80vh] bg-canvas pt-16 pb-16 flex items-center justify-center">
      <div className="max-w-[440px] text-center px-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-mute font-medium mb-3">
          {t("notFoundTitle")}
        </p>
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.022em] leading-[1.1] text-ink">
          {refStr ? (
            <>
              <code className="tabular-nums">{refStr}</code>
            </>
          ) : null}
        </h1>
        <p className="mt-3 text-[13.5px] text-ink-soft">{t("notFoundBody")}</p>
        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/account/orders"
            className="h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
          >
            {tAccount("navOrders")}
          </Link>
          <Link
            href="/shop"
            className="h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full border border-hairline-strong text-ink-soft hover:text-ink hover:bg-paper transition-colors"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </section>
  );
}
