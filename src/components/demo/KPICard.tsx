// KPICard — premium dashboard tile.
//
// Replaces the prior KpiTile primitive's flat label/value structure
// with: eyebrow label · large value · optional delta badge · optional
// sparkline strip. Designed for the Backoffice Overview Revenue
// Intelligence panel (3-up KPI row), but reusable anywhere the
// dashboard needs a tile that surfaces both a number and its
// recent trajectory.

import { SparkLine } from "./SparkLine";

type Props = {
  label: string;
  value: string;
  /** Right-aligned suffix below the value (e.g. "MAD" or "/day"). */
  suffix?: string;
  /** Optional comparison hint shown under the value — e.g.
   *  "vs. last week" + delta badge. */
  comparison?: {
    label: string;
    deltaPct: number;
  };
  /** Optional sparkline series. Renders inside the tile when
   *  provided. */
  spark?: {
    values: number[];
    tone?: "ink" | "brand" | "emerald";
  };
  /** Visual accent for the value tone. Defaults to "ink". */
  accent?: "ink" | "muted" | "amber" | "emerald";
};

export function KPICard({
  label,
  value,
  suffix,
  comparison,
  spark,
  accent = "ink",
}: Props) {
  const valueColor =
    accent === "muted"
      ? "text-ink-mute"
      : accent === "amber"
        ? "text-amber-700"
        : accent === "emerald"
          ? "text-emerald-700"
          : "text-ink";

  return (
    <article className="rounded-[10px] border border-hairline bg-paper p-4 md:p-5 flex flex-col gap-3.5 min-h-[148px]">
      <header>
        <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-mute">
          {label}
        </p>
      </header>

      <div>
        <p
          className={
            "text-[clamp(1.5rem,2.4vw,2rem)] font-semibold tabular-nums tracking-[-0.018em] leading-[1.05] " +
            valueColor
          }
        >
          {value}
          {suffix && (
            <span className="ml-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
              {suffix}
            </span>
          )}
        </p>
        {comparison && (
          <p className="mt-1.5 flex items-baseline gap-1.5 text-[11px] text-ink-mute leading-tight">
            <DeltaBadge pct={comparison.deltaPct} />
            <span>{comparison.label}</span>
          </p>
        )}
      </div>

      {spark && spark.values.length > 0 && (
        <div className="mt-auto -mx-1 text-ink-mute">
          <SparkLine
            values={spark.values}
            width={220}
            height={32}
            tone={spark.tone ?? "ink"}
          />
        </div>
      )}
    </article>
  );
}

function DeltaBadge({ pct }: { pct: number }) {
  if (!isFinite(pct) || Math.abs(pct) < 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums text-ink-mute">
        — 0%
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={
        "inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums " +
        (up ? "text-emerald-700" : "text-red-600")
      }
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}
