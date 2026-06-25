"use client";

// Premium ecosystem radial — the official Caisse Manager brand mark at the
// center, surrounded by partner integration tiles on a radial orbit.
//
// Brand asset
// ─────────
// The centerpiece renders the OFFICIAL brand SVG (the same vector path that
// lives in /public/logo/cm-logo.svg) inlined so its color matches the rest
// of the site (#E11D2A) rather than the file's baked-in #ff0000. No
// approximation, no library icon, no redrawn stroke — this is the brand
// mark, presented as a brand moment.
//
// Composition layers (back-to-front)
// ─────────────────
//   1. Hub bloom              — soft warm-red dome behind the disc
//   2. Sonar rings            — two expanding brand-tinted rings
//   3. Connection arcs        — quadratic-Bezier strokes, partner → center
//   4. Traveling pulses       — brand-red dots flowing each arc
//   5. Arrival flash          — soft brand-red halo pulsing at the hub
//   6. Outer presentation ring— hairline brand ring framing the disc
//   7. Central disc           — light-glass platform with layered shadows
//   8. Brand mark             — official SVG path, brand-red, soft glow
//   9. Partner tiles          — light paper cards, lift on hover
//
// Motion
// ──────
// All entrance motion uses Apple-grade curves (cubic-bezier(0.22,1,0.36,1)
// for the natural-feeling decel + the [0.32,0.72,0,1] brand curve for the
// brand-led moments). Entrance is staggered, directional, and crisp:
//   • central disc scales up with a slight overshoot
//   • each partner tile slides in FROM its polar direction (outside → in)
//   • arc strokes draw partner → center as the tile arrives
//   • pulse dots + sonar begin only after the composition has settled
// Continuous motion (breath, drift, pulse) is gated on
// prefers-reduced-motion — under reduced motion only the static
// composition renders.

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { INTEGRATIONS, type Integration } from "@/data/integrations";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const BRAND_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const BRAND_RED = "#E11D2A";

// (The official brand-mark SVG path used to live here as the central
// element. It's been replaced by /3d/cm-brand-object-2.png — a fully
// rendered 3D version of the same mark — so the central hub feels
// like a brand object rather than a flat icon on a glass disc.)

// ─── Layout constants (% of the 100×100 SVG viewBox) ──────────────────
// Tightened orbit (38 → 34) so the hub and partners read as a coherent
// system rather than four cards stranded in the corners. Hub-end inset
// raised in step so the arcs still terminate just outside the (smaller)
// central disc.
const TILE_ORBIT_RADIUS_PCT = 34; // distance from center to each tile center
const ARC_TILE_INSET_PCT = 7;     // arc starts inset from tile center
const ARC_RING_PCT = 10;          // arc ends just outside the central ring
// Outer compass ring — barely-perceptible hairline circle the partner
// orbit appears to ride on, with a 1-pp tick at each partner angle. It's
// the kind of detail Apple uses on Watch face dials: not decorative, but
// it makes the layout feel deliberate.
const COMPASS_RING_PCT = 44;

/** Polar → percent. angle measured clockwise from 12 o'clock. */
function polar(angleDeg: number, radiusPct: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: 50 + radiusPct * Math.sin(rad),
    y: 50 - radiusPct * Math.cos(rad),
  };
}

/** Quadratic curve from a → b with a gentle inward bend 30% past midpoint. */
function curve(ax: number, ay: number, bx: number, by: number): string {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const cx = mx + (bx - mx) * 0.3;
  const cy = my + (by - my) * 0.3;
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}

/** Arc path from partner → center (used for the pulse-dot motion). */
function arcPath(integration: Integration): string {
  const a = polar(integration.angle, TILE_ORBIT_RADIUS_PCT - ARC_TILE_INSET_PCT);
  const b = polar(integration.angle, ARC_RING_PCT);
  return curve(a.x, a.y, b.x, b.y);
}

