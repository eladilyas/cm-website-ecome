"use client";

// Locale-aware footer information architecture.
//
// Six flat columns matching the website's logical IA. Each column is
// a single flat list (no nested sub-headings) so the eye scans each
// column in one pass — Apple/Stripe pattern.
//
// Every href resolves to a real route. No speculative links.
// Labels resolve through next-intl so FR and EN footers share the
// exact same structure (and the same component code path).

import { useTranslations } from "next-intl";

export type FooterLink = { label: string; href: string };

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export function useFooterColumns(): FooterColumn[] {
  const cols = useTranslations("footer.columns");
  const l = useTranslations("footer.links");

  return [
    {
      title: cols("solutions"),
      links: [
        { label: l("exploreSolutions"), href: "/#solutions" },
        { label: l("demo"), href: "/demo" },
        { label: l("pricing"), href: "/pricing" },
        { label: l("freeTrial"), href: "/start-free-trial" },
      ],
    },
    {
      title: cols("industries"),
      links: [
        { label: l("restaurants"), href: "/industries/restaurants" },
        { label: l("cafes"), href: "/industries/cafes" },
        { label: l("bakeries"), href: "/industries/bakery" },
        { label: l("retail"), href: "/industries/retail" },
        { label: l("bars"), href: "/industries/bar" },
        { label: l("beauty"), href: "/industries/beauty" },
      ],
    },
    {
      title: cols("store"),
      links: [
        { label: l("allHardware"), href: "/shop" },
        { label: l("swan1"), href: "/shop/swan-1-gen-2" },
        { label: l("swift2Pro"), href: "/shop/swift-2-pro" },
        { label: l("heron1"), href: "/shop/heron-1" },
      ],
    },
    {
      title: cols("company"),
      links: [
        { label: l("about"), href: "/about" },
        { label: l("careers"), href: "/careers" },
        { label: l("partnership"), href: "/partnership" },
      ],
    },
    {
      title: cols("supportLegal"),
      links: [
        { label: l("supportCenter"), href: "/support" },
        { label: l("contact"), href: "/support#contact" },
        { label: l("faq"), href: "/support#faq" },
        { label: l("account"), href: "/account" },
        { label: l("privacy"), href: "/legal/privacy" },
        { label: l("terms"), href: "/legal/terms" },
      ],
    },
  ];
}

export function useFooterLegalLinks(): FooterLink[] {
  const ll = useTranslations("footer.legalLinks");
  return [
    { label: ll("privacy"), href: "/legal/privacy" },
    { label: ll("terms"), href: "/legal/terms" },
  ];
}

export const FOOTER_SOCIAL: {
  label: string;
  href: string;
  icon: "x" | "linkedin" | "youtube";
}[] = [
  { label: "X (Twitter)", href: "https://x.com", icon: "x" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
  { label: "YouTube", href: "https://youtube.com", icon: "youtube" },
];
