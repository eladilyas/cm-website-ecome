// Sitemap — Next.js app router auto-generates /sitemap.xml from this
// export. Each indexable route emits one entry per locale, with
// `alternates.languages` carrying the hreflang map so Google knows
// the FR and EN URLs are the same page in different languages.
//
// URL strategy mirrors next-intl "as-needed":
//   • FR (default) — clean URLs:   https://caissemanager.com/shop
//   • EN           — prefixed:     https://caissemanager.com/en/shop
//
// Excluded from the sitemap:
//   • /account/**         — authenticated portal (no SEO value, robots
//                           also block-listed below)
//   • /signin, /signup    — auth gates (no SEO value)
//   • /checkout, /cart    — transactional surfaces with no organic intent
//
// Priorities reflect organic importance:
//   1.0  home
//   0.9  pricing, shop, demo
//   0.8  industries hub + child slugs, /about, /support
//   0.7  product detail pages, partnership, careers
//   0.5  legal, start-free-trial (intent-but-thin pages)

import type { MetadataRoute } from "next";
import { listPublicProducts } from "@/server/catalog/service";
import { routing } from "@/i18n/routing";

const SITE_URL = "https://caissemanager.com";

const INDUSTRY_SLUGS = [
  "restaurants",
  "cafes",
  "fast-food",
  "bakery",
  "retail",
  "multi-store",
  "bar-lounge",
  "beauty-services",
];

type RouteSpec = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

/** Build the locale-prefixed URL for a given route. The default
 *  locale (FR) keeps clean URLs; other locales get a /{locale} prefix. */
function localizedUrl(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return `${SITE_URL}${path}`;
  return `${SITE_URL}/${locale}${path === "/" ? "" : path}`;
}

/** Wrap a single route as N sitemap entries (one per locale) with
 *  hreflang alternates pointing at every other locale + x-default. */
function expandRoute(
  route: RouteSpec,
  lastModified: Date,
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    // hreflang convention: use the IETF tag for the locale. We anchor
    // French to fr-MA (the Moroccan variant we actually serve) so
    // Google routes Moroccan searchers here rather than France.
    const tag = locale === "fr" ? "fr-MA" : locale;
    languages[tag] = localizedUrl(route.path, locale);
  }
  // x-default tells Google which URL to fall back to when no locale
  // matches the user's Accept-Language — we point at French (Morocco
  // is the primary market).
  languages["x-default"] = localizedUrl(route.path, routing.defaultLocale);

  return routing.locales.map((locale) => ({
    url: localizedUrl(route.path, locale),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const catalog = await listPublicProducts();

  const staticRoutes: RouteSpec[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
    { path: "/shop", changeFrequency: "weekly", priority: 0.9 },
    { path: "/demo", changeFrequency: "weekly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/support", changeFrequency: "monthly", priority: 0.8 },
    { path: "/careers", changeFrequency: "monthly", priority: 0.7 },
    { path: "/partnership", changeFrequency: "monthly", priority: 0.7 },
    { path: "/start-free-trial", changeFrequency: "monthly", priority: 0.6 },
    { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  const industryRoutes: RouteSpec[] = INDUSTRY_SLUGS.map((slug) => ({
    path: `/industries/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const productRoutes: RouteSpec[] = catalog.map((p) => ({
    path: `/shop/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...industryRoutes, ...productRoutes].flatMap(
    (route) => expandRoute(route, now),
  );
}
