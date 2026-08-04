// /partnership/affiliate — Affiliate program detail (Partnership 2)
import type { Metadata } from "next";
import { seoAlternates } from "@/lib/seoAlternates";
import { getTranslations, getLocale } from "next-intl/server";
import {
  ProgramHero,
  NumberedSteps,
  FeatureCards,
  ProgramCta,
} from "@/components/partnership/blocks";
import { SectionDivider } from "@/components/ui/SectionDivider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("partnership.programs.affiliate");
  return {
    alternates: seoAlternates("/partnership/affiliate", locale), title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AffiliatePage() {
  const t = await getTranslations("partnership.programs.affiliate");
  const steps = t.raw("steps") as { title: string; body: string }[];
  const tools = t.raw("tools") as { title: string; body: string }[];
  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />
      <ProgramHero
        crumb={t("crumb")}
        eyebrow={t("eyebrow")}
        title={t("title")}
        body={t("body")}
      />
      <NumberedSteps
        eyebrow={t("stepsEyebrow")}
        title={t("stepsTitle")}
        items={steps}
        scheme="paper"
      />
      <FeatureCards
        eyebrow={t("toolsEyebrow")}
        title={t("toolsTitle")}
        items={tools}
        cols={3}
        scheme="canvas"
      />
      <ProgramCta
        eyebrow={t("ctaEyebrow")}
        title={t("ctaTitle")}
        body={t("ctaBody")}
        primaryLabel={t("ctaPrimary")}
        primaryHref="/support#contact"
        secondaryLabel={t("ctaSecondary")}
        secondaryHref="/partnership"
      />
    </main>
  );
}
