"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { AppStoreBadge, GooglePlayBadge } from "@/components/ui/AppStoreBadges";
import { SectionDivider } from "@/components/ui/SectionDivider";

// "About our Backoffice" — the section directly after the hero.
//
// Visual treatment (the asset is a transparent PNG, so the entire premium
// presentation comes from CSS + motion layers):
//
//   1. Soft brand-red radial halo behind the devices (subtle — picks up the
//      logo's red without breaking the canvas-tone palette)
//   2. drop-shadow() applied to the PNG itself — silhouette-aware, follows
//      the laptop and phone edges; cool-tinted to match canvas tokens
//   3. Floor-reflection gradient strip extending below the devices, fading
//      out — suggests a polished surface without a literal mirror flip
//   4. Slow vertical breath via Framer Motion: y oscillates 0 → -6 → 0 over
//      10s, infinite, easeInOut. Subtle by design.
//   5. Entrance fade via Reveal.
//
// Layout: text-left, mockup-right asymmetric. The dual-CTA path on the left
// pairs the brand-level primary CTA (free trial) with mobile-app download
// badges — visually grouped with the phone in the image on the right.

const FLOAT_DURATION_S = 10;
const FLOAT_AMPLITUDE_PX = 6;

export function BackofficeSection() {
  const reduce = useReducedMotion();

  return (
    <section
      data-scheme="light"
      className="relative overflow-hidden bg-canvas text-ink"
    >
      <SectionDivider scheme="light" />
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-12 md:gap-16 items-center">
          {/* ── Left: copy + dual CTA path ────────────────────────────── */}
          <div>
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-4">
                Backoffice
              </p>

              <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight leading-[1.07] text-ink">
                The back office that runs every counter.
              </h2>

              <p className="mt-5 text-[17px] md:text-[19px] leading-[1.5] text-ink-soft max-w-[32rem]">
                Menu, inventory, staff, financials, reporting — all powered by
                the same engine that runs your till. Operate from a laptop at
                your desk or the phone in your pocket; the numbers stay the
                same.
              </p>

              {/* Primary product CTA pair */}
              <div className="mt-7 flex items-center gap-3">
                <Button href="/start-free-trial" variant="primary" size="sm">
                  Start free trial
                </Button>
                <Button href="/products/backoffice" variant="outline" size="sm">
                  Explore back office
                </Button>
              </div>

              {/* Mobile-app download path — clearly subordinate to the
                  primary CTAs above. Smaller eyebrow (10px / normal weight),
                  tighter mt-8 so the eyebrow visually belongs WITH the
                  badges below rather than declaring a new section. */}
              <div className="mt-8">
                <p className="text-[10px] font-normal uppercase tracking-[0.14em] text-ink-mute mb-2">
                  Manage on the go
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Responsive badge widths: snug on 375px phones, full size on md+. */}
                  <AppStoreBadge
                    href="https://apps.apple.com/"
                    className="w-[140px] md:w-[162px]"
                  />
                  <GooglePlayBadge
                    href="https://play.google.com/store"
                    className="w-[140px] md:w-[162px]"
                  />
                </div>
              </div>
            </Reveal>
          </div>

          {/* ── Right: enhanced mockup composition.
                Source image is 1875×1063 RGBA with TRUE transparency, so the
                backdrop / halo / floor-reflection layers show through the
                edges cleanly (no rectangular cut-off seam). The high-res
                source means we can render up to ~640px CSS-wide and still be
                pin-sharp on Retina (2× DPR = 1280 actual pixels, well within
                source). On mobile, the image breaks out of the section's
                px-6 padding via negative margins so the dashboard reads
                larger and clearer at small viewports. ── */}
          <div className="-mx-6 md:mx-0">
            <Reveal delay={0.08}>
              <div className="relative w-full max-w-[640px] mx-auto px-2 sm:px-0">
                {/* Soft brand-red halo — small inset so it stays behind the
                    devices and doesn't bleed into the eyebrow / heading. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-x-[4%] -inset-y-[10%] -z-0"
                  style={{
                    background:
                      "radial-gradient(58% 50% at 50% 45%, rgba(225,29,42,0.10) 0%, rgba(225,29,42,0) 70%)",
                    filter: "blur(28px)",
                  }}
                />
                {/* Cool-tint canvas studio sweep — matches the visual system's
                    canvas tone backdrop language so the visual rhymes with
                    other canvas-tone sections further down the page. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-x-[8%] -inset-y-[14%] -z-10"
                  style={{
                    background:
                      "radial-gradient(72% 60% at 50% 24%, #E9F0F7 0%, rgba(233,240,247,0) 80%)",
                  }}
                />

                {/* The devices — slow floating motion, silhouette drop-shadow
                    (two-layer: a soft cool-blue ambient + a tight near-black
                    contact shadow under the device feet for grounding). */}
                <motion.div
                  animate={reduce ? undefined : { y: [0, -FLOAT_AMPLITUDE_PX, 0] }}
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
                  <Image
                    src="/mockups/backoffice-suite.png"
                    alt="Caisse Manager Backoffice — dashboard shown on a MacBook beside its companion mobile app on iPhone, with revenue charts, top products, and a real-time monthly summary."
                    width={1875}
                    height={1063}
                    sizes="(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw"
                    className="relative w-full h-auto select-none pointer-events-none"
                    style={{
                      filter:
                        "drop-shadow(0 24px 48px rgba(40,80,140,0.22)) drop-shadow(0 4px 8px rgba(0,0,0,0.10))",
                    }}
                    draggable={false}
                  />

                  {/* Floor reflection — soft gradient strip that suggests a
                      polished surface beneath the devices without a literal
                      mirror flip (which would also reflect the dark screens). */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[6%] right-[6%] -bottom-1 h-12"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(40,80,140,0.18) 0%, rgba(40,80,140,0) 100%)",
                      filter: "blur(8px)",
                    }}
                  />
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
