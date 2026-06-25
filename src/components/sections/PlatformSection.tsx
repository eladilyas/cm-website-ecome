"use client";

// "Every device. One system." — premium ecosystem composition.
//
// One hub. Seven satellites. One ground line. One pulse cadence.
//
// Canvas geometry — 16:9, max-w 1100px so the entire composition fits in
// a single viewport without scroll, even on a typical 1080-px laptop:
//
//   Row 1 (top tiles, KDS · Customer display)         y = 14
//   Row 2 (hardware ground line)                       y = 63.33
//        Heron (x=14) — Hub Swan 1 (x=50) — Swift (x=86)
//   Row 3 (bottom tiles, QR · Queue · TPE)             y = 86
//
// Consistent scaling logic:
//   • Hub is 2.5 × the width of either device satellite (15% canvas-width
//     vs 6%). Same ratio both sides — no random sizing.
//   • Heron and Swift use the SAME width (6%) and natural device heights
//     based on their real aspect ratios. They share a ground line with
//     the hub at y=63.33 so the eye reads three devices on one counter,
//     not three drifting centers.
//   • All software tile badges are identical (56×56 px).
//
// Hub centering — non-negotiable:
//   • Hub center is at EXACTLY (50, 50). Every other element is positioned
//     relative to that anchor. This was the root cause of the "POS not
//     centered" feedback: the previous version had visualTop=49.65 which
//     shifted the hub barely-but-visibly above center, and the device row
//     ground-aligned to a y=63 that was 0.35% off from the hub-derived
//     ground. Locking the hub to (50, 50) and recomputing each device's
//     visualTop from a single ground line (50 + hub_half_h = 63.33) eliminates
//     all drift.
//   • Hub halo + sonar are the visual cues; no chrome under the device.
//
// Caption discipline:
//   • Pure typography — no backdrop chrome. Each caption is positioned
//     close enough to its visual to read as a label, far enough that no
//     text sits over imagery.
//   • Hub caption: 3 lines (THE CORE / Swan 1 / POS terminal).
//   • Satellite captions: 2 lines (role / name) — tighter, more compact,
//     definitively UI labels.
//   • Row 1 caption centers are offset outward (KDS to the left, Customer
//     display to the right) so the curved arcs from those badges to the
//     hub don't traverse caption text.
//   • Row 2 and row 3 captions sit directly under their visuals — arcs
//     terminate at the hub long before reaching those caption y values.
//
// Motion — calm and unified:
//   • Only the hub breathes (3 px on 10 s sine).
//   • Single inward pulse per arc, 4 s cycle, evenly staggered across the
//     7 satellites. At any moment ~1–2 pulses are in flight, never a flash.
//   • Hub sonar — two brand-red rings expanding on a 4 s loop.
//
// Section padding tuned (py-16 md:py-20) so title + canvas + chrome
// together stay within typical viewports.

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const BRAND_RED = "#E11D2A";

// ─── Module inventory ────────────────────────────────────────────────

type BaseDef = {
  key: string;
  name: string;
  role: string;
  blurb: string;
  /** Center of the visual element. */
  visualTop: number;
  visualLeft: number;
  /** Top of the caption block. */
  captionTop: number;
  /** X-center of the caption block. Defaults to visualLeft if omitted. */
  captionLeft?: number;
  z: number;
};

type DeviceDef = BaseDef & {
  type: "device";
  src: string;
  alt: string;
  imageWidthPct: number;
  isHub?: boolean;
};

type TileDef = BaseDef & {
  type: "tile";
  icon: React.ReactNode;
};

type ModuleDef = DeviceDef | TileDef;

