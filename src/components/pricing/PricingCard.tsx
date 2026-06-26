// PricingCard — premium per-tier card. All three prices visible passively
// (monthly headline + Yearly + 24-month commitment tiles) so the savings
// differentiator reads without requiring a billing-cycle toggle. The card
// is shared by the home preview (`compact`) and the /pricing page (full).
//
// Apple / Stripe vocabulary:
//   • eyebrow tag → bold tagline → short description → price + tiles
//   • feature rows with BrandCheck (included) or muted dash (not included)
//   • full-width CTA at the bottom
//   • Recommended (Pro) earns: brand-red ring + ambient red shadow +
//     "Most popular" pill anchored above the card edge.

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { Arrow } from "@/components/ui/Arrow";
import { DiscountTile } from "./DiscountTile";
import type { Plan } from "@/data/pricing";

const APPLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Props = {
  plan: Plan;
  /** Tightens spacing for surfaces that need a denser card. Reserved for
   *  the home preview wrapper if it ever re-uses this card directly. */
  compact?: boolean;
};

export function PricingCard({ plan, compact = false }: Props) {
  const isRecommended = Boolean(plan.recommended);
  const monthly = plan.prices.monthly;
  const t = useTranslations("pricing");

  return (
    <div
      className={`group relative h-full flex flex-col rounded-[18px] p-6 md:p-7 transition-all duration-500 hover:-translate-y-0.5 ${
        isRecommended
          ? "bg-paper ring-1 ring-hairline-strong shadow-[0_22px_55px_-32px_rgba(0,0,0,0.22),0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_28px_65px_-30px_rgba(0,0,0,0.26),0_3px_10px_-2px_rgba(0,0,0,0.06)]"
          : "bg-paper ring-1 ring-hairline hover:ring-hairline-strong hover:shadow-[0_18px_50px_-30px_rgba(0,0,0,0.18)]"
      }`}
      style={{ transitionTimingFunction: APPLE_EASE }}
    >
      {/* Soft ambient warmth behind the Pro card — sits below content
          via negative z-index; rounded-overflow guards the corners. Pure
          neutral now: a faint paper-on-paper glow that lifts the card
          without adding colour. */}
      {isRecommended && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[20px] overflow-hidden"
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

      {/* "Most popular" pill — anchored above the card edge. Neutral
          chip with a single brand-red dot so the recommendation reads
          as a precise mark, not a stamp. */}
      {isRecommended && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-paper ring-1 ring-hairline-strong text-ink text-[10.5px] font-medium uppercase tracking-[0.16em]"
          style={{ boxShadow: "0 6px 16px -8px rgba(0,0,0,0.18)" }}
        >
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#E11D2A]"
          />
          {t("popular")}
        </span>
      )}

      {/* Eyebrow + plan name */}
      <p className="text-[10.5px] font-medium uppercase tracking-[0.20em] text-ink-mute">
        {plan.name}
      </p>

      {/* Tagline */}
      <h3
        className={`mt-2.5 text-[clamp(1.125rem,1.6vw,1.375rem)] font-semibold tracking-[-0.014em] leading-[1.2] text-ink ${
          compact ? "min-h-0" : "min-h-[2.6em]"
        }`}
        style={{ textWrap: "balance" }}
      >
        {plan.tagline}
      </h3>

      {/* Description */}
      <p
        className={`mt-2.5 text-[13px] leading-[1.55] text-ink-soft ${
          compact ? "" : "min-h-[4.2em]"
        }`}
      >
        {plan.description}
      </p>

      {/* Monthly price block (headline) */}
      <div className="mt-6">
        {plan.isFree ? (
          <>
            <div className="flex items-baseline">
              <span className="text-[clamp(1.875rem,3.4vw,2.5rem)] font-semibold tracking-[-0.022em] leading-none text-ink">
                {t("free")}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-ink-mute">
              {t("freeForever")}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[clamp(1.875rem,3.4vw,2.5rem)] font-semibold tracking-[-0.022em] leading-none tabular-nums text-ink">
                {monthly}
              </span>
              <span className="text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink-mute">
                {t("currency")}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-ink-mute">
              {t("perMonthPerCounter")}
            </p>
          </>
        )}
      </div>

      {/* Commitment discount tiles — visible passively so the savings
          differentiator never requires interaction. Pro/Enterprise only. */}
      {!plan.isFree && plan.prices.yearly && plan.prices.biennial && (
        <div className="mt-5 space-y-2">
          <DiscountTile
            label={t("yearly")}
            save={t("save25")}
            amount={plan.prices.yearly}
            variant="soft"
          />
          <DiscountTile
            label={t("biennial")}
            save={t("save50")}
            amount={plan.prices.biennial}
            variant="bold"
          />
        </div>
      )}

      {/* Divider before features */}
      <div className="mt-6 h-px bg-hairline" aria-hidden />

      {/* Feature list */}
      <ul className="mt-5 space-y-3 flex-1">
        {plan.highlights.map((row) => (
          <li
            key={row.label}
            className={`flex items-start gap-3 text-[13px] leading-[1.45] ${
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
            <span>{row.label}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        className={`mt-7 inline-flex items-center justify-center w-full h-11 rounded-[10px] text-[13.5px] font-medium transition-all duration-300 ${
          isRecommended
            ? "bg-[#E11D2A] text-white hover:bg-[#c8141f] shadow-[0_8px_20px_-10px_rgba(225,29,42,0.35)]"
            : "bg-ink text-paper hover:bg-ink-soft"
        }`}
        style={{ transitionTimingFunction: APPLE_EASE }}
      >
        {plan.ctaLabel}
        <Arrow
          className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5"
          style={{ transitionTimingFunction: APPLE_EASE }}
        />
      </Link>
    </div>
  );
}
