// Privacy policy — locale-aware, server-rendered.
//
// Copy sourced from Caisse Manager's official policy (loi 09-08
// compliant, effective 17 July 2026). Every section is keyed under
// `legal.privacy.sections[i]` in the i18n catalog so future updates
// touch one place per locale.

import type { Metadata } from "next";
import { seoAlternates } from "@/lib/seoAlternates";
import { getTranslations, getLocale } from "next-intl/server";
import { LegalLayout, LegalH2, LegalP } from "@/components/legal/LegalLayout";

type Section = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  return {
    alternates: seoAlternates("/legal/privacy", locale),
    title: t("metaPrivacyTitle"),
    description: t("metaPrivacyDesc"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const tP = await getTranslations("legal.privacy");
  const sections = tP.raw("sections") as Section[];
  return (
    <LegalLayout
      title={tP("title")}
      lastUpdated={tP("effectiveDate")}
      intro={tP("intro")}
    >
      {sections.map((s) => (
        <div key={s.heading}>
          <LegalH2>{s.heading}</LegalH2>
          {s.paragraphs.map((p, i) => (
            <LegalP key={i}>{p}</LegalP>
          ))}
          {s.bullets && s.bullets.length > 0 && (
            <ul className="mt-3 mb-6 space-y-2 pl-5 list-disc marker:text-ink-mute text-[14.5px] leading-[1.6] text-ink-soft">
              {s.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </LegalLayout>
  );
}