// Anchor: Hub center at EXACTLY (50, 50). Every other device's vertical
// position is derived so that all three hardware images share the same
// ground line at HUB_GROUND_Y = 50 + 15 × (16/9) / 2 ≈ 63.33.  The math is
// expressed in plain numbers below — fudging any of these breaks the
// "POS perfectly centered" invariant.
const MODULES: ModuleDef[] = [
  // ─── Row 1 — top tiles ───────────────────────────────────────
  // Caption centers offset outward (KDS left, Customer Display right) so
  // they sit outside the arc path from badge to hub.
  {
    key: "kds",
    type: "tile",
    name: "KDS",
    role: "Kitchen display",
    blurb: "Tickets fire live",
    visualTop: 14,
    visualLeft: 32,
    captionTop: 22,
    captionLeft: 26,
    z: 15,
    icon: <KdsIcon />,
  },
  {
    key: "customer-display",
    type: "tile",
    name: "Customer display",
    role: "Live order screen",
    blurb: "Show what you ring",
    visualTop: 14,
    visualLeft: 68,
    captionTop: 22,
    captionLeft: 74,
    z: 15,
    icon: <DisplayIcon />,
  },

  // ─── Row 2 — hardware ground line at y=63.33 ─────────────────
  // Hub center is locked to (50, 50). Heron and Swift centers are derived
  // from a single shared ground line at HUB_GROUND_Y so all three device
  // bottoms align pixel-perfectly to the eye. Same width (6%) for both
  // satellite devices = same horizontal mass either side of the hub.

  // Heron 1: aspect ≈ 1:2.13 → at width 6% on 16:9 canvas, height ≈ 22.72%.
  // bottom y=63.33 → center y = 63.33 - 22.72/2 ≈ 51.97.
  {
    key: "heron-1",
    type: "device",
    name: "Heron 1",
    role: "Self-order kiosk",
    blurb: "Customers order themselves",
    src: "/hardware/heron-1.webp",
    alt: "Heron 1 self-order kiosk",
    imageWidthPct: 6,
    visualTop: 51.97,
    visualLeft: 14,
    captionTop: 70,
    z: 20,
  },
  // Swan 1 hub: aspect 1:1 → at width 15% on 16:9 canvas, height ≈ 26.67%.
  // visualTop = 50 EXACTLY. This is the anchor — do not change this number
  // without recomputing HUB_GROUND_Y and every other device's center.
  {
    key: "swan-1",
    type: "device",
    name: "Swan 1",
    role: "The core",
    blurb: "POS terminal",
    src: "/hardware/swan-1-gen-2.webp",
    alt: "Caisse Manager Swan 1 POS terminal",
    imageWidthPct: 15,
    visualTop: 50,
    visualLeft: 50,
    captionTop: 70,
    z: 30,
    isHub: true,
  },
  // Swift 2 Pro: aspect ≈ 1:1.4 → at width 6% on 16:9 canvas, height ≈ 14.93%.
  // bottom y=63.33 → center y = 63.33 - 14.93/2 ≈ 55.87.
  {
    key: "swift-2-pro",
    type: "device",
    name: "Swift 2 Pro",
    role: "Mobile POS",
    blurb: "Take orders anywhere",
    src: "/hardware/swift-2-pro.webp",
    alt: "Swift 2 Pro mobile POS handheld",
    imageWidthPct: 6,
    visualTop: 55.87,
    visualLeft: 86,
    captionTop: 70,
    z: 20,
  },

  // ─── Row 3 — bottom tiles ────────────────────────────────────
  // No caption offset needed — arcs from bottom-row badges travel UP to
  // the hub, captions sit BELOW the badges, never in the arc path.
  {
    key: "qr-menu",
    type: "tile",
    name: "QR menu",
    role: "Order from the table",
    blurb: "No app required",
    visualTop: 86,
    visualLeft: 28,
    captionTop: 93,
    z: 15,
    icon: <QrIcon />,
  },
  {
    key: "queue",
    type: "tile",
    name: "Queue manager",
    role: "Pagers · beepers",
    blurb: "Buzz when it's ready",
    visualTop: 86,
    visualLeft: 50,
    captionTop: 93,
    z: 15,
    icon: <BellIcon />,
  },
  {
    key: "tpe",
    type: "tile",
    name: "TPE intégré",
    role: "Integrated payment",
    blurb: "Card, contactless, mobile",
    visualTop: 86,
    visualLeft: 72,
    captionTop: 93,
    z: 15,
    icon: <CardIcon />,
  },
];


const HUB = MODULES.find((m) => m.type === "device" && m.isHub) as DeviceDef;
const SATELLITES = MODULES.filter(
  (m) => !(m.type === "device" && m.isHub),
);

// Bezier arc satellite → hub, 0–100 viewBox units.
function arcPath(sat: ModuleDef): string {
  const ax = sat.visualLeft;
  const ay = sat.visualTop;
  const bx = HUB.visualLeft;
  const by = HUB.visualTop;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  // Control point pulled 25% toward hub for a gentle bend.
  const cx = mx + (bx - mx) * 0.25;
  const cy = my + (by - my) * 0.25;
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}

