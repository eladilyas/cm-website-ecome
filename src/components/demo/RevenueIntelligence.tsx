"use client";

// RevenueIntelligence — Phase 5C.
//
// Three KPI cards (Today / This week / This month) with deltas +
// sparklines, plus the revenue-by-category horizontal stacked bar
// and revenue-by-channel breakdown. The dashboard's headline panel.

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  selectChannelMix,
  selectCategoryMix,
  selectRevenueIntelligence,
  useDemoStore,
  type ChannelMix,
  type CategoryMix,
  type RevenueIntelligence as RIType,
} from "@/lib/demoStore";
import { KPICard } from "./KPICard";

const BRAND_RED = "#E11D2A";

// Category colors — distinct enough to read in a stacked bar but
// kept in the cool/neutral family so the brand red stays the only
// "loud" color on the dashboard. Cycles when more than 8 categories.
const CATEGORY_COLORS = [
  "#1d1d1f",
  "#4b5563",
  "#9ca3af",
  "#7c5cbc",
  "#3b82f6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
];

export function RevenueIntelligence() {
  const activity = useDemoStore((s) => s.activity);
  const receipts = useDemoStore((s) => s.receipts);
  const t = useTranslations("demo.backoffice.revenueIntel");

  // Reuse the same mount-effect pattern used elsewhere in Overview
  // to seed `now` without violating React 19's render-purity rule.
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 300_000);
    return () => clearInterval(id);
  }, []);

  const ownReceipts = useMemo(
    () => (activity ? receipts.filter((r) => r.activity === activity) : []),
    [activity, receipts],
  );

  const intel = useMemo<RIType>(
    () =>
      now > 0
        ? selectRevenueIntelligence(ownReceipts, now)
        : {
            today: { revenue: 0, orders: 0, spark: [] },
            week: { revenue: 0, orders: 0, deltaPct: 0 },
            month: { revenue: 0, orders: 0, deltaPct: 0 },
          },
    [ownReceipts, now],
  );

  const channelMix = useMemo<ChannelMix>(
    () => selectChannelMix(ownReceipts),
    [ownReceipts],
  );

  const categoryMix = useMemo<CategoryMix>(() => {
    void activity;
    return selectCategoryMix(useDemoStore.getState());
  }, [activity]);

  return (
    <div className="space-y-4">
      {/* Three KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <KPICard
          label={t("salesToday")}
          value={fmtMoney(intel.today.revenue)}
          suffix="MAD"
          comparison={{
            label: t("ordersTodaySuffix", { count: intel.today.orders }),
            deltaPct: 0,
          }}
          spark={{
            values: intel.today.spark,
            tone: "brand",
          }}
          accent={intel.today.revenue > 0 ? "ink" : "muted"}
        />
        <KPICard
          label={t("thisWeek")}
          value={fmtMoney(intel.week.revenue)}
          suffix="MAD"
          comparison={{
            label: t("vsPrior7"),
            deltaPct: intel.week.deltaPct,
          }}
          spark={{
            values: intel.today.spark,
            tone: "ink",
          }}
          accent="ink"
        />
        <KPICard
          label={t("thisMonth")}
          value={fmtMoney(intel.month.revenue)}
          suffix="MAD"
          comparison={{
            label: t("vsPrior30"),
            deltaPct: intel.month.deltaPct,
          }}
          accent="ink"
        />
      </div>

      {/* Category mix + channel donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <CategoryMixCard mix={categoryMix} />
        <ChannelMixCard mix={channelMix} />
      </div>
    </div>
  );
}

// ── Category mix — horizontal stacked bar + legend ─────────────────

function CategoryMixCard({ mix }: { mix: CategoryMix }) {
  const empty = mix.length === 0;
  const t = useTranslations("demo.backoffice.revenueIntel");
  return (
    <section className="rounded-[10px] border border-hairline bg-paper p-4 md:p-5">
      <header className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink">
          {t("revenueByCategory")}
        </h3>
        <p className="text-[11px] text-ink-mute tabular-nums shrink-0">
          {empty ? "—" : t("categoriesUnit", { count: mix.length })}
        </p>
      </header>
      {empty ? (
        <p className="text-[12px] text-ink-mute py-3">
          {t("categoryEmpty")}
        </p>
      ) : (
        <>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-fog">
            {mix.map((c, i) => (
              <div
                key={c.categoryId}
                title={`${c.categoryName} · ${c.pct.toFixed(0)}%`}
                style={{
                  width: `${c.pct}%`,
                  backgroundColor:
                    CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                }}
              />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {mix.slice(0, 8).map((c, i) => (
              <li
                key={c.categoryId}
                className="flex items-center justify-between gap-3 text-[12.5px]"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                    }}
                  />
                  <span className="text-ink truncate">{c.categoryName}</span>
                </span>
                <span className="text-ink-mute tabular-nums shrink-0">
                  {c.pct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// ── Channel mix — donut + legend ───────────────────────────────────

function ChannelMixCard({ mix }: { mix: ChannelMix }) {
  const total = mix.reduce((s, c) => s + c.revenue, 0);
  const empty = total === 0;
  const t = useTranslations("demo.backoffice.revenueIntel");
  const tCh = useTranslations("demo.backoffice.revenueIntel.channelLabels");
  return (
    <section className="rounded-[10px] border border-hairline bg-paper p-4 md:p-5">
      <header className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink">
          {t("byChannel")}
        </h3>
        <p className="text-[11px] text-ink-mute tabular-nums shrink-0">
          {empty ? "—" : `${fmtMoney(total)} MAD`}
        </p>
      </header>
      {empty ? (
        <p className="text-[12px] text-ink-mute py-3">
          {t("channelEmpty")}
        </p>
      ) : (
        <div className="flex items-center gap-5">
          <Donut mix={mix} />
          <ul className="flex-1 space-y-1.5">
            {mix.map((c, i) => (
              <li
                key={c.channel}
                className="flex items-center justify-between gap-3 text-[12px]"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        i === 0 ? BRAND_RED : CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                    }}
                  />
                  <span className="text-ink truncate">
                    {safeChannelLabel(tCh, c.channel)}
                  </span>
                </span>
                <span className="text-ink-mute tabular-nums shrink-0">
                  {c.pct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Donut({ mix }: { mix: ChannelMix }) {
  const size = 88;
  const radius = 36;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  // Precompute cumulative offsets so the render loop is pure (no
  // post-render variable reassignment — React 19 immutability rule).
  // First compute arcLen for each segment, then derive dashOffset
  // as the prefix-sum of all prior arcLens (immutable map + slice).
  const arcLens = mix.map((c) => (c.pct / 100) * circumference);
  const segments = mix.map((c, i) => ({
    ...c,
    arcLen: arcLens[i],
    dashOffset: -arcLens.slice(0, i).reduce((s, v) => s + v, 0),
  }));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(20,15,40,0.06)"
        strokeWidth={stroke}
      />
      {segments.map((seg, i) => (
        <circle
          key={seg.channel}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={
            i === 0 ? BRAND_RED : CATEGORY_COLORS[i % CATEGORY_COLORS.length]
          }
          strokeWidth={stroke}
          strokeDasharray={`${seg.arcLen.toFixed(2)} ${(circumference - seg.arcLen).toFixed(2)}`}
          strokeDashoffset={seg.dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

// Guards against unknown channel keys leaking past the message catalog.
// Calling `t(key)` on a missing message throws under next-intl's default
// error mode; we'd rather surface the raw key than crash the dashboard.
function safeChannelLabel(
  t: ReturnType<typeof useTranslations>,
  channel: string,
): string {
  const known = ["take-away", "dine-in", "glovo", "done"];
  return known.includes(channel) ? t(channel) : channel;
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(n);
}
