// Privacy — locale-aware, server-rendered.
//
// Placeholder copy. Replace with the finalized policy from your legal
// counsel before launch. The structure here is a starting outline only —
// it should not be relied on as a complete legal policy.

import { getTranslations } from "next-intl/server";
import { LegalLayout, LegalH2, LegalP } from "@/components/legal/LegalLayout";

export async function generateMetadata() {
  const t = await getTranslations("legal");
  return {
    title: t("metaPrivacyTitle"),
    description: t("metaPrivacyDesc"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const tP = await getTranslations("legal.privacy");
  return (
    <LegalLayout
      title={tP("title")}
      lastUpdated={t("lastUpdated")}
      intro={tP("intro")}
    >
      <LegalH2>{tP("h1")}</LegalH2>
      <LegalP>{tP("p1")}</LegalP>

      <LegalH2>{tP("h2")}</LegalH2>
      <LegalP>{tP("p2")}</LegalP>

      <LegalH2>{tP("h3")}</LegalH2>
      <LegalP>{tP("p3")}</LegalP>

      <LegalH2>{tP("h4")}</LegalH2>
      <LegalP>{tP("p4")}</LegalP>

      <LegalH2>{tP("h5")}</LegalH2>
      <LegalP>{tP("p5")}</LegalP>
    </LegalLayout>
  );
}
