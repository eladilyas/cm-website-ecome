// BrandLogo — the single way a client / partner / event logo is rendered.
//
// Every asset in `src/data/logos.ts` is a fixed 320×140 canvas with the
// optical balancing already baked in: each mark is scaled so its INK AREA is
// comparable to its neighbours, then centred with padding inside that shared
// frame. So the only correct way to render one is in a box of the same 320:140
// ratio, at its natural size.
//
// That is the whole reason this component exists. If callers were free to pass
// their own width/height, or reach for object-contain, they would re-introduce
// exactly the per-logo size drift the pipeline removed — a wide wordmark would
// fill its box and a compact roundel would sit small inside the same box. Here
// the frame is the constant and the artwork is pre-fitted to it.
//
// There is deliberately NO CSS colour filter. The previous strip faked white
// logos with `brightness(0) invert(1)`, which flattens every opaque pixel to
// pure white and destroys internal detail — a mascot becomes a featureless
// blob. We now ship real white artwork per brand, so the dark surface gets
// genuine white lockups with their counters and inner shapes intact.

import Image from "next/image";
import type { Logo } from "@/data/logos";

/** Rendered slot sizes. All share the source 320:140 aspect so the baked-in
 *  optical balance survives — only the scale changes. */
const SIZES = {
  /** Dense rows: the hero band, footer strips. */
  sm: "w-[120px] h-[52.5px]",
  /** Default: client walls, partner grids. */
  md: "w-[150px] h-[65.6px]",
  /** Feature moment: a single client called out beside their story. */
  lg: "w-[190px] h-[83px]",
} as const;

export type BrandLogoSize = keyof typeof SIZES;

/**
 * Will BrandLogo actually render artwork for this brand on this surface?
 *
 * Callers that provide a typographic fallback must ask this BEFORE laying out,
 * rather than relying on BrandLogo returning null — otherwise they reserve a
 * logo slot, get nothing in it, and show a gap where the brand should be.
 *
 * False when the brand has no artwork for the surface at all, or when its
 * colour lockup is light-inked and there is no white variant to chip.
 */
export function hasRenderableLogo(
  logo: Logo | null | undefined,
  surface: "light" | "dark",
): boolean {
  if (!logo) return false;
  if (surface === "dark") return Boolean(logo.variants.onDark);
  if (logo.onLightSafe === false) return Boolean(logo.variants.onDark);
  return Boolean(logo.variants.onLight);
}

export function BrandLogo({
  logo,
  surface,
  size = "md",
  /** Empty string marks the image decorative — use when an adjacent element
   *  already names the brand, or in a duplicated marquee track. */
  alt,
  className = "",
  priority = false,
}: {
  logo: Logo;
  /** Which surface this sits on. Picks the matching artwork variant. */
  surface: "light" | "dark";
  size?: BrandLogoSize;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  // A light surface normally wants the colour artwork — but a good number of
  // these "colour" lockups are themselves light-inked: white knockout text
  // inside a coloured ring, pale gold hairlines. Placed on white they read as
  // an empty frame however well they are scaled. `onLightSafe: false` marks
  // those (measured, not guessed), and the fix is to show the WHITE artwork on
  // a dark chip — the standard brand-guideline answer for a light-ink mark,
  // and it reads as deliberate rather than as a patch.
  const lightUnsafe = surface === "light" && logo.onLightSafe === false;
  const needsChip = lightUnsafe && Boolean(logo.variants.onDark);

  // Light-inked artwork with NO white variant to fall back on. This is the
  // legacy brand set — colour PNGs supplied without a dark-surface lockup.
  // There is nothing here that can be made legible on a light surface: the
  // chip needs white art, and deriving it from the alpha silhouette would
  // flatten the mark to a featureless blob, which is the exact failure the
  // white-artwork switch was made to escape. Return null so the caller's
  // typographic fallback renders the brand name instead — a wordmark set in
  // type is honest and legible, an invisible logo is neither.
  if (lightUnsafe && !logo.variants.onDark) return null;

  const src = needsChip
    ? logo.variants.onDark
    : surface === "dark"
      ? logo.variants.onDark
      : logo.variants.onLight;

  // A brand can legitimately lack one variant. Rendering the wrong one would
  // put white art on white, so render nothing instead of an invisible box.
  if (!src) return null;

  if (needsChip) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xl bg-ink ${SIZES[size]} ${className}`}
      >
        <Image
          src={src}
          alt={alt ?? logo.name}
          width={320}
          height={140}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          draggable={false}
          // Inset so the artwork keeps clear of the chip's rounded corners;
          // the asset's own padding alone is tuned for an edgeless surface.
          className="w-[86%] h-[86%] select-none"
        />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? logo.name}
      width={320}
      height={140}
      // Deliberately NO `sizes`. With `sizes` set, Next cannot know the
      // viewport so it emits the entire width ladder — up to 2048px and
      // beyond — for what is a 120px slot. Across 38 logos rendered twice by
      // the marquee that was ~570 candidate URLs of dead srcset in the HTML.
      // These assets are a fixed 320×140 and are never displayed larger, so
      // omitting `sizes` lets Next emit a plain 1x/2x pair instead.
      priority={priority}
      loading={priority ? undefined : "lazy"}
      draggable={false}
      className={`${SIZES[size]} select-none ${className}`}
    />
  );
}
