"use client";

// ModulesGrid — the "Modules complémentaires" row under the two plans.
// Five à-la-carte modules that layer onto any plan (KDS, Mobile POS,
// Kiosk, Inventory, Web app). Each shows monthly HT + TTC + the yearly
// and 24-month totals so the buyer can quote a full stack without a
// calculator.

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { useAddons, ttc, type Addon, type AddonIcon } from "@/data/pricing";

function formatMad(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function ModulesGrid() {
  const addons = useAddons();
  const t = useTranslations("pricing");
  return (
    <div>
      <div className="mb-6 md:mb-8">
        <Reveal>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-mute">
            {t("addonsEyebrow")}
          </p>
        </Reveal>
        <Reveal delay={0.04}>
          <h3
            className="mt-3 text-[clamp(1.375rem,2.2vw,1.75rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink max-w-[36ch]"
            style={{ textWrap: "balance" }}
          >
            {t("addonsTitle")}
          </h3>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-3 text-[13.5px] leading-[1.55] text-ink-soft max-w-[38rem]">
            {t("addonsBody")}
          </p>
        </Reveal>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
        {addons.map((addon, i) => (
          <Reveal key={addon.slug} delay={0.06 + i * 0.03}>
            <ModuleCard
              addon={addon}
              tPerMonth={t("perMonth")}
              tPerYear={t("perYear")}
              tPer24={t("per24")}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  addon,
  tPerMonth,
  tPerYear,
  tPer24,
}: {
  addon: Addon;
  tPerMonth: string;
  tPerYear: string;
  tPer24: string;
}) {
  const monthlyTtc = ttc(addon.prices.monthly);
  const yearlyTotalHt = addon.prices.yearly * 12;
  const yearlyTotalTtc = ttc(yearlyTotalHt);
  const biennialTotalHt = addon.prices.biennial * 24;
  const biennialTotalTtc = ttc(biennialTotalHt);
  return (
    <div
      className="h-full flex flex-col rounded-2xl bg-paper ring-1 ring-hairline px-5 py-5 md:px-6 md:py-6 transition-all duration-500 hover:-translate-y-0.5 hover:ring-hairline-strong hover:shadow-[0_18px_42px_-28px_rgba(0,0,0,0.22)]"
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      <ModuleIcon kind={addon.icon} />
      <p className="mt-3.5 text-[14px] font-medium text-ink leading-[1.3]">
        {addon.name}
      </p>
      <div className="mt-3.5 flex items-baseline gap-1.5">
        <span className="text-[clamp(1.375rem,2vw,1.625rem)] font-semibold tracking-[-0.02em] leading-none tabular-nums text-ink">
          {formatMad(addon.prices.monthly)}
        </span>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
          MAD HT
        </span>
      </div>
      <p className="mt-1.5 inline-flex items-center h-[22px] px-2 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-medium tabular-nums self-start">
        {formatMad(monthlyTtc)} TTC / {tPerMonth}
      </p>
      <div className="mt-4 pt-3.5 border-t border-hairline space-y-1.5 text-[11.5px] leading-[1.5] text-ink-soft tabular-nums">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-mute">{tPerYear} (HT)</span>
          <span>
            {formatMad(yearlyTotalHt)} DH{" "}
            <span className="text-emerald-700">
              → {formatMad(yearlyTotalTtc)} TTC
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-mute">{tPer24} (HT)</span>
          <span>
            {formatMad(biennialTotalHt)} DH{" "}
            <span className="text-emerald-700">
              → {formatMad(biennialTotalTtc)} TTC
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ModuleIcon({ kind }: { kind: AddonIcon }) {
  const wrap =
    "inline-flex items-center justify-center h-10 w-10 rounded-xl bg-canvas ring-1 ring-hairline text-ink";
  const svgProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
  } as const;
  switch (kind) {
    case "kds":
      return (
        <span className={wrap}>
          <svg {...svgProps}>
            <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      );
    case "mobile":
      return (
        <span className={wrap}>
          <svg {...svgProps}>
            <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 18h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      );
    case "kiosk":
      return (
        <span className={wrap}>
          <svg {...svgProps}>
            <rect x="5" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M9 21h6M12 17v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      );
    case "box":
      return (
        <span className={wrap}>
          <svg {...svgProps}>
            <path
              d="M4 8l8-4 8 4v8l-8 4-8-4V8Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M4 8l8 4 8-4M12 12v9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </span>
      );
    case "globe":
      return (
        <span className={wrap}>
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      );
  }
}
