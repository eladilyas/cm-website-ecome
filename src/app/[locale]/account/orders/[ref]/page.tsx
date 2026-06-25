// Order detail — server component reading from Postgres.
//
// Ownership: only the order's customer (or admin/dispatcher with
// scope) can read. Unauthorized access returns the same NotFound as
// a missing order — existence isn't probable across users.

import Link from "next/link";
import Image from "next/image";

import { getServerSession, requireRole } from "@/server/auth-helpers";
import { loadActor } from "@/server/policy";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import {
  actorCanSeeOrder,
  getOrderByRef,
  orderBelongsTo,
} from "@/server/orders/service";
import { PAYMENT_METHOD_LABEL } from "@/server/orders/status";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  StatusBadge,
} from "@/components/account/StatusBadge";
import { formatPrice } from "@/lib/formatPrice";
import { listPublicProducts } from "@/server/catalog/service";
import { PaymentProofUploader } from "@/components/checkout/PaymentProofUploader";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  await requireRole(
    "/account/orders",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
    ROLE_SLUGS.dispatcher,
    ROLE_SLUGS.customer,
  );
  const { ref } = await params;

  const order = await getOrderByRef(ref);
  if (!order) return <NotFound />;

  const session = await getServerSession();
  const actor = await loadActor();
  const isOwner =
    Boolean(session?.user) && orderBelongsTo(order, session!.user.id);
  const allowed = isOwner || (await actorCanSeeOrder(order, actor));
  if (!allowed) return <NotFound />;

  const catalog = await listPublicProducts();
  const productBySlug = new Map(catalog.map((p) => [p.slug, p]));

  const isWire = order.status === "AWAITING_PAYMENT";

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <Link
          href="/account/orders"
          className="text-[12px] text-ink-mute hover:text-ink"
        >
          ← All orders
        </Link>
      </div>

      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-mute font-medium">
            Order
          </p>
          <h1 className="mt-0.5 text-[clamp(1.5rem,3vw,1.875rem)] font-semibold tracking-[-0.018em] text-ink tabular-nums">
            {order.ref}
          </h1>
        </div>
        <StatusBadge
          tone={ORDER_STATUS_TONE[order.status]}
          label={ORDER_STATUS_LABEL[order.status]}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <section className="space-y-5">
          {isWire && (
            <div className="rounded-2xl border border-hairline bg-paper p-5">
              <header className="mb-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
                  Reçu de virement
                </p>
                <h2 className="mt-0.5 text-[14.5px] font-semibold tracking-[-0.005em] text-ink">
                  {order.paymentProof?.dataUrl
                    ? "Reçu transmis · validation en cours"
                    : "Téléchargez votre justificatif"}
                </h2>
              </header>
              <PaymentProofUploader
                orderRef={order.ref}
                initialProof={order.paymentProof}
              />
            </div>
          )}

          <div className="rounded-2xl border border-hairline bg-paper">
            <header className="px-5 pt-4 pb-3">
              <h2 className="text-[14.5px] font-semibold tracking-[-0.005em] text-ink">
                Items ({order.totals.itemCount})
              </h2>
            </header>
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
              <SummaryRow label="Subtotal · HT" value={formatPrice(order.totals.subtotal)} />
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
          </div>
        </section>

        <aside className="space-y-5">
          <Card title="Payment">
            <Row
              label="Method"
              value={PAYMENT_METHOD_LABEL[order.paymentMethod]}
            />
            <Row
              label="Placed"
              value={new Date(order.createdAt).toLocaleString("en-GB")}
            />
            {order.trackingNumber && (
              <Row label="Tracking" value={order.trackingNumber} />
            )}
          </Card>

          <Card title="Delivery">
            <p className="text-[13px] text-ink">
              {order.shipping.street}
              <br />
              {order.shipping.postalCode} {order.shipping.city}
              <br />
              {order.shipping.country}
            </p>
          </Card>

          <Card title="Contact">
            <p className="text-[13px] text-ink">{order.contact.fullName}</p>
            <p className="text-[12px] text-ink-mute mt-0.5">{order.contact.email}</p>
            <p className="text-[12px] text-ink-mute">{order.contact.phone}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="rounded-2xl bg-paper border border-hairline p-10 text-center">
      <h2 className="text-[18px] font-semibold tracking-[-0.012em] text-ink">
        Order not found
      </h2>
      <p className="mt-2 text-[13px] text-ink-soft">
        We couldn&rsquo;t find that order on your account.
      </p>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-soft transition-colors"
      >
        Back to my orders
      </Link>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-paper">
      <header className="px-5 pt-4 pb-3 border-b border-hairline">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-ink-mute font-medium">
          {title}
        </h3>
      </header>
      <div className="px-5 py-4 space-y-2.5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
        {label}
      </span>
      <span className="text-[13px] text-ink text-right">{value}</span>
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
