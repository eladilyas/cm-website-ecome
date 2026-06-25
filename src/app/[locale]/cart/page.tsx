"use client";

// /cart — dedicated B2B cart page.
//
// Replaces the prior CartDrawer as the primary cart surface. Two-
// column on lg+: items list (left) + sticky summary (right). On
// mobile, summary stacks under items.
//
// Per-line surfaces availability ("En stock" / "En arrivage")
// alongside qty + line total so buyers can self-assess delivery
// expectations BEFORE the checkout form. Empty cart shows a
// friendly "browse the store" CTA.

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cartStore";
import { useCartLines, useCartTotals, useCartUpsells } from "@/lib/useCart";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { formatPrice } from "@/lib/formatPrice";
import { AvailabilityBadge } from "@/components/shop/AvailabilityBadge";
import { WafasalafBadge } from "@/components/shop/WafasalafBadge";

export default function CartPage() {
  const t = useTranslations("cart");
  const setQty = useCartStore((s) => s.setQty);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const addToCart = useCartStore((s) => s.addToCart);
  const clearCart = useCartStore((s) => s.clearCart);

  const lines = useCartLines();
  const totals = useCartTotals();
  const upsells = useCartUpsells();
  const { categoryLabels } = useCatalog();
  const labelFor = (slug: string) => categoryLabels[slug] ?? slug;

  const isEmpty = lines.length === 0;

  // Buyer-visible delivery readiness: if any line is "incoming",
  // the order ships as a partial / consolidated delivery so we
  // surface a banner explaining the longest lead time. Guarded on
  // !isEmpty so the empty branch doesn't compute incoming lines.
  const incomingLines = isEmpty
    ? []
    : lines.filter((l) => l.product.availability?.status === "incoming");
  const maxLeadWeeks = incomingLines.reduce(
    (max, l) => Math.max(max, l.product.availability?.leadWeeks ?? 3),
    0,
  );

  // Empty state renders INSIDE the same shell so removing the last
  // item doesn't unmount the outer layout — that was causing the
  // scroll-to-top jump + visible layout shift. Same outer section,
  // same canvas backdrop, same min-h; only the inner card swaps.
  if (isEmpty) {
    return (
      <section className="min-h-[80vh] bg-canvas pt-10 md:pt-14 pb-16">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <EmptyCartInline />
        </div>
      </section>
    );
  }

  // Format helpers — translate the per-unit + line-count strings
  // here in the parent so the row components stay pure.
  const perUnit = (price: number) => t("perUnit", { price: formatPrice(price) });

  return (
    <section className="min-h-[80vh] bg-canvas pt-10 md:pt-14 pb-16">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
        {/* Header */}
        <div className="mb-8 md:mb-10 flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-2">
              {t("eyebrow")}
            </p>
            <h1 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
              {t("headerCount", { count: totals.itemCount })} ·{" "}
              <span className="text-ink-soft tabular-nums">
                {formatPrice(totals.subtotal)}{" "}
                <span className="text-[14px] font-normal text-ink-mute uppercase tracking-[0.1em]">
                  HT
                </span>
              </span>
            </h1>
          </div>
          <Link
            href="/shop"
            className="text-[13px] text-ink-soft hover:text-ink underline-offset-4 hover:underline"
          >
            {t("continueShopping")}
          </Link>
        </div>

        {/* Lead-time banner — only when at least one incoming line */}
        {incomingLines.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 md:px-5 py-3 flex items-start gap-3">
            <span
              aria-hidden
              className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-700 mt-0.5"
            >
              <ClockIcon />
            </span>
            <div className="min-w-0 text-[12.5px] text-amber-900 leading-[1.5]">
              <p className="font-medium">
                {t("incomingTitle", { count: incomingLines.length })}
              </p>
              <p className="text-amber-900/85 mt-0.5">
                {t("incomingBody", { weeks: maxLeadWeeks })}
              </p>
            </div>
          </div>
        )}

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-10 items-start">
          {/* LEFT — items list */}
          <div className="space-y-3">
            {lines.map((l) => (
              <CartLineRow
                key={l.slug}
                slug={l.slug}
                name={l.product.name}
                subline={l.product.subline}
                category={labelFor(l.product.category)}
                image={l.product.heroImage}
                alt={l.product.alt}
                availability={l.product.availability}
                qty={l.qty}
                unitLabel={perUnit(l.product.priceFrom)}
                lineTotal={l.lineTotal}
                removeLabel={t("remove")}
                incLabel={t("increase")}
                decLabel={t("decrease")}
                onInc={() => setQty(l.slug, l.qty + 1)}
                onDec={() => setQty(l.slug, l.qty - 1)}
                onRemove={() => removeFromCart(l.slug)}
              />
            ))}

            {/* Clear cart row */}
            <div className="pt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={clearCart}
                className="text-[12px] text-ink-mute hover:text-ink-soft underline-offset-4 hover:underline transition-colors"
              >
                {t("clearCart")}
              </button>
            </div>

            {/* Upsells */}
            {upsells.length > 0 && (
              <section className="mt-6 rounded-2xl border border-hairline bg-paper p-5 md:p-6">
                <header className="mb-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-1">
                    {t("upsellsEyebrow")}
                  </p>
                  <h2 className="text-[15px] font-semibold tracking-[-0.005em] text-ink">
                    {t("upsellsTitle")}
                  </h2>
                </header>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upsells.map((p) => (
                    <li key={p.slug}>
                      <UpsellRow
                        name={p.name}
                        subline={p.subline}
                        category={labelFor(p.category)}
                        image={p.heroImage}
                        alt={p.alt}
                        priceLabel={t("fromPrice", { price: formatPrice(p.priceFrom) })}
                        addLabel={t("add")}
                        onAdd={() => addToCart(p.slug, 1)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* RIGHT — sticky summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-hairline bg-paper p-5 md:p-6">
              <h2 className="text-[14px] font-semibold tracking-[-0.005em] text-ink mb-4">
                {t("summaryTitle")}
              </h2>
              <div className="space-y-1.5 text-[13px]">
                <SummaryRow
                  label={t("headerCount", { count: totals.itemCount })}
                  value={formatPrice(totals.subtotal)}
                />
                <SummaryRow label={t("shipping")} value={t("shippingCalc")} muted small />
                <SummaryRow label={t("vat")} value={t("vatCalc")} muted small />
                <div className="mt-3 pt-3 border-t border-hairline flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                    {t("subtotalHT")}
                  </span>
                  <span className="text-[22px] font-semibold tabular-nums tracking-[-0.018em] text-ink">
                    {formatPrice(totals.total)}
                  </span>
                </div>
              </div>

              {/* Financing affordance — surfaces the monthly Wafasalaf
                  equivalent on the cart total so buyers see the
                  spread-out cost before they hit checkout. */}
              <WafasalafBadge
                amount={totals.total}
                variant="card"
                className="mt-4"
              />

              <Link
                href="/checkout"
                className="mt-5 w-full h-12 inline-flex items-center justify-center gap-2 rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-soft transition-colors"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
                {t("secureOrder")}
                <Arrow />
              </Link>

              <p className="mt-3 text-[11px] text-ink-mute text-center leading-snug">
                {t("payMethods")}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

/** Empty-cart card rendered INSIDE the cart page's existing shell.
 *
 *  Why this matters: when the buyer removes the last line, React only
 *  needs to swap this card in/out — the outer `<section>` shell
 *  (canvas backdrop, min-h, mx-auto container) stays mounted. That
 *  keeps the scroll position stable AND avoids the visible layout
 *  shift the previous full-page swap caused. */
function EmptyCartInline() {
  const t = useTranslations("cart");
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-[420px]">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-paper border border-hairline flex items-center justify-center text-ink-mute mb-5">
          {/* Same modern shopping-bag silhouette as the header cart
              button — rounded body with an arch handle. Scaled up
              (24px) to fill this 56px tile; geometry is identical so
              the empty state echoes the header glyph the buyer just
              clicked from. */}
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M5 7h10a0.8 0.8 0 0 1 0.8 0.86l-0.7 8.4a1.6 1.6 0 0 1-1.6 1.47H6.5a1.6 1.6 0 0 1-1.6-1.47l-0.7-8.4A0.8 0.8 0 0 1 5 7Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M7.4 7V5.6a2.6 2.6 0 1 1 5.2 0V7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-[20px] font-semibold tracking-[-0.005em] text-ink">
          {t("emptyTitle")}
        </h1>
        <p className="mt-2 text-[13px] text-ink-mute leading-[1.5]">
          {t("emptyHint")}
        </p>
        <Link
          href="/shop"
          className="mt-6 h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
        >
          {t("exploreStore")}
        </Link>
      </div>
    </div>
  );
}

function CartLineRow({
  name,
  subline,
  category,
  image,
  alt,
  availability,
  qty,
  unitLabel,
  lineTotal,
  removeLabel,
  incLabel,
  decLabel,
  onInc,
  onDec,
  onRemove,
}: {
  slug: string;
  name: string;
  subline?: string;
  category: string;
  image: string;
  alt: string;
  availability?: Parameters<typeof AvailabilityBadge>[0]["availability"];
  qty: number;
  unitLabel: string;
  lineTotal: number;
  removeLabel: string;
  incLabel: string;
  decLabel: string;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-paper p-4 md:p-5">
      <div className="grid grid-cols-[88px_1fr_auto] gap-4 md:gap-5 items-start">
        {/* Image */}
        <div className="relative h-[88px] w-[88px] rounded-xl bg-canvas overflow-hidden">
          <Image
            src={image}
            alt={alt}
            fill
            sizes="88px"
            className="object-contain p-2"
          />
        </div>

        {/* Text + meta */}
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            {category}
          </p>
          <p className="mt-1 text-[15px] md:text-[16px] font-semibold tracking-[-0.005em] text-ink leading-tight">
            {name}
            {subline && (
              <span className="ml-1.5 text-[12px] font-normal text-ink-mute">
                {subline}
              </span>
            )}
          </p>
          <div className="mt-2.5">
            <AvailabilityBadge availability={availability} size="sm" />
          </div>
          <p className="mt-2 text-[12px] text-ink-mute tabular-nums">
            {unitLabel}
          </p>
        </div>

        {/* Line total */}
        <p className="text-right text-[16px] font-semibold tabular-nums tracking-[-0.005em] text-ink">
          {formatPrice(lineTotal)}
        </p>
      </div>

      {/* Qty + remove */}
      <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <QtyStep onClick={onDec} aria-label={decLabel}>
            −
          </QtyStep>
          <span className="min-w-[36px] text-center text-[14px] font-medium tabular-nums text-ink">
            {qty}
          </span>
          <QtyStep onClick={onInc} aria-label={incLabel}>
            +
          </QtyStep>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 text-[12px] text-ink-mute hover:text-ink underline-offset-4 hover:underline transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3 4h8m-6 0V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-4 0v7a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {removeLabel}
        </button>
      </div>
    </div>
  );
}

function QtyStep({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="h-9 w-9 rounded-lg border border-hairline-strong bg-paper text-ink-soft hover:bg-canvas hover:text-ink text-[18px] font-medium flex items-center justify-center active:scale-95 transition-all"
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      {...rest}
    >
      {children}
    </button>
  );
}

function UpsellRow({
  name,
  subline,
  category,
  image,
  alt,
  priceLabel,
  addLabel,
  onAdd,
}: {
  name: string;
  subline?: string;
  category: string;
  image: string;
  alt: string;
  priceLabel: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-xl bg-canvas border border-hairline p-3 flex items-center gap-3">
      <div className="relative shrink-0 h-12 w-12 rounded-lg bg-paper overflow-hidden">
        <Image src={image} alt={alt} fill sizes="48px" className="object-contain p-1" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
          {category}
        </p>
        <p className="mt-0.5 text-[13px] font-medium tracking-[-0.005em] text-ink truncate">
          {name}
          {subline && (
            <span className="ml-1.5 text-[11px] font-normal text-ink-mute">
              {subline}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-mute tabular-nums">
          {priceLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 h-9 px-3 text-[12px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {addLabel}
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  small,
}: {
  label: string;
  value: string;
  muted?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={muted ? "text-ink-mute" : "text-ink-soft"}>{label}</span>
      <span
        className={
          "tabular-nums " +
          (small ? "text-[11px] text-ink-mute" : muted ? "text-ink-soft" : "text-ink")
        }
      >
        {value}
      </span>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 5v3.25l2 1.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
