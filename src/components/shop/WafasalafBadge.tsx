// Wafasalaf financing affordance — surfaced on every product
// surface (cards, rail, detail page, cart, quick-view) so buyers
// see "X MAD / month" alongside the sticker price. Driving
// conversion: Wafasalaf-backed financing is a primary purchase
// motivator for Moroccan B2B hardware, and burying it inside the
// checkout flow misses the key window where the buyer decides
// whether to start the cart at all.
//
// Wafasalaf is always represented by its SVG logo (never the word
// "Wafasalaf" inline) so the brand association reads instantly as
// a partner mark, not body copy.
//
// Behaviour:
//   • Uses the standard 24-month Classique tariff.
//   • Uses the under-60 age bracket as the default visible estimate
//     — the under-60 monthly is slightly cheaper (lower insurance),
//     so we display the more attractive number with a "from" prefix;
//     checkout recomputes the exact monthly based on the customer's
//     declared age bracket.
//   • Renders on EVERY product (no MAD floor) so the financing
//     option is consistently discoverable across the catalog.
//   • Three variants:
//       - compact: single line "X MAD/mo · [logo]" — cards + rail
//       - inline:  "From X MAD/mo with [logo] · 24 months" — detail
//                  page, quick-view, cart
//       - card:    bordered tile with logo + amount + helper copy —
//                  cart summary, future side panels

import Image from "next/image";
import { useTranslations } from "next-intl";

import { computeClassique, fmtMAD } from "@/lib/wafasalaf";

export type WafasalafBadgeVariant = "compact" | "inline" | "card";

/** Wafasalaf mark — colored teal + yellow logo from the partner.
 *  The SVG viewBox is 353.6 × 298.5 (≈1.185:1), so we size by
 *  height and let width follow the natural ratio. Full color (no
 *  opacity dampening) so the brand reads at a glance. */
const LOGO_RATIO = 353.6 / 298.5;
function WafasalafLogo({
  height,
  className,
}: {
  height: number;
  className?: string;
}) {
  const width = Math.round(height * LOGO_RATIO);
  return (
    <Image
      src="/logos/wafasalaf.svg"
      alt="Wafasalaf"
      width={width}
      height={height}
      className={"shrink-0 " + (className ?? "")}
      // Explicit pixel dimensions on the element so the rendered
      // size matches the intent regardless of Tailwind reset rules.
      style={{ height, width }}
      unoptimized
    />
  );
}

export function WafasalafBadge({
  amount,
  variant = "inline",
  className,
}: {
  /** MAD whole units, HT or TTC — caller decides which total to
   *  base the monthly on. */
  amount: number;
  variant?: WafasalafBadgeVariant;
  className?: string;
}) {
  const t = useTranslations("wafasalaf");
  if (amount <= 0) return null;

  let monthly: number;
  try {
    monthly = computeClassique(amount, 24, "under60").monthly;
  } catch {
    return null;
  }
  const monthlyRounded = Math.ceil(monthly);
  const monthlyStr = fmtMAD(monthlyRounded);

  if (variant === "compact") {
    // Pill-shaped chip — gives the Wafasalaf mark its own
    // bordered well so it reads as a financing affordance, not as
    // body text trailing a separator. Used on /shop cards + the
    // homepage rail under the sticker price. The logo well is
    // intentionally generous so the partner mark reads at a glance
    // — at smaller sizes the stacked icon+wordmark SVG collapses
    // into an unidentifiable blob.
    return (
      <div
        className={
          "inline-flex items-center gap-2.5 pl-1.5 pr-3.5 h-11 rounded-full bg-emerald-50/60 border border-emerald-100 whitespace-nowrap " +
          (className ?? "")
        }
        aria-label={t("ariaCompact", { monthly: monthlyStr })}
      >
        <span className="inline-flex items-center justify-center h-9 w-10 rounded-full bg-paper shadow-[inset_0_0_0_1px_rgba(16,185,129,0.22)]">
          <WafasalafLogo height={30} />
        </span>
        <span className="text-[12.5px] tabular-nums text-ink leading-none">
          <span className="text-ink-mute font-medium">{t("from")} </span>
          <span className="font-semibold">{monthlyStr} MAD</span>
          <span className="text-ink-mute font-medium">{t("perMonth")}</span>
        </span>
      </div>
    );
  }

  if (variant === "inline") {
    // Mid-sized chip — same language as compact but with more
    // breathing room. Used on the Quick View modal where there's
    // room for the monthly amount + the 24-month term.
    return (
      <div
        className={
          "inline-flex items-center gap-3 pl-1.5 pr-4 h-12 rounded-full bg-emerald-50/60 border border-emerald-100 whitespace-nowrap " +
          (className ?? "")
        }
        aria-label={t("ariaInline", { monthly: monthlyStr })}
      >
        <span className="inline-flex items-center justify-center h-10 w-11 rounded-full bg-paper shadow-[inset_0_0_0_1px_rgba(16,185,129,0.22)]">
          <WafasalafLogo height={34} />
        </span>
        <span className="text-[13px] text-ink leading-none">
          <span className="text-ink-mute">{t("from")} </span>
          <span className="font-semibold tabular-nums">
            {monthlyStr} MAD
          </span>
          <span className="text-ink-mute font-medium">{t("perMonth")}</span>
          <span className="text-ink-mute"> {t("termSuffix")}</span>
        </span>
      </div>
    );
  }

  // card — full-bleed financing tile. Used on the detail page
  // hero + the cart summary. Same emerald accent + paper-well
  // logo treatment, just sized up so the financing affordance
  // earns the full attention it deserves on those surfaces.
  return (
    <div
      className={
        "rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 md:p-5 flex items-start gap-4 " +
        (className ?? "")
      }
    >
      <div className="shrink-0 h-14 w-16 rounded-xl bg-paper border border-emerald-100 inline-flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <WafasalafLogo height={40} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] uppercase tracking-[0.16em] text-emerald-700 font-semibold">
          {t("partnerEyebrow")}
        </p>
        <p className="mt-1 text-[15px] md:text-[16px] text-ink leading-tight">
          <span className="font-semibold tabular-nums">
            {t("cardTitle", { monthly: monthlyStr })}
          </span>{" "}
          <span className="text-ink-mute font-normal">{t("cardSubtitle")}</span>
        </p>
        <p className="mt-1.5 text-[12px] text-ink-mute leading-snug">
          {t("cardFootnote")}
        </p>
      </div>
    </div>
  );
}
