// Order confirmation — server component.
//
// Renders two faces of the same page:
//   • AWAITING_PAYMENT → wire-transfer instructions + receipt uploader
//   • everything else  → standard "your order is confirmed" summary

import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { formatPrice } from "@/lib/formatPrice";
import { PAYMENT_METHOD_LABEL } from "@/server/orders/status";
import { BankTransferDetails } from "@/components/checkout/BankTransferDetails";
import { PaymentProofUploader } from "@/components/checkout/PaymentProofUploader";
import type { DisplayOrder } from "@/server/orders/service";

export async function OrderSuccess({ order }: { order: DisplayOrder }) {
  const isWire = order.status === "AWAITING_PAYMENT";
  const t = await getTranslations("checkoutSuccess");
  const locale = await getLocale();
  const dateLocale = locale === "fr" ? "fr-MA" : "en-GB";
  return isWire ? (
    <WireConfirmation order={order} t={t} dateLocale={dateLocale} />
  ) : (
    <Confirmation order={order} t={t} dateLocale={dateLocale} />
  );
}

// next-intl getTranslations callsite returns a translator with raw + format;
// we narrow it here to the function shape we actually use.
type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function placedAtLabel(order: DisplayOrder, dateLocale: string): string {
  return new Date(order.createdAt).toLocaleString(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Confirmation({
  order,
  t,
  dateLocale,
}: {
  order: DisplayOrder;
  t: Translator;
  dateLocale: string;
}) {
  const firstName = order.contact.fullName.split(" ")[0];
  // Catalog stores the headline with a \n marker so each locale can
  // wrap the line in the right place (FR keeps "Nous préparons" on its
  // own line; EN keeps "We're preparing" on its own line).
  const [titleLine1, titleLine2] = t("paidTitle", { firstName }).split("\n");
  return (
    <section className="min-h-[80vh] bg-canvas pt-12 md:pt-16 pb-16">
      <div className="mx-auto max-w-[720px] px-6 lg:px-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div
            aria-hidden
            className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5"
          >
            <CheckIcon />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700 mb-3">
            {t("paidEyebrow")}
          </p>
          <h1 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
            {titleLine1}
            <br />
            {titleLine2}
          </h1>
          <p className="mt-4 text-[14px] md:text-[15px] text-ink-soft max-w-[28rem] mx-auto leading-[1.5]">
            {t("paidBody", { email: order.contact.email })}
          </p>
        </div>

        <RefCard order={order} t={t} dateLocale={dateLocale} />
        <ItemsCard order={order} t={t} />

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href={`/account/orders/${order.ref}`}
            className="h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
          >
            {t("trackOrder")}
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

function WireConfirmation({
  order,
  t,
  dateLocale,
}: {
  order: DisplayOrder;
  t: Translator;
  dateLocale: string;
}) {
  const proofUploaded = Boolean(order.paymentProof?.dataUrl);
  const firstName = order.contact.fullName.split(" ")[0];
  const [titleLine1, titleLine2] = t("wireTitle", { firstName }).split("\n");
  return (
    <section className="min-h-[80vh] bg-canvas pt-12 md:pt-16 pb-16">
      <div className="mx-auto max-w-[780px] px-6 lg:px-10">
        <div className="text-center mb-10">
          <div
            aria-hidden
            className="mx-auto w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-5"
          >
            <ClockIcon />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700 mb-3">
            {t("wireEyebrow")}
          </p>
          <h1 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
            {titleLine1}
            <br />
            {titleLine2}
          </h1>
          <p className="mt-4 text-[14px] md:text-[15px] text-ink-soft max-w-[32rem] mx-auto leading-[1.5]">
            {t("wireBody")}
          </p>
        </div>

        <RefCard order={order} t={t} dateLocale={dateLocale} />

        <div className="mb-5">
          <BankTransferDetails amount={order.totals.total} orderRef={order.ref} />
        </div>

        <div className="rounded-2xl border border-hairline bg-paper p-5 md:p-6 mb-5">
          <header className="mb-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
              {t("wireProofEyebrow")}
            </p>
            <h2 className="mt-0.5 text-[16px] font-semibold tracking-[-0.005em] text-ink">
              {proofUploaded
                ? t("wireProofUploaded")
                : t("wireProofHeading")}
            </h2>
            {!proofUploaded && (
              <p className="mt-1 text-[12.5px] text-ink-soft leading-relaxed">
                {t("wireProofHint")}
              </p>
            )}
          </header>
          <PaymentProofUploader
            orderRef={order.ref}
            initialProof={order.paymentProof}
          />
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href={`/account/orders/${order.ref}`}
            className="h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
          >
            {t("wireTrackOrder")}
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

function RefCard({
  order,
  t,
  dateLocale,
}: {
  order: DisplayOrder;
  t: Translator;
  dateLocale: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-paper p-5 md:p-6 mb-5">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-1">
            {t("orderRef")}
          </p>
          <p className="text-[22px] md:text-[26px] font-semibold tabular-nums tracking-[-0.018em] text-ink">
            {order.ref}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-1">
            {t("placedAt")}
          </p>
          <p className="text-[12.5px] text-ink-soft tabular-nums">
            {placedAtLabel(order, dateLocale)}
          </p>
        </div>
      </div>
      <div className="mt-5 pt-5 border-t border-hairline space-y-3">
        <Row label={t("payment")} value={PAYMENT_METHOD_LABEL[order.paymentMethod]} />
        <Row
          label={t("delivery")}
          value={`${order.shipping.street}, ${order.shipping.city} ${order.shipping.postalCode}`}
        />
        {order.company.name && <Row label={t("billedTo")} value={order.company.name} />}
      </div>
    </div>
  );
}

function ItemsCard({ order, t }: { order: DisplayOrder; t: Translator }) {
  return (
    <div className="rounded-2xl border border-hairline bg-paper p-5 md:p-6 mb-8">
      <h2 className="text-[14px] font-semibold tracking-[-0.005em] text-ink mb-4">
        {t("itemsOrdered")}
      </h2>
      <ul className="divide-y divide-hairline">
        {order.items.map((it) => (
          <li
            key={it.slug}
            className="py-3 flex items-baseline justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium text-ink truncate">
                {it.name}
                {it.subline && (
                  <span className="ml-1.5 text-[12px] font-normal text-ink-mute">
                    {it.subline}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-mute tabular-nums">
                {formatPrice(it.unitPrice)} × {it.qty}
              </p>
            </div>
            <p className="text-[13.5px] font-semibold tabular-nums text-ink shrink-0">
              {formatPrice(it.lineTotal)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-hairline space-y-1.5 text-[13px]">
        <SummaryRow label={t("subtotalHT")} value={formatPrice(order.totals.subtotal)} />
        <SummaryRow label={t("vat")} value={formatPrice(order.totals.vat)} muted />
        <SummaryRow
          label={t("shipping")}
          value={
            order.totals.shipping > 0
              ? formatPrice(order.totals.shipping)
              : t("shippingIncluded")
          }
          muted
        />
        <div className="mt-2.5 pt-2.5 border-t border-hairline flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
            {t("totalTTC")}
          </span>
          <span className="text-[22px] md:text-[24px] font-semibold tabular-nums tracking-[-0.018em] text-ink">
            {formatPrice(order.totals.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
        {label}
      </span>
      <span className="text-ink">{value}</span>
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

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 12 4 4 8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
