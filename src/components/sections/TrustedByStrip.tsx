"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { BAND_LOGOS } from "@/data/logos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { HERO_GLASS_SURFACE, HERO_GLASS_HAIRLINE } from "@/lib/heroGlass";

// Px / second — slow enough to feel premium, fast enough that the visible
// window cycles through every priority partner in ~10 seconds.
const SCROLL_SPEED_PX_PER_SEC = 32;

/**
 * Trusted-by strip — JS-driven auto-scrolling carousel of client logos.
 *
 * Treatment:
 *   • Real WHITE artwork per brand, from `BAND_LOGOS`. This replaced a CSS
 *     `brightness(0) invert(1)` filter over colour art. That filter collapsed
 *     every opaque pixel to pure white, so a mascot or a badge lost its inner
 *     detail and read as a featureless blob — which is why the old roster had
 *     to exclude several brands outright. Genuine white lockups keep their
 *     counters and internal shapes, so the roster is 38 brands instead of 12.
 *   • Sizing is NOT done here. Each asset is a fixed 320×140 canvas with the
 *     artwork pre-scaled so its ink area matches its neighbours, so BrandLogo
 *     renders it at one uniform slot size and the optical balance holds.
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
  const t = useTranslations("home.hero");
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
      aria-label={t("trustedByLabel")}
      // Shared "hero glass" — same dark frost the navbar uses at the
      // top of the hero (see src/lib/heroGlass.ts). The two edges read
      // as a single premium glass system bracketing the hero, rather
      // than two unrelated UI bands.
      className={`relative w-full border-t ${HERO_GLASS_SURFACE} ${HERO_GLASS_HAIRLINE}`}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-5 md:py-6">
        <div className="flex items-center gap-6 md:gap-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-paper/55 whitespace-nowrap flex-shrink-0">
            {t("trustedBy")}
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
                {BAND_LOGOS.map((logo) => (
                  <li
                    key={`a-${logo.slug}`}
                    className="flex-shrink-0 opacity-80"
                  >
                    <BrandLogo logo={logo} surface="dark" size="sm" />
                  </li>
                ))}
                {/* Second copy — pixel-identical duplicate that completes the
                    seamless loop. aria-hidden so SR users hear each name once. */}
                {BAND_LOGOS.map((logo) => (
                  <li
                    key={`b-${logo.slug}`}
                    aria-hidden="true"
                    className="flex-shrink-0 opacity-80"
                  >
                    <BrandLogo logo={logo} surface="dark" size="sm" alt="" />
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

