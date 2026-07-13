"use client";

// Client island rendering the pricing surface. A 3-column editorial
// layout — [header column] · [Pro] · [Enterprise] — matches the
// screenshot: the leftmost column carries the section eyebrow +
// headline + reassurance, so the plans read as an editorial
// spread rather than a floating grid.
//
// Extracted from /pricing/page.tsx so the page can stay a server
// component; hydration cost is bounded by the two cards + header.

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { PricingCard } from "@/components/pricing/PricingCard";
import { usePlans } from "@/data/pricing";

export function PricingPlansSection({ reassureText }: { reassureText: string }) {
  const plans = usePlans();
  const t = useTranslations("pricing");
  return (
    <>
      <div className="rounded-[24px] bg-paper ring-1 ring-hairline overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr] items-stretch">
          {/* Header column — the editorial anchor. */}
          <div className="relative px-7 py-8 md:px-9 md:py-10 border-b lg:border-b-0 lg:border-r border-hairline flex flex-col">
            <Reveal>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-mute">
                {t("eyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2
                className="mt-5 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] leading-[1.05] text-ink"
                style={{ textWrap: "balance" }}
              >
                {t("plansHeaderLine1")}
                <br />
                <span className="text-ink">{t("plansHeaderLine2")}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-5 text-[14px] leading-[1.55] text-ink-soft">
                {t("plansHeaderTagline")}
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 text-[13px] leading-[1.55] text-ink-soft">
                {t("plansHeaderBody")}
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 text-[12px] leading-[1.55] text-ink-mute">
                {t("plansHeaderVat")}
              </p>
            </Reveal>
          </div>

          {/* Plan cards */}
          {plans.map((p, i) => (
            <div
              key={p.slug}
              className={`p-5 md:p-6 ${i < plans.length - 1 ? "lg:border-r lg:border-hairline" : ""}`}
            >
              <Reveal delay={0.1 + i * 0.05} className="h-full">
                <PricingCard plan={p} />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
      <Reveal delay={0.24}>
        <p className="mt-8 text-center text-[12.5px] text-ink-mute max-w-[44rem] mx-auto">
          {reassureText}
        </p>
      </Reveal>
    </>
  );
}
