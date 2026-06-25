// Admin / Orders / [ref] — full detail view + status transition.
//
// Server component. Pulls the order through the service, gates
// visibility via canSeeOrder, computes legal next statuses via the
// state machine, and hands off the transition picker to a small
// client component.

import Link from "next/link";
import Image from "next/image";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-helpers";
import { loadActor } from "@/server/policy";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import {
  actorCanSeeOrder,
  getOrderByRef,
} from "@/server/orders/service";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PAYMENT_METHOD_LABEL,
  nextStatusesFrom,
} from "@/server/orders/status";
import {
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/admin/AdminPrimitives";
import { listPublicProducts } from "@/server/catalog/service";
import { formatPrice } from "@/lib/formatPrice";
import { OrderTransitionControl } from "./OrderTransitionControl";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  await requireRole(
    "/admin/orders",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
    ROLE_SLUGS.dispatcher,
  );

  const { ref: orderRef } = await params;
  const actor = await loadActor();
  const order = await getOrderByRef(orderRef);
  if (!order) return <NotFound refStr={orderRef} />;
  const allowed = await actorCanSeeOrder(order, actor);
  if (!allowed) return <NotFound refStr={orderRef} />;

  const [transitions, catalog] = await Promise.all([
    db.orderStatusTransition.findMany({
      where: { orderId: order.id },
      orderBy: { occurredAt: "desc" },
    }),
    listPublicProducts(),
  ]);
  const productBySlug = new Map(catalog.map((p) => [p.slug, p]));
  const nextOptions = nextStatusesFrom(order.status);
  const canTransition = Boolean(actor?.isAdmin || actor?.isDispatcher);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-[12px] text-ink-mute hover:text-ink mb-3 inline-block"
      >
        ← All orders
      </Link>

      <PageHeader
        eyebrow="Operations"
        title={order.ref}
        description={`${order.contact.fullName} · ${order.contact.email}`}
        actions={
          <StatusPill
            label={ORDER_STATUS_LABEL[order.status]}
            tone={ORDER_STATUS_TONE[order.status]}
          />
        }
      />

      {canTransition && nextOptions.length > 0 && (
        <div className="rounded-xl border border-hairline bg-paper px-5 py-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
                Next status
              </p>
              <p className="mt-1 text-[12.5px] text-ink-soft">
                Transitions are validated against the state machine and
                logged in OrderStatusTransition.
              </p>
            </div>
            <OrderTransitionControl
              orderRef={order.ref}
              options={nextOptions.map((s) => ({
                value: s,
                label: ORDER_STATUS_LABEL[s],
                tone: ORDER_STATUS_TONE[s],
              }))}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <section className="space-y-5">
          <SectionCard title={`Items (${order.totals.itemCount})`}>
            <ul className="divide-y divide-hairline">
              {order.items.map((item) => {
                const product = productBySlug.get(item.slug);
                return (
                  <li
                    key={item.id}
                    className="px-5 py-3.5 flex items-center gap-4"
                  >
                    <div className="h-12 w-12 rounded-lg bg-canvas border border-hairline overflow-hidden relative shrink-0">
                      {product?.heroImage && (
                        <Image
                          src={product.heroImage}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-ink truncate">
                        {item.name}
                        {item.subline && (
                          <span className="ml-1.5 text-[12px] font-normal text-ink-mute">
                            {item.subline}
                          </span>
                        )}
                      </p>
                      <p className="text-[11.5px] text-ink-mute tabular-nums">
                        {formatPrice(item.unitPrice)} × {item.qty}
                      </p>
                    </div>
                    <p className="text-[13.5px] font-semibold tabular-nums text-ink shrink-0">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="px-5 py-4 border-t border-hairline space-y-1.5">
              <SummaryRow label="Subtotal" value={formatPrice(order.totals.subtotal)} />
              <SummaryRow label="VAT" value={formatPrice(order.totals.vat)} muted />
              <SummaryRow
                label="Shipping"
                value={
                  order.totals.shipping > 0
                    ? formatPrice(order.totals.shipping)
                    : "Included"
                }
                muted
              />
              <div className="mt-2 pt-2 border-t border-hairline flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                  Total · TTC
                </span>
                <span className="text-[20px] font-semibold tabular-nums tracking-[-0.018em] text-ink">
                  {formatPrice(order.totals.total)}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Status history">
            {transitions.length === 0 ? (
              <p className="p-5 text-[13px] text-ink-soft">
                No status changes yet.
              </p>
            ) : (
              <ul className="divide-y divide-hairline">
                {transitions.map((t) => (
                  <li key={t.id} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] text-ink">
                        <span className="text-ink-mute">{ORDER_STATUS_LABEL[t.fromStatus]}</span>
                        {" → "}
                        <span className="font-medium">{ORDER_STATUS_LABEL[t.toStatus]}</span>
                      </p>
                      <p className="text-[11.5px] text-ink-mute tabular-nums">
                        {new Date(t.occurredAt).toLocaleString("en-CA")}
                      </p>
                    </div>
                    {t.reason && (
                      <p className="mt-0.5 text-[12px] text-ink-soft">
                        {t.reason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </section>

        <aside className="space-y-5">
          {order.orderType === "FINANCING" && (
            <SectionCard
              title="Financing"
              description="This order is backed by a Wafasalaf application reviewed by the pre-sales team."
            >
              <div className="px-5 py-4">
                <a
                  href={`/admin/financing/${order.ref}`}
                  className="inline-flex h-10 items-center px-4 rounded-full bg-ink text-paper text-[12.5px] font-medium hover:bg-ink-soft transition-colors"
                >
                  Open financing follow-up →
                </a>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Payment">
            <div className="px-5 py-4 space-y-2.5 text-[13px]">
              <Row label="Method" value={PAYMENT_METHOD_LABEL[order.paymentMethod]} />
              {order.trackingNumber && (
                <Row label="Tracking" value={order.trackingNumber} />
              )}
              {order.paymentProof?.dataUrl && (
                <Row label="Proof" value={order.paymentProof.fileName} />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Delivery">
            <div className="px-5 py-4 text-[13px] text-ink">
              {order.shipping.street}
              <br />
              {order.shipping.postalCode} {order.shipping.city}
              <br />
              {order.shipping.country}
            </div>
          </SectionCard>

          <SectionCard title="Contact">
            <div className="px-5 py-4 text-[13px]">
              <p className="text-ink">{order.contact.fullName}</p>
              <p className="text-ink-mute mt-0.5">{order.contact.email}</p>
              <p className="text-ink-mute">{order.contact.phone}</p>
              {order.company.name && (
                <p className="text-ink-mute mt-2">{order.company.name}</p>
              )}
              {order.company.ice && (
                <p className="text-ink-mute">ICE {order.company.ice}</p>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function NotFound({ refStr }: { refStr: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-paper p-10 text-center">
      <h2 className="text-[18px] font-semibold tracking-[-0.012em] text-ink">
        Order not found
      </h2>
      <p className="mt-2 text-[13px] text-ink-soft">
        No order matches <code className="tabular-nums">{refStr}</code> in your
        scope.
      </p>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-soft transition-colors"
      >
        Back to orders
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
        {label}
      </span>
      <span className="text-ink text-right">{value}</span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between text-[13px]">
      <span className={muted ? "text-ink-mute" : "text-ink-soft"}>{label}</span>
      <span className="tabular-nums text-ink">{value}</span>
    </div>
  );
}