export function EcosystemRadial() {
  const reduce = useReducedMotion();

  // Precompute partner geometry once — the polar math is cheap, but
  // memoizing keeps the JSX read clean.
  const partners = useMemo(
    () =>
      INTEGRATIONS.map((integration, index) => {
        const tilePos = polar(integration.angle, TILE_ORBIT_RADIUS_PCT);
        const startPos = polar(integration.angle, TILE_ORBIT_RADIUS_PCT + 14);
        return { integration, index, tilePos, startPos };
      }),
    [],
  );

  return (
    <div className="relative w-full aspect-square max-w-[680px] mx-auto">
      {/* ── Layer 1 · Hub bloom ──────────────────────────────────────
            Soft warm-red dome that anchors the disc. Sits well below
            everything else and is wider than the disc so the bleed
            reads as ambient, not as a hard halo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
        style={{
          width: "44%",
          aspectRatio: "1 / 1",
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(225,29,42,0.20) 0%, rgba(225,29,42,0.07) 38%, rgba(225,29,42,0) 78%)",
          filter: "blur(36px)",
        }}
      />

      {/* ── Layer 2 · Sonar rings ────────────────────────────────────
            Two expanding brand-tinted rings, slow enough to read as
            ambient rather than animated. Suppressed under reduced
            motion. */}
      {!reduce && (
        <>
          <span
            aria-hidden
            className="ecosystem-sonar"
            style={{ left: "50%", top: "50%" }}
          />
          <span
            aria-hidden
            className="ecosystem-sonar ecosystem-sonar-2"
            style={{ left: "50%", top: "50%" }}
          />
        </>
      )}

      {/* ── Layer 2.5 · Compass ring ───────────────────────────────
            Hairline circle the partner orbit rides on, with a 1-pp tick
            at each partner angle. Drawn before arcs/pulses so it sits
            behind them in z-order. Entire layer fades in once the
            composition has settled. */}
      <motion.svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? 1 : 1 }}
        transition={{
          duration: reduce ? 0 : 0.8,
          ease: APPLE_EASE,
          delay: reduce ? 0 : 1.2,
        }}
      >
        <circle
          cx="50"
          cy="50"
          r={COMPASS_RING_PCT}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="0.12"
          vectorEffect="non-scaling-stroke"
        />
        {INTEGRATIONS.map((integration) => {
          const inner = polar(integration.angle, COMPASS_RING_PCT - 1.2);
          const outer = polar(integration.angle, COMPASS_RING_PCT + 1.2);
          return (
            <line
              key={`tick-${integration.slug}`}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(225,29,42,0.40)"
              strokeWidth="0.22"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </motion.svg>

      {/* ── Layer 3+4 · Connection arcs + traveling pulses ─────────── */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          {/* Arc gradient — fades from a soft paper-white at the
              partner end to warm brand at the hub end, so on the dark
              section background the visual flow still reads as
              partner data → Caisse Manager. */}
          <linearGradient id="ecosystem-arc-gradient">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="50%" stopColor="rgba(225,29,42,0.42)" />
            <stop offset="100%" stopColor="rgba(225,29,42,0.85)" />
          </linearGradient>
          {/* Pulse-dot soft glow — applied to the traveling dot so it
              reads as a moving spark rather than a flat circle. */}
          <radialGradient id="ecosystem-pulse-glow">
            <stop offset="0%" stopColor={BRAND_RED} stopOpacity="0.7" />
            <stop offset="60%" stopColor={BRAND_RED} stopOpacity="0.18" />
            <stop offset="100%" stopColor={BRAND_RED} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Static arc strokes — slightly thicker now (0.28 non-scaling)
            so the connection reads at the section's scale without
            looking decorative. */}
        {INTEGRATIONS.map((integration, i) => (
          <motion.path
            key={`arc-${integration.slug}`}
            d={arcPath(integration)}
            stroke="url(#ecosystem-arc-gradient)"
            strokeWidth="0.28"
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: reduce ? 0 : 0.7,
              ease: APPLE_EASE,
              delay: reduce ? 0 : 0.7 + i * 0.08,
            }}
          />
        ))}

        {/* Traveling pulse dots — partner → center, continuous loop.
            Each dot has a soft glow halo (larger circle with the
            radial-gradient fill) so it reads as light rather than a
            point. SMIL animateMotion is what PlatformSection uses;
            kept here for both consistency and smoother path-following
            than any JS easing could achieve. */}
        {!reduce &&
          INTEGRATIONS.map((integration, i) => (
            <g key={`pulse-${integration.slug}`}>
              {/* Soft halo trailing the dot */}
              <circle r="1.8" fill="url(#ecosystem-pulse-glow)">
                <animateMotion
                  dur="4.2s"
                  repeatCount="indefinite"
                  begin={`${1.4 + i * 0.7}s`}
                  path={arcPath(integration)}
                />
                <animate
                  attributeName="opacity"
                  values="0;0.9;0.9;0"
                  keyTimes="0;0.15;0.85;1"
                  dur="4.2s"
                  repeatCount="indefinite"
                  begin={`${1.4 + i * 0.7}s`}
                />
              </circle>
              {/* The bright pulse dot itself */}
              <circle r="0.55" fill={BRAND_RED}>
                <animateMotion
                  dur="4.2s"
                  repeatCount="indefinite"
                  begin={`${1.4 + i * 0.7}s`}
                  path={arcPath(integration)}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.12;0.88;1"
                  dur="4.2s"
                  repeatCount="indefinite"
                  begin={`${1.4 + i * 0.7}s`}
                />
              </circle>
            </g>
          ))}
      </svg>

      {/* ── Layer 7+8 · Central anchor — the brand moment ──────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: reduce ? 0 : 0.85,
          ease: BRAND_EASE,
          delay: reduce ? 0 : 0.1,
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <CentralAnchor reduce={!!reduce} />
      </motion.div>

      {/* ── Layer 9 · Partner tiles ─────────────────────────────────
            Each tile slides in FROM its outer polar position toward
            its final orbit position — so the composition assembles
            in a way that feels deliberate (drawn into the orbit),
            not just faded into place. */}
      {partners.map(({ integration, index, tilePos, startPos }) => (
        <PartnerTile
          key={integration.slug}
          integration={integration}
          index={index}
          x={tilePos.x}
          y={tilePos.y}
          startX={startPos.x}
          startY={startPos.y}
          reduce={!!reduce}
        />
      ))}
    </div>
  );
}

