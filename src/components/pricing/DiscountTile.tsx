// DiscountTile — promotional commitment tile used to surface the Yearly
// (Save 25%) and 24-month (Save 50%) prices directly on each plan card,
// without requiring a billing-cycle toggle interaction.
//
// Two variants:
//   • soft — pale red wash + brand-red text  (Yearly)
//   • bold — solid brand-red + white text    (24 months)
//
// Layout: left column = cycle label + savings copy; right column = price
// + "/ mo" unit. Tight padding, tabular price, sharp 8px corners — matches
// the architectural language of the new pricing surfaces.

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
          ? "bg-[#E11D2A] text-white"
          : "bg-[#E11D2A]/[0.08] text-[#E11D2A]"
      }`}
    >
      <div className="flex flex-col leading-tight">
        <span
          className={`font-bold uppercase tracking-[0.10em] ${
            density === "compact" ? "text-[9.5px]" : "text-[10.5px]"
          }`}
        >
          {label}
        </span>
        <span
          className={`mt-0.5 ${
            density === "compact" ? "text-[10px]" : "text-[10.5px]"
          } ${isBold ? "text-white/85" : "text-[#E11D2A]/85"}`}
        >
          {save}
        </span>
      </div>
      <div className="flex flex-col items-end leading-tight">
        <span className={`font-bold tabular-nums ${priceSize}`}>
          {formatMad(amount)} MAD
        </span>
        <span
          className={`mt-0.5 ${
            density === "compact" ? "text-[9.5px]" : "text-[10px]"
          } ${isBold ? "text-white/80" : "text-[#E11D2A]/75"}`}
        >
          / mo
        </span>
      </div>
    </div>
  );
}
