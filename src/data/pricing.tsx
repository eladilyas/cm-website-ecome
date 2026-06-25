"use client";

// Pricing — locale-aware source of truth.
//
// Three tiers, three billing cycles, one comparison matrix. The
// shape is unchanged; only labels resolve through next-intl so /pricing
// + the homepage preview ship in both French and English without
// duplicating data.
//
// Numeric data (prices in MAD, included/excluded flags) stays in code
// because numbers don't translate. Plan slugs stay in code so URLs +
// CTAs remain stable across locales.

import { useTranslations } from "next-intl";

export type BillingCycle = "monthly" | "yearly" | "biennial";

export type PlanHighlight = { label: string; included: boolean };

export type Plan = {
  slug: "basic" | "pro" | "enterprise";
  name: string;
  tagline: string;
  description: string;
  prices: Record<BillingCycle, number | null>;
  isFree?: boolean;
  highlights: PlanHighlight[];
  ctaLabel: string;
  ctaHref: string;
  recommended?: boolean;
};

// Code-side flags — drive which of the 5 highlight slots get the
// included ✓ vs the muted ✗ on each plan. Mirrors the prior PLANS
// const exactly so the matrix doesn't drift from the cards.
const INCLUDED_BY_PLAN: Record<"basic" | "pro" | "enterprise", boolean[]> = {
  basic: [true, true, false, false, false],
  pro: [true, true, true, false, false],
  enterprise: [true, true, true, true, true],
};

export function usePlans(): Plan[] {
  const t = useTranslations("pricing.plans");
  const buildHighlights = (slug: "basic" | "pro" | "enterprise"): PlanHighlight[] => {
    const incs = INCLUDED_BY_PLAN[slug];
    return ["h1", "h2", "h3", "h4", "h5"].map((key, i) => ({
      label: t(`${slug}.highlights.${key}`),
      included: incs[i],
    }));
  };

  return [
    {
      slug: "basic",
      name: t("basic.name"),
      tagline: t("basic.tagline"),
      description: t("basic.description"),
      prices: { monthly: null, yearly: null, biennial: null },
      isFree: true,
      highlights: buildHighlights("basic"),
      ctaLabel: t("basic.ctaLabel"),
      ctaHref: "/start-free-trial",
    },
    {
      slug: "pro",
      name: t("pro.name"),
      tagline: t("pro.tagline"),
      description: t("pro.description"),
      prices: { monthly: 250, yearly: 190, biennial: 120 },
      recommended: true,
      highlights: buildHighlights("pro"),
      ctaLabel: t("pro.ctaLabel"),
      ctaHref: "/start-free-trial",
    },
    {
      slug: "enterprise",
      name: t("enterprise.name"),
      tagline: t("enterprise.tagline"),
      description: t("enterprise.description"),
      prices: { monthly: 350, yearly: 260, biennial: 170 },
      highlights: buildHighlights("enterprise"),
      ctaLabel: t("enterprise.ctaLabel"),
      ctaHref: "/start-free-trial?intent=enterprise",
    },
  ];
}

// ── Comparison matrix ────────────────────────────────────────────────────
// Authoritative side-by-side. Strings render verbatim; booleans render
// as BrandCheck (true) or a muted em-dash (false). Group titles +
// row labels + hints + string cells all flow through the catalog.

export type MatrixCell = boolean | string;

export type MatrixRow = {
  label: string;
  hint?: string;
  basic: MatrixCell;
  pro: MatrixCell;
  enterprise: MatrixCell;
};

export type MatrixGroup = {
  title: string;
  rows: MatrixRow[];
};

export function useComparison(): MatrixGroup[] {
  const tG = useTranslations("pricing.matrix");
  const tR = useTranslations("pricing.matrix.rows");
  return [
    {
      title: tG("groupWorkspace"),
      rows: [
        {
          label: tR("counters"),
          hint: tR("countersHint"),
          basic: tR("countersBasic"),
          pro: tR("countersPro"),
          enterprise: tR("countersEnterprise"),
        },
        {
          label: tR("multiSync"),
          hint: tR("multiSyncHint"),
          basic: false,
          pro: true,
          enterprise: true,
        },
        { label: tR("kds"), basic: false, pro: true, enterprise: true },
        { label: tR("delivery"), basic: false, pro: true, enterprise: true },
        {
          label: tR("branded"),
          hint: tR("brandedHint"),
          basic: false,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      title: tG("groupPlatform"),
      rows: [
        {
          label: tR("remote"),
          hint: tR("remoteHint"),
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          label: tR("storage"),
          hint: tR("storageHint"),
          basic: false,
          pro: false,
          enterprise: true,
        },
        {
          label: tR("api"),
          hint: tR("apiHint"),
          basic: false,
          pro: false,
          enterprise: true,
        },
        { label: tR("sso"), basic: false, pro: false, enterprise: true },
        { label: tR("uptime"), basic: false, pro: false, enterprise: true },
      ],
    },
    {
      title: tG("groupSupport"),
      rows: [
        { label: tR("chatEmail"), basic: true, pro: true, enterprise: true },
        { label: tR("phone"), basic: false, pro: true, enterprise: true },
        { label: tR("priority"), basic: false, pro: true, enterprise: true },
        { label: tR("onboarding"), basic: false, pro: false, enterprise: true },
      ],
    },
    {
      title: tG("groupHardware"),
      rows: [
        { label: tR("hwCompat"), basic: true, pro: true, enterprise: true },
        { label: tR("hwPeripheral"), basic: true, pro: true, enterprise: true },
        { label: tR("hwKitchen"), basic: false, pro: true, enterprise: true },
        { label: tR("hwBundles"), basic: false, pro: false, enterprise: true },
      ],
    },
  ];
}
