// Delivery hint — small inline line that pairs with AvailabilityBadge
// to set delivery expectations the way Amazon / Alibaba product cards
// do. Two messages: when the item ships and where to.
//
// In-stock items ship within 2-4 business days (Casablanca-based
// warehouse + nationwide courier network — assumption baked in for
// the demo). Incoming items quote the lead time from the catalog.
//
// Copy is static (no Date math) so SSR and CSR render identical HTML.
// Avoiding a moving "Delivered by Tuesday June 17" date keeps the
// hydration boundary clean and the card cache-friendly.

import type { ProductAvailability } from "@/server/catalog/types";

type Variant = "compact" | "full";

export function DeliveryHint({
  availability,
  variant = "compact",
  className = "",
}: {
  availability?: ProductAvailability;
  variant?: Variant;
  className?: string;
}) {
  const status = availability?.status ?? "in-stock";
  const leadWeeks = availability?.leadWeeks ?? 3;
  const isInStock = status === "in-stock";

  const when = isInStock
    ? "Livraison sous 2–4 jours ouvrés"
    : `Livraison sous ~${leadWeeks} sem.`;
  const ships = "Expédition Maroc";

  if (variant === "full") {
    return (
      <p
        className={
          "text-[12px] leading-snug text-ink-soft " + className
        }
      >
        <TruckIcon />
        <span className="ml-1.5 align-middle">{when}</span>
        <span className="mx-1.5 text-ink-mute/60">·</span>
        <span className="align-middle text-ink-mute">{ships}</span>
      </p>
    );
  }

  return (
    <p
      className={
        "inline-flex items-center gap-1.5 text-[11px] leading-snug text-ink-soft " +
        className
      }
    >
      <TruckIcon />
      <span>{when}</span>
      <span className="text-ink-mute/60">·</span>
      <span className="text-ink-mute">{ships}</span>
    </p>
  );
}

function TruckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="inline-block shrink-0 text-ink-mute"
    >
      <path
        d="M1.5 3.5h6.2a.6.6 0 0 1 .6.6V10H2.1a.6.6 0 0 1-.6-.6V3.5z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M8.3 5.5h2.5l1.7 2v2H8.3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle
        cx="4.5"
        cy="11"
        r="1.1"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="white"
      />
      <circle
        cx="10.3"
        cy="11"
        r="1.1"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="white"
      />
    </svg>
  );
}
