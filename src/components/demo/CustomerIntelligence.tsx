"use client";

// CustomerIntelligence — Phase 5C.
//
// Two-up customer panel: repeat-customer rate KPI + top customers
// leaderboard. Pulls from the selectCustomerIntelligence selector
// which uses the receipt ledger's stamped customerId (Phase 5B)
// plus the seeded customer roster. The earlier "loyalty tier
// distribution" bar has been removed — the points/tier feature is
// not part of the shipped product.

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  selectCustomerIntelligence,
  useDemoStore,
  type CustomerIntelligence as CIType,
} from "@/lib/demoStore";

export function CustomerIntelligence() {
  const activity = useDemoStore((s) => s.activity);
  const customers = useDemoStore((s) =>
    activity ? s.customers[activity] : undefined,
  );
  const receipts = useDemoStore((s) => s.receipts);
  const t = useTranslations("demo.backoffice.customerIntel");
  const tKpi = useTranslations("demo.backoffice.kpi");

  const intel = useMemo<CIType>(() => {
    void activity;
    void customers;
    void receipts;
    return selectCustomerIntelligence(useDemoStore.getState());
  }, [activity, customers, receipts]);

  if (!activity) return null;

  return (
    <section className="rounded-[10px] border border-hairline bg-paper p-4 md:p-5">
      <header className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            {t("eyebrow")}
          </p>
          <h3 className="mt-0.5 text-[14px] font-semibold tracking-[-0.005em] text-ink">
            {t("inBook", { count: intel.totalCustomers })}
          </h3>
        </div>
        <p className="text-[11px] text-ink-mute tabular-nums shrink-0">
          {tKpi("attributedOrders", { count: intel.attributedOrders })}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Repeat rate KPI */}
        <div className="rounded-lg bg-canvas p-3.5 border border-hairline">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            {t("repeatRate")}
          </p>
          <p className="mt-2 text-[24px] font-semibold tabular-nums tracking-[-0.012em] leading-none text-ink">
            {intel.repeatRate.toFixed(0)}
            <span className="text-[12px] font-medium text-ink-mute ml-0.5">
              %
            </span>
          </p>
          <p className="mt-2 text-[11.5px] text-ink-soft leading-snug">
            {t("repeatRateBody")}
          </p>
          <p className="mt-2.5 text-[10.5px] text-ink-mute leading-snug">
            {t("attributedShare", { share: intel.attributedShare.toFixed(0) })}
          </p>
        </div>

        {/* Top customers */}
        <div className="rounded-lg bg-canvas p-3.5 border border-hairline lg:col-span-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-2.5">
            {t("topCustomers")}
          </p>
          {intel.topCustomers.length === 0 ? (
            <p className="text-[12px] text-ink-mute py-3">
              {t("topCustomersEmpty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {intel.topCustomers.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2.5"
                >
                  <span className="text-[10.5px] tabular-nums text-ink-mute w-3 shrink-0">
                    {i + 1}
                  </span>
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-paper border border-hairline text-[10.5px] font-semibold text-ink-soft tracking-wide shrink-0"
                  >
                    {initialsOf(c.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-ink truncate leading-tight">
                      {c.name}
                    </p>
                    <p className="text-[10.5px] text-ink-mute leading-tight tabular-nums">
                      {t("ordersUnit", { orders: c.orders })}
                    </p>
                  </div>
                  <p className="text-[12px] tabular-nums font-semibold text-ink shrink-0">
                    {fmtMoney(c.spend)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Loyalty tier distribution removed — the tier/points feature
          is not part of the live product. The data model still
          carries `tierCounts` so the underlying selector keeps its
          shape, but the panel no longer renders. */}
    </section>
  );
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(n);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] ?? "??").slice(0, 2).toUpperCase();
}
