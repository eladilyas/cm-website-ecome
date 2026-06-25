"use client";

// Support topic + FAQ seed data — locale-aware. The shape stays the same
// (id + label + description; topicId + question + answer) so existing
// consumers don't change; only the strings flow through next-intl.

import { useTranslations } from "next-intl";

export type SupportTopic = {
  id: string;
  label: string;
  description: string;
};

export type FAQ = {
  topicId: string;
  question: string;
  answer: string;
};

export function useSupportTopics(): SupportTopic[] {
  const t = useTranslations("support.topics");
  return [
    { id: "setup", label: t("setupLabel"), description: t("setupDesc") },
    { id: "hardware", label: t("hardwareLabel"), description: t("hardwareDesc") },
    { id: "payments", label: t("paymentsLabel"), description: t("paymentsDesc") },
    { id: "integrations", label: t("integrationsLabel"), description: t("integrationsDesc") },
    { id: "backoffice", label: t("backofficeLabel"), description: t("backofficeDesc") },
    { id: "mobile", label: t("mobileLabel"), description: t("mobileDesc") },
  ];
}

export function useSupportFaqs(): FAQ[] {
  const t = useTranslations("support.faqs");
  return [
    { topicId: "setup", question: t("setup1Q"), answer: t("setup1A") },
    { topicId: "setup", question: t("setup2Q"), answer: t("setup2A") },
    { topicId: "hardware", question: t("hardware1Q"), answer: t("hardware1A") },
    { topicId: "hardware", question: t("hardware2Q"), answer: t("hardware2A") },
    { topicId: "payments", question: t("payments1Q"), answer: t("payments1A") },
    { topicId: "payments", question: t("payments2Q"), answer: t("payments2A") },
    { topicId: "integrations", question: t("integrations1Q"), answer: t("integrations1A") },
    { topicId: "integrations", question: t("integrations2Q"), answer: t("integrations2A") },
    { topicId: "backoffice", question: t("backoffice1Q"), answer: t("backoffice1A") },
    { topicId: "backoffice", question: t("backoffice2Q"), answer: t("backoffice2A") },
    { topicId: "mobile", question: t("mobile1Q"), answer: t("mobile1A") },
    { topicId: "mobile", question: t("mobile2Q"), answer: t("mobile2A") },
  ];
}
