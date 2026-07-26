// /partnership/support — Partner support page (Partnership 5)
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  ProgramHero,
  StatsBand,
  FeatureCards,
  BulletList,
  ContactChannels,
  ProgramCta,
} from "@/components/partnership/blocks";
import { SectionDivider } from "@/components/ui/SectionDivider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partnership.programs.support");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PartnerSupportPage() {
  const t = await getTranslations("partnership.programs.support");
  const stats = t.raw("stats") as {
    value: string;
    label: string;
    note: string;
  }[];
  const operate = t.raw("operate") as { title: string; body: string }[];
  const promises = t.raw("promises") as string[];
  const channels = t.raw("channels") as { title: string; body: string }[];
  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />
      <ProgramHero
        crumb={t("crumb")}
        eyebrow={t("eyebrow")}
        title={t("title")}
        body={t("body")}
      />
      <StatsBand
        eyebrow={t("statsEyebrow")}
        title={t("statsTitle")}
        items={stats}
        scheme="paper"
      />
      <FeatureCards
        eyebrow={t("operateEyebrow")}
        title={t("operateTitle")}
        items={operate}
        cols={3}
        scheme="canvas"
      />
      <BulletList
        eyebrow={t("promisesEyebrow")}
        title={t("promisesTitle")}
        body={t("promisesBody")}
        items={promises}
        scheme="paper"
      />
      <ContactChannels
        eyebrow={t("channelsEyebrow")}
        title={t("channelsTitle")}
        items={channels}
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
