// /partnership/reseller — Reseller program detail (Partnership 3)
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  ProgramHero,
  NumberedSteps,
  BulletList,
  FeatureCards,
  ProgramCta,
} from "@/components/partnership/blocks";
import { SectionDivider } from "@/components/ui/SectionDivider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partnership.programs.reseller");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ResellerPage() {
  const t = await getTranslations("partnership.programs.reseller");
  const steps = t.raw("steps") as { title: string; body: string }[];
  const criteria = t.raw("criteria") as string[];
  const benefits = t.raw("benefits") as { title: string; body: string }[];
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
      <BulletList
        eyebrow={t("criteriaEyebrow")}
        title={t("criteriaTitle")}
        body={t("criteriaBody")}
        items={criteria}
        scheme="canvas"
      />
      <FeatureCards
        eyebrow={t("benefitsEyebrow")}
        title={t("benefitsTitle")}
        items={benefits}
        cols={3}
        scheme="paper"
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
