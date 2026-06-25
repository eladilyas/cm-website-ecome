"use client";

import { useReducedMotion } from "framer-motion";

// Premium footer atmosphere — REPLACES the literal world-map backdrop.
//
// Design thesis (per brief): "atmosphere, not map".
//
// The first cut of this layer rendered ~250 land dots in an equirectangular
// projection with six brand-red presence pins. Even at 8% opacity that
// read as "world map with markers" — a dashboard visualization, not a
// luxury closing scene. This component throws that out and rebuilds the
// surface as ambient light.
//
// Layer stack (rendered back-to-front by the parent Footer):
//
//   ┌─ ambient gradient mesh ────────────────────────────────────────┐
//   │  Three overlapping radial gradients fake a volumetric light    │
//   │  source. Brand red is here as a soft bloom in one corner — the │
//   │  ONLY place red appears on the surface, and it's diffused into  │
//   │  the air, not stamped as a marker.                              │
//   └─────────────────────────────────────────────────────────────────┘
//   ┌─ vignette ─────────────────────────────────────────────────────┐
//   │  Pulls outer edges back toward deep graphite. Gives the         │
//   │  composition a centre of gravity.                               │
//   └─────────────────────────────────────────────────────────────────┘
//   ┌─ connection threads ───────────────────────────────────────────┐
//   │  Four near-invisible 1px lines between adjacent nodes. No       │
//   │  animation, no travelling pulses — just the suggestion that     │
//   │  the constellation is one network. Drawn BEFORE the nodes so    │
//   │  endpoints disappear under the node glow.                       │
//   └─────────────────────────────────────────────────────────────────┘
//   ┌─ constellation of nodes ───────────────────────────────────────┐
//   │  ~10 soft glowing dots at AESTHETIC positions (NOT geographic). │
//   │  Each is a small white core + radial halo. Three pulse with a   │
//   │  fade-only animation on a 14s cycle — subconscious motion,      │
//   │  the kind you only notice if you stop and look.                 │
//   └─────────────────────────────────────────────────────────────────┘
//
// Why divs not SVG circles for the nodes:
//   SVG circles inside a viewBox with `preserveAspectRatio="none"` get
//   stretched into ellipses by the actual footer aspect ratio. Using
//   absolute-positioned divs sized in CSS pixels keeps every halo a
//   perfect circle regardless of how wide or short the footer renders.
//
// Why SVG for the threads:
//   Lines between two percent-positioned points are easy in SVG and
//   genuinely awkward with rotated divs. `vector-effect="non-scaling-
//   stroke"` keeps the 1px stroke crisp even when the viewBox is
//   stretched by `preserveAspectRatio="none"`.

type Node = {
  /** % of surface width  */ cx: number;
  /** % of surface height */ cy: number;
  /** Render a slow pulse halo on this node. */
  pulse?: boolean;
};

// Hand-placed for visual rhythm. Three informal clusters, slightly
// off-balance toward the upper half so the dense legal/social strip
// at the bottom is left clean. Numbers chosen by eye, not formula.
const NODES: ReadonlyArray<Node> = [
  // Upper-left cluster
  { cx: 11, cy: 22, pulse: true },
  { cx: 19, cy: 34 },
  { cx: 8, cy: 48 },

  // Mid-band drift
  { cx: 29, cy: 28 },
  { cx: 38, cy: 17, pulse: true },

  // Right-side cluster
  { cx: 58, cy: 23 },
  { cx: 66, cy: 38 },
  { cx: 74, cy: 20 },
  { cx: 82, cy: 32, pulse: true },
  { cx: 90, cy: 17 },
];

// Pairs of node indices to wire with a faint thread. Picked so each
// line connects nodes inside the same visual cluster — avoids the
// "global routing diagram" feel that comes from long cross-canvas
// lines.
const THREADS: ReadonlyArray<readonly [number, number]> = [
  [0, 4], // upper-left → mid-band drift (long, the only "spanning" line)
  [1, 3], // intra-cluster
  [5, 7], // right cluster top
  [6, 8], // right cluster diagonal
];

// Halo + core sizes in CSS pixels. Same for every node — the "feature"
// node would be a marker again; we want a constellation, not a map key.
const HALO_PX = 56;
const CORE_PX = 3;

export function AtmosphereBackdrop() {
  const reduce = useReducedMotion();

  return (
    <>
      {/* ── Layer 1 · Ambient gradient mesh ─────────────────────────
          Three overlapping radials. The brand-red bloom in the bottom-
          left is the ONLY red on the surface and it appears as diffuse
          light — there's no edge, no marker, no shape. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(70% 60% at 8% 100%, rgba(225,29,42,0.11) 0%, rgba(225,29,42,0) 55%)",
            "radial-gradient(60% 70% at 95% 5%, rgba(80,110,160,0.09) 0%, rgba(80,110,160,0) 60%)",
            "radial-gradient(120% 100% at 50% -10%, rgba(45,55,75,0.32) 0%, rgba(10,11,13,0) 60%)",
          ].join(", "),
        }}
      />

      {/* ── Layer 2 · Vignette ───────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 80% at 50% 50%, rgba(10,11,13,0) 50%, rgba(0,0,0,0.40) 100%)",
        }}
      />

      {/* ── Layer 3 · Connection threads ─────────────────────────────
          Drawn with `vector-effect: non-scaling-stroke` so the 1px line
          stays crisp even as the viewBox is stretched by the footer's
          aspect. No animation. */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="thread-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {THREADS.map(([a, b], i) => {
          const A = NODES[a];
          const B = NODES[b];
          return (
            <line
              key={i}
              x1={A.cx}
              y1={A.cy}
              x2={B.cx}
              y2={B.cy}
              stroke="url(#thread-gradient)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* ── Layer 4 · Constellation of nodes ────────────────────────
          One container per node — anchor at (cx%, cy%), halo and core
          are absolute children translated to the anchor's center. */}
      {NODES.map((n, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute"
          style={{ left: `${n.cx}%`, top: `${n.cy}%`, width: 0, height: 0 }}
        >
          {/* Halo — soft, always present */}
          <div
            className="absolute rounded-full"
            style={{
              width: HALO_PX,
              height: HALO_PX,
              left: -HALO_PX / 2,
              top: -HALO_PX / 2,
              background:
                "radial-gradient(closest-side, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0) 70%)",
            }}
          />
          {/* Slow fade pulse — fade-only, no scale change. Each pulsing
              node staggered so the eye never catches a "wave" pattern. */}
          {n.pulse && !reduce && (
            <div
              className="absolute rounded-full"
              style={{
                width: HALO_PX,
                height: HALO_PX,
                left: -HALO_PX / 2,
                top: -HALO_PX / 2,
                background:
                  "radial-gradient(closest-side, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 65%)",
                animation: `atmosphere-pulse 14s ease-in-out ${i * 1.7}s infinite`,
              }}
            />
          )}
          {/* Core */}
          <div
            className="absolute rounded-full"
            style={{
              width: CORE_PX,
              height: CORE_PX,
              left: -CORE_PX / 2,
              top: -CORE_PX / 2,
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 0 6px rgba(255,255,255,0.35)",
            }}
          />
        </div>
      ))}
    </>
  );
}
