// PricingCard — premium per-tier card. Every price shows both HT and
// TTC so the Moroccan buyer sees the full quote. Enterprise's Storage
// + Integrations rows expand into structured sub-content — the buyer
// reads the plan's unique value without opening a comparison table.
//
// Apple / Stripe vocabulary:
//   • eyebrow tag (with red-dot POPULAIRE mark for the recommended plan)
//   • bold tagline → short description
//   • headline price (HT) + TTC subline
//   • two commitment tiles (Yearly + 24-month) — dual HT/TTC each
//   • hairline divider → feature rows
//   • detail blocks on Enterprise (Storage · Integrations)
//   • full-width CTA at the bottom
//
// The recommended plan owns: subtle warmer surface + a top brand-red
// underline mark, a POPULAIRE chip with red dot, and the red CTA.

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { Arrow } from "@/components/ui/Arrow";
import { DiscountTile } from "./DiscountTile";
import { ttc } from "@/data/pricing";
import type { Plan, PlanHighlight, PlanHighlightDetail } from "@/data/pricing";

const APPLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Props = {
  plan: Plan;
  /** Tightens spacing for surfaces that need a denser card. */
  compact?: boolean;
};

function formatMad(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function PricingCard({ plan, compact = false }: Props) {
  const isRecommended = Boolean(plan.recommended);
  const monthly = plan.prices.monthly;
  const monthlyTtc = ttc(monthly);
  const yearlyTotal = plan.prices.yearly * 12;
  const biennialTotal = plan.prices.biennial * 24;

  const t = useTranslations("pricing");

  return (
    <div
      className={`group relative h-full flex flex-col rounded-[20px] p-6 md:p-7 transition-all duration-500 hover:-translate-y-0.5 ${
        isRecommended
          ? "bg-paper ring-1 ring-hairline-strong shadow-[0_28px_60px_-32px_rgba(0,0,0,0.24),0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_34px_72px_-30px_rgba(0,0,0,0.28),0_3px_10px_-2px_rgba(0,0,0,0.07)]"
          : "bg-paper ring-1 ring-hairline hover:ring-hairline-strong hover:shadow-[0_22px_55px_-32px_rgba(0,0,0,0.20)]"
      }`}
      style={{ transitionTimingFunction: APPLE_EASE }}
    >
      {/* Neutral warmth behind the recommended card — a faint paper-on-
          paper glow lifting the card without adding colour. */}
      {isRecommended && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[22px] overflow-hidden"
        >
          <div
            className="absolute inset-x-0 top-0 h-[55%]"
            style={{
              background:
                "radial-gradient(80% 100% at 50% 0%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.015) 60%, rgba(0,0,0,0) 100%)",
            }}
          />
        </div>
      )}

      {/* Top red rule — architectural mark only on the recommended card.
          Sits flush with the card's top edge, rounded to match. */}
      {isRecommended && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] rounded-t-[20px] bg-[#E11D2A]"
        />
      )}

      {/* Plan name + POPULAIRE tag */}
      <div className="flex items-center gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-mute">
          {plan.name}
        </p>
        {isRecommended && (
          <span
            className="inline-flex items-center gap-1.5 h-[20px] px-2 rounded-full bg-canvas ring-1 ring-hairline text-ink text-[9.5px] font-semibold uppercase tracking-[0.14em]"
          >
            <span
              aria-hidden
              className="inline-block h-1 w-1 rounded-full bg-[#E11D2A]"
            />
            {t("popular")}
          </span>
        )}
      </div>

      {/* Tagline */}
      <h3
        className={`mt-3 text-[clamp(1.125rem,1.5vw,1.35rem)] font-semibold tracking-[-0.014em] leading-[1.2] text-ink ${
          compact ? "min-h-0" : "min-h-[2.6em]"
        }`}
        style={{ textWrap: "balance" }}
      >
        {plan.tagline}
      </h3>

      {/* Headline price — HT big + TTC subline */}
      <div className="mt-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[clamp(2rem,3.6vw,2.75rem)] font-semibold tracking-[-0.024em] leading-none tabular-nums text-ink">
            {formatMad(monthly)}
          </span>
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            MAD HT
          </span>
        </div>
        <p className="mt-1.5 text-[12px] text-ink-mute">
          {t("perMonthPerCounter")}
        </p>
        <p className="mt-2.5 inline-flex items-center h-6 px-2.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium tabular-nums">
          {formatMad(monthlyTtc)} MAD TTC / {t("perMonth")}
        </p>
      </div>

      {/* Commitment tiles — dual HT + TTC per tile. */}
      <div className="mt-5 space-y-2">
        <DiscountTile
          label={t("yearly")}
          amount={plan.prices.yearly}
          totalLabel={`${formatMad(yearlyTotal)} DH HT / ${t("perYear")}`}
          variant="soft"
        />
        <DiscountTile
          label={t("biennial")}
          amount={plan.prices.biennial}
          totalLabel={`${formatMad(biennialTotal)} DH HT / 24mo`}
          variant="bold"
        />
      </div>

      {/* Divider */}
      <div className="mt-6 h-px bg-hairline" aria-hidden />

      {/* Feature list — each included row can carry a detail block
          (Enterprise's Storage + Integrations render structured content
          right below the row so the plan's unique value is legible
          without cross-referencing a matrix). */}
      <ul className="mt-5 space-y-3.5 flex-1">
        {plan.highlights.map((row, i) => (
          <FeatureRow key={i} row={row} />
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        className={`mt-7 group/cta inline-flex items-center justify-center w-full h-11 rounded-full text-[13.5px] font-medium transition-all duration-300 ${
          isRecommended
            ? "bg-[#E11D2A] text-white hover:bg-[#c8141f] shadow-[0_8px_20px_-10px_rgba(225,29,42,0.35)]"
            : "bg-ink text-paper hover:bg-ink-soft"
        }`}
        style={{ transitionTimingFunction: APPLE_EASE }}
      >
        {plan.ctaLabel}
        <Arrow
          className="ml-2 transition-transform duration-300 group-hover/cta:translate-x-0.5"
          style={{ transitionTimingFunction: APPLE_EASE }}
        />
      </Link>
    </div>
  );
}

// ── Feature row — check/x + label + optional detail block ────────────────

function FeatureRow({ row }: { row: PlanHighlight }) {
  return (
    <li className="flex flex-col gap-2">
      <div
        className={`flex items-start gap-3 text-[13.5px] leading-[1.4] ${
          row.included ? "text-ink" : "text-ink-mute"
        }`}
      >
        {row.included ? (
          <BrandCheck variant="chip" size={10} className="mt-0.5 shrink-0" />
        ) : (
          <span
            aria-hidden
            className="mt-0.5 inline-flex items-center justify-center shrink-0 rounded-full bg-fog"
            style={{ width: 18, height: 18 }}
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 2l6 6M8 2l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-ink-mute/70"
              />
            </svg>
          </span>
        )}
        <span className="pt-px">{row.label}</span>
      </div>
      {row.included && row.detail && (
        <div className="ml-[26px]">
          <FeatureDetail detail={row.detail} />
        </div>
      )}
    </li>
  );
}

// Detail block variants — structured content for Enterprise's Storage
// + Integrations rows. Each variant renders in the plan card verbatim
// so buyers get the answer without following a footnote.

function FeatureDetail({ detail }: { detail: PlanHighlightDetail }) {
  if (detail.kind === "storage") {
    return (
      <div className="rounded-lg bg-canvas ring-1 ring-hairline px-3 py-2.5 text-[11.5px] leading-[1.55] text-ink-soft space-y-1.5">
        <p className="text-ink">{detail.includedLine}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-ink-soft">
          {detail.addonLines.map((line) => (
            <span key={line} className="inline-flex">
              {line}
            </span>
          ))}
        </div>
        <p className="text-ink-mute">{detail.overageLine}</p>
      </div>
    );
  }
  if (detail.kind === "integrations") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {detail.chips.map((c) => (
          <span
            key={c.slug}
            className="inline-flex items-center gap-1.5 h-6 pl-1 pr-2 rounded-full bg-canvas ring-1 ring-hairline text-[11px] font-medium text-ink"
          >
            <span
              aria-hidden
              className="inline-flex items-center justify-center h-4 w-4 rounded-full text-white text-[9px] font-bold"
              style={{ backgroundColor: c.color }}
            >
              {c.label.charAt(0)}
            </span>
            {c.label}
          </span>
        ))}
      </div>
    );
  }
  return null;
}
