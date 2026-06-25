import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/sections/HeroSection";
import { POSImmersionSection } from "@/components/sections/POSImmersionSection";
import { SolutionsShowcaseSection } from "@/components/sections/SolutionsShowcaseSection";
import { IntegrationsSection } from "@/components/sections/IntegrationsSection";
import { PricingPreviewSection } from "@/components/sections/PricingPreviewSection";
import { StoreShowcaseSection } from "@/components/sections/StoreShowcaseSection";
import { IndustriesSection } from "@/components/sections/IndustriesSection";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";

// Home — the single most important indexable page on the site. Title +
// description are tuned for both Moroccan French search ("logiciel de
// caisse", "point de vente") and English ("POS software Morocco").
// Canonical = "/" overrides the inherited root canonical only as an
// explicit safety net.
export const metadata: Metadata = {
  title: "Modern POS for restaurants, cafés & retail in Morocco",
  description:
    "Caisse Manager is the all-in-one POS, inventory, kitchen, and multi-store platform built for Moroccan operators. Try the live simulator. Free Basic plan, Pro from 250 MAD/month.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Caisse Manager — Modern POS for Morocco",
    description:
      "POS, inventory, kitchen, multi-store. Built for Moroccan restaurants, cafés, bakeries, and retail. Try the live simulator.",
    url: "/",
  },
};

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
      <POSImmersionSection />
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
            <Button href="/products/pos" variant="outline" size="md">
              {t("secondaryCta")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
