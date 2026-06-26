"use client";

// Locale-aware navigation source of truth.
//
// The IA was previously a static `const NAV` with hardcoded English
// labels. Now it lives in a hook so every label resolves through the
// next-intl message catalog and stays in sync with the active locale.
//
// Structure (unchanged):
//   • Five top-level items: Solutions · Store · Pricing · Support · Company
//   • "Solutions" and "Support" use the {items + groups} pattern — a
//     primary big-text list on the left, supporting groups on the right.
//   • "Store" uses {groups} only — product families.
//   • "Pricing" is a direct link with no dropdown.
//   • "Company" uses {items + groups} — primary destinations + sub-groups.

import { useTranslations } from "next-intl";

export type NavSubItem = {
  label: string;
  href: string;
  description?: string;
};

export type NavGroup = {
  title: string;
  items: NavSubItem[];
};

export type NavItem = {
  label: string;
  href?: string;
  groups?: NavGroup[];
  items?: NavSubItem[];
};

/** Build the navigation tree from the active locale's catalog.
 *  Same shape as the legacy `NAV` const so every consumer
 *  (Header, NavExpansion, MobileMenu) keeps working unchanged. */
export function useNavMenu(): NavItem[] {
  const t = useTranslations("nav.menuLabels");
  const s = useTranslations("nav.solutionsDropdown");
  const sup = useTranslations("nav.supportDropdown");
  const co = useTranslations("nav.companyDropdown");

  return [
    // ─── Solutions ─────────────────────────────────────────────
    {
      label: t("solutions"),
      items: [
        { label: s("cafes"), href: "/demo#cafe" },
        { label: s("bakery"), href: "/demo#bakery" },
        { label: s("fastFood"), href: "/demo#fast-food" },
        { label: s("restaurants"), href: "/demo#dine-in" },
        { label: s("beauty"), href: "/demo#beauty" },
        { label: s("barber"), href: "/demo#barber" },
        { label: s("market"), href: "/demo#market" },
      ],
      groups: [
        {
          title: s("whyTitle"),
          items: [
            {
              label: s("platformLabel"),
              href: "/#platform",
              description: s("platformDesc"),
            },
            {
              label: s("integrationsLabel"),
              href: "/#integrations",
              description: s("integrationsDesc"),
            },
            {
              label: s("hardwareLabel"),
              href: "/shop",
              description: s("hardwareDesc"),
            },
            { label: s("seePricing"), href: "/pricing" },
          ],
        },
        {
          title: s("getStartedTitle"),
          items: [
            {
              label: s("trialLabel"),
              href: "/start-free-trial",
              description: s("trialDesc"),
            },
            {
              label: s("demoLabel"),
              href: "/demo",
              description: s("demoDesc"),
            },
            { label: s("salesLabel"), href: "/support#contact" },
          ],
        },
      ],
    },

    // ─── Store ─────────────────────────────────────────────────
    // Flat 8-category taxonomy. POS first so the dropdown opens on
    // the headline product family.
    {
      label: t("store"),
      href: "/shop",
      items: [
        { label: "POS", href: "/shop?category=pos" },
        { label: "Handheld", href: "/shop?category=handheld" },
        { label: "Kiosk", href: "/shop?category=kiosk" },
        { label: "Peripherals", href: "/shop?category=peripherals" },
        { label: "Syscall", href: "/shop?category=syscall" },
        { label: "Accessories", href: "/shop?category=accessories" },
        { label: "Consumables", href: "/shop?category=consumables" },
        { label: "Access & Presence", href: "/shop?category=access-presence" },
      ],
    },

    // ─── Pricing ───────────────────────────────────────────────
    { label: t("pricing"), href: "/pricing" },

    // ─── Support ───────────────────────────────────────────────
    {
      label: t("support"),
      items: [
        { label: sup("helpCenter"), href: "/support" },
        { label: sup("faq"), href: "/support#faq" },
        { label: sup("contactSales"), href: "/support#contact" },
      ],
      groups: [
        {
          title: sup("onboardingTitle"),
          items: [
            { label: s("trialLabel"), href: "/start-free-trial", description: sup("trialDesc") },
            { label: s("demoLabel"), href: "/demo", description: sup("demoDesc") },
            { label: sup("hardwareStore"), href: "/shop" },
          ],
        },
        {
          title: sup("accountTitle"),
          items: [
            { label: sup("signIn"), href: "/signin" },
            { label: sup("ordersLabel"), href: "/account/orders", description: sup("ordersDesc") },
            { label: sup("financingLabel"), href: "/account/financing", description: sup("financingDesc") },
            { label: sup("profile"), href: "/account/profile" },
          ],
        },
      ],
    },

    // ─── Company ───────────────────────────────────────────────
    {
      label: t("company"),
      items: [
        { label: co("about"), href: "/about" },
        { label: co("careers"), href: "/careers" },
        { label: co("partnership"), href: "/partnership" },
      ],
      groups: [
        {
          title: co("workTitle"),
          items: [
            { label: co("rolesLabel"), href: "/careers", description: co("rolesDesc") },
            { label: co("partnerLabel"), href: "/partnership", description: co("partnerDesc") },
            { label: co("talkSales"), href: "/support#contact" },
          ],
        },
        {
          title: co("trustTitle"),
          items: [
            { label: co("privacy"), href: "/legal/privacy" },
            { label: co("terms"), href: "/legal/terms" },
          ],
        },
      ],
    },
  ];
}
