// Visual system tokens.
//
// Apple's home page composes products into "studios" — each tile has a
// coherent lighting setup made of layered effects:
//   1. Studio backdrop — radial sweep, brightest near the top-center,
//      falling off to transparent at the edges (creates a natural vignette).
//   2. Subject halo — radial wash behind the silhouette, also top-biased,
//      simulating directional studio light hitting the top of the device.
//   3. Subject shadow — drop-shadow() that follows transparent PNG edges.
//   4. Cinematic crop — subtle scale-up (1.03–1.07) of the subject so it
//      reads as a "shot product photo" rather than a screen-captured fit.
//
// All values are token-driven so any product or 3D asset on the site can be
// re-lit by changing a single value here.

export type VisualTone = "dark" | "light" | "fog" | "canvas";

type ToneTokens = {
  /** Studio backdrop — radial, top-biased. Brightest at ~50% 24%, fades to transparent. */
  backdrop: string;
  /** Halo — radial, top-biased. Highlights the top edge of the subject. */
  halo: string;
  /** drop-shadow(...) value — follows transparent PNG silhouettes. */
  shadow: string;
  /** Section background utility. */
  surface: string;
  /** Primary text. */
  ink: string;
  /** Secondary text. */
  inkSoft: string;
  /** Tertiary (muted) text — eyebrows, captions. */
  inkMute: string;
  /** Header scheme attribute. */
  scheme: "dark" | "light";
};

export const VISUAL_SYSTEM: Record<VisualTone, ToneTokens> = {
  dark: {
    backdrop:
      "radial-gradient(72% 60% at 50% 24%, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0) 80%)",
    halo:
      "radial-gradient(55% 45% at 50% 35%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
    shadow: "drop-shadow(0 40px 80px rgba(0,0,0,0.55))",
    surface: "bg-night",
    ink: "text-paper",
    inkSoft: "text-paper/75",
    inkMute: "text-paper/60",
    scheme: "dark",
  },
  light: {
    backdrop:
      "radial-gradient(72% 60% at 50% 24%, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0) 80%)",
    halo:
      "radial-gradient(55% 45% at 50% 35%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0) 70%)",
    shadow: "drop-shadow(0 30px 60px rgba(0,0,0,0.16))",
    surface: "bg-paper",
    ink: "text-ink",
    inkSoft: "text-ink-soft",
    inkMute: "text-ink-mute",
    scheme: "light",
  },
  fog: {
    backdrop:
      "radial-gradient(72% 60% at 50% 24%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.04) 100%)",
    halo:
      "radial-gradient(55% 45% at 50% 35%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 70%)",
    shadow: "drop-shadow(0 30px 60px rgba(0,0,0,0.12))",
    surface: "bg-fog",
    ink: "text-ink",
    inkSoft: "text-ink-soft",
    inkMute: "text-ink-mute",
    scheme: "light",
  },
  // Apple's "MacBook Air on light blue" tile — extremely subtle cool tint.
  // Tints all three layers (backdrop, halo, shadow) so metallic / glass
  // devices read with the same cool cast Apple uses for computer photography.
  canvas: {
    backdrop:
      "radial-gradient(72% 60% at 50% 24%, #E9F0F7 0%, #F2F6FA 55%, rgba(242,246,250,0) 85%)",
    halo:
      "radial-gradient(55% 45% at 50% 35%, rgba(80,130,200,0.12) 0%, rgba(0,0,0,0) 70%)",
    shadow: "drop-shadow(0 30px 60px rgba(40,80,140,0.18))",
    surface: "bg-canvas",
    ink: "text-ink",
    inkSoft: "text-ink-soft",
    inkMute: "text-ink-mute",
    scheme: "light",
  },
};

// Cinematic crop levels — scale factor applied to the product image so it
// reads as a "photographed product" rather than a flat screen capture.
// The image visually extends ~3–6% beyond its layout box into the surrounding
// tile (we don't clip with overflow-hidden, so the silhouette shadow stays valid).
export const CINEMATIC_CROP = {
  none: 1.0,
  subtle: 1.03,
  cinematic: 1.06,
} as const;

export type CinematicCrop = keyof typeof CINEMATIC_CROP;

// Scale presets per device type — guidance for sizing the image wrapper.
// Values are CSS max-width expressions (Tailwind arbitrary-value friendly).
// Each device has a "lead" size (hero / large feature tile) and a "split" size
// (half-width tile in a 2-up grid).
export const DEVICE_SCALE = {
  terminal: { lead: "min(820px,72vh)", split: "min(560px,52vh)" },
  laptop: { lead: "min(840px,68vh)", split: "min(520px,48vh)" },
  tablet: { lead: "min(920px,72vh)", split: "min(520px,50vh)" },
  phone: { lead: "min(280px,68vh)", split: "min(240px,60vh)" },
  kiosk: { lead: "min(420px,72vh)", split: "min(320px,60vh)" },
} as const;

export const REVEAL = {
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  durationFast: 0.6,
  durationSlow: 0.9,
  /** Parallax translate range in px across a subject's full scroll-visible window. */
  parallaxRange: 30,
};
