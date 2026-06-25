// Partner integrations rendered by the EcosystemRadial component.
//
// Each entry maps a partner to its role label and the SVG file in
// /public/logos/. `angle` is the position around the central check
// measured in degrees, clockwise from 12-o'clock. The visual canvas
// expects 4–6 entries arranged with good rotational symmetry.

export type IntegrationRoleKey =
  | "foodDelivery"
  | "paymentIntegration"
  | "integratedScale"
  | "deliveryApp"
  | "stockErp";

export type Integration = {
  slug: string;
  /** Display name — shown under the logo in the tile. */
  name: string;
  /** Role / category translation key — resolved by the consumer via
   *  `useTranslations("integrations.role").(roleKey)`. */
  roleKey: IntegrationRoleKey;
  /** SVG path under /public/logos/. */
  logo: string;
  /** Position angle on the orbit, degrees clockwise from 12 o'clock. */
  angle: number;
  /** Brand color tint applied to the partner tile background so each
   *  card reads as that partner's surface, not a generic white box.
   *  Use a low-saturation hex — the tile gradient blends it with paper
   *  so brand presence is felt without screaming. */
  brandColor: string;
  /** Optional vertical nudge for the logo, in percentage of its
   *  rendered height. Negative = up, positive = down. Use when a
   *  logo's visual center-of-mass differs from its SVG geometric
   *  centre (e.g. logos with heavy top elements + empty bottom
   *  whitespace). Defaults to 0. */
  logoOffsetY?: number;
};

// Angles deliberately break a clockface — 60–80° gaps (not a uniform 72°)
// so the ecosystem reads as composed rather than mechanically distributed.
// Ordered clockwise from 12.
// brandColor MUST match the colored backplate baked into each logo
// SVG. When the tile renders in this exact color, the logo's own
// backplate dissolves into the tile and only the central mark
// remains visible — the logo "merges" with the surface, no chip,
// no rigid container.
//
// Reference (sampled from /public/logos/*.svg):
//   • Yassir   backplate = #6316db  (cls-4 rect)
//   • CMI      backplate = #f9f3f3  (cls-2 rect — off-white)
//   • Brehm    backplate = #ffffff  (cls-3 rect — white)
//   • Glovo    no backplate (transparent); use Glovo's brand yellow
//   • Odoo     backplate = #a24689  (cls-1 rect)
export const INTEGRATIONS: Integration[] = [
  {
    slug: "yassir",
    name: "Yassir",
    roleKey: "foodDelivery",
    logo: "/logos/yassir.svg",
    angle: 350, // just left of top
    brandColor: "#6316db",
  },
  {
    slug: "cmi",
    name: "CMI",
    roleKey: "paymentIntegration",
    logo: "/logos/cmi.svg",
    angle: 70, // upper-right
    brandColor: "#f9f3f3",
    // The CMI mark concentrates its visual weight in the upper half
    // (CMI wordmark + red triangle). Geometric centering reads as
    // sitting too low against the other partner tiles. Nudge up.
    logoOffsetY: -10,
  },
  {
    slug: "brehm",
    name: "Brehm",
    roleKey: "integratedScale",
    logo: "/logos/brehm.svg",
    angle: 150, // lower-right
    brandColor: "#ffffff",
  },
  {
    slug: "glovo",
    name: "Glovo",
    roleKey: "deliveryApp",
    logo: "/logos/glovo.svg",
    angle: 215, // lower-left
    brandColor: "#ffc333",
  },
  {
    slug: "odoo",
    name: "Odoo",
    roleKey: "stockErp",
    logo: "/logos/odoo.svg",
    angle: 290, // upper-left
    brandColor: "#a24689",
  },
];