// ── Central anchor ────────────────────────────────────────────────────

function CentralAnchor({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -3, 0] }}
      transition={
        reduce
          ? undefined
          : { duration: 8.5, ease: "easeInOut", repeat: Infinity }
      }
      className="relative will-change-transform"
    >
      {/* The hub — now a free-floating 3D brand object instead of a
          framed disc. The cube ships as a PNG with baked-in lighting
          and a transparent background, so it sits naturally on the
          atmospheric backdrop without needing a glass plate.
          Sized one tier UP from the prior disc so the cube has the
          volumetric presence the framed mark used to fake. */}
      <div className="relative h-[160px] w-[160px] md:h-[200px] md:w-[200px] flex items-center justify-center">
        <Image
          src="/3d/cm-brand-object-2.png"
          alt="Caisse Manager brand object"
          width={400}
          height={400}
          priority
          className="relative h-full w-full object-contain"
          style={{
            filter:
              "drop-shadow(0 28px 56px rgba(225,29,42,0.36)) drop-shadow(0 10px 22px rgba(20,15,40,0.18))",
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Partner tile ──────────────────────────────────────────────────────

function PartnerTile({
  integration,
  index,
  x,
  y,
  startX,
  startY,
  reduce,
}: {
  integration: Integration;
  index: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  reduce: boolean;
}) {
  // Slight per-tile breath, irrationally offset periods so the
  // composition never lands in perfect lockstep.
  const breathPeriod = 7.2 + (index % 4) * 0.6;
  // Convert percent-space delta into a CSS translate the entrance can
  // start from — each tile enters from its polar-outward direction.
  const entranceFromX = startX - x;
  const entranceFromY = startY - y;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: `${entranceFromX}%`,
        y: `${entranceFromY}%`,
        scale: 0.94,
      }}
      animate={{ opacity: 1, x: "0%", y: "0%", scale: 1 }}
      transition={{
        duration: reduce ? 0 : 0.85,
        ease: APPLE_EASE,
        delay: reduce ? 0 : 0.45 + index * 0.09,
      }}
      whileHover={reduce ? undefined : { scale: 1.035, y: -4 }}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        translateX: "-50%",
        translateY: "-50%",
      }}
      className="absolute will-change-transform"
    >
      {/* Continuous breath nested inside — keeps the entrance crisp
          while letting the long-term motion live on its own track.
          Each tile now wears its partner's brand color in full:
            • the card surface IS the brand color (Odoo purple, CMI
              navy, Glovo yellow…), gradient-lifted top → bottom for
              depth.
            • a small white logo chip sits inside so the mark stays
              legible regardless of the tile color.
            • name + role text auto-adapts to the brand luminance —
              paper on dark tiles, ink on light tiles. */}
      <motion.div
        animate={reduce ? undefined : { y: [0, -2.5, 0] }}
        transition={
          reduce
            ? undefined
            : { duration: breathPeriod, ease: "easeInOut", repeat: Infinity }
        }
        className="group relative rounded-[18px] w-[132px] md:w-[152px] transition-shadow duration-300"
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* Outer ambient halo — the tile bleeds its brand color into
            the surrounding dark canvas. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[26px]"
          style={{
            background: `radial-gradient(60% 60% at 50% 50%, ${hexToRgba(integration.brandColor, 0.42)} 0%, ${hexToRgba(integration.brandColor, 0.10)} 55%, ${hexToRgba(integration.brandColor, 0)} 85%)`,
            filter: "blur(10px)",
          }}
        />

        {/* The card itself — SOLID brand color, no vertical gradient.
            A gradient on the tile would make the logo's solid-color
            backplate visible as a distinct rectangle inside (lighter-
            top vs. solid-backplate vs. darker-bottom). Solid color
            means the backplate dissolves perfectly into the surface.
            Depth comes from the outer halo, drop shadow, and a single
            top-rim white highlight — never from a vertical wash. */}
        <div
          className="relative rounded-[18px] px-3.5 py-4 md:px-4 md:py-5 overflow-hidden"
          style={{
            background: integration.brandColor,
            boxShadow: `0 0 0 1px ${darkenHex(integration.brandColor, 0.12)}, 0 12px 28px -10px ${hexToRgba(integration.brandColor, 0.55)}, 0 24px 40px -18px rgba(0,0,0,0.55), inset 0 1px 0 ${hexToRgba("#ffffff", 0.18)}`,
          }}
        >
          {/* Logo — sits directly on the brand surface, no chip, no
              container. Each logo SVG ships with its own brand-color
              backplate; the tile color (brandColor in the data file)
              is set to MATCH that backplate exactly, so the logo's
              backplate dissolves into the tile and only the central
              mark remains visible. The logo IS the surface.
              An optional per-integration logoOffsetY nudges the mark
              vertically when the SVG's geometric centre doesn't match
              the visual centre-of-mass (e.g. CMI's top-heavy layout). */}
          <div className="relative h-14 md:h-16 -mx-2 flex items-center justify-center">
            <Image
              src={integration.logo}
              alt={integration.name}
              width={160}
              height={160}
              unoptimized
              className="relative h-full w-auto object-contain"
              style={
                integration.logoOffsetY
                  ? { transform: `translateY(${integration.logoOffsetY}%)` }
                  : undefined
              }
            />
          </div>

          {/* Name + role — adaptive color tied to the tile's
              luminance. Light tiles (Glovo yellow) get ink text;
              dark tiles (CMI navy, Odoo mauve) get paper text. */}
          <div className="relative mt-3 text-center">
            <p
              className="text-[12px] md:text-[13px] font-semibold tracking-[-0.012em] leading-tight"
              style={{ color: textOn(integration.brandColor) }}
            >
              {integration.name}
            </p>
            <p
              className="mt-1 text-[9.5px] md:text-[10px] uppercase tracking-[0.14em] leading-tight"
              style={{ color: subTextOn(integration.brandColor) }}
            >
              <IntegrationRole roleKey={integration.roleKey} />
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Color helpers for brand-painted PartnerTile ──────────────────────
//
// The tile surface IS the partner's brand color, so we need cheap
// derivations to:
//   • brighten the top edge + darken the bottom edge for material depth
//   • derive the rim stroke as a deeper shade of the brand
//   • pick text + sub-text color via relative luminance so Glovo yellow
//     gets ink text and CMI navy gets paper text — both readable on
//     their own surface.

function parseHex(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Mix the color toward black by `amount` (0..1). */
function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const f = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/** Relative luminance (W3C-style, simplified). 0 = black, 1 = white. */
function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Primary text color for content sitting on `hex`. */
function textOn(hex: string): string {
  return luminance(hex) > 0.62 ? "#1d1d1f" : "#ffffff";
}

/** Secondary text color for content sitting on `hex` — slightly
 *  dimmer than the primary so the role label recedes. */
function subTextOn(hex: string): string {
  return luminance(hex) > 0.62
    ? "rgba(29,29,31,0.62)"
    : "rgba(255,255,255,0.70)";
}


// Re-export the integration list for callers that want a parallel
// legend or footer pulling from the same data source.
export { INTEGRATIONS } from "@/data/integrations";

// Tiny component so the role string passes through next-intl. Kept
// inline (not exported) — the parent tile is the only consumer.
function IntegrationRole({
  roleKey,
}: {
  roleKey: Integration["roleKey"];
}) {
  const t = useTranslations("integrations.role");
  return <>{t(roleKey)}</>;
}
