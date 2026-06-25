// Per-locale layout — owns the <html lang> attribute and the
// NextIntlClientProvider that hydrates client components with the
// active locale's message catalog.
//
// Everything visual (chrome, body padding, font wiring) stays in the
// root layout. This layout's job is purely linguistic:
//   • Validates the URL locale against the supported list (404 if not)
//   • Provides messages to every client component below
//   • Stamps the correct <html lang> for screen readers + SEO

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { SiteChrome } from "@/components/layout/SiteChrome";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Per-locale metadata. Each /{locale} subtree gets its own
 *  default title + description in the right language, plus a
 *  hreflang map so search engines understand the FR ↔ EN pairing.
 *  The opengraph locale follows next-intl's IETF tag (fr → fr_MA,
 *  en → en_US) — fr_MA is what Facebook/LinkedIn actually expect
 *  for Moroccan French. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  // Mirror sitemap.ts: default locale → clean URL, others → /{locale}.
  const canonical = locale === routing.defaultLocale ? "/" : `/${locale}`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    const tag = l === "fr" ? "fr-MA" : l;
    languages[tag] = l === routing.defaultLocale ? "/" : `/${l}`;
  }
  languages["x-default"] = "/";

  return {
    title: { default: t("defaultTitle"), template: `%s | ${t("siteName")}` },
    description: t("defaultDescription"),
    alternates: { canonical, languages },
    openGraph: {
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      locale: locale === "fr" ? "fr_MA" : "en_US",
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => (l === "fr" ? "fr_MA" : "en_US")),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enables static rendering — call once per locale-aware request.
  setRequestLocale(locale);

  // Server-side session hint — checked here so SiteChrome → Header
  // can render the right chrome (chip vs Sign in link) on the first
  // SSR paint. Without this, the server doesn't know about the
  // visitor's auth state and the header renders a blank or
  // signed-out placeholder; on hydration the client reads
  // localStorage + useSession and the chip pops in, creating the
  // brief flash visible during locale toggles + page refreshes.
  //
  // We only check cookie *presence* (not validity) — that's enough
  // to render the optimistic chip immediately. AuthBridge resolves
  // the real session state shortly after mount; if the cookie is
  // expired, the chrome updates to the genuine signed-out state at
  // that point. Cheap server work — no DB call, no auth probe.
  const cookieStore = await cookies();
  const initialSessionHint = cookieStore
    .getAll()
    .some((c) => c.name.startsWith("better-auth"));

  return (
    <NextIntlClientProvider>
      <SiteChrome initialSessionHint={initialSessionHint}>{children}</SiteChrome>
    </NextIntlClientProvider>
  );
}
