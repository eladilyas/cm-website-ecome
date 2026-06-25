"use client";

// POS immersion — the product, immediately after the hero.
//
// Conversion thesis: the fastest way to sell a POS is to let the visitor
// touch the POS. The simulator is presented as a real iPad running the
// POS so the impression is "this is a finished product, on real hardware"
// rather than "this is a web demo embedded in a card".
//
// Mechanics:
//   • Auto-selects the first activity on mount so the visitor lands
//     INSIDE the workspace with zero clicks. The Zustand demo store's
//     persist middleware preserves whatever activity the user last picked,
//     so returning visitors stay where they were.
//   • Every activity now carries `skipOrderTypePicker: true` (set in
//     src/data/demo/activities.ts), so selectActivity always drops the
//     user straight into the workspace — no order-type screen, no
//     identifier screen, no setup ceremony.
//   • Switching tabs calls selectActivity(), which the demo store wires
//     to a clean state reset (new take-away order, stage="workspace",
//     activity-specific menu + categories). The chassis stays put; only
//     the ProductBrowser content swaps. No reload feel.
//   • Below the device: one Free Trial CTA. No competing buttons.
//
// iPad realism pass:
//   The mockup is now composed as a real device rather than a styled
//   rectangle. Materials, edges, and shadows are tuned to read as
//   machined-aluminum chassis + glass display, the same idiom Apple
//   uses on iPad product photography.
//
//   • Aspect ratio 3:2 — closer to a real iPad than the prior 16:10
//     (still wide enough for the ProductBrowser + ActiveOrder split,
//     still capped by maxHeight so the whole section stays above-fold).
//   • Chassis: two-layer background (subtle top-of-bezel sheen +
//     machined-aluminum gradient) + a 4-layer box-shadow stack
//     (ambient bloom, mid contact, fine contact, inset top highlight,
//     inset bottom shadow, inset side hairlines).
//   • Bezel reduced (p-2.5 md:p-3) and chassis corner radius retuned
//     to rounded-[28px] — more modern-iPad-Pro than the old 34px.
//   • Screen: inset hairline + 1-px inner shadow at the glass / bezel
//     join, so the screen reads as recessed glass, not a colored
//     rectangle pasted onto the chassis.
//   • Two-layer floor shadow under the device: wide ambient bloom
//     (soft, blurred) + tight contact shadow (smaller, sharper). The
//     device looks lifted off the section, not painted onto it.
//   • Soft section atmosphere — a faint radial brightening centered
//     under the device, like a studio fill light on the floor.

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Button } from "@/components/ui/Button";
import { ACTIVITY_LIST } from "@/data/demo/activities";
import { useDemoStore } from "@/lib/demoStore";
import { POSWorkspace } from "@/components/demo/POSWorkspace";

// ────────────────────────────────────────────────────────────────────
// Shadow variants — preview each by changing SHADOW_VARIANT below.
//
//   "none"      — flat: no floor, no outer shadow at all (control / baseline)
//   "current"   — original heavy multi-layer stack (dramatic float)
//   "editorial" — Stripe / Linear: single far ambient, very soft, low opacity
//   "contact"   — Apple Store: tight contact band only, no ambient
//   "studio"    — Dual-light cinematic: soft top-bloom + warm contact
//   "hairline"  — Minimal: barely-there outline + faint floor kiss
//
// Each variant returns the floor-shadow JSX layers AND a `boxShadow`
// CSS string the chassis applies via inline style. The chassis itself
// (color / gradient / rounded corners) stays identical across variants
// — only the lighting changes. "none" keeps the inset hairlines so the
// bezel edges still read as a defined material; it just removes every
// outer shadow so you can compare a raw, effect-free chassis against
// each lit preset.
// ────────────────────────────────────────────────────────────────────

type ShadowVariant =
  | "none"
  | "current"
  | "editorial"
  | "contact"
  | "studio"
  | "hairline";

const SHADOW_VARIANT: ShadowVariant = "current";

