// Availability badge — En stock / En arrivage signal shown on every
// product surface. Builds buyer trust by setting delivery expectations
// before checkout.
//
// Three presentations:
//   • sm  — compact, used on rail cards (top-right corner). Status
//           dot + short label.
//   • md  — full, used on the shop detail page. Status dot + label
//           + lead-time hint when "incoming".
//   • lg  — flagship presentation on the catalogue ProductCard.
//           Same content as md but with thicker padding + bolder
//           typographic weight so availability reads from a glance.
//
// French labels are intentional (Moroccan B2B convention — same as
// "HT" on the price line). Status tints follow the rest of the site:
// emerald for healthy, amber for caution.

import type { ProductAvailability } from "@/server/catalog/types";

type Size = "sm" | "md" | "lg";

export function AvailabilityBadge({
  availability,
  size = "sm",
  className = "",
}: {
  availability?: ProductAvailability;
  size?: Size;
  className?: string;
}) {
  // Default-when-missing: assume in-stock. Keeps the catalog tolerant
  // of products added before the availability field was populated.
  const status = availability?.status ?? "in-stock";
  const leadWeeks = availability?.leadWeeks ?? 3;
  const isInStock = status === "in-stock";

  const dotColor = isInStock ? "bg-emerald-500" : "bg-amber-500";
  const tone = isInStock
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-800";

  const dims =
    size === "sm"
      ? "h-[24px] px-2.5 text-[10.5px] gap-1.5"
      : size === "md"
        ? "h-7 px-3 text-[11px] gap-2"
        : "h-[30px] px-3 text-[11.5px] gap-2";

  const dotSize =
    size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2";

  const label =
    size === "sm"
      ? isInStock
        ? "En stock"
        : `En arrivage · ~${leadWeeks} sem.`
      : isInStock
        ? "En stock · Disponible immédiatement"
        : `En arrivage · ~${leadWeeks} semaines`;

  return (
    <span
      className={
        "inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.08em] " +
        dims +
        " " +
        tone +
        " " +
        className
      }
      title={
        isInStock
          ? "Available immediately"
          : `Restocking — expected within ${leadWeeks} weeks`
      }
    >
      <span
        aria-hidden
        className={"rounded-full " + dotSize + " " + dotColor}
      />
      <span>{label}</span>
    </span>
  );
}
