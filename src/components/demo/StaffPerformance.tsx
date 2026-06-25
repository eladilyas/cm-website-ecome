"use client";

// StaffPerformance — Phase 5C.
//
// Leaderboard table: initials avatar, name, role, orders today,
// revenue today, average ticket, 7-day spark. Sorted by today's
// revenue desc.
//
// Data comes from receipts with staffId stamped by Phase 5B's
// completePayment extension. Pre-5B receipts (backfill) have no
// staffId so will show as 0/0/0 — that's the honest state until
// the cashier rings a few orders with a staff identity attached.

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  selectStaffPerformance,
  useDemoStore,
  type StaffPerformance as SPType,
} from "@/lib/demoStore";
import { SparkLine } from "./SparkLine";

export function StaffPerformance() {
  const activity = useDemoStore((s) => s.activity);
  const staff = useDemoStore((s) =>
    activity ? s.staff[activity] : undefined,
  );
  const receipts = useDemoStore((s) => s.receipts);

  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 300_000);
    return () => clearInterval(id);
  }, []);

  const perf = useMemo<SPType>(() => {
    void activity;
    void staff;
    void receipts;
    return now > 0
      ? selectStaffPerformance(useDemoStore.getState(), now)
      : [];
  }, [activity, staff, receipts, now]);

  const t = useTranslations("demo.backoffice.staffPerfPanel");

  if (!activity) return null;

  const empty = perf.length === 0;
  const noActivity = perf.every((p) => p.ordersToday === 0);

  return (
    <section className="rounded-[10px] border border-hairline bg-paper p-4 md:p-5">
      <header className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            {t("eyebrow")}
          </p>
          <h3 className="mt-0.5 text-[14px] font-semibold tracking-[-0.005em] text-ink">
            {t("headline")}
          </h3>
        </div>
        <p className="text-[11px] text-ink-mute tabular-nums shrink-0">
          {empty ? "—" : t("peopleCount", { count: perf.length })}
        </p>
      </header>

      {empty ? (
        <p className="text-[12px] text-ink-mute py-3">{t("noStaff")}</p>
      ) : noActivity ? (
        <p className="text-[12px] text-ink-mute py-3 leading-relaxed">
          {t("noAttribution")}
        </p>
      ) : (
        <ul className="divide-y divide-hairline -mx-4">
          {perf.map((p) => (
            <li
              key={p.id}
              className="px-4 py-3 grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3"
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-canvas border border-hairline text-[11px] font-semibold tracking-wide text-ink-soft shrink-0"
              >
                {p.initials}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink truncate leading-tight">
                  {p.name}
                </p>
                <p className="text-[10.5px] text-ink-mute capitalize leading-tight mt-0.5">
                  {translateRole(t, p.role)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[12.5px] font-semibold tabular-nums text-ink leading-tight">
                  {p.ordersToday}
                </p>
                <p className="text-[10px] text-ink-mute tabular-nums leading-tight">
                  {t("ordersUnit")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[12.5px] font-semibold tabular-nums text-ink leading-tight">
                  {fmtMoney(p.revenueToday)}
                </p>
                <p className="text-[10px] text-ink-mute tabular-nums leading-tight">
                  {p.avgTicket > 0
                    ? t("avgPrefix", { value: fmtMoney(p.avgTicket) })
                    : "—"}
                </p>
              </div>
              <div className="hidden sm:block text-ink-mute">
                <SparkLine
                  values={p.spark7d}
                  width={80}
                  height={26}
                  tone={p.revenueToday > 0 ? "ink" : "ink"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Maps a free-form role string from seed data ("cashier", "Barista")
// to a translated label. Falls back to the raw role if no key matches —
// keeps rendering safe even when seeds introduce a new role we haven't
// added to the catalog yet.
function translateRole(
  t: ReturnType<typeof useTranslations>,
  role: string,
): string {
  const known = [
    "cashier",
    "manager",
    "barista",
    "chef",
    "server",
    "barber",
    "stylist",
    "esthetician",
    "owner",
    "cook",
  ];
  const key = role.toLowerCase();
  return known.includes(key) ? t(`role.${key}`) : role;
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(n);
}
