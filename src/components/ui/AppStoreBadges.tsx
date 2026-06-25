// App Store + Google Play badges.
//
// These are the OFFICIAL licensed badges installed from the project's
// /icons/ folder. They live at /public/badges/ and are served through
// next/image so the optimizer generates responsive AVIF/WebP variants per
// `sizes`. Do not modify the binaries — Apple's Marketing Tools and Google
// Play's Brand Guidelines require shipping the exact licensed artwork.
//
//   /public/badges/app-store.png       (738 × 219, aspect 3.37:1)
//   /public/badges/google-play.webp    (1280 × 380, aspect 3.37:1)
//
// Both share the same aspect ratio, so they render at identical heights
// when given the same target width — that's the visual-harmony foundation
// for the side-by-side CTA pair in the Backoffice section.

import Image from "next/image";
import Link from "next/link";

type Props = {
  href: string;
  /** Tailwind classes for sizing — consumer controls width via parent class
   *  (e.g. "w-[140px] md:w-[162px]"). Aspect is locked at 3.37:1 by the
   *  intrinsic dims, so width alone is enough. */
  className?: string;
};

// Native dimensions from the licensed assets.
const APP_STORE_W = 738;
const APP_STORE_H = 219;
const PLAY_STORE_W = 1280;
const PLAY_STORE_H = 380;

// Responsive sizes hint — matches the consumer's `w-[140px] md:w-[162px]`.
// `2x` densities are handled automatically by next/image via srcSet.
const RESPONSIVE_SIZES = "(min-width: 768px) 162px, 140px";

const BASE_LINK_CLASS =
  "inline-flex transition-[opacity,transform] duration-300 hover:opacity-90 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-[9px]";

const LINK_STYLE = {
  transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
} as const;

/** App Store badge — official PNG asset. */
export function AppStoreBadge({ href, className = "" }: Props) {
  return (
    <Link
      href={href}
      aria-label="Download Caisse Manager on the App Store"
      className={`${BASE_LINK_CLASS} ${className}`}
      style={LINK_STYLE}
    >
      <Image
        src="/badges/app-store.png"
        alt=""
        width={APP_STORE_W}
        height={APP_STORE_H}
        sizes={RESPONSIVE_SIZES}
        priority={false}
        className="w-full h-auto"
      />
    </Link>
  );
}

/** Google Play badge — official WebP asset. */
export function GooglePlayBadge({ href, className = "" }: Props) {
  return (
    <Link
      href={href}
      aria-label="Download Caisse Manager on Google Play"
      className={`${BASE_LINK_CLASS} ${className}`}
      style={LINK_STYLE}
    >
      <Image
        src="/badges/google-play.webp"
        alt=""
        width={PLAY_STORE_W}
        height={PLAY_STORE_H}
        sizes={RESPONSIVE_SIZES}
        priority={false}
        className="w-full h-auto"
      />
    </Link>
  );
}
