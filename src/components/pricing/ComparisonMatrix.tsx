"use client";

// ComparisonMatrix — the authoritative side-by-side reference. Apple-style:
//   • Sticky header with the three plan names + their CTA
//   • Section headings break the table into Workspace / Platform / Support / Hardware
//   • BrandCheck for included rows; muted em-dash for not-included
//   • Mobile: collapses to a stacked-by-plan vertical layout below md
//
// Locale-aware via the usePlans + useComparison hooks in [data/pricing.tsx].

import { useTranslations } from "next-intl";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { usePlans, useComparison, type MatrixCell } from "@/data/pricing";

const PLAN_SLUGS = ["basic", "pro", "enterprise"] as const;

function Cell({ value, recommended }: { value: MatrixCell; recommended?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex">
        <BrandCheck variant="chip" size={11} />
      </span>
    ) : (
      <span
        aria-hidden
        className="inline-block w-3 h-px bg-ink-mute/40"
        title="Not included"
      />
    );
  }
  return (
    <span
      className={`text-[13.5px] leading-[1.4] ${
        recommended ? "text-ink font-medium" : "text-ink-soft"
      }`}
    >
      {value}
    </span>
  );
}

export function ComparisonMatrix() {
  const PLANS = usePlans();
  const COMPARISON = useComparison();
  const t = useTranslations("pricing");
  return (
    <>
      {/* ── Desktop matrix (md+) ───────────────────────────────────────── */}
      <div className="hidden md:block">
        <div className="rounded-[28px] bg-paper ring-1 ring-hairline overflow-hidden">
          {/* Plan header row — empty first cell on the desktop matrix lets
              the feature labels sit underneath without a "Compare" caption
              competing with the section eyebrow above. */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-8 px-8 lg:px-10 py-7 border-b border-hairline">
            <span aria-hidden />
            {PLANS.map((p) => (
              <div
                key={p.slug}
                className={`flex flex-col gap-1.5 ${
                  p.recommended ? "" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.20em] text-ink-mute">
                    {p.name}
                  </p>
                  {p.recommended && (
                    <span className="inline-flex items-center h-[18px] px-2 rounded-full bg-[#E11D2A]/10 text-[#E11D2A] text-[9.5px] font-medium uppercase tracking-[0.14em]">
                      {t("popular")}
                    </span>
                  )}
                </div>
                <p className="text-[17px] font-semibold tracking-[-0.018em] text-ink">
                  {p.isFree ? (
                    t("free")
                  ) : (
                    <>
                      <span className="tabular-nums">{p.prices.yearly}</span>{" "}
                      <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-ink-mute">
                        {t("currency")} / {t("perMonthPerCounter").replace(/^\/\s*/, "").split(" ")[0]}
                      </span>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Body — grouped rows */}
          {COMPARISON.map((group, gi) => (
            <div key={group.title}>
              {/* Group header */}
              <div
                className={`grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-8 px-8 lg:px-10 py-4 bg-canvas/60 ${
                  gi > 0 ? "border-t border-hairline" : ""
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
                  {group.title}
                </p>
                <span aria-hidden />
                <span aria-hidden />
                <span aria-hidden />
              </div>
              {group.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-8 px-8 lg:px-10 py-4 border-t border-hairline items-start hover:bg-canvas/40 transition-colors duration-200"
                >
                  <div>
                    <p className="text-[14.5px] font-medium tracking-[-0.005em] text-ink">
                      {row.label}
                    </p>
                    {row.hint && (
                      <p className="mt-1 text-[12.5px] text-ink-mute leading-[1.5]">
                        {row.hint}
                      </p>
                    )}
                  </div>
                  {PLAN_SLUGS.map((slug) => {
                    const value = row[slug];
                    const plan = PLANS.find((p) => p.slug === slug);
                    return (
                      <div key={slug} className="flex items-start pt-0.5">
                        <Cell value={value} recommended={plan?.recommended} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile stacked (below md) ───────────────────────────────────── */}
      <div className="md:hidden space-y-6">
        {PLANS.map((p) => (
          <div
            key={p.slug}
            className={`rounded-[24px] bg-paper p-6 ring-1 ${
              p.recommended ? "ring-[#E11D2A]/30" : "ring-hairline"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.20em] text-ink-mute">
                {p.name}
              </p>
              <p className="text-[14px] font-semibold text-ink">
                {p.isFree ? t("free") : `${p.prices.yearly} ${t("currency")}/mo`}
              </p>
            </div>

            {COMPARISON.map((group) => (
              <div key={group.title} className="mt-6">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-2.5">
                  {group.title}
                </p>
                <ul className="divide-y divide-hairline">
                  {group.rows.map((row) => {
                    const value = row[p.slug];
                    return (
                      <li
                        key={row.label}
                        className="py-2.5 flex items-start justify-between gap-4"
                      >
                        <span className="text-[13.5px] text-ink-soft leading-[1.4]">
                          {row.label}
                        </span>
                        <span className="shrink-0">
                          <Cell value={value} recommended={p.recommended} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
