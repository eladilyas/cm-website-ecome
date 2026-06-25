"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

// "One platform" — dark editorial split.
//
// LEFT: editorial typography stack (eyebrow → headline → standfirst → whisper).
// RIGHT: cm-brand-object-3.png — a 3D-rendered cinematic composition of the
// central red check + five partner cards (Yassir, CMI, Odoo, Glovo, Brehm)
// with the image's red rim lighting designed to extend out into the section
// atmosphere itself. No "card frame" around the image — it must read as
// fully embedded in the section's dark surface, not pasted on top.
//
// Premium fusion technique:
//   1. Section base — warm graphite gradient tuned to the image's own
//      dark corners (#15171c → #0a0508). Matching base means the mask
//      boundary between image and section becomes imperceptible.
//   2. Outer red bleed — wide low-frequency radial behind the image,
//      blurred 80px, extending the image's red glow into the room
//      beyond its frame.
//   3. Soft elliptical mask — feathers the image edges to transparent
//      so it merges into the surrounding atmosphere without a visible
//      boundary or hard rectangle.
//   4. Subtle vignette — sub-perceptible corner darkening pulls focus
//      to the center of the composition.
//
// Motion: slow 14s easeInOut y-axis breath (±4px) — quieter than
// Backoffice (10s ±6px) and Platform (11s ±6px) so this section reads
// as the "ambient pause" between two product showcases. Respects
// prefers-reduced-motion.

const FLOAT_DURATION_S = 14;
const FLOAT_AMPLITUDE_PX = 4;

export function IntegrationsSection() {
  const reduce = useReducedMotion();
  const t = useTranslations("home.integrations");

  return (
    <section
      id="integrations"
      data-scheme="dark"
      className="relative overflow-hidden text-paper scroll-mt-24 bg-black"
    >
      <SectionDivider scheme="dark" />
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-28 md:py-40">
        <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-x-12 lg:gap-x-20 gap-y-14 md:gap-y-0 items-center">
          {/* ── LEFT: editorial title plate ─────────────────────────── */}
          <div className="max-w-[28rem]">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-paper/55 mb-5">
                {t("eyebrow")}
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <h2
                className="text-[clamp(2rem,4.2vw,3.25rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-paper max-w-[20ch]"
                style={{ textWrap: "balance" }}
              >
                {t("headline")}
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-7 text-[17px] md:text-[19px] leading-[1.5] text-paper/75 max-w-[27rem]">
                {t("subtitle")}
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-3 text-[13px] md:text-[14px] leading-[1.5] text-paper/50 max-w-[24rem]">
                {t("whisper")}
              </p>
            </Reveal>
          </div>

          {/* ── RIGHT: 3D ecosystem composition.
              The image is fully embedded — feathered edges fade into
              the section's dark base, while the image's red rim
              lighting extends BEYOND the image bounds via two
              ambient halo layers. Reads as one continuous lit
              environment, not as a placed image. ── */}
          <div className="-mx-6 md:mx-0">
            <Reveal delay={0.2}>
              <div className="relative w-full max-w-[640px] mx-auto">
                {/* The video — slow cinematic breath, soft elliptical
                    edge feather so the dark corners of the rendered
                    scene fade INTO the section's dark base, removing
                    any visible "pasted image" boundary.

                    Sizing: the video renders at its NATURAL aspect
                    ratio (block w-full h-auto). Previously a fixed
                    `aspect-[2/1]` container forced object-contain to
                    letterbox the video on the sides/top, shrinking the
                    visible 3D content to ~half size when the source
                    file's aspect didn't match. Natural sizing keeps
                    the 3D object filling the entire container width
                    regardless of future file-resolution changes. The
                    only constraint is max-width so the visual stays
                    proportional to the editorial text on the left. */}
                <motion.div
                  animate={
                    reduce ? undefined : { y: [0, -FLOAT_AMPLITUDE_PX, 0] }
                  }
                  transition={
                    reduce
                      ? undefined
                      : {
                          duration: FLOAT_DURATION_S,
                          ease: "easeInOut",
                          repeat: Infinity,
                        }
                  }
                  className="relative will-change-transform"
                >
                  <div
                    className="relative w-full"
                    style={{
                      // Soft outer feather — the real fusion comes from
                      // the screen blend below. This smooths the outer
                      // ~12% so the rendered scene fades into the section
                      // surface without any visible rectangle.
                      maskImage:
                        "radial-gradient(ellipse 100% 100% at center, black 88%, transparent 100%)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse 100% 100% at center, black 88%, transparent 100%)",
                    }}
                  >
                    {/* Autoplaying loop video composited with
                        `mix-blend-mode: screen`. Screen blends each
                        video pixel additively with the section
                        background: pure black stays black, dark
                        near-black becomes effectively invisible,
                        and the bright red glow + partner logos
                        compose on top of the section's atmosphere.

                        Result: the video has no perceptible rectangle
                        — only the red core and partner cards float in
                        the section's environment. The dark video
                        corners ARE the section's dark corners,
                        mathematically identical.

                        Brightness/contrast boosts compensate for the
                        slight wash-out screen blend introduces and
                        ensure the brights remain saturated. */}
                    <video
                      src="/3d/cm-brand-object-3.mp4"
                      poster="/3d/cm-brand-object-3.png"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-hidden
                      className="block w-full h-auto select-none pointer-events-none"
                      style={{
                        mixBlendMode: "screen",
                        filter:
                          "brightness(0.95) contrast(1.32) saturate(1.18)",
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
