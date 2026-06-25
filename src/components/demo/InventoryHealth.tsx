"use client";

// InventoryHealth — Phase 5C.
//
// Replaces the prior single-purpose "Low-stock alerts" card with a
// fuller inventory snapshot: stock-value KPI, healthy/low/out bucket
// counts, the low-stock list, and a "most rotated this week" line.

import { useMemo } from "react";
import {
  selectInventoryHealth,
  selectActivityProducts,
  useDemoStore,
  type InventoryHealth as IHType,
} from "@/lib/demoStore";

export function InventoryHealth() {
  const activity = useDemoStore((s) => s.activity);
  const stock = useDemoStore((s) =>
    activity ? s.stock[activity] : undefined,
  );
  const thresholds = useDemoStore((s) =>
    activity ? s.stockThresholds[activity] : undefined,
  );
  const overrides = useDemoStore((s) =>
    activity ? s.productOverrides[activity] : undefined,
  );

  const health = useMemo<IHType>(() => {
    void stock;
    void thresholds;
    void overrides;
    return selectInventoryHealth(useDemoStore.getState());
  }, [stock, thresholds, overrides]);

  // Build the displayed low-stock list locally so we have product
  // names available without rerunning a second selector pass on
  // products.
  const lowList = useMemo(() => {
    if (!activity || !stock) return [];
    const products = selectActivityProducts(useDemoStore.getState(), activity);
    const byId = new Map(products.map((p) => [p.id, p]));
    const out: Array<{ id: string; name: string; onHand: number; threshold: number }> = [];
    for (const [id, qty] of Object.entries(stock)) {
      const t = thresholds?.[id] ?? 5;
      if (qty <= t) {
        const p = byId.get(id);
        if (p) out.push({ id, name: p.name, onHand: qty, threshold: t });
      }
    }
    return out.sort((a, b) => a.onHand - b.onHand).slice(0, 6);
  }, [activity, stock, thresholds]);

  if (!activity) return null;

  const noStock = health.totalSkus === 0;
  const hasAlerts = health.lowCount + health.outCount > 0;
  const borderTone = health.outCount > 0
    ? "border-red-200"
    : health.lowCount > 0
      ? "border-amber-200"
      : "border-hairline";

  return (
    <section
      className={
        "rounded-[10px] bg-paper p-4 md:p-5 border " + borderTone
      }
    >
      <header className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            Inventory health
          </p>
          <h3 className="mt-0.5 text-[14px] font-semibold tracking-[-0.005em] text-ink">
            {noStock
              ? "No stock tracked"
              : hasAlerts
                ? `${health.lowCount + health.outCount} ${health.lowCount + health.outCount === 1 ? "item" : "items"} need attention`
                : "All tracked products are healthy"}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
            Stock value
          </p>
          <p className="text-[14px] font-semibold tabular-nums text-ink leading-tight">
            {fmtMoney(health.totalValue)}{" "}
            <span className="text-[10.5px] font-medium text-ink-mute">
              MAD
            </span>
          </p>
        </div>
      </header>

      {/* Bucket strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <BucketTile
          label="Healthy"
          value={health.healthyCount}
          tone="emerald"
        />
        <BucketTile label="Low" value={health.lowCount} tone="amber" />
        <BucketTile
          label="Out"
          value={health.outCount}
          tone={health.outCount > 0 ? "red" : "muted"}
        />
      </div>

      {/* Low-stock list */}
      {lowList.length > 0 ? (
        <ul className="divide-y divide-hairline -mx-4">
          {lowList.map((row) => {
            const isOut = row.onHand <= 0;
            return (
              <li
                key={row.id}
                className="px-4 py-2 flex items-center justify-between gap-3"
              >
                <span className="text-[12.5px] text-ink truncate min-w-0 flex-1">
                  {row.name}
                </span>
                <span
                  className={
                    "text-[12px] tabular-nums shrink-0 font-medium " +
                    (isOut ? "text-red-600" : "text-amber-600")
                  }
                >
                  {row.onHand}
                  <span className="text-ink-mute font-normal">
                    {" / "}
                    {row.threshold}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : noStock ? (
        <p className="text-[12px] text-ink-mute py-2">
          Set stock on the Inventory screen to surface alerts here.
        </p>
      ) : (
        <p className="text-[12px] text-ink-mute py-2">
          All tracked products are above their thresholds.
        </p>
      )}

      {/* Most-rotated trailer */}
      {health.mostRotated.length > 0 && (
        <div className="mt-4 pt-3 border-t border-hairline">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-1.5">
            Most rotated · last 7 days
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {health.mostRotated.map((m) => (
              <li
                key={m.name}
                className="text-[12px] text-ink-soft flex items-baseline gap-1.5"
              >
                <span className="text-ink-mute tabular-nums">{m.qty}×</span>
                <span className="text-ink">{m.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function BucketTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "red" | "muted";
}) {
  const valueColor =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "red"
          ? "text-red-700"
          : "text-ink-mute";
  return (
    <div className="rounded-lg bg-canvas border border-hairline p-2.5 text-center">
      <p className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-ink-mute">
        {label}
      </p>
      <p
        className={
          "mt-0.5 text-[18px] font-semibold tabular-nums tracking-[-0.01em] leading-none " +
          valueColor
        }
      >
        {value}
      </p>
    </div>
  );
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(n);
}
