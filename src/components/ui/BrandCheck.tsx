// BrandCheck — the single source of truth for every "checked" or
// "included" indicator across the site.
//
// The check stroke matches the Caisse Manager brand mark exactly
// (d="M5 12.5l4 4L19 6.5") so a check next to a pricing feature, a
// product benefit, or a payment-success card reads as the same brand
// element. No green checkmarks, no system ✓, no library icons — every
// affirmative indicator uses this component.
//
// Variants:
//   • inline — bare stroke, inherits color (use inside text contexts)
//   • chip   — small filled brand-red bg circle around the check
//              (use in feature lists, benefit bullets)
//   • circle — larger outlined brand-red ring around the check
//              (use in success states, hero confirmations)
//
// Color is brand red by default. The "inline" variant inherits
// currentColor for cases where the parent already sets the tone.

type Variant = "inline" | "chip" | "circle";

type Props = {
  /** Stroke size in px. Default 14 (good for chip in feature lists). */
  size?: number;
  variant?: Variant;
  className?: string;
};

const BRAND_RED = "#E11D2A";

export function BrandCheck({ size = 14, variant = "inline", className = "" }: Props) {
  if (variant === "chip") {
    // Small chip: brand-red check on a 12%-opacity brand-red fill.
    // Outer container is a circle slightly bigger than the stroke.
    const outer = size + 8;
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full ${className}`}
        style={{
          width: outer,
          height: outer,
          backgroundColor: "rgba(225, 29, 42, 0.12)",
          color: BRAND_RED,
        }}
      >
        <CheckPath size={size} />
      </span>
    );
  }

  if (variant === "circle") {
    // Hero / success indicator: solid 2px brand-red ring + soft brand
    // tint fill, larger stroke. Visually distinct enough to read as
    // "completed" while still being unmistakably the brand mark.
    const outer = size + 16;
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full ${className}`}
        style={{
          width: outer,
          height: outer,
          backgroundColor: "rgba(225, 29, 42, 0.10)",
          border: `2px solid ${BRAND_RED}`,
          color: BRAND_RED,
        }}
      >
        <CheckPath size={size} />
      </span>
    );
  }

  // inline — inherits currentColor from the parent. Falls back to brand
  // red when the parent hasn't set a text color, so a bare <BrandCheck />
  // still reads as the brand mark.
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color: "currentColor", width: size, height: size }}
    >
      <CheckPath size={size} />
    </span>
  );
}

function CheckPath({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 12.5l4 4L19 6.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
