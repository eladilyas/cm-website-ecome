// Search index — every entry points to a route that exists in /app.
//
// Source of truth for what the header search can find. Keep this in sync
// with the IA: when a new page ships, add an entry; when a page is
// removed, prune its entry. Search results that 404 destroy trust faster
// than any other navigation bug.
//
// Localized strings live in messages/{locale}.json under
// `search.entries.{id}.title` / `.description` and `search.categories.{id}`.
// This file holds only the IDs, hrefs, and the merged FR+EN keyword
// list (so search matches in either language).

import { useMemo } from "react";
import { useTranslations } from "next-intl";

export type SearchCategoryId =
  | "getStarted"
  | "solutions"
  | "store"
  | "platform"
  | "helpLegal";

export type SearchEntry = {
  /** Stable ID — maps to `search.entries.<id>` in message catalogs. */
  id: string;
  title: string;
  description?: string;
  href: string;
  category: SearchCategoryId;
  categoryLabel: string;
  /** Synonyms — case-insensitive substring match in addition to title. */
  keywords?: string[];
};

type SearchRef = {
  id: string;
  href: string;
  category: SearchCategoryId;
  /** Synonyms in EN + FR so matches work across both locales. */
  keywords?: string[];
  /** True when this entry has no description (e.g. legal pages). */
  noDescription?: boolean;
};

const SEARCH_REFS: SearchRef[] = [
  // ─── Get started ────────────────────────────────────────────────────
  {
    id: "trial",
    href: "/start-free-trial",
    category: "getStarted",
    keywords: ["sign up", "signup", "trial", "free", "try", "essai", "gratuit", "tester"],
  },
  {
    id: "demo",
    href: "/demo",
    category: "getStarted",
    keywords: ["sandbox", "preview", "tour", "demo", "démo", "essai", "preview"],
  },
  {
    id: "pricing",
    href: "/pricing",
    category: "getStarted",
    keywords: ["plans", "cost", "price", "billing", "tarifs", "prix", "facturation"],
  },

  // ─── Solutions ──────────────────────────────────────────────────────
  {
    id: "cafe",
    href: "/demo#cafe",
    category: "solutions",
    keywords: ["coffee", "cafe", "café", "pastry", "takeaway", "espresso", "à emporter"],
  },
  {
    id: "bakery",
    href: "/demo#bakery",
    category: "solutions",
    keywords: ["bakery", "boulangerie", "bread", "pain", "baguette", "croissant", "viennoiserie", "pastry", "cake", "pâtisserie"],
  },
  {
    id: "fastFood",
    href: "/demo#fast-food",
    category: "solutions",
    keywords: ["burger", "combo", "quick service", "fries", "drive-thru", "fast-food", "snack", "restauration rapide"],
  },
  {
    id: "restaurant",
    href: "/demo#dine-in",
    category: "solutions",
    keywords: ["restaurant", "dining", "dine-in", "table", "service", "courses", "salle", "couvert"],
  },
  {
    id: "beauty",
    href: "/demo#beauty",
    category: "solutions",
    keywords: ["beauty", "salon", "hair", "nails", "manicure", "pedicure", "spa", "facial", "massage", "appointment", "booking", "calendar", "beauté", "ongles", "soins", "rendez-vous", "agenda"],
  },
  {
    id: "barber",
    href: "/demo#barber",
    category: "solutions",
    keywords: ["barber", "barbershop", "haircut", "fade", "shave", "beard", "men", "grooming", "appointment", "booking", "calendar", "barbier", "coupe", "barbe", "rasage"],
  },
  {
    id: "retail",
    href: "/demo#market",
    category: "solutions",
    keywords: ["market", "retail", "grocery", "shop", "scan", "barcode", "épicerie", "boutique", "alimentation", "détail"],
  },

  // ─── Store ──────────────────────────────────────────────────────────
  { id: "shopAll", href: "/shop", category: "store", keywords: ["store", "shop", "devices", "hardware", "boutique", "matériel"] },
  { id: "swan1", href: "/shop/swan-1-gen-2", category: "store", keywords: ["pos", "terminal", "counter", "swan", "caisse", "comptoir"] },
  { id: "swan1k", href: "/shop/swan-1k-gen-2", category: "store", keywords: ["pos", "terminal", "vesa", "wall", "swan", "mural"] },
  { id: "swift1Pro", href: "/shop/swift-1-pro", category: "store", keywords: ["mobile", "handheld", "nfc", "swift", "portable"] },
  { id: "swift2Pro", href: "/shop/swift-2-pro", category: "store", keywords: ["mobile", "handheld", "printer", "swift", "imprimante"] },
  { id: "swift2Ultra", href: "/shop/swift-2-ultra", category: "store", keywords: ["mobile", "handheld", "printer", "label", "swift", "étiquette"] },
  { id: "heron1", href: "/shop/heron-1", category: "store", keywords: ["kiosk", "self-order", "floor", "heron", "borne", "libre-service"] },
  { id: "heron1Mini", href: "/shop/heron-1-mini", category: "store", keywords: ["kiosk", "self-order", "counter", "heron", "borne", "comptoir"] },

  // ─── Platform ───────────────────────────────────────────────────────
  {
    id: "platform",
    href: "/#platform",
    category: "platform",
    keywords: ["ecosystem", "pos", "kds", "kiosk", "qr menu", "customer display", "queue", "tpe", "écosystème", "borne", "afficheur"],
  },
  {
    id: "integrations",
    href: "/#integrations",
    category: "platform",
    keywords: ["odoo", "cmi", "glovo", "brehm", "wafasalaf", "payments", "delivery", "erp", "paiement", "livraison", "intégration"],
  },

  // ─── Help & legal ───────────────────────────────────────────────────
  { id: "helpCenter", href: "/support", category: "helpLegal", keywords: ["support", "docs", "documentation", "help", "aide", "assistance"] },
  { id: "faq", href: "/support#faq", category: "helpLegal", noDescription: true, keywords: ["faq", "questions", "answers", "questions", "réponses"] },
  { id: "contactSales", href: "/support#contact", category: "helpLegal", keywords: ["contact", "sales", "talk", "human", "email", "phone", "commercial", "appel", "téléphone"] },
  { id: "about", href: "/about", category: "helpLegal", keywords: ["company", "team", "story", "entreprise", "équipe", "histoire"] },
  { id: "privacy", href: "/legal/privacy", category: "helpLegal", noDescription: true, keywords: ["privacy", "confidentialité", "rgpd"] },
  { id: "terms", href: "/legal/terms", category: "helpLegal", noDescription: true, keywords: ["terms", "conditions", "cgv", "cgu"] },
];

