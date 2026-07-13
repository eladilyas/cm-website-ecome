// DiscountTile — commitment tile used to surface the Yearly and
// 24-month prices directly on each plan card. Displays BOTH the HT
// price (top row) and the TTC-equivalent per month (bottom row) so a
// Moroccan buyer never has to compute VAT themselves.
//
// Two variants form a monochrome commitment ladder rather than a
// colour wash:
//   • soft → light canvas surface + ink text   (Yearly, medium commitment)
//   • bold → ink surface + paper text          (24-month, deepest commitment)
//
// Layout (left → right):
//   [ eyebrow: cycle label       ]          [ amount HT  ]
//   [ small: HT total for cycle  ]          [ TTC / mo   ]

import { ttc } from "@/data/pricing";

type Variant = "soft" | "bold";

type Props = {
  /** Top label — "ANNUEL" or "24 MOIS" */
  label: string;
  /** Monthly-equivalent amount HT in MAD (the headline number). */
  amount: number;
  /** Whole-period HT total (e.g. yearly = amount × 12 = 2340). */
  totalLabel: string;
  variant: Variant;
  density?: "default" | "compact";
};

function formatMad(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function DiscountTile({
  label,
  amount,
  totalLabel,
  variant,
  density = "default",
}: Props) {
  const isBold = variant === "bold";
  const pad = density === "compact" ? "px-3 py-2.5" : "px-4 py-3";
  const amountSize =
    density === "compact"
      ? "text-[15px]"
      : "text-[clamp(1.05rem,1.4vw,1.25rem)]";
  const monthlyTtc = ttc(amount);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[10px] ${pad} ${
        isBold
          ? "bg-ink text-paper"
          : "bg-canvas text-ink ring-1 ring-hairline"
      }`}
    >
      <div className="flex flex-col leading-tight min-w-0">
        <span
          className={`font-semibold uppercase tracking-[0.11em] ${
            density === "compact" ? "text-[10px]" : "text-[10.5px]"
          } ${isBold ? "text-paper" : "text-ink"}`}
        >
          {label}
        </span>
        <span
          className={`mt-1 ${
            density === "compact" ? "text-[10.5px]" : "text-[11px]"
          } ${isBold ? "text-paper/70" : "text-ink-mute"} tabular-nums truncate`}
        >
          {totalLabel}
        </span>
      </div>
      <div className="flex flex-col items-end leading-tight shrink-0">
        <span
          className={`font-semibold tabular-nums ${amountSize} ${
            isBold ? "text-paper" : "text-ink"
          }`}
        >
          {formatMad(amount)}{" "}
          <span
            className={`text-[10px] font-medium uppercase tracking-[0.14em] ${
              isBold ? "text-paper/70" : "text-ink-mute"
            }`}
          >
            HT
          </span>
        </span>
        <span
          className={`mt-1 tabular-nums ${
            density === "compact" ? "text-[10px]" : "text-[10.5px]"
          } ${isBold ? "text-paper/65" : "text-ink-mute"}`}
        >
          {formatMad(monthlyTtc)} TTC /mo
        </span>
      </div>
    </div>
  );
}
