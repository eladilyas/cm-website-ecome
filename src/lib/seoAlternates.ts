// Per-page canonical + hreflang builder.
//
// Why this exists: `alternates` set in `[locale]/layout.tsx` is INHERITED
// by every descendant page that does not override it. A layout has no way
// to know the page path, so the canonical it emits is only ever correct
// for the home page — every other route was declaring the home page as
// its canonical URL, which tells Google to drop it from the index. The
// layout no longer sets `alternates` at all; pages opt in through this
// helper with their own path.
//
// Path convention mirrors `sitemap.ts`: FR is the default locale and
// serves clean unprefixed URLs, EN lives under `/en`.

import { routing } from "@/i18n/routing";

/** BCP-47 tag per locale. `fr-MA` rather than bare `fr` because the
 *  audience is Moroccan French specifically. */
function hreflangTag(locale: string): string {
  return locale === "fr" ? "fr-MA" : locale;
}

/** Build the localized URL for `path` in `locale`.
 *  `path` is the route WITHOUT any locale prefix, leading slash included
 *  ("/pricing", "/solutions/cafe"). Pass "/" for the home page. */
function localizedPath(path: string, locale: string): string {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "");
  return locale === routing.defaultLocale
    ? clean || "/"
    : `/${locale}${clean}`;
}

/**
 * `alternates` block for a page's Metadata.
 *
 * @param path   route without locale prefix, e.g. "/pricing"
 * @param locale the active locale
 *
 * Emits a self-referencing canonical plus one hreflang per locale and an
 * `x-default` pointing at the FR (default-locale) URL.
 */
export function seoAlternates(path: string, locale: string) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[hreflangTag(l)] = localizedPath(path, l);
  }
  languages["x-default"] = localizedPath(path, routing.defaultLocale);

  return {
    canonical: localizedPath(path, locale),
    languages,
  };
}
