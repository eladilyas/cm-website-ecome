import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { CatalogHydrator } from "@/components/catalog/CatalogHydrator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// ── Site identity ───────────────────────────────────────────────────────
// Single source of truth re-used by metadata + structured data. Keep the
// description tight (under 160 chars) so it doesn't get truncated in
// Google SERPs.

const SITE = {
  name: "Caisse Manager",
  legalName: "Caisse Manager SARL",
  url: "https://caissemanager.com",
  description:
    "POS, inventory, kitchen, and multi-store software for Moroccan restaurants, cafés, bakeries, and retail. Cloud-based. Bilingual. Built for Morocco.",
  // Bilingual search terms — Moroccan operators search interchangeably
  // in French (logiciel de caisse, point de vente, gestion de stock) and
  // English (POS software, kitchen display). Both surfaces matter.
  keywords: [
    "POS Maroc",
    "logiciel de caisse Maroc",
    "système de caisse Maroc",
    "point de vente Maroc",
    "gestion de stock Maroc",
    "logiciel restaurant Maroc",
    "logiciel café Maroc",
    "logiciel boulangerie Maroc",
    "logiciel commerce Maroc",
    "caisse tactile Maroc",
    "gestion multi-magasins",
    "logiciel inventaire Maroc",
    "logiciel retail Maroc",
    "KDS Maroc",
    "kitchen display system Morocco",
    "self-order kiosk Morocco",
    "POS software Morocco",
    "restaurant management Morocco",
    "Caisse Manager",
  ],
  // Local business — Morocco. Casablanca registered office; service
  // covers the whole country. Update phone/address when ready to make
  // the LocalBusiness schema fully populated.
  locale: "fr_MA",
  country: "MA",
  city: "Casablanca",
} as const;

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  legalName: SITE.legalName,
  url: SITE.url,
  logo: `${SITE.url}/logo/cm-logo.svg`,
  description: SITE.description,
  address: {
    "@type": "PostalAddress",
    addressCountry: SITE.country,
    addressLocality: SITE.city,
  },
  areaServed: { "@type": "Country", name: "Morocco" },
  sameAs: [],
} as const;

const SOFTWARE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE.name,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "PointOfSale",
  operatingSystem: "Web, Android, iOS",
  description: SITE.description,
  url: SITE.url,
  offers: {
    "@type": "Offer",
    priceCurrency: "MAD",
    price: "0",
    description: "Free Basic plan · Pro from 250 MAD/month per counter",
  },
  audience: {
    "@type": "BusinessAudience",
    audienceType:
      "Restaurants, cafés, bakeries, retail, fast food, multi-store operators in Morocco",
  },
} as const;

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  inLanguage: ["en", "fr-MA", "ar-MA"],
  publisher: {
    "@type": "Organization",
    name: SITE.name,
    logo: `${SITE.url}/logo/cm-logo.svg`,
  },
} as const;

// ── Metadata ────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — POS & operations software for Morocco`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  alternates: {
    canonical: "/",
    languages: {
      "fr-MA": "/",
      "en": "/en",
      "x-default": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — POS & operations software for Morocco`,
    description: SITE.description,
    url: SITE.url,
    locale: SITE.locale,
    alternateLocale: ["en_US"],
    images: [
      {
        url: "/logo/cm-logo.svg",
        width: 379,
        height: 366,
        alt: `${SITE.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    images: ["/logo/cm-logo.svg"],
  },
  icons: {
    icon: "/logo/cm-logo.svg",
    apple: "/logo/cm-logo.svg",
  },
  category: "business",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Stamp <html lang> with the active locale so screen readers,
  // translation engines, and search crawlers attribute the page to
  // the right language. getLocale() reads next-intl's per-request
  // locale state set by the [locale] layout.
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {/* Structured data — Organization + WebSite + SoftwareApplication.
            Renders once in the root so every page inherits the org-level
            knowledge graph signal. Page-level schemas (Product, FAQ,
            Breadcrumb) layer on top from their respective page files. */}
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <Script
          id="ld-software"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_JSONLD) }}
        />
        <Script
          id="ld-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
        {/* CatalogHydrator is a server component — it runs the
            catalog reads once per request and hydrates the client
            provider that wraps the whole app. Every client component
            below has synchronous `useCatalog()` access.
            ─────────────────────────────────────────────────────
            SiteChrome (Header + Footer) is mounted by the
            [locale]/layout below NextIntlClientProvider, so its
            client components (Header, Footer) have access to
            useTranslations / useLocale. The admin route group
            renders its own AdminShell, never the marketing chrome —
            so admin works without an intl provider. */}
        <CatalogHydrator>{children}</CatalogHydrator>
      </body>
    </html>
  );
}
