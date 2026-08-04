import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { seoAlternates } from "@/lib/seoAlternates";
import { HeroSection } from "@/components/sections/HeroSection";
import { LivePosPreviewSection } from "@/components/sections/LivePosPreviewSection";
import { SolutionsShowcaseSection } from "@/components/sections/SolutionsShowcaseSection";
import { IntegrationsSection } from "@/components/sections/IntegrationsSection";
import { PricingPreviewSection } from "@/components/sections/PricingPreviewSection";
import { StoreShowcaseSection } from "@/components/sections/StoreShowcaseSection";
import { IndustriesSection } from "@/components/sections/IndustriesSection";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";

// Home — the single most important indexable page on the site.
//
// This was `export const metadata` with hardcoded English strings, which
// meant the FR-default site served an English title and description on
// its highest-value URL. Now locale-aware: copy resolves from the
// `home.meta*` catalog keys, and the canonical/hreflang set comes from
// `seoAlternates` so `/` and `/en` each point at themselves.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("home");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: seoAlternates("/", locale),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaOgDescription"),
      url: locale === "fr" ? "/" : `/${locale}`,
    },
  };
}

// Real-product page spine — interaction-first conversion flow.
//
// Rhythm:
//   night  (hero · cinematic video + AI gradient headline) →
//   canvas (POS immersion · live simulator with tabs) →                    ← TRY-FIRST product moment
//   canvas (Solutions showcase · 8 alternating Apple-style chapters) →     ← STORYTELLING moment
//   paper  (integrations · ecosystem radial — "Connected by design") →
//   canvas (pricing preview — 3 plans + Explore more) →                    ← conversion preview
//   paper  (store showcase · 3 curated category tiles → /shop) →           ← store-exploration teaser
//   canvas (industries) →
//   night  (final CTA · Start Free Trial).                                 ← conversion CTA
//
// POS immersion sits IMMEDIATELY after the hero. The thesis: the fastest
// path to a paid trial is to let the visitor touch the product. Every
// section below the simulator supports the story; the simulator IS the
// story.
//
// Every section after the hero opens with a SectionDivider sized to the
// content container — Apple-style chapter break, contained not full-bleed.

export default async function HomePage() {
  const t = await getTranslations("home.finalCta");
  return (
    <>
      <HeroSection />
      <LivePosPreviewSection />
      <SolutionsShowcaseSection />
      <IntegrationsSection />
      <PricingPreviewSection />
      <StoreShowcaseSection />

      {/* ── Industries — premium masonry carousel ───────────────── */}
      <IndustriesSection />

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section data-scheme="dark" className="bg-night text-paper">
        <SectionDivider scheme="dark" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-28 md:py-40 text-center">
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-semibold tracking-[-0.022em] leading-[1.05]">
            {t("heading")}
          </h2>
          <p className="mt-6 text-[17px] md:text-[19px] text-paper/75 max-w-[34rem] mx-auto">
            {t("body")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button href="/start-free-trial" variant="invert" size="md">
              {t("primaryCta")}
            </Button>
            <Button href="/why" variant="outline" size="md">
              {t("secondaryCta")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
