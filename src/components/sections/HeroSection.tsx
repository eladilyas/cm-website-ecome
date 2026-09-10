"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { TrustedByStrip } from "@/components/sections/TrustedByStrip";
import { HeroVideo } from "@/components/sections/HeroVideo";

// Hero — cinematic photo carousel of Caisse Manager customers, AI-
// driven headline, two CTAs.
//
// Visual system:
//   ▸ Full-bleed background video (HeroVideo) — the brand ad clip, muted
//     and looping. Replaced a four-photo cross-fading carousel
//     (HeroCarousel, now unreferenced but kept as a revert path). The
//     video takes the identical `absolute inset-0` footprint, so the
//     overlay stack below and the trust strip were unaffected.
//   ▸ Multi-layer overlay above the video:
//       1) Base scrim — lifts contrast across every frame.
//       2) Vertical gradient — darkens top + bottom, leaves middle
//          breathable so the footage still reads.
//       3) Text-zone radial pool — soft ellipse of darkness exactly
//          where the headline + subhead + CTAs sit. This matters more
//          with video than it did with stills: the background is now
//          ~900 frames rather than four, so legibility has to hold
//          across all of them instead of being checked per photo.
//       4) Brand-red bloom in the lower third for warmth.
//   ▸ Top edge of the vertical gradient is deliberately darker than
//     the middle band so the header logo + nav links keep their
//     contrast on every slide.

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <section
      data-scheme="dark"
      data-header-overlay="hero"
      className="relative overflow-hidden bg-night text-paper h-svh flex flex-col"
    >
      {/* ── Background — the brand ad clip ──────────────────────────
          Was HeroCarousel (four cross-fading photos). Same
          `absolute inset-0` footprint, so every overlay below and the
          TrustedByStrip at the bottom are unaffected. */}
      <HeroVideo alt={t("posterAlt")} />

      {/* ── Overlay stack ────────────────────────────────────────────
          With the photos sitting raw edge-to-edge below (no fade
          masks, no seam, no inner-frame breathing room), text
          readability is now carried by a single uniform dark scrim
          across the whole hero, plus a top + bottom edge gradient
          to keep the header chrome and trust strip on a dark band. */}

      {/* 1) Uniform dark scrim across the entire hero. ~52 % black —
            deeper than the prior 40 % step, so the headline + subhead
            sit confidently over any frame the carousel lands on,
            while the photos still carry colour and storefront
            detail underneath. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/60 pointer-events-none"
      />

      {/* 2) Vertical edge gradient — concentrated at the very top
            and bottom. Top end keeps the floating header chrome
            (logo + nav) crisply readable on every slide; bottom
            end anchors the TrustedByStrip. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 78%, rgba(0,0,0,0.80) 100%)",
        }}
      />

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-shell px-6 lg:px-10 flex-1 flex flex-col items-center justify-center min-h-0">
        <Reveal>
          <h1
            // Font-size + width tuned to absorb both the short EN
            // headline ("AI-Empowerment for business growth", 33 chars)
            // AND the slightly longer FR equivalent ("L'IA au service
            // de votre croissance", 36 chars) without either locale
            // wrapping to more than two lines.
            className="text-display font-semibold tracking-[-0.022em] leading-[1.05] text-center max-w-[22ch] mx-auto"
            style={{ textWrap: "balance" }}
          >
            <span className="ai-gradient-text">{t("headline")}</span>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-5 text-sm md:text-[15.5px] leading-[1.55] text-paper/80 max-w-[36rem] text-center mx-auto">
            {t("subhead")}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Button href="/start-free-trial" variant="invert" size="md">
              {t("primaryCta")}
            </Button>
            <Button href="/pricing" variant="outline" size="md">
              {t("secondaryCta")}
            </Button>
          </div>
        </Reveal>
      </div>

      {/* Trusted-by strip — pinned to the section bottom, INSIDE the same
          viewport (h-svh + flex column). */}
      <div className="relative z-10">
        <TrustedByStrip />
      </div>
    </section>
  );
}
