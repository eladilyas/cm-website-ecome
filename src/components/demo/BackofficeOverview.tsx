"use client";

// Backoffice — Overview section.
//
// The "at a glance" landing page when the manager opens Back
// Office. Aggregates everything that mattered in the old top-level
// Dashboard plus the alerts a manager actually wants to see first:
// low-stock, in-flight kitchen tickets / appointments, and a strip
// of the most recent transactions.
//
// Light theme — paper cards on a canvas page, refined typography,
// generous whitespace. Built on the same selectors as the legacy
// DashboardView so the underlying math stays in one place.

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  selectTopProducts,
  useDemoStore,
  type CompletedReceipt,
} from "@/lib/demoStore";
import { ActivityFeed } from "./ActivityFeed";
import { RevenueIntelligence } from "./RevenueIntelligence";
import { CustomerIntelligence } from "./CustomerIntelligence";
import { StaffPerformance } from "./StaffPerformance";
import { InventoryHealth } from "./InventoryHealth";

export function BackofficeOverview() {
  const activity = useDemoStore((s) => s.activity);
  const receipts = useDemoStore((s) => s.receipts);
  const tOv = useTranslations("demo.backoffice.overview");

  // "Today" anchor — captured on mount, refreshed every 5 min so
  // long sessions that cross midnight still bucket correctly. React
  // 19's purity rule forbids Date.now() during render; the mount-
  // effect setState is the canonical workaround.
  const [todayStart, setTodayStart] = useState<number>(() => 0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayStart(startOfDay(Date.now()));
    const id = setInterval(() => setTodayStart(startOfDay(Date.now())), 300_000);
    return () => clearInterval(id);
  }, []);

  const ownAll = useMemo(
    () => (activity ? receipts.filter((r) => r.activity === activity) : []),
    [receipts, activity],
  );
  const liveAll = useMemo(
    () => ownAll.filter((r) => r.status !== "voided"),
    [ownAll],
  );
  const today = useMemo(
    () => liveAll.filter((r) => r.completedAt >= todayStart),
    [liveAll, todayStart],
  );

  const hourly = useMemo(() => bucketByHour(today), [today]);
  const top = useMemo(() => selectTopProducts(ownAll, 5), [ownAll]);

  if (!activity) return null;

  const orderCount = today.length;
  const totalToday = today.reduce((s, r) => s + r.total, 0);
  const avg = orderCount > 0 ? totalToday / orderCount : 0;
  const maxHour = Math.max(1, ...hourly.map((h) => h.total));

  return (
    <div className="h-full w-full overflow-y-auto px-6 md:px-8 py-6 space-y-6">
      {/* Phase 5C — Revenue Intelligence panel (3 KPIs + category +
          channel breakdowns). Replaces the prior 4-up KPI strip. */}
      <RevenueIntelligence />

      {/* Operational pulse — peak hours + top items.
          Kept from the original Overview because they're load-
          bearing operational signals managers expect to see. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card
          title={tOv("salesByHour")}
          subtitle={tOv("salesByHourSubtitle", {
            count: orderCount,
            avg: fmtMoney(avg),
          })}
        >
          {today.length === 0 ? (
            <EmptyHint>{tOv("salesByHourEmpty")}</EmptyHint>
          ) : (
            <div className="flex items-end gap-1 h-[140px] pt-2">
              {hourly.map((h) => {
                const heightPct = (h.total / maxHour) * 100;
                const isActive = h.total > 0;
                return (
                  <div
                    key={h.hour}
                    className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0"
                  >
                    <div
                      className={
                        "w-full rounded-sm transition-colors " +
                        (isActive ? "bg-[#E11D2A]" : "bg-fog")
                      }
                      style={{ height: `${Math.max(2, heightPct)}%` }}
                      title={`${h.hour}:00 · ${fmtMoney(h.total)} MAD`}
                    />
                    <span className="text-[9px] text-ink-mute tabular-nums">
                      {h.hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title={tOv("topItems")} subtitle={tOv("topItemsSubtitle")}>
          {top.length === 0 ? (
            <EmptyHint>{tOv("topItemsEmpty")}</EmptyHint>
          ) : (
            <ul className="space-y-2.5 mt-1">
              {top.map((it, i) => {
                const maxQty = top[0].qty;
                const barPct = (it.qty / maxQty) * 100;
                return (
                  <li
                    key={it.name}
                    className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2.5"
                  >
                    <span className="text-[11px] text-ink-mute tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-ink truncate">
                        {it.name}
                      </p>
                      <div className="mt-1 h-1 rounded-full bg-fog overflow-hidden">
                        <div
                          className="h-full bg-[#E11D2A]"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[12.5px] font-semibold tabular-nums text-ink">
                        {it.qty}
                      </p>
                      <p className="text-[10px] text-ink-mute tabular-nums">
                        {fmtMoney(it.revenue)} MAD
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Phase 5C — Customer Intelligence + Inventory Health row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <CustomerIntelligence />
        <InventoryHealth />
      </div>

      {/* Phase 5C — Staff Performance + Activity Feed row.
          Staff perf carries the 7-day trajectory + today's
          attribution; the feed renders the live event stream. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <StaffPerformance />
        <ActivityFeed />
      </div>
    </div>
  );
}

// ── Sub-pieces ──────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: "amber" | "red";
  children: React.ReactNode;
}) {
  const borderCls =
    accent === "amber"
      ? "border-amber-200"
      : accent === "red"
        ? "border-red-200"
        : "border-hairline";
  return (
    <section
      className={
        "rounded-[10px] border bg-paper p-4 md:p-5 " + borderCls
      }
    >
      <header className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-ink-mute tabular-nums shrink-0">
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] text-ink-mute py-3">{children}</p>
  );
}

// ── Aggregation helpers ────────────────────────────────────────────
// (RecentRow / StatusDot / fmtTime / methodLabel removed when the
// "Recent transactions" card was replaced with ActivityFeed. The
// Receipts tab still owns the detailed receipt presentation.)

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function bucketByHour(receipts: CompletedReceipt[]) {
  const buckets: Array<{ hour: number; total: number }> = [];
  for (let h = 0; h < 24; h++) buckets.push({ hour: h, total: 0 });
  for (const r of receipts) {
    const h = new Date(r.completedAt).getHours();
    buckets[h].total += r.total;
  }
  const firstActive = buckets.findIndex((b) => b.total > 0);
  if (firstActive < 0) return buckets.slice(8, 23);
  const lastActive = buckets.findLastIndex((b) => b.total > 0);
  const pad = 2;
  const from = Math.max(0, firstActive - pad);
  const to = Math.min(24, lastActive + pad + 1);
  return buckets.slice(from, to);
}

function fmtMoney(n: number) {
  return n.toFixed(2);
}
