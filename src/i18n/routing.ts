// next-intl routing config — single source of truth for which locales
// the site supports and how they appear in URLs.
//
// Locale strategy for the Moroccan B2B market:
//   • French ("fr") is the default — it's the dominant business
//     language in Morocco and the language most operators read
//     contracts, invoices, and POS instructions in.
//   • English ("en") is the secondary — used by multi-national
//     hospitality groups, expats, and tourism-facing operators.
//
// URL strategy: "as-needed" prefix.
//   • French URLs stay clean: /shop, /pricing, /checkout
//   • English URLs are prefixed: /en/shop, /en/pricing
//   This keeps the Moroccan default audience on canonical URLs
//   without a redirect tax and signals to search engines that
//   French is the primary market language.

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"] as const,
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
