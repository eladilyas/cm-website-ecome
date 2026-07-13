"use client";

// Pricing — locale-aware source of truth.
//
// Two tiers, three billing cycles, one comparison matrix. Numbers stay
// in code (MAD HT, VAT computed at 20%) so no locale can accidentally
// misprice a plan. Copy resolves through next-intl.
//
// Structural changes from v1:
//   • Dropped the "basic" tier — the free plan sat outside the
//     commercial ladder and cannibalised Pro trials.
//   • Every price now surfaces both HT and TTC so the Moroccan buyer
//     doesn't have to compute VAT themselves.
//   • Enterprise carries structured detail blocks under "Stockage" +
//     "Intégrations" — the card renders them verbatim so the plan's
//     unique value is legible at a glance without a comparison table.
//   • New `useAddons()` hook exports the à-la-carte modules row
//     (KDS, Mobile POS, Kiosk, Inventory, Web app) with the same
//     HT/TTC/annual/24-month price ladder.

import { useTranslations } from "next-intl";

// VAT applied to every subscription — Moroccan standard rate.
export const VAT_RATE = 0.20;

/** Whole-MAD TTC from a whole-MAD HT amount, rounded to nearest MAD. */
export function ttc(ht: number): number {
  return Math.round(ht * (1 + VAT_RATE));
}

export type BillingCycle = "monthly" | "yearly" | "biennial";

export type PlanHighlight = {
  label: string;
  included: boolean;
  /** Optional structured content revealed under an included row — used
   *  by Enterprise's Storage + API integrations detail blocks. */
  detail?: PlanHighlightDetail;
};

export type PlanHighlightDetail =
  | {
      kind: "storage";
      includedLine: string;
      addonLines: string[];
      overageLine: string;
    }
  | {
      kind: "integrations";
      chips: { slug: string; label: string; color: string }[];
    };

export type Plan = {
  slug: "pro" | "enterprise";
  name: string;
  tagline: string;
  description: string;
  /** MAD HT per counter per month, per commitment length. */
  prices: Record<BillingCycle, number>;
  highlights: PlanHighlight[];
  ctaLabel: string;
  ctaHref: string;
  recommended?: boolean;
};

/** Add-on modules — priced per counter per month HT, additive to the
 *  base plan. Same commitment ladder as plans (monthly / yearly / 24mo)
 *  so the cost story is consistent everywhere. */
export type Addon = {
  slug: "kds" | "mobile-pos" | "kiosk" | "inventory" | "web-app";
  name: string;
  icon: AddonIcon;
  prices: Record<BillingCycle, number>;
};

export type AddonIcon = "kds" | "mobile" | "kiosk" | "box" | "globe";

// ── Plans ───────────────────────────────────────────────────────────────

const INCLUDED_BY_PLAN: Record<"pro" | "enterprise", boolean[]> = {
  pro: [true, true, true, false, false],
  enterprise: [true, true, true, true, true],
};

// Enterprise Storage + Integrations detail blocks. Structured so the
// card renders them verbatim; adding a new integration is one array push.
const INTEGRATIONS_CHIPS = [
  { slug: "glovo", label: "Glovo", color: "#FFA200" },
  { slug: "done", label: "Done", color: "#1B7CE0" },
  { slug: "yassir", label: "Yassir", color: "#7A2FD9" },
  { slug: "kooul", label: "Kooul", color: "#D63A1F" },
  { slug: "fantastic", label: "Fantastic", color: "#2A9D5A" },
  { slug: "odoo", label: "Odoo", color: "#8A5AD9" },
  { slug: "balance", label: "Balance", color: "#2C6FE0" },
  { slug: "syscal", label: "Syscal", color: "#6B7280" },
];

