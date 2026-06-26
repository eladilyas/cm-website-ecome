// /pricing — flagship pricing experience.
//
// Page rhythm:
//   1. Hero (canvas)                — eyebrow + headline + sub + warm halo
//   2. Plans grid                   — three cards, all 3 prices visible passively
//   3. Trust strip                  — four purchase-anxiety reducers
//   4. Comparison matrix            — full side-by-side feature table
//   5. Hardware callout             — bridge to /shop + monthly bundle pitch
//   6. FAQ accordion                — animated expanding rows
//   7. Final CTA (night)            — start-trial + try-demo
//
// SERVER COMPONENT. All static copy resolves via `getTranslations()`
// at request time so the markup ships fully rendered. Interactive
// pieces (Reveal animations, pricing card buttons, comparison matrix
// hover state, FAQ accordion) live in narrow client islands.

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { TrustStrip } from "@/components/pricing/TrustStrip";
import { ComparisonMatrix } from "@/components/pricing/ComparisonMatrix";
import { HardwareCallout } from "@/components/pricing/HardwareCallout";
import { PricingPlansSection } from "@/components/pricing/PricingPlansSection";
import { PricingFaqSection } from "@/components/pricing/PricingFaqSection";

export default async function PricingPage() {
  const t = await getTranslations("pricing");

  // Catalog stores the FAQ-body sentence with a <link>…</link> marker so
  // each locale can wrap the "Ask the team" link inside its natural
  // sentence position. Split and stitch with a locale-aware Link.
  const faqBodyRaw = t.raw("faqBody");
  const faqBody = typeof faqBodyRaw === "string" ? faqBodyRaw : "";
  const [faqBefore, faqLinkAndAfter] = faqBody.split("<link>");
  const [faqLink, faqAfter] = (faqLinkAndAfter ?? "").split("</link>");

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section data-scheme="light" className="relative overflow-hidden bg-canvas">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] -z-0"
          style={{
            background:
              "radial-gradient(55% 80% at 50% 0%, rgba(225,29,42,0.10) 0%, rgba(225,29,42,0.04) 38%, rgba(225,29,42,0) 75%)",
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 md:pt-28 pb-10 md:pb-14 text-center">
          <Reveal>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.20em] text-ink-mute mb-4">
              {t("heroEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="text-[clamp(2rem,4.4vw,3.5rem)] font-semibold tracking-[-0.022em] leading-[1.02] text-ink max-w-[20ch] mx-auto"
              style={{ textWrap: "balance" }}
            >
              {t("heroHeadline")}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-[15px] md:text-[16px] leading-[1.55] text-ink-soft max-w-[38rem] mx-auto">
              {t("heroBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── PLANS — three cards with all 3 commitment tiers visible ──── */}
      <section data-scheme="light" className="relative bg-canvas">
        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pb-20 md:pb-28">
          <PricingPlansSection reassureText={t("plansReassure")} />
        </div>
      </section>

      {/* ── TRUST STRIP ────────────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-24">
          <div className="max-w-[40rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.20em] text-ink-mute mb-3">
                {t("whyTeamsEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2
                className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink"
                style={{ textWrap: "balance" }}
              >
                {t("whyTeamsTitleA")}{" "}
                <span className="text-ink-mute">{t("whyTeamsTitleB")}</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.08}>
            <TrustStrip />
          </Reveal>
        </div>
      </section>

      {/* ── COMPARISON MATRIX ──────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-canvas">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <div className="max-w-[40rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.20em] text-ink-mute mb-3">
                {t("compareEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2
                className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink"
                style={{ textWrap: "balance" }}
              >
                {t("compareTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[14px] md:text-[14.5px] leading-[1.55] text-ink-soft max-w-[34rem]">
                {t("compareBody")}
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <ComparisonMatrix />
          </Reveal>
        </div>
      </section>

      {/* ── HARDWARE CALLOUT ───────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <Reveal>
            <HardwareCallout />
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-canvas">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 md:gap-14">
            <div>
              <Reveal>
                <p className="text-[11px] font-medium uppercase tracking-[0.20em] text-ink-mute mb-3">
                  {t("faqEyebrow")}
                </p>
              </Reveal>
              <Reveal delay={0.04}>
                <h2
                  className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink max-w-[14ch]"
                  style={{ textWrap: "balance" }}
                >
                  {t("faqTitle")}
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-4 text-[13.5px] leading-[1.6] text-ink-soft max-w-[26rem]">
                  {faqBefore}
                  <Link
                    href="/support"
                    className="text-ink underline underline-offset-4 decoration-hairline-strong hover:decoration-ink"
                  >
                    {faqLink}
                  </Link>
                  {faqAfter}
                </p>
              </Reveal>
            </div>
            <PricingFaqSection />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section data-scheme="dark" className="relative bg-night text-paper overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
          style={{
            background:
              "radial-gradient(50% 100% at 50% 0%, rgba(225,29,42,0.18) 0%, rgba(225,29,42,0.05) 45%, rgba(225,29,42,0) 78%)",
          }}
        />
        <SectionDivider scheme="dark" />
        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32 text-center">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold tracking-[-0.02em] leading-[1.08]">
              {t("finalTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-4 text-[15px] md:text-[16px] leading-[1.55] text-paper/72 max-w-[34rem] mx-auto">
              {t("finalBody")}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <Button href="/start-free-trial" variant="invert" size="lg">
                {t("finalPrimaryCta")}
              </Button>
              <Link
                href="/demo"
                className="h-11 px-6 inline-flex items-center text-[14px] font-medium rounded-full border border-paper/20 text-paper/85 hover:bg-white/[0.06] hover:text-paper transition-colors"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {t("finalSecondaryCta")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
