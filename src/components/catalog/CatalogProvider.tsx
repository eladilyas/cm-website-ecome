"use client";

// CatalogProvider — hydrates the entire public catalog client-side
// from a single server fetch. Components that need synchronous access
// to products or categories (cart, toast, rails, badges) read from
// this provider via `useCatalog()`.
//
// Lifecycle:
//   • Mounted ONCE at the root via src/components/layout/SiteChrome.tsx.
//   • The server component above it (`<CatalogHydrator />`) runs the
//     reads from server/catalog/service.ts and passes the result in.
//   • Client navigation through the App Router re-runs the parent
//     server tree, which re-hydrates the provider when products change.
//
// We use React context (not Zustand) because the data is render-time
// constant within a session — no client-side mutations, no need for
// fine-grained subscriptions.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import type {
  CatalogCategory,
  CatalogProduct,
} from "@/server/catalog/types";

type CatalogContextValue = Readonly<{
  products: readonly CatalogProduct[];
  productsBySlug: Readonly<Record<string, CatalogProduct>>;
  categories: readonly CatalogCategory[];
  categoryLabels: Readonly<Record<string, string>>;
}>;

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  products,
  categories,
  children,
}: {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  children: ReactNode;
}) {
  const value = useMemo<CatalogContextValue>(() => {
    const productsBySlug: Record<string, CatalogProduct> = {};
    for (const p of products) productsBySlug[p.slug] = p;
    const categoryLabels: Record<string, string> = {};
    for (const c of categories) categoryLabels[c.slug] = c.label;
    return {
      products,
      productsBySlug,
      categories,
      categoryLabels,
    };
  }, [products, categories]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

/** Read the catalog. Returns `null` outside the provider so callers
 *  can render fallbacks without crashing — but in practice the
 *  provider is mounted at the root, so this rarely fires. */
export function useCatalogOptional(): CatalogContextValue | null {
  return useContext(CatalogContext);
}

/** Read the catalog. Throws when used outside the provider — meant
 *  for components that genuinely need it (cart, rails, etc.). */
export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error(
      "useCatalog must be used inside <CatalogProvider />. Mount the " +
        "provider via SiteChrome / a server CatalogHydrator.",
    );
  }
  return ctx;
}

/** Lookup helper — returns `undefined` when the slug isn't in the
 *  current public catalog (deleted / disabled / mistyped). */
export function useProduct(slug: string): CatalogProduct | undefined {
  return useCatalog().productsBySlug[slug];
}

/** Category label lookup. Resolution order:
 *    1. i18n catalog (`shop.categories.<slug>`) — bilingual.
 *    2. Live DB label from `useCatalog`.
 *    3. Slug itself, as last-resort fallback.
 *  Components inside `<CatalogProvider />` get the right label for the
 *  current locale without any extra wiring. */
export function useCategoryLabel(slug: string): string {
  const ctx = useCatalog();
  const t = useTranslations("shop.categories");
  // next-intl returns the key path itself for missing keys; treat that
  // as "no translation" and fall back to the DB label.
  const translated = t(slug);
  if (translated && translated !== `shop.categories.${slug}`) return translated;
  return ctx.categoryLabels[slug] ?? slug;
}