export function usePlans(): Plan[] {
  const t = useTranslations("pricing.plans");

  const build = (
    slug: "pro" | "enterprise",
    detailByRow: Record<number, PlanHighlightDetail | undefined>,
  ): PlanHighlight[] => {
    const incs = INCLUDED_BY_PLAN[slug];
    return ["h1", "h2", "h3", "h4", "h5"].map((key, i) => ({
      label: t(`${slug}.highlights.${key}`),
      included: incs[i],
      detail: detailByRow[i],
    }));
  };

  return [
    {
      slug: "pro",
      name: t("pro.name"),
      tagline: t("pro.tagline"),
      description: t("pro.description"),
      prices: { monthly: 260, yearly: 195, biennial: 130 },
      recommended: true,
      highlights: build("pro", {}),
      ctaLabel: t("pro.ctaLabel"),
      ctaHref: "/start-free-trial",
    },
    {
      slug: "enterprise",
      name: t("enterprise.name"),
      tagline: t("enterprise.tagline"),
      description: t("enterprise.description"),
      prices: { monthly: 350, yearly: 260, biennial: 170 },
      highlights: build("enterprise", {
        3: {
          kind: "storage",
          includedLine: t("enterprise.storage.includedLine"),
          addonLines: [
            t("enterprise.storage.addonPlus"),
            t("enterprise.storage.addonMax"),
          ],
          overageLine: t("enterprise.storage.overageLine"),
        },
        4: {
          kind: "integrations",
          chips: INTEGRATIONS_CHIPS,
        },
      }),
      ctaLabel: t("enterprise.ctaLabel"),
      ctaHref: "/start-free-trial?intent=enterprise",
    },
  ];
}

// ── Add-on modules ──────────────────────────────────────────────────────
// One per row on /pricing under the two plans. Prices are per counter per
// month HT — same commitment ladder (monthly / yearly / biennial) as
// plans so admins can quote a full stack without switching mental models.

export function useAddons(): Addon[] {
  const t = useTranslations("pricing.addons");
  return [
    {
      slug: "kds",
      name: t("kds.name"),
      icon: "kds",
      prices: { monthly: 60, yearly: 45, biennial: 30 },
    },
    {
      slug: "mobile-pos",
      name: t("mobilePos.name"),
      icon: "mobile",
      prices: { monthly: 60, yearly: 45, biennial: 30 },
    },
    {
      slug: "kiosk",
      name: t("kiosk.name"),
      icon: "kiosk",
      prices: { monthly: 500, yearly: 375, biennial: 250 },
    },
    {
      slug: "inventory",
      name: t("inventory.name"),
      icon: "box",
      prices: { monthly: 200, yearly: 150, biennial: 100 },
    },
    {
      slug: "web-app",
      name: t("webApp.name"),
      icon: "globe",
      prices: { monthly: 300, yearly: 225, biennial: 150 },
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
          pro: tR("countersPro"),
          enterprise: tR("countersEnterprise"),
        },
        {
          label: tR("multiSync"),
          hint: tR("multiSyncHint"),
          pro: true,
          enterprise: true,
        },
        { label: tR("kds"), pro: true, enterprise: true },
        { label: tR("delivery"), pro: true, enterprise: true },
        {
          label: tR("branded"),
          hint: tR("brandedHint"),
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
          pro: true,
          enterprise: true,
        },
        {
          label: tR("storage"),
          hint: tR("storageHint"),
          pro: false,
          enterprise: true,
        },
        {
          label: tR("api"),
          hint: tR("apiHint"),
          pro: false,
          enterprise: true,
        },
        { label: tR("sso"), pro: false, enterprise: true },
        { label: tR("uptime"), pro: false, enterprise: true },
      ],
    },
    {
      title: tG("groupSupport"),
      rows: [
        { label: tR("chatEmail"), pro: true, enterprise: true },
        { label: tR("phone"), pro: true, enterprise: true },
        { label: tR("priority"), pro: true, enterprise: true },
        { label: tR("onboarding"), pro: false, enterprise: true },
      ],
    },
    {
      title: tG("groupHardware"),
      rows: [
        { label: tR("hwCompat"), pro: true, enterprise: true },
        { label: tR("hwPeripheral"), pro: true, enterprise: true },
        { label: tR("hwKitchen"), pro: true, enterprise: true },
        { label: tR("hwBundles"), pro: false, enterprise: true },
      ],
    },
  ];
}
