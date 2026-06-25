"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TRUSTED_LOGOS } from "@/lib/trustedLogos";
import { HERO_GLASS_SURFACE, HERO_GLASS_HAIRLINE } from "@/lib/heroGlass";

// Px / second — slow enough to feel premium, fast enough that the visible
// window cycles through every priority partner in ~10 seconds.
const SCROLL_SPEED_PX_PER_SEC = 32;

/**
 * Trusted-by strip — JS-driven auto-scrolling carousel of client logos.
 *
 * Treatment:
 *   • Logos are rendered in uniform WHITE (CSS filter brightness(0) invert(1))
 *     so the strip reads as one cohesive set rather than a colorful gallery.
 *     The filter preserves each brand's silhouette, transparency, and
 *     proportions — only the color is flattened.
 *   • Each logo lives in a fixed-width "slot" (w-[100px] md:w-[120px]) with
 *     object-contain fit. Square / portrait logos get horizontal breathing
 *     room; very wide logos cap at slot width. Result: bounded visual weight
 *     for every brand regardless of source aspect ratio.
 *   • Flat opacity-80 (no hover transition on the items) — they're
 *     decorative; the strip's pause-on-hover lives on the parent container.
 *
 * Interaction:
 *   • Continuous horizontal scroll via requestAnimationFrame + scrollLeft.
 *   • Pause immediately on hover (desktop) — onMouseEnter flips a ref.
 *   • Seamless resume on mouse leave — picks up from current scrollLeft.
 *   • Native swipe on mobile via overflow-x-auto; touchstart pauses the
 *     RAF so the user's gesture wins, touchend resumes.
 *   • Seamless infinite loop — logos rendered twice; on each forward wrap
 *     past scrollWidth/2 we subtract that amount instantly.
 *   • IntersectionObserver gate — RAF skips when offscreen.
 *   • prefers-reduced-motion: RAF short-circuits at mount; scroller is
 *     keyboard-focusable (tabIndex=0) so keyboard users can arrow-scroll
 *     through the static row.
 */
export function TrustedByStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ paused: false, inView: false });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const container = containerRef.current;
    const scroller = scrollRef.current;
    if (!container || !scroller) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        stateRef.current.inView = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(container);

    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (last === 0) last = now;
      const dt = Math.min(50, now - last) / 1000;
      last = now;

      const { paused, inView } = stateRef.current;
      if (!paused && inView) {
        scroller.scrollLeft += dt * SCROLL_SPEED_PX_PER_SEC;
        const half = scroller.scrollWidth / 2;
        if (half > 0) {
          if (scroller.scrollLeft >= half) scroller.scrollLeft -= half;
          if (scroller.scrollLeft < 0) scroller.scrollLeft += half;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const pause = () => {
    stateRef.current.paused = true;
  };
  const resume = () => {
    stateRef.current.paused = false;
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Clients using Caisse Manager"
      // Shared "hero glass" — same dark frost the navbar uses at the
      // top of the hero (see src/lib/heroGlass.ts). The two edges read
      // as a single premium glass system bracketing the hero, rather
      // than two unrelated UI bands.
      className={`relative w-full border-t ${HERO_GLASS_SURFACE} ${HERO_GLASS_HAIRLINE}`}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-5 md:py-6">
        <div className="flex items-center gap-6 md:gap-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-paper/55 whitespace-nowrap flex-shrink-0">
            Trusted by
          </p>

          <div
            className="relative flex-1 overflow-hidden"
            onMouseEnter={pause}
            onMouseLeave={resume}
            onTouchStart={pause}
            onTouchEnd={resume}
            onTouchCancel={resume}
            style={{
              maskImage:
                "linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%)",
            }}
          >
            {/* Scroller — tabIndex=0 + focus-visible ring so keyboard users
                on prefers-reduced-motion can arrow-scroll through the row. */}
            <div
              ref={scrollRef}
              tabIndex={0}
              className="overflow-x-auto overflow-y-hidden scrollbar-hide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/30 focus-visible:ring-offset-2 focus-visible:ring-offset-night rounded-sm"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <ul className="flex items-center gap-6 md:gap-10 w-max">
                {/* First copy — announced to assistive tech as a list. */}
                {TRUSTED_LOGOS.map((logo) => (
                  <li
                    key={`a-${logo.name}`}
                    className="flex-shrink-0 opacity-80"
                  >
                    <LogoSlot logo={logo} altText={logo.name} />
                  </li>
                ))}
                {/* Second copy — pixel-identical duplicate that completes the
                    seamless loop. aria-hidden so SR users hear each name once. */}
                {TRUSTED_LOGOS.map((logo) => (
                  <li
                    key={`b-${logo.name}`}
                    aria-hidden="true"
                    className="flex-shrink-0 opacity-80"
                  >
                    <LogoSlot logo={logo} altText="" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LogoSlot ─────────────────────────────────────────────────────────────
// Fixed-width slot (w-[100px] md:w-[120px], h-7 md:h-9) that contains the
// logo image and centers it via flex. The image renders inside via
// object-contain so its native aspect is preserved; max-w-full max-h-full
// ensures it never overflows. CSS filter flattens every source color to a
// uniform white silhouette — applied uniformly because the data set is
// curated to only include logos that survive the transformation.

function LogoSlot({
  logo,
  altText,
}: {
  logo: { src: string; width: number; height: number; name: string };
  altText: string;
}) {
  return (
    <div className="h-7 md:h-9 w-[100px] md:w-[120px] flex items-center justify-center">
      <Image
        src={logo.src}
        alt={altText}
        width={logo.width}
        height={logo.height}
        sizes="(min-width: 768px) 120px, 100px"
        className="max-w-full max-h-full w-auto h-auto select-none pointer-events-none"
        style={{ filter: "brightness(0) invert(1)" }}
        draggable={false}
      />
    </div>
  );
}
