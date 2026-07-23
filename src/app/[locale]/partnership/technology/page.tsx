// /partnership/technology — API partner program (Partnership 4)
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  ProgramHero,
  NumberedSteps,
  FeatureCards,
  ProgramCta,
} from "@/components/partnership/blocks";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partnership.programs.technology");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function TechnologyPage() {
  const t = await getTranslations("partnership.programs.technology");
  const build = t.raw("build") as { title: string; body: string }[];
  const connected = t.raw("connected") as { title: string; body: string }[];
  const process = t.raw("process") as { title: string; body: string }[];
  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />
      <ProgramHero
        crumb={t("crumb")}
        eyebrow={t("eyebrow")}
        title={t("title")}
        body={t("body")}
      />
      <FeatureCards
        eyebrow={t("buildEyebrow")}
        title={t("buildTitle")}
        items={build}
        cols={2}
        scheme="paper"
      />
      <FeatureCards
        eyebrow={t("connectedEyebrow")}
        title={t("connectedTitle")}
        items={connected}
        cols={3}
        scheme="canvas"
      />
      <NumberedSteps
        eyebrow={t("processEyebrow")}
        title={t("processTitle")}
        items={process}
        scheme="paper"
      />
      {/* Docs teaser */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="rounded-2xl bg-paper ring-1 ring-hairline p-6 md:p-10 max-w-[46rem]">
          <Reveal>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
              {t("docsEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.25rem,2.4vw,1.75rem)] font-semibold tracking-[-0.014em] leading-[1.15] text-ink">
              {t("docsTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-[14.5px] leading-[1.6] text-ink-soft">
              {t("docsBody")}
            </p>
          </Reveal>
        </div>
      </section>
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