export function PlatformSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="platform"
      data-scheme="light"
      className="relative overflow-hidden text-ink scroll-mt-24"
    >
      {/* Warm luminous wash. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(70% 70% at 50% 40%, #ffffff 0%, #fbfbfd 55%, #f0f0f3 100%)",
        }}
      />
      <SectionDivider scheme="light" />

      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-10 md:py-12">
        {/* ── Editorial text plate ──────────────────────────────────── */}
        <div className="text-center max-w-[46rem] mx-auto">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
              The platform
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-[clamp(2rem,4.6vw,3.25rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
              Every device. One system.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-[16px] md:text-[18px] leading-[1.5] text-ink-soft max-w-[40rem] mx-auto">
              Terminal, kiosk, handheld, KDS, customer display, integrated TPE,
              QR menu, queue — every surface designed to behave like one
              product.
            </p>
          </Reveal>
        </div>

        {/* ── Desktop composition ───────────────────────────────────── */}
        {/* mt + max-w tuned so [header chrome + text plate + canvas + section
            padding] sums to under ~1000px — the available height on a
            standard 1080p laptop. Canvas max-w shrunk from 1200→1100 so the
            16:9 canvas height drops from 675 → 619, recovering ~56 px of
            vertical room without losing visual scale. */}
        <div className="mt-8 md:mt-10 hidden md:block">
          <Reveal delay={0.14}>
            <div className="relative w-full max-w-[1100px] aspect-[16/9] mx-auto">
              {/* Hub halo */}
              <div
                aria-hidden
                className="absolute pointer-events-none -z-10"
                style={{
                  left: `${HUB.visualLeft}%`,
                  top: `${HUB.visualTop}%`,
                  transform: "translate(-50%, -50%)",
                  width: `${HUB.imageWidthPct * 1.8}%`,
                  aspectRatio: "1 / 1",
                  background:
                    "radial-gradient(50% 50% at 50% 50%, rgba(225,29,42,0.10) 0%, rgba(225,29,42,0) 75%)",
                  filter: "blur(36px)",
                }}
              />

              {/* Hub sonar */}
              {!reduce && (
                <>
                  <span
                    aria-hidden
                    className="ecosystem-sonar"
                    style={{
                      left: `${HUB.visualLeft}%`,
                      top: `${HUB.visualTop}%`,
                    }}
                  />
                  <span
                    aria-hidden
                    className="ecosystem-sonar ecosystem-sonar-2"
                    style={{
                      left: `${HUB.visualLeft}%`,
                      top: `${HUB.visualTop}%`,
                    }}
                  />
                </>
              )}

              {/* Arcs + single-direction inward pulses */}
              <svg
                aria-hidden
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <defs>
                  <linearGradient id="arc-gradient">
                    <stop offset="0%" stopColor="rgba(20,20,30,0.04)" />
                    <stop offset="60%" stopColor="rgba(225,29,42,0.18)" />
                    <stop offset="100%" stopColor="rgba(225,29,42,0.45)" />
                  </linearGradient>
                </defs>

                {SATELLITES.map((sat) => (
                  <path
                    key={sat.key}
                    d={arcPath(sat)}
                    stroke="url(#arc-gradient)"
                    strokeWidth="0.14"
                    strokeLinecap="round"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {/* One inward pulse per satellite. Cadence: 4 s cycle,
                    stagger = (i / N) × 4 so at any moment ~1–2 pulses
                    are in flight across the entire composition. */}
                {!reduce &&
                  SATELLITES.map((sat, i) => {
                    const begin = (i / SATELLITES.length) * 4;
                    return (
                      <g key={`pulse-${sat.key}`}>
                        <circle r="0.45" fill={BRAND_RED} opacity="0">
                          <animateMotion
                            dur="4s"
                            repeatCount="indefinite"
                            begin={`${begin}s`}
                            path={arcPath(sat)}
                          />
                          <animate
                            attributeName="opacity"
                            values="0;0.75;0.75;0"
                            keyTimes="0;0.18;0.82;1"
                            dur="4s"
                            repeatCount="indefinite"
                            begin={`${begin}s`}
                          />
                        </circle>
                      </g>
                    );
                  })}
              </svg>

              {/* Modules — visuals first, captions on top z-layer */}
              {MODULES.map((mod) => (
                <ModuleVisual
                  key={mod.key}
                  module={mod}
                  reduce={reduce}
                />
              ))}
              {MODULES.map((mod, i) => (
                <ModuleCaption key={`cap-${mod.key}`} module={mod} index={i} />
              ))}
            </div>
          </Reveal>
        </div>

        {/* ── Mobile: clean 2-col grid ─────────────────────────────── */}
        <div className="mt-10 md:hidden">
          <Reveal delay={0.14}>
            <div className="grid grid-cols-2 gap-3">
              {MODULES.map((mod) => (
                <MobileModuleCard key={mod.key} module={mod} />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Desktop module renderers ──────────────────────────────────────

function ModuleVisual({
  module: mod,
  reduce,
}: {
  module: ModuleDef;
  reduce: boolean | null;
}) {
  const isHub = mod.type === "device" && !!mod.isHub;
  const breathe = isHub && !reduce;

  if (mod.type === "device") {
    // Two-layer structure — CRITICAL:
    //   Outer div owns positioning (`left/top + transform: translate(-50%, -50%)`)
    //   Inner motion.div owns the breath animation (`y: [0, -3, 0]`).
    // These MUST live on separate elements. If both lived on the same node
    // the Framer Motion `y` animation would seize the `transform` property
    // and clobber the centering translate — the hub would render with its
    // TOP-LEFT corner at (50, 50) instead of its CENTER, dragging the device
    // visually down-and-right by roughly (7.5%, 13.3%) of the canvas. That
    // was the exact symptom of "POS not centered" the user reported.
    return (
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left: `${mod.visualLeft}%`,
          top: `${mod.visualTop}%`,
          width: `${mod.imageWidthPct}%`,
          transform: "translate(-50%, -50%)",
          zIndex: mod.z,
          filter: isHub
            ? "drop-shadow(0 18px 36px rgba(20,15,40,0.12))"
            : "drop-shadow(0 10px 22px rgba(20,15,40,0.10))",
        }}
      >
        <motion.div
          animate={breathe ? { y: [0, -3, 0] } : undefined}
          transition={
            breathe
              ? { duration: 10, ease: "easeInOut", repeat: Infinity }
              : undefined
          }
        >
          <Image
            src={mod.src}
            alt={mod.alt}
            width={1000}
            height={1000}
            className="w-full h-auto"
            draggable={false}
            priority={isHub}
          />
        </motion.div>
      </div>
    );
  }

  // Tile — uniform 56×56 badge with brand-red icon.
  return (
    <div
      className="absolute"
      style={{
        left: `${mod.visualLeft}%`,
        top: `${mod.visualTop}%`,
        transform: "translate(-50%, -50%)",
        zIndex: mod.z,
      }}
    >
      <span
        aria-hidden
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-hairline bg-paper text-[#E11D2A] shadow-[0_8px_18px_rgba(20,15,40,0.06)]"
      >
        {mod.icon}
      </span>
    </div>
  );
}

function ModuleCaption({
  module: mod,
  index,
}: {
  module: ModuleDef;
  index: number;
}) {
  const isHub = mod.type === "device" && mod.isHub;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: APPLE_EASE,
        delay: 0.4 + index * 0.05,
      }}
      className="absolute text-center pointer-events-none"
      style={{
        left: `${mod.captionLeft ?? mod.visualLeft}%`,
        top: `${mod.captionTop}%`,
        transform: "translateX(-50%)",
        width: isHub ? "min(220px, 22%)" : "min(150px, 15%)",
        zIndex: 40,
      }}
    >
      <p
        className={
          isHub
            ? "text-[11px] font-semibold uppercase tracking-[0.20em] text-[#E11D2A]"
            : "text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute"
        }
      >
        {mod.role}
      </p>
      <p
        className={
          "mt-1 font-semibold tracking-[-0.012em] text-ink leading-[1.2] " +
          (isHub ? "text-[17px]" : "text-[13px]")
        }
      >
        {mod.name}
      </p>
      {isHub && (
        <p className="mt-1 text-[12px] leading-[1.4] text-ink-mute">
          {mod.blurb}
        </p>
      )}
    </motion.div>
  );
}

// ─── Mobile card ────────────────────────────────────────────────────

function MobileModuleCard({ module: mod }: { module: ModuleDef }) {
  const isHub = mod.type === "device" && mod.isHub;
  return (
    <div
      className={
        "rounded-2xl border border-hairline bg-paper p-4 " +
        (isHub ? "col-span-2" : "")
      }
    >
      {mod.type === "device" ? (
        <div
          className="relative mx-auto"
          style={{
            width: isHub ? "55%" : "70%",
            aspectRatio: "1 / 1",
          }}
        >
          <Image
            src={mod.src}
            alt={mod.alt}
            fill
            className="object-contain"
            sizes="(min-width: 768px) 0px, 50vw"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center mx-auto h-16">
          <span className="inline-flex h-12 w-12 rounded-xl bg-[#E11D2A]/8 items-center justify-center text-[#E11D2A]">
            {mod.icon}
          </span>
        </div>
      )}
      <p
        className={
          "mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] " +
          (isHub ? "text-[#E11D2A]" : "text-ink-mute")
        }
      >
        {mod.role}
      </p>
      <p className="mt-0.5 text-[14px] font-semibold tracking-[-0.005em] text-ink">
        {mod.name}
      </p>
      <p className="mt-0.5 text-[12px] leading-[1.4] text-ink-mute">
        {mod.blurb}
      </p>
    </div>
  );
}

// ─── Tile icons — 20px, stroke 1.4, rounded caps ──────────────────

function KdsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 13.5h6M8 11v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 5.5h4M4.5 7.5h7M4.5 9h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function DisplayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.8" y="3.5" width="12.4" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 13h5M8 11v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 6h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4 8h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function QrIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10" y="2" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="10" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.5 8.5h2v2M11.5 10.5v2h2v-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7h12" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 10.5h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 11V8a4 4 0 0 1 8 0v3l1 1H3l1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M7 14a1 1 0 0 0 2 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
