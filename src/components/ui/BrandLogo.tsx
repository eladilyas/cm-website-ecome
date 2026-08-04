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
  sm: { cls: "w-[120px] h-[52.5px]", vw: "120px" },
  /** Default: client walls, partner grids. */
  md: { cls: "w-[150px] h-[65.6px]", vw: "150px" },
  /** Feature moment: a single client called out beside their story. */
  lg: { cls: "w-[190px] h-[83px]", vw: "190px" },
} as const;

export type BrandLogoSize = keyof typeof SIZES;

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
  const src =
    surface === "dark" ? logo.variants.onDark : logo.variants.onLight;

  // A brand can legitimately lack one variant. Rendering the wrong one would
  // put white art on white, so render nothing instead of an invisible box.
  if (!src) return null;

  const s = SIZES[size];
  return (
    <Image
      src={src}
      alt={alt ?? logo.name}
      width={320}
      height={140}
      sizes={s.vw}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      draggable={false}
      className={`${s.cls} select-none ${className}`}
    />
  );
}
