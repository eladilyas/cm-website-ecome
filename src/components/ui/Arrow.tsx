// Arrow — the canonical right-pointing arrow used across every "Explore",
// "Continue", "See more", and group-hover affordance in the codebase.
//
// Before this primitive existed, the same 14×14 SVG path was inlined in
// 11 different files (pricing cards, product cards, section CTAs, the
// cart toast, the demo page, checkout/cart/careers/account inline
// links, etc.). One source of truth eliminates copy-paste drift and
// makes a future stroke / weight tweak a single-file change.
//
// Pass-through className so callers add their own transition behaviour
// (e.g. `group-hover:translate-x-0.5` for hover-nudge affordances).
// currentColor stroke so the arrow inherits the surrounding text colour.

type Props = {
  /** Visual side length in px. Defaults to 14. */
  size?: number;
  /** Extra utility classes — typically transition + group-hover behaviour. */
  className?: string;
  /** Stroke width. Defaults to 1.5; 1.4 reads slightly lighter on small surfaces. */
  strokeWidth?: number;
  /** Inline style — typically used to set a custom transition timing function
   *  (the codebase's Apple cubic-bezier doesn't ship as a Tailwind utility). */
  style?: React.CSSProperties;
};

export function Arrow({ size = 14, className, strokeWidth = 1.5, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
      style={style}
    >
      <path
        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
