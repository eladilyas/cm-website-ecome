// Terms — locale-aware, server-rendered.
//
// Placeholder copy. Replace with the finalized terms from your legal
// counsel before launch. The structure here is a starting outline only —
// it should not be relied on as a complete legal agreement.

import { getTranslations } from "next-intl/server";
import { LegalLayout, LegalH2, LegalP } from "@/components/legal/LegalLayout";

export async function generateMetadata() {
  const t = await getTranslations("legal");
  return {
    title: t("metaTermsTitle"),
    description: t("metaTermsDesc"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("legal");
  const tT = await getTranslations("legal.terms");
  return (
    <LegalLayout
      title={tT("title")}
      lastUpdated={t("lastUpdated")}
      intro={tT("intro")}
    >
      <LegalH2>{tT("h1")}</LegalH2>
      <LegalP>{tT("p1")}</LegalP>

      <LegalH2>{tT("h2")}</LegalH2>
      <LegalP>{tT("p2")}</LegalP>

      <LegalH2>{tT("h3")}</LegalH2>
      <LegalP>{tT("p3")}</LegalP>

      <LegalH2>{tT("h4")}</LegalH2>
      <LegalP>{tT("p4")}</LegalP>

      <LegalH2>{tT("h5")}</LegalH2>
      <LegalP>{tT("p5")}</LegalP>

      <LegalH2>{tT("h6")}</LegalH2>
      <LegalP>{tT("p6")}</LegalP>

      <LegalH2>{tT("h7")}</LegalH2>
      <LegalP>{tT("p7")}</LegalP>
    </LegalLayout>
  );
}
