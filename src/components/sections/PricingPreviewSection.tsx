// Pricing — homepage preview.
//
// Editorial 4-column panel built to land in a single desktop viewport.
// Column 1 carries the section header + Compare-everything CTA; columns
// 2–4 are dense plan slots sharing internal hairline dividers (no
// floating "cards"). The Pro column owns a top brand-red rule, a soft
// vertical wash, and an inline "Popular" tag — the recommendation reads
// without a floating badge.
//
// This component renders its own inline PlanColumn rather than reusing
// the spacious PricingCard on /pricing; the home surface is intentionally
// terser. Both surfaces still read from the same `usePlans()` hook.

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { DiscountTile } from "@/components/pricing/DiscountTile";
import { Arrow } from "@/components/ui/Arrow";
import { usePlans, type Plan } from "@/data/pricing";

const APPLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function PricingPreviewSection() {
  const PLANS = usePlans();
  const t = useTranslations("home.pricingPreview");
  const tCommon = useTranslations("pricing");
  return (
    <section
      data-scheme="light"
      className="relative bg-canvas overflow-hidden"
    >
      {/* Quiet warm bloom behind the Pro column — sits below the panel and
          only reads as ambient temperature, never as colour. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] -z-0"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,29,42,0.06), rgba(225,29,42,0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1240px] px-6 lg:px-10 py-12 md:py-14 lg:py-16">
        <Reveal>
          <div className="rounded-[16px] bg-paper ring-1 ring-hairline overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr_1.05fr_1fr]">
              {/* ── Column 1 — section header + cross-link ────────────── */}
              <div className="relative p-7 md:p-9 flex flex-col border-b lg:border-b-0 lg:border-r border-hairline">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.20em] text-ink-mute">
                  {t("eyebrow")}
                </p>
                <h2
                  className="mt-6 text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.022em] leading-[1.04] text-ink"
                  style={{ textWrap: "balance" }}
                >
                  {t("titleLine1")}
                  <br />
                  <span className="text-ink-mute">{t("titleLine2")}</span>
                </h2>
                <p className="mt-5 text-[14px] leading-[1.55] text-ink-soft max-w-[24rem]">
                  {t("subtitle")}
                </p>
                <div className="mt-auto pt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center text-[13.5px] font-medium text-ink hover:text-[#E11D2A] transition-colors duration-200"
                    style={{ transitionTimingFunction: APPLE_EASE }}
                  >
                    {t("compareCta")}
                    <Arrow
                      size={13}
                      className="ml-1.5 transition-transform duration-300"
                      style={{ transitionTimingFunction: APPLE_EASE }}
                    />
                  </Link>
                  <span className="text-[12px] text-ink-mute tabular-nums">
                    {t("compareHint")}
                  </span>
                </div>
              </div>

              {/* ── Plan columns ──────────────────────────────────────── */}
              {PLANS.map((p, i) => (
                <PlanColumn
                  key={p.slug}
                  plan={p}
                  isLast={i === PLANS.length - 1}
                  delay={0.06 + i * 0.04}
                  labels={{
                    popular: tCommon("popular"),
                    free: tCommon("free"),
                    currency: tCommon("currency"),
                    freeForever: tCommon("freeForever"),
                    perMonthPerCounter: tCommon("perMonthPerCounter"),
                    yearly: tCommon("yearly"),
                    biennial: tCommon("biennial"),
                    save25: tCommon("save25"),
                    save50: tCommon("save50"),
                  }}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── PlanColumn — dense vertical slot inside the shared panel ─────────────

type PlanColumnLabels = {
  popular: string;
  free: string;
  currency: string;
  freeForever: string;
  perMonthPerCounter: string;
  yearly: string;
  biennial: string;
  save25: string;
  save50: string;
};

function PlanColumn({
  plan,
  isLast,
  delay,
  labels,
}: {
  plan: Plan;
  isLast: boolean;
  delay: number;
  labels: PlanColumnLabels;
}) {
  const isPro = Boolean(plan.recommended);

  return (
    <Reveal delay={delay} className="contents">
      <div
        className={`relative p-7 md:p-8 flex flex-col border-b lg:border-b-0 ${
          !isLast ? "lg:border-r" : ""
        } border-hairline ${
          isPro ? "bg-gradient-to-b from-[#E11D2A]/[0.035] to-transparent" : ""
        }`}
      >
        {/* Brand-red top rule — only on the recommended column. */}
        {isPro && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px] bg-[#E11D2A]"
          />
        )}

        {/* Header row — plan name + optional inline Popular tag */}
        <div className="flex items-center gap-2">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.20em] text-ink-mute">
            {plan.name}
          </p>
          {isPro && (
            <span className="inline-flex items-center h-[18px] px-1.5 rounded-[4px] bg-[#E11D2A]/10 text-[#E11D2A] text-[9.5px] font-medium uppercase tracking-[0.14em]">
              {labels.popular}
            </span>
          )}
        </div>

        {/* Tagline */}
        <h3 className="mt-3 text-[17px] md:text-[18px] font-semibold tracking-[-0.011em] leading-[1.2] text-ink">
          {plan.tagline}
        </h3>

        {/* Price block */}
        <div className="mt-5">
          {plan.isFree ? (
            <div className="flex items-baseline">
              <span className="text-[clamp(2rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em] leading-none text-ink">
                {labels.free}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[clamp(2rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em] leading-none tabular-nums text-ink">
                {plan.prices.monthly}
              </span>
              <span className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-mute">
                {labels.currency}
              </span>
            </div>
          )}
          <p className="mt-1.5 text-[11.5px] text-ink-mute">
            {plan.isFree ? labels.freeForever : labels.perMonthPerCounter}
          </p>
        </div>

        {/* Commitment discount tiles — passive, no toggle. Pro/Enterprise
            only; Basic stays on its single "Free" line. */}
        {!plan.isFree && plan.prices.yearly && plan.prices.biennial && (
          <div className="mt-4 space-y-1.5">
            <DiscountTile
              label={labels.yearly}
              save={labels.save25}
              amount={plan.prices.yearly}
              variant="soft"
              density="compact"
            />
            <DiscountTile
              label={labels.biennial}
              save={labels.save50}
              amount={plan.prices.biennial}
              variant="bold"
              density="compact"
            />
          </div>
        )}

        {/* Feature zone — anchored to the bottom of the column via mt-auto
            so the divider line aligns across all three plans regardless of
            how much pricing chrome (tiles vs Free) sits above. Same five
            BrandCheck rows that the /pricing card and matrix use, just
            tighter typography. */}
        <div className="mt-auto pt-6">
          <div className="h-px bg-hairline" aria-hidden />
          <ul className="mt-5 space-y-2.5">
            {plan.highlights.map((row) => (
              <li
                key={row.label}
                className={`flex items-start gap-2.5 text-[12.5px] leading-[1.4] ${
                  row.included ? "text-ink" : "text-ink-mute"
                }`}
              >
                {row.included ? (
                  <BrandCheck
                    variant="chip"
                    size={8}
                    className="mt-[1px] shrink-0"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="mt-[1px] inline-flex items-center justify-center shrink-0 rounded-full bg-fog text-ink-mute/70"
                    style={{ width: 16, height: 16 }}
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 2l6 6M8 2l-6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}
                <span>{row.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link
          href={plan.ctaHref}
          className={`group/cta mt-6 inline-flex items-center justify-center w-full h-10 rounded-[8px] text-[13.5px] font-medium transition-all duration-300 ${
            isPro
              ? "bg-[#E11D2A] text-white hover:bg-[#c8141f] shadow-[0_8px_20px_-8px_rgba(225,29,42,0.45)]"
              : "bg-ink text-paper hover:bg-ink-soft"
          }`}
          style={{ transitionTimingFunction: APPLE_EASE }}
        >
          {plan.ctaLabel}
          <Arrow
            size={13}
            className="ml-1.5 transition-transform duration-300 group-hover/cta:translate-x-0.5"
            style={{ transitionTimingFunction: APPLE_EASE }}
          />
        </Link>
      </div>
    </Reveal>
  );
}

