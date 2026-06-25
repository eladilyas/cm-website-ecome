"use client";

// Hero carousel — story-format photographs of Caisse Manager
// customers across Morocco (Clicfood Tab restaurant, KROOZY burger,
// BCHEF sandwich shop, Le Roissant bakery).
//
// Responsive layout:
//   • Desktop (≥ md): diptych — 2 photos side-by-side per slide,
//     each framed with breathing room so the brand sign + the
//     Caisse Manager-branded uniform stay fully visible without
//     bezel noise. 2 slides total.
//   • Mobile (< md): single photo per slide — portrait viewport
//     fits the portrait source naturally. 4 slides total.
//
// Both layouts mount in the DOM and Tailwind shows the right one
// per breakpoint. Each runs an independent cross-fade timer so a
// resize from desktop ↔ mobile transitions smoothly.
//
// Visual treatment:
//   • Photos render at `object-contain` so the full composition
//     (subject + storefront sign + Caisse Manager uniform) is
//     ALWAYS visible — never cropped.
//   • Each photo sits inside a framed inner box at ~84 % of its
//     pane, giving intentional breathing room around the image
//     (less "zoomed in" feel, more "editorial portrait" feel).
//   • Surrounding space uses a quiet vertical dark gradient that
//     dissolves into the section's night background — no blurred
//     image backdrop, so brand assets never get smeared.
//   • Indicator dots adapt count to the active layout (2 on
//     desktop, 4 on mobile).
//   • prefers-reduced-motion: first slide only, no auto-advance.
//   • Pause on hover / focus-within / tab hidden.

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// ────────────────────────────────────────────────────────────────────
// Seam variants — the "shadow effect around picture" between the
// three photos in the desktop triptych. Preview each by changing
// SEAM_VARIANT below.
//
//   "none"        — no seam at all. Photos sit edge-to-edge; their
//                   existing fade masks already feather the join. Use
//                   this as the effect-free control to judge whether
//                   any seam adds value.
//   "velvet"      — original 10px black column with a heavy 40px
//                   outer glow that bleeds into adjacent photos.
//                   Cinematic "spread" feel; can read as heavy.
//   "thin"        — slim 4px column + a refined 18px glow. Same
//                   vocabulary, dialed back two notches.
//   "hairline"    — 1px hairline at low-opacity white, no shadow.
//                   Editorial / minimal — photos clearly separated
//                   but the gap doesn't compete with the imagery.
//   "gap"         — 20px pure-night gap, no shadow, no column tint.
//                   Lets the section background show through cleanly.
//   "feathered"   — no column, just symmetric inset shadows on each
//                   photo's inner edge so the join darkens gradually
//                   without a hard line.
// ────────────────────────────────────────────────────────────────────

type SeamVariant = "none" | "velvet" | "thin" | "hairline" | "gap" | "feathered";

const SEAM_VARIANT: SeamVariant = "none";


function renderSeam(variant: SeamVariant): React.ReactNode {
  switch (variant) {
    case "none":
      return null;

    case "velvet":
      return (
        <div
          aria-hidden
          className="shrink-0 self-stretch w-2.5 relative z-10"
          style={{
            background: "#04060a",
            boxShadow:
              "0 0 40px 14px rgba(0,0,0,0.85), 0 0 12px 4px rgba(0,0,0,0.95)",
          }}
        />
      );

    case "thin":
      return (
        <div
          aria-hidden
          className="shrink-0 self-stretch w-1 relative z-10"
          style={{
            background: "#05070b",
            boxShadow:
              "0 0 18px 6px rgba(0,0,0,0.55), 0 0 6px 2px rgba(0,0,0,0.80)",
          }}
        />
      );

    case "hairline":
      return (
        <div
          aria-hidden
          className="shrink-0 self-stretch w-px relative z-10"
          style={{ background: "rgba(255,255,255,0.10)" }}
        />
      );

    case "gap":
      return (
        <div
          aria-hidden
          className="shrink-0 self-stretch w-5 relative z-10"
          style={{ background: "#07090d" }}
        />
      );

    case "feathered":
      // No column at all. The darkening lives on each photo's inner
      // edge via an inset shadow applied in PhotoPane — controlled by
      // this same variant. Returning a zero-width spacer keeps the
      // flex layout stable.
      return null;
  }
}

