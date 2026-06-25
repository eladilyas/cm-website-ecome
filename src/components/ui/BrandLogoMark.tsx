import Image from "next/image";

// Official Caisse Manager brand mark, decorative (no link wrapper).
// Wherever you'd otherwise reach for a bare check stroke and the
// visual semantics is "this represents Caisse Manager" — use this.
// For generic "checked / included" indicators, prefer BrandCheck.
//
// Source of truth: /public/logo/cm-logo.svg.

const LOGO_INTRINSIC_W = 379.157;
const LOGO_INTRINSIC_H = 366.132;

type Props = {
  /** Visual width in px. Height is derived to preserve aspect. */
  size?: number;
  className?: string;
};

export function BrandLogoMark({ size = 24, className }: Props) {
  const height = Math.round((size * LOGO_INTRINSIC_H) / LOGO_INTRINSIC_W);
  return (
    <Image
      src="/logo/cm-logo.svg"
      alt=""
      width={size}
      height={height}
      className={className}
      aria-hidden
      priority={false}
    />
  );
}