const CATEGORY_ORDER: SearchCategoryId[] = [
  "getStarted",
  "solutions",
  "store",
  "platform",
  "helpLegal",
];

/**
 * Locale-aware search index. Resolves entry IDs against the active
 * message catalog, returning fully-translated rows ready for render.
 */
export function useSearchIndex(): SearchEntry[] {
  const t = useTranslations("search");
  return useMemo(
    () =>
      SEARCH_REFS.map((ref) => ({
        id: ref.id,
        title: t(`entries.${ref.id}.title`),
        description: ref.noDescription
          ? undefined
          : t(`entries.${ref.id}.description`),
        href: ref.href,
        category: ref.category,
        categoryLabel: t(`categories.${ref.category}`),
        keywords: ref.keywords,
      })),
    [t],
  );
}

/** Curated quick links shown when the input is empty. Real routes only. */
const QUICK_LINK_IDS = ["trial", "demo", "pricing", "shopAll", "integrations"];

export function useQuickLinks(): SearchEntry[] {
  const index = useSearchIndex();
  return useMemo(
    () => QUICK_LINK_IDS.map((id) => index.find((e) => e.id === id)!).filter(Boolean),
    [index],
  );
}

/**
 * Filter the localized index by a free-form query. Empty/whitespace
 * query returns an empty array.
 *
 * Matching: case-insensitive substring over the joined title + description
 * + keywords haystack. Keywords carry both EN and FR synonyms so search
 * works regardless of locale.
 */
export function filterSearch(
  index: SearchEntry[],
  query: string,
  limit = 20,
): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches: SearchEntry[] = [];
  for (const entry of index) {
    const haystack = [
      entry.title,
      entry.description ?? "",
      ...(entry.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) matches.push(entry);
    if (matches.length >= limit) break;
  }
  return matches;
}

/** Group matches by category in the canonical display order. */
export function groupByCategory(
  entries: SearchEntry[],
): Array<{ category: SearchCategoryId; categoryLabel: string; entries: SearchEntry[] }> {
  const buckets = new Map<SearchCategoryId, SearchEntry[]>();
  for (const e of entries) {
    const arr = buckets.get(e.category) ?? [];
    arr.push(e);
    buckets.set(e.category, arr);
  }
  return CATEGORY_ORDER.map((category) => {
    const list = buckets.get(category) ?? [];
    return {
      category,
      categoryLabel: list[0]?.categoryLabel ?? "",
      entries: list,
    };
  }).filter((g) => g.entries.length > 0);
}