type Photo = { src: string; alt: string; objectPosition: string };
type Triptych = readonly [Photo, Photo, Photo];

/** The full 4-photo set — used as mobile slides directly, and
 *  triplet-grouped into the desktop triptychs below. Order
 *  defines the narrative arc. */
const PHOTOS: Photo[] = [
  {
    src: "/hero-pictures/DSC01255.jpg",
    alt: "Caisse Manager team member walking into Clicfood Tab restaurant — Moroccan bistro with traditional zellige arch",
    objectPosition: "center 35%",
  },
  {
    src: "/hero-pictures/DSC07142.jpg",
    alt: "Caisse Manager team member walking into KROOZY burger restaurant — purple-and-orange quick-service brand",
    objectPosition: "center 30%",
  },
  {
    src: "/hero-pictures/DSC01434.jpg",
    alt: "Caisse Manager service van parked outside BCHEF sandwiches & grillades at night — field support coverage",
    objectPosition: "center 50%",
  },
  {
    src: "/hero-pictures/DSC09778-Enhanced-NR.jpg",
    alt: "Caisse Manager team member walking into Le Roissant bakery & coffee — premium marble storefront",
    objectPosition: "center 38%",
  },
];

/** Desktop triptychs — three photos per slide. Curated order:
 *
 *    LEFT   — KROOZY burger (purple/orange daytime brand)
 *    MIDDLE — BCHEF service van at night (the car as the
 *             centerpiece — service depth, after-hours coverage)
 *    RIGHT  — Le Roissant bakery (premium marble daytime entry)
 *
 *  Reads as a chromatic + tonal arc: warm purple → deep night
 *  → cool cream. Clicfood is held back for future triptychs;
 *  add new triplets to this array and the carousel auto-advances
 *  between them at the DESKTOP_DURATION_MS cadence. */
const DESKTOP_TRIPTYCHS: Triptych[] = [
  // Single triptych for now — warm purple → deep night → cool cream.
  // The carousel mechanic gates indicator dots + prev/next buttons
  // on `count > 1`, so with a single slide the hero renders chrome-
  // free. Add more triptychs to re-introduce navigation.
  [PHOTOS[1], PHOTOS[2], PHOTOS[3]],
];

/** Auto-advance cadence. Single photos on mobile cycle quicker;
 *  desktop triptychs linger longer (three photos to read per
 *  beat). When only ONE triptych exists, the desktop carousel
 *  skips the auto-advance interval — there's nothing to fade to. */
const DESKTOP_DURATION_MS = 9000;
const MOBILE_DURATION_MS = 6000;
/** Crossfade duration. 1.2 s reads as cinematic. */
const FADE_DURATION_MS = 1200;

export function HeroCarousel() {
  return (
    <>
      {/* Desktop diptych carousel — hidden below md */}
      <div className="hidden md:block absolute inset-0">
        <DesktopCarousel />
      </div>
      {/* Mobile single-photo carousel — visible below md */}
      <div className="md:hidden absolute inset-0">
        <MobileCarousel />
      </div>
    </>
  );
}

// ─── Desktop diptych carousel ──────────────────────────────────────────