function shadowPreset(variant: ShadowVariant): {
  /** JSX floor layers rendered BEHIND the chassis. */
  floor: React.ReactNode;
  /** box-shadow string applied to the chassis itself. Always carries
   *  the four inset hairlines so the bezel edges stay defined. */
  boxShadow: string;
} {
  const insetEdges = [
    "inset 0 1px 0 rgba(255,255,255,0.06)",
    "inset 0 -1px 0 rgba(0,0,0,0.30)",
    "inset 1px 0 0 rgba(255,255,255,0.03)",
    "inset -1px 0 0 rgba(255,255,255,0.03)",
  ];

  switch (variant) {
    case "none":
      // Control / baseline — no floor layer, no outer box-shadow at
      // all. Inset edges kept so the chassis still has defined rims
      // (without them the dark gradient looks unfinished). Use this
      // to A/B-judge whether a lit preset is actually adding value.
      return {
        floor: null,
        boxShadow: insetEdges.join(", "),
      };

    case "current":
      return {
        floor: (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-16 -bottom-10 h-32"
              style={{
                background:
                  "radial-gradient(55% 100% at 50% 0%, rgba(20,15,40,0.32) 0%, rgba(20,15,40,0.10) 45%, rgba(20,15,40,0) 80%)",
                filter: "blur(22px)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-4 -bottom-2 h-6"
              style={{
                background:
                  "radial-gradient(60% 100% at 50% 0%, rgba(20,15,40,0.30) 0%, rgba(20,15,40,0) 80%)",
                filter: "blur(8px)",
              }}
            />
          </>
        ),
        boxShadow: [
          "0 56px 112px -28px rgba(18,14,32,0.40)",
          "0 22px 48px -12px rgba(18,14,32,0.18)",
          "0 5px 12px -3px rgba(18,14,32,0.12)",
          ...insetEdges,
        ].join(", "),
      };

    case "editorial":
      // Stripe / Linear: ONE far-below ambient, wide + soft + faint.
      // Device reads "kissed by light", not "dramatically floating".
      return {
        floor: (
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-20 -bottom-16 h-36"
            style={{
              background:
                "radial-gradient(50% 100% at 50% 0%, rgba(20,15,40,0.16) 0%, rgba(20,15,40,0.04) 55%, rgba(20,15,40,0) 85%)",
              filter: "blur(28px)",
            }}
          />
        ),
        boxShadow: [
          "0 40px 80px -32px rgba(18,14,32,0.22)",
          "0 12px 28px -10px rgba(18,14,32,0.10)",
          ...insetEdges,
        ].join(", "),
      };

    case "contact":
      // Apple Store hardware page: tight contact ONLY. Device sits on
      // the page like a placed photograph. No bloom — confidence by
      // restraint.
      return {
        floor: (
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -bottom-3 h-8"
            style={{
              background:
                "radial-gradient(55% 100% at 50% 0%, rgba(20,15,40,0.38) 0%, rgba(20,15,40,0) 75%)",
              filter: "blur(10px)",
            }}
          />
        ),
        boxShadow: [
          "0 8px 18px -6px rgba(18,14,32,0.22)",
          "0 2px 6px -2px rgba(18,14,32,0.10)",
          ...insetEdges,
        ].join(", "),
      };

    case "studio":
      // Two-light cinematic: a cool ambient bloom (key) + a tight warm
      // contact band (fill). The warm tone reads like a desk lamp.
      return {
        floor: (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-24 -bottom-12 h-40"
              style={{
                background:
                  "radial-gradient(55% 100% at 50% 0%, rgba(40,38,78,0.26) 0%, rgba(40,38,78,0.06) 50%, rgba(40,38,78,0) 85%)",
                filter: "blur(30px)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-3 -bottom-1 h-5"
              style={{
                background:
                  "radial-gradient(60% 100% at 50% 0%, rgba(50,30,20,0.30) 0%, rgba(50,30,20,0) 80%)",
                filter: "blur(7px)",
              }}
            />
          </>
        ),
        boxShadow: [
          "0 48px 96px -28px rgba(28,22,60,0.34)",
          "0 16px 36px -10px rgba(28,22,60,0.14)",
          "0 4px 10px -3px rgba(28,22,60,0.10)",
          ...insetEdges,
        ].join(", "),
      };

    case "hairline":
      // Minimal: a barely-perceptible floor kiss + a refined 1-px
      // outline ring. For surfaces where the chassis must read as
      // material, not theatre.
      return {
        floor: (
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -bottom-4 h-10"
            style={{
              background:
                "radial-gradient(55% 100% at 50% 0%, rgba(20,15,40,0.12) 0%, rgba(20,15,40,0) 80%)",
              filter: "blur(12px)",
            }}
          />
        ),
        boxShadow: [
          "0 14px 32px -14px rgba(18,14,32,0.14)",
          "0 0 0 0.5px rgba(255,255,255,0.04)",
          ...insetEdges,
        ].join(", "),
      };
  }
}

export function POSImmersionSection() {
  const activity = useDemoStore((s) => s.activity);
  const selectActivity = useDemoStore((s) => s.selectActivity);
  const t = useTranslations("home.posImmersion");
  const tAct = useTranslations("demo.activities");

  // First-mount: if no activity is persisted, pick the first one so the
  // workspace renders immediately. selectActivity also primes the right
  // stage (order-type for restaurants, workspace for Market via the
  // store's skipOrderTypePicker branch).
  useEffect(() => {
    if (!activity) selectActivity(ACTIVITY_LIST[0].key);
  }, [activity, selectActivity]);

  return (
    // Desktop-only. The simulator is a dense, multi-pane workspace
    // (POS + cart + KDS + Backoffice) tuned for ≥1024px viewports;
    // forcing it onto a phone delivers a poor first impression
    // and inflates the mobile JS bundle. We hide the entire section
    // below lg — mobile visitors still see every other home section
    // (hero, narrative, store rail, pricing, etc.).
    <section
      data-scheme="light"
      className="relative bg-canvas overflow-hidden hidden lg:block"
    >
      <SectionDivider scheme="light" />

      {/* Soft studio atmosphere — radial brightening centered where the
          device sits. Sub-perceptible alone; together with the floor
          shadow it gives the device a sense of being placed in a lit
          space rather than dropped onto a flat color. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 60%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-14 md:pt-20 pb-16 md:pb-24">
        {/* Compact title block — single eyebrow + one-line headline.
            Deliberately spare: no standfirst, no feature bullets, no
            third paragraph. Anything more delays the product. */}
        <div className="text-center max-w-[44rem] mx-auto mb-8 md:mb-10">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
              {t("eyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-[clamp(2rem,4.6vw,3.25rem)] font-semibold tracking-[-0.022em] leading-[1.02] text-ink"
              style={{ textWrap: "balance" }}
            >
              {t("headline")}
            </h2>
          </Reveal>
        </div>

        {/* Business-type tab row — architectural, not pill-shaped.
            Radius (10px) matches the simulator's product cards so the
            row reads as part of the same engineered surface, not a
            floating consumer-app toolbar. Active state uses a subtle
            paper lift (bg-paper + ring + 1px shadow) instead of a
            heavy ink-on-paper inversion — Linear/Stripe vocabulary.
            Container is overflow-x scrollable so the row remains
            usable on narrow viewports. */}
        <Reveal delay={0.1}>
          <div className="flex justify-center mb-6 md:mb-8">
            <nav
              role="tablist"
              aria-label={t("tabsAria")}
              className="flex items-center gap-1 p-1 rounded-[12px] bg-fog/60 ring-1 ring-hairline overflow-x-auto scrollbar-hide max-w-full"
            >
              {ACTIVITY_LIST.map((a) => {
                const isActive = a.key === activity;
                return (
                  <button
                    key={a.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectActivity(a.key)}
                    className={
                      "shrink-0 w-[124px] h-8 text-[12.5px] font-medium rounded-[8px] transition-all duration-200 flex items-center justify-center " +
                      (isActive
                        ? "bg-paper text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                        : "text-ink-soft hover:text-ink hover:bg-paper/55")
                    }
                    style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                  >
                    {tAct(a.key)}
                  </button>
                );
              })}
            </nav>
          </div>
        </Reveal>

        {/* iPad mockup — landscape orientation, modern-iPad-Pro feel.
            Layer stack (back → front):
              1. Ambient floor bloom (wide, soft, blurred)
              2. Tight contact shadow (narrow, sharper)
              3. Chassis — machined-aluminum material
              4. Top-of-bezel sheen (light from above)
              5. Camera pinhole
              6. Inner screen with glass / bezel hairline join
              7. POSWorkspace painted inside the screen */}
        <Reveal delay={0.15}>
          <div className="relative mx-auto" style={{ maxWidth: "1020px" }}>
            {/* Floor shadow layers — driven by SHADOW_VARIANT at the
                top of this file. Swap to compare presets. */}
            {shadowPreset(SHADOW_VARIANT).floor}

            {/* iPad chassis — machined-aluminum gradient with a faint
                horizontal sheen across the top of the bezel band. The
                lighting (box-shadow stack) is variant-controlled; the
                chassis material itself stays identical. */}
            <div
              className="relative rounded-[26px] p-1.5 md:p-2"
              style={{
                background: [
                  // Subtle horizontal sheen across the very top of the
                  // chassis — like a faint reflection of an overhead
                  // light source on anodized metal.
                  "linear-gradient(178deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 10%, rgba(255,255,255,0) 24%)",
                  // Machined-aluminum base — three-stop vertical gradient,
                  // tuned a half-stop lighter for a more contemporary
                  // anodized feel.
                  "linear-gradient(180deg, #2f3236 0%, #232529 42%, #181a1e 100%)",
                ].join(", "),
                boxShadow: shadowPreset(SHADOW_VARIANT).boxShadow,
              }}
            >
              {/* Top-of-bezel highlight — narrow light wash across the
                  upper bezel only, so the chassis catches light at the
                  top edge the way a real device does. */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-12 rounded-t-[28px] pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)",
                }}
              />

              {/* Front-facing camera pinhole — modern iPad: 1×1 px on
                  this scale, positioned on the long bezel (landscape).
                  A faint outer glow ring sells the lens-vs-bezel join. */}
              <div
                aria-hidden
                className="absolute top-[5px] md:top-[6px] left-1/2 -translate-x-1/2 h-[4px] w-[4px] rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 35% 35%, #4a4c52 0%, #1a1c20 70%)",
                  boxShadow:
                    "inset 0 0 0 0.5px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.4)",
                }}
              />

              {/* Inner screen — the working POS.
                  • w-full forces the screen to fill the chassis interior
                    so the workspace below it always has the full width
                    to render its ProductBrowser + ActiveOrder grid.
                  • Explicit height (not max-height + aspect-ratio) makes
                    the dimensions deterministic across viewports.
                  • Chassis max-w is 1020 px so the screen ends up about
                    996 × min(70vh, 640) — natural iPad-Pro 3:2-ish
                    proportions, no shrink-to-content guessing.
                  • bg-night is the FALLBACK colour shown only behind
                    payment overlays (which are dark). The light cart-
                    half is painted by ProductBrowser (bg-paper), the
                    dark checkout-half by ActiveOrder (bg-night/95), so
                    the visible screen is a deliberate light/dark split
                    at the column boundary.
                  • Inset hairline + inner shadow at the glass / bezel
                    join — reads as recessed glass, not pasted color. */}
              <div
                className="relative w-full rounded-[22px] overflow-hidden bg-night"
                style={{
                  height: "min(70vh, 640px)",
                  boxShadow:
                    "inset 0 0 0 0.5px rgba(0,0,0,0.40), inset 0 1px 2px rgba(0,0,0,0.22)",
                }}
              >
                <POSWorkspace embedded />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Conversion line — single Free Trial CTA. No competing buttons.
            The hint above the button is plain instruction, not marketing. */}
        <Reveal delay={0.2}>
          <div className="mt-8 md:mt-10 flex flex-col items-center gap-3">
            <p className="text-[13px] text-ink-mute text-center max-w-[26rem]">
              {t("hint")}
            </p>
            <Button href="/start-free-trial" variant="primary" size="md">
              {t("cta")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
