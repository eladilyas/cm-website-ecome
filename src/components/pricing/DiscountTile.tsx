// DiscountTile — commitment tile used to surface the Yearly (Save 25%)
// and 24-month (Save 50%) prices directly on each plan card, without a
// billing-cycle toggle.
//
// Visual language is a monochrome commitment ladder, not a colour wash:
//   • soft → light canvas surface + ink text   (Yearly · medium commitment)
//   • bold → ink surface + paper text          (24-month · deepest commitment)
//
// The savings claim (e.g. "Save 25%") gets a tiny brand-red dot as its
// only accent — a single point of colour per tile, so a column of two
// tiles doesn't read as a wall of red.

type Variant = "soft" | "bold";

type Props = {
  /** Top label, e.g. "YEARLY" or "24 MONTHS" */
  label: string;
  /** Savings copy, e.g. "Save 25%" */
  save: string;
  /** Monthly-equivalent amount in MAD */
  amount: number;
  variant: Variant;
  /** Tighter (home preview) or default (pricing page). Default = default. */
  density?: "default" | "compact";
};

function formatMad(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function DiscountTile({
  label,
  save,
  amount,
  variant,
  density = "default",
}: Props) {
  const isBold = variant === "bold";
  const pad = density === "compact" ? "px-3 py-2" : "px-3.5 py-2.5";
  const priceSize = density === "compact" ? "text-[14px]" : "text-[15.5px]";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[8px] ${pad} ${
        isBold
          ? "bg-ink text-paper"
          : "bg-canvas text-ink ring-1 ring-hairline"
      }`}
    >
      <div className="flex flex-col leading-tight">
        <span
          className={`font-semibold uppercase tracking-[0.10em] ${
            density === "compact" ? "text-[9.5px]" : "text-[10.5px]"
          } ${isBold ? "text-paper" : "text-ink"}`}
        >
          {label}
        </span>
        <span
          className={`mt-0.5 inline-flex items-center gap-1.5 ${
            density === "compact" ? "text-[10px]" : "text-[10.5px]"
          } ${isBold ? "text-paper/70" : "text-ink-mute"}`}
        >
          <span
            aria-hidden
            className="inline-block h-1 w-1 rounded-full bg-[#E11D2A]"
          />
          {save}
        </span>
      </div>
      <div className="flex flex-col items-end leading-tight">
        <span
          className={`font-semibold tabular-nums ${priceSize} ${
            isBold ? "text-paper" : "text-ink"
          }`}
        >
          {formatMad(amount)} MAD
        </span>
        <span
          className={`mt-0.5 ${
            density === "compact" ? "text-[9.5px]" : "text-[10px]"
          } ${isBold ? "text-paper/60" : "text-ink-mute"}`}
        >
          / mo
        </span>
      </div>
    </div>
  );
}
