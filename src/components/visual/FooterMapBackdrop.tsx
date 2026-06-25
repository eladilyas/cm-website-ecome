"use client";

// Footer atmospheric backdrop — stylized Morocco silhouette with soft
// brand-red presence dots representing client installations across the
// country.
//
// Design thesis: communicate "we're everywhere in Morocco" through a
// visual that reads as light + presence rather than as a data viz.
// The map is heavily blurred (~24px) and rendered at low opacity
// (~16%), so the silhouette is felt rather than read. Red presence
// dots get a lighter blur + a soft glow so they punctuate the surface
// without becoming a dashboard.
//
// Layer stack (back → front):
//   1. Ambient gradient mesh — three overlapping radial blooms tinted
//      with a corner of brand red. Gives the surface volumetric depth
//      so the map sits in lit atmosphere, not on flat charcoal.
//   2. Morocco silhouette — filled + outlined, heavily blurred so the
//      country reads as a shape, not a chart.
//   3. Presence dots — 11 city positions, each a soft red bloom plus
//      a brighter pin core. Lightly blurred — visible but never crisp.
//   4. Top reading scrim — radial fade so the upper third of the
//      footer is darker, ensuring the editorial copy + columns stay
//      readable against the backdrop.
//
// All layers are pointer-events: none and aria-hidden. Zero motion —
// the surface is intentionally static so the closing chapter reads
// as a single composed moment.

const SURFACE = "#0a0a0d";

// Major Moroccan cities as approximate (x, y) percentages on the
// 100×100 viewBox the silhouette uses. Picked to spread evenly
// across the country so the dots read as "national presence" rather
// than a cluster on the coast.
const PRESENCE_DOTS: { x: number; y: number; size: number }[] = [
  { x: 14, y: 34, size: 1.6 }, // Casablanca — biggest dot, biggest city
  { x: 17, y: 27, size: 1.1 }, // Rabat
  { x: 19, y: 12, size: 1.0 }, // Tangier
  { x: 26, y: 14, size: 0.9 }, // Tetouan
  { x: 32, y: 22, size: 1.1 }, // Fes
  { x: 27, y: 23, size: 0.9 }, // Meknes
  { x: 22, y: 47, size: 1.3 }, // Marrakech
  { x: 14, y: 58, size: 1.0 }, // Agadir
  { x: 60, y: 19, size: 1.0 }, // Oujda
  { x: 47, y: 16, size: 0.8 }, // Nador
  { x: 20, y: 78, size: 0.9 }, // Laayoune
];

// Stylized Morocco silhouette — a generalized outline that reads as
// the country at a glance under heavy blur. Not a cartographic
// projection; tuned for visual presence.
const MOROCCO_PATH = `
  M 14 12
  C 16 9, 22 7, 28 9
  L 38 9
  C 48 8, 58 8, 68 12
  C 73 13, 76 16, 78 22
  C 82 30, 86 40, 90 54
  C 92 66, 92 76, 88 86
  C 84 92, 76 94, 64 94
  L 42 92
  C 32 92, 24 88, 18 80
  C 12 70, 8 58, 6 44
  C 5 32, 6 22, 10 16
  Z
`;

export function FooterMapBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ backgroundColor: SURFACE }}
    >
      {/* Layer 1 — ambient gradient mesh. Three diffused radial
          blooms that give the surface a sense of volumetric depth
          before the map appears on top. Brand red is here only as a
          quiet bloom in the lower-right so the map dots feel like
          they're sitting in coherent lighting. */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(60% 60% at 75% 72%, rgba(225,29,42,0.10) 0%, rgba(225,29,42,0) 70%)",
            "radial-gradient(50% 60% at 18% 28%, rgba(70,90,140,0.10) 0%, rgba(70,90,140,0) 70%)",
            "radial-gradient(80% 80% at 50% 100%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 70%)",
          ].join(", "),
        }}
      />

      {/* Layer 2 — the Morocco silhouette. Heavily blurred so the
          country is a felt presence, not a data overlay. Positioned
          to the right side of the footer with a generous size so the
          shape extends past the viewport edges (the cropping makes
          it feel atmospheric, like a planet on the horizon). */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute"
        style={{
          // Sized to dominate the right half of the footer. On wider
          // viewports the map drifts farther right; on mobile it
          // centers gently so the silhouette is still recognizable.
          width: "min(85vw, 1100px)",
          height: "min(85vw, 1100px)",
          right: "-12%",
          top: "50%",
          transform: "translateY(-46%)",
          opacity: 0.18,
          filter: "blur(24px)",
        }}
      >
        <defs>
          <radialGradient id="footer-map-fill" cx="50%" cy="48%" r="58%">
            <stop offset="0%" stopColor="#fdf1f2" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#cfd2da" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#cfd2da" stopOpacity="0.10" />
          </radialGradient>
        </defs>
        <path
          d={MOROCCO_PATH}
          fill="url(#footer-map-fill)"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
      </svg>

      {/* Layer 3 — presence dots. Same viewBox as the silhouette so
          dot positions stay locked to the country shape. Lightly
          blurred so they punctuate without becoming pixel-precise
          markers. Each dot is a soft outer halo plus a brighter
          core, producing a "lit pin" feel against the blurred
          country backdrop. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute"
        style={{
          width: "min(85vw, 1100px)",
          height: "min(85vw, 1100px)",
          right: "-12%",
          top: "50%",
          transform: "translateY(-46%)",
          opacity: 0.85,
          filter: "blur(1.2px)",
        }}
      >
        {PRESENCE_DOTS.map((d, i) => (
          <g key={i}>
            {/* Outer halo — wide brand-red bloom */}
            <circle
              cx={d.x}
              cy={d.y}
              r={d.size * 2.6}
              fill="rgba(225,29,42,0.18)"
            />
            {/* Mid halo — tighter bloom */}
            <circle
              cx={d.x}
              cy={d.y}
              r={d.size * 1.5}
              fill="rgba(225,29,42,0.35)"
            />
            {/* Core — the pin itself */}
            <circle cx={d.x} cy={d.y} r={d.size * 0.55} fill="#E11D2A" />
          </g>
        ))}
      </svg>

      {/* Layer 4 — top reading scrim. A vertical wash that darkens the
          upper portion of the footer so the editorial copy + column
          links stay readable against the map without the map needing
          to be even more muted. */}
      <div
        className="absolute inset-x-0 top-0 h-[55%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,11,13,0.85) 0%, rgba(10,11,13,0.55) 50%, rgba(10,11,13,0) 100%)",
        }}
      />
    </div>
  );
}
