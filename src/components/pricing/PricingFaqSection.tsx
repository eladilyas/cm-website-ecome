"use client";

// Client island that builds the FAQ row array via useTranslations
// and feeds it to the animated accordion.
//
// Extracted so /pricing/page.tsx can stay a server component. The
// q+a strings are still resolved at render time from the next-intl
// client catalog (matches what the rest of the page does for
// interactive copy).

import { useTranslations } from "next-intl";
import { FaqAccordion, type FaqRow } from "@/components/pricing/FaqAccordion";

function buildRows(t: (key: string) => string): FaqRow[] {
  return [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
    { q: t("q6"), a: t("a6") },
    { q: t("q7"), a: t("a7") },
  ];
}

export function PricingFaqSection() {
  const t = useTranslations("pricing.faqs");
  return <FaqAccordion items={buildRows(t)} />;
}
