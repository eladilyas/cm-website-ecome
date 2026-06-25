"use client";

// Cart hooks — combine the slug-based Zustand store with the
// CatalogProvider so consumers get fully-resolved CartLine + totals +
// upsells in one call.
//
// Keep the raw `useCartStore` for actions (addToCart, setQty, etc.);
// use these hooks anywhere you need to RENDER cart info.

import { useMemo } from "react";

import { useCatalog } from "@/components/catalog/CatalogProvider";
import {
  selectCartLines,
  selectCartTotals,
  selectUpsells,
  useCartStore,
  type CartLine,
  type CartTotals,
} from "./cartStore";
import type { CatalogProduct } from "@/server/catalog/types";

/** Resolved cart lines (slug → product + qty + lineTotal). */
export function useCartLines(): CartLine[] {
  const items = useCartStore((s) => s.items);
  const { productsBySlug } = useCatalog();
  return useMemo(
    () => selectCartLines({ items }, productsBySlug),
    [items, productsBySlug],
  );
}

/** Cart totals (subtotal / total / itemCount), driven by the same map. */
export function useCartTotals(): CartTotals {
  const items = useCartStore((s) => s.items);
  const { productsBySlug } = useCatalog();
  return useMemo(
    () => selectCartTotals({ items }, productsBySlug),
    [items, productsBySlug],
  );
}

/** Upsells — up to `max` complementary products that aren't in the cart. */
export function useCartUpsells(max = 3): CatalogProduct[] {
  const items = useCartStore((s) => s.items);
  const { productsBySlug } = useCatalog();
  return useMemo(
    () => selectUpsells({ items }, productsBySlug, max),
    [items, productsBySlug, max],
  );
}
