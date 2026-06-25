// Client logos for the trusted-by strip.
//
// Curated for the white-monochrome treatment: the strip applies CSS filter
// `brightness(0) invert(1)` which collapses every opaque pixel of the source
// PNG to pure white, preserving only the alpha-channel silhouette. Logos that
// lose their brand identity under this transformation are EXCLUDED — better
// to show fewer logos that look perfect than many that erode the strip's
// premium impression.
//
// Sizing constraint: the strip slot is ~120×36px. Square / portrait lockup
// logos (mascot stacked over wordmark stacked over tagline) compress every
// element down to illegible mush at that height. We exclude any asset that
// can't read as a recognisable mark at strip size — brand integrity over
// brand coverage. Logos that fail this test should ship as their own
// wordmark-only export to be re-added later.
//
// Removed brands (verified by rendering the white-on-black preview via PIL):
//   • CTR Chicken    — chicken mascot collapses to a featureless white blob;
//                      "CHICKEN" text inside its orange box disappears
//                      (white-on-white after the filter merges opaque pixels).
//   • Golden Coffee  — composition reduces to a plain white circle with no
//                      internal detail; brand identity destroyed entirely.
//   • Panda          — vertical lockup (mascot + "PANDA" + "SUSHI & WOK"
//                      tagline) at 1:1 square aspect renders as ~36×36 in
//                      the strip slot, making mascot fuzzy and both text
//                      lines unreadable. Re-add when a wordmark-only
//                      "PANDA" SVG is supplied.
//
// Order = display order in the carousel:
//   1–N  Priority partners first (Crusty, Primos, Leamido, 75 Flavours)
//        so they land in the carousel's initial visible window before the
//        auto-scroll begins to cycle.
//   N+   Remaining partners discovered in the Reference Logos folder,
//        alphabetical.

export type TrustedLogo = {
  /** Brand name — used as alt text + screen-reader label. */
  name: string;
  /** Path under /public/clients/. */
  src: string;
  /** Intrinsic dimensions of the source file, in pixels. */
  width: number;
  height: number;
};

export const TRUSTED_LOGOS: TrustedLogo[] = [
  // ── Priority partners ──────────────────────────────────────────────
  { name: "Crusty",            src: "/clients/crusty.png",            width: 2566, height: 606  },
  { name: "Primos",            src: "/clients/primos.png",            width: 1355, height: 995  },
  { name: "Leamido",           src: "/clients/leamido.png",           width: 1163, height: 1360 },
  { name: "75 Flavours",       src: "/clients/75-flavours.png",       width: 2601, height: 1159 },
  // ── Remaining partners, alphabetical ────────────────────────────────
  { name: "Alhayba",           src: "/clients/alhayba.png",           width: 1024, height: 569  },
  { name: "Elbayt Eldimashki", src: "/clients/elbayt-eldimashki.png", width: 2752, height: 1322 },
  { name: "Fried",             src: "/clients/fried.png",             width: 1932, height: 1072 },
  { name: "Lartisan",          src: "/clients/lartisan.png",          width: 4094, height: 1392 },
  { name: "Panini Grill",      src: "/clients/panini-grill.png",      width: 899,  height: 983  },
  { name: "Parigini",          src: "/clients/parigini.png",          width: 508,  height: 136  },
  { name: "Room 21",           src: "/clients/room-21.png",           width: 348,  height: 301  },
  { name: "Sea View 360",      src: "/clients/sea-view-360.png",      width: 1432, height: 584  },
];
