import Image from "next/image";
import Link from "next/link";

// Official SVG viewBox dims — used to preserve aspect ratio in <Image>.
const LOGO_INTRINSIC_W = 379.157;
const LOGO_INTRINSIC_H = 366.132;

const APPLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type LogoProps = {
  /** Visual width of the mark in px. Height is derived from intrinsic aspect. */
  size?: number;
  className?: string;
  /** Adds a wordmark next to the icon. */
  wordmark?: boolean;
  /**
   * When true, render the brand mark in solid white. Used by the hero
   * immersive navbar so the logo reads against the cinematic video.
   * Off elsewhere — the natural brand red shows through.
   *
   * Implementation: two stacked instances of /public/logo/cm-logo.svg
   * (one natural, one flattened-to-white via `brightness(0) invert(1)`)
   * crossfade via opacity. This gives a clean tween between the two
   * states; a single CSS filter transition would pass through a muddy
   * grayscale intermediate.
   */
  white?: boolean;
  /** Destination URL. Defaults to "/" (marketing home). The admin shell
   *  overrides this to "/admin" so the logo keeps admins inside the
   *  operations panel — cross-over to the public site happens through
   *  the explicit "View site" affordance instead. */
  href?: string;
};

/**
 * Single source of truth: /public/logo/cm-logo.svg.
 * Two stacked instances enable a smooth white↔red crossfade for the
 * hero-immersive navbar; everywhere else the natural red shows.
 */
export function Logo({
  size = 28,
  className,
  wordmark = false,
  white = false,
  href = "/",
}: LogoProps) {
  const width = size;
  const height = Math.round((size * LOGO_INTRINSIC_H) / LOGO_INTRINSIC_W);

  return (
    <Link
      href={href}
      aria-label="Caisse Manager — home"
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
    >
      <span
        className="relative inline-block"
        style={{ width, height }}
      >
        {/* Red — natural fill from the asset. Visible when `white` is off. */}
        <Image
          src="/logo/cm-logo.svg"
          alt=""
          width={width}
          height={height}
          priority
          className={`absolute inset-0 transition-opacity duration-500 ${
            white ? "opacity-0" : "opacity-100"
          }`}
          style={{ transitionTimingFunction: APPLE_EASE }}
        />
        {/* White — same asset flattened via CSS filter. Visible when
            `white` is on. aria-hidden so screen-readers see one logo. */}
        <Image
          src="/logo/cm-logo.svg"
          alt=""
          aria-hidden="true"
          width={width}
          height={height}
          priority
          className={`absolute inset-0 transition-opacity duration-500 ${
            white ? "opacity-100" : "opacity-0"
          }`}
          style={{
            filter: "brightness(0) invert(1)",
            transitionTimingFunction: APPLE_EASE,
          }}
        />
      </span>
      {wordmark ? (
        <span className="text-[14px] font-semibold tracking-tight">
          Caisse Manager
        </span>
      ) : null}
    </Link>
  );
}