function DesktopCarousel() {
  // Edge-to-edge triptych. Three photos butt each other with NO seam,
  // NO fade mask, NO inner frame — each photo fills its flex pane via
  // `object-cover`. Raw imagery; the section-level dark scrim in
  // HeroSection.tsx carries the text-readability load on its own.
  return (
    <Carousel
      count={DESKTOP_TRIPTYCHS.length}
      durationMs={DESKTOP_DURATION_MS}
      ariaLabel="Caisse Manager customers across Morocco"
      renderSlide={(i, isActive) => {
        const triptych = DESKTOP_TRIPTYCHS[i];
        return (
          <div className="absolute inset-0 flex">
            {triptych.map((photo, j) => (
              <div
                key={photo.src}
                className="relative flex-1 min-h-0 overflow-hidden"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  priority={i === 0 && j === 0 && isActive}
                  quality={88}
                  className="object-cover pointer-events-none select-none"
                  style={{ objectPosition: photo.objectPosition }}
                />
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}

// ─── Mobile single-photo carousel ──────────────────────────────────────

function MobileCarousel() {
  return (
    <Carousel
      count={PHOTOS.length}
      durationMs={MOBILE_DURATION_MS}
      ariaLabel="Caisse Manager customers across Morocco"
      // `fullBleed` flips PhotoPane to mobile mode: object-cover,
      // no inner frame, no side mask. The phone viewport is far
      // more portrait (≈ 0.46) than the source photo (0.75), so
      // a contained image would leave huge bars top + bottom.
      // Cover fills the screen; horizontal crop is minimal because
      // subjects + brand signs are centered in every shot.
      renderSlide={(i, isActive) => (
        <div className="absolute inset-0 flex">
          <PhotoPane
            photo={PHOTOS[i]}
            priority={i === 0 && isActive}
            fullBleed
          />
        </div>
      )}
    />
  );
}

// ─── Shared carousel mechanic — cross-fade, autoplay, indicators ──────

function Carousel({
  count,
  durationMs,
  ariaLabel,
  renderSlide,
}: {
  count: number;
  durationMs: number;
  ariaLabel: string;
  renderSlide: (i: number, isActive: boolean) => React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, durationMs);
    return () => window.clearInterval(id);
  }, [reducedMotion, paused, count, durationMs]);

  return (
    <div
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className="absolute inset-0 pointer-events-none"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className="absolute inset-0 will-change-[opacity] pointer-events-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            opacity: i === index ? 1 : 0,
            transition: reducedMotion
              ? "none"
              : `opacity ${FADE_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {renderSlide(i, i === index)}
        </div>
      ))}

      {/* Indicator dots — Apple-style active pill. Rendered only
          when there's more than one slide; a single-slide carousel
          has nothing to navigate to and the lone dot reads as
          residual UI noise. */}
      {count > 1 && (
        <div className="absolute right-4 md:right-8 bottom-28 md:bottom-32 z-20 flex items-center gap-1.5 pointer-events-auto">
          {Array.from({ length: count }).map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1} of ${count}`}
                aria-current={active ? "true" : undefined}
                onClick={() => setIndex(i)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                className={
                  "h-1.5 rounded-full transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
                  (active
                    ? "w-6 bg-paper"
                    : "w-1.5 bg-paper/45 hover:bg-paper/70")
                }
              />
            );
          })}
        </div>
      )}

      {/* Prev / next arrow buttons — small circular controls so the
          visitor can step through the slides manually instead of
          waiting for the auto-advance. Same `count > 1` gate as the
          dots: hidden on single-slide carousels where there's
          nowhere to go. Positioned bottom-left as a pair so they
          read as one control cluster (vs. the convention of pinning
          them to opposite edges, which competes with the dots). */}
      {count > 1 && (
        <div className="absolute left-4 md:left-8 bottom-24 md:bottom-28 z-20 flex items-center gap-2 pointer-events-auto">
          <ArrowButton
            direction="prev"
            onClick={() =>
              setIndex((i) => (i - 1 + count) % count)
            }
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          />
          <ArrowButton
            direction="next"
            onClick={() => setIndex((i) => (i + 1) % count)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          />
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  direction,
  onClick,
  onFocus,
  onBlur,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-night/55 border border-white/15 text-paper/85 hover:bg-night/75 hover:text-paper hover:border-white/30 backdrop-blur-sm transition-colors duration-200"
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden
        style={{ transform: direction === "prev" ? "rotate(180deg)" : undefined }}
      >
        <path
          d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ─── Photo pane — clean, no blur backdrop ──────────────────────────────

/** A single photo, framed with breathing room and a quiet dark
 *  gradient backdrop. No blurred image behind — keeps the brand
 *  assets (storefront signs, Caisse Manager-branded uniforms)
 *  crisp and uncluttered.
 *
 *  Sizing math: the inner frame caps the photo at ~84-88 % of the
 *  pane dimensions, leaving intentional negative space around the
 *  image. Combined with object-contain, this means the source 3:4
 *  portrait never gets cropped AND never feels claustrophobically
 *  zoomed-in — the photo reads as an editorial portrait inside the
 *  hero, not a brutally cropped billboard.
 *
 *  Backdrop: a soft diagonal dark gradient from #0c0f15 → #07090d,
 *  matching the section's bg-night base. Quiet enough that the
 *  bezels recede; just enough variation that the negative space
 *  doesn't read as flat. */
function PhotoPane({
  photo,
  priority,
  fullBleed = false,
}: {
  photo: Photo;
  priority: boolean;
  /** Mobile-only: skip the inner-frame breathing-room treatment
   *  and the side-fade mask. Photo fills the full viewport WIDTH
   *  via `object-contain` so brand assets (the Caisse Manager
   *  logo on the t-shirt, the storefront sign) are NEVER cropped
   *  — they're guaranteed visible on every mobile device,
   *  regardless of aspect ratio (390×844 iPhone, 360×800 Galaxy,
   *  iPad mini portrait, fold devices, etc.). The natural top +
   *  bottom bezels are filled with a premium dark gradient that
   *  matches the rest of the hero's night palette. */
  fullBleed?: boolean;
}) {
  if (fullBleed) {
    // Mobile branch — object-contain guarantees no horizontal
    // crop ever. Photo fills full viewport width at its natural
    // 3:4 aspect; the dark gradient backdrop fills the small
    // top + bottom bezels left by the contained image.
    //
    // Vertical mask fades the top + bottom edges of the image so
    // it dissolves into the dark backdrop AND into the surrounding
    // hero overlay (marketing header above, trust strip below)
    // instead of presenting a hard rectangular cut. Net effect:
    // the photo reads as "emerging from the dark" rather than
    // pasted onto it.
    return (
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #0c0f15 0%, #050709 50%, #0c0f15 100%)",
          }}
        />
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="100vw"
          priority={priority}
          quality={88}
          className="object-contain pointer-events-none select-none"
          style={{
            objectPosition: "center",
            maskImage: VERTICAL_FADE_MASK,
            WebkitMaskImage: VERTICAL_FADE_MASK,
          }}
        />
      </div>
    );
  }

  // Desktop triptych branch — framed inner box with a 2-axis
  // edge-fade mask. Horizontal fade dissolves the photo's left +
  // right edges into the velvet seams between panes. Vertical
  // fade dissolves the top + bottom edges into the hero's overlay
  // stack (header band above, trust strip + section transition
  // below) so the photo never reads as a stamped rectangle.
  //
  // Frame sizing — STRICT 4:5 aspect-ratio box, matching the
  // intrinsic aspect of every hero photograph (verified via sips:
  // KROOZY 4672×5840, BCHEF 2738×3422, Le Roissant 2720×3400 all
  // = 0.800). Using `aspect-[4/5]` instead of free percentage
  // sizing means object-contain fills the frame perfectly with
  // zero letterboxing — every photo's visible top + bottom edge
  // lands at the same Y across the triptych. Eliminates the
  // perceived height mismatch caused by luminance-driven illusion
  // when bright content (BCHEF car body) and dark content (pavement
  // on KROOZY / Le Roissant) sit at identical Y inside letterboxed
  // panes. Pure design-rule consistency, no asset modification.
  return (
    <div className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0c0f15 0%, #07090d 50%, #0c0f15 100%)",
        }}
      />
      <div
        className="relative w-[88%] aspect-[4/5] max-h-[88%]"
        style={{
          maskImage: TWO_AXIS_FADE_MASK,
          WebkitMaskImage: TWO_AXIS_FADE_MASK,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          priority={priority}
          quality={88}
          className="object-contain pointer-events-none select-none"
          // objectPosition retained for the rare ultra-tall viewport
          // edge case where `max-h-[88%]` clamps the frame and the
          // aspect ratio breaks — in that case object-contain
          // re-introduces letterboxing inside the frame and the
          // per-photo vertical anchor keeps the subject + storefront
          // sign in view. At standard viewports the frame matches
          // the photo aspect exactly so this position is a no-op.
          style={{ objectPosition: photo.objectPosition }}
        />
      </div>
    </div>
  );
}

// Reusable mask gradients. Defined at module scope so the strings
// aren't recreated each render.
//
// VERTICAL_FADE_MASK — single 180° gradient, fades top + bottom.
//   Used on mobile where the photo is full-bleed (no horizontal
//   fade needed; the photo already fills the viewport width).
//
// TWO_AXIS_FADE_MASK — two stacked gradients (horizontal + vertical)
//   intersected via `mask-composite: intersect`. The intersection
//   produces a "vignette frame" where every edge fades; corners
//   fade even softer. Used on desktop where the photo sits inside
//   a framed inner box.
const VERTICAL_FADE_MASK =
  "linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)";
const TWO_AXIS_FADE_MASK =
  "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)";
