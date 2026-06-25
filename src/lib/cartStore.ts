"use client";

// Cart state — Apple/Stripe-style B2B commerce cart.
//
// Replaces the prior `quoteStore`. The shift from quote to cart
// matches the strategic move from "request a quote" to "purchase
// online or via Wafasalaf financing". Same persisted Zustand shape;
// new persist key ("cm-cart") so the rename is a clean break with
// no migration mess (any in-flight demo quote data goes away,
// acceptable since no real checkout existed yet).
//
// The drawer remains the cart's home; its open/close state is
// transient and excluded from persist.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CatalogProduct } from "@/server/catalog/types";

export type CartItem = {
  slug: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  /** Slug of the most recently added item, used by CartToast to
   *  surface a floating notification. Cleared on dismiss / nav.
   *  Replaces the legacy "open drawer" boolean since the drawer was
   *  removed in favour of a dedicated /cart page + toast. */
  toastSlug: string | null;
};

type CartActions = {
  addToCart: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  /** Hide the floating add-to-cart toast. Called by the toast on
   *  dismiss, by route changes, and by the 5s auto-dismiss timer. */
  dismissToast: () => void;
};

const INITIAL: CartState = {
  items: [],
  toastSlug: null,
};

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      addToCart: (slug, qty = 1) => {
        const existing = get().items.find((i) => i.slug === slug);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.slug === slug ? { ...i, qty: i.qty + qty } : i,
            ),
            toastSlug: slug,
          });
          return;
        }
        set({
          items: [...get().items, { slug, qty }],
          toastSlug: slug,
        });
      },

      setQty: (slug, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.slug !== slug) });
          return;
        }
        set({
          items: get().items.map((i) => (i.slug === slug ? { ...i, qty } : i)),
        });
      },

      removeFromCart: (slug) =>
        set({ items: get().items.filter((i) => i.slug !== slug) }),

      clearCart: () => set({ items: [], toastSlug: null }),

      dismissToast: () => set({ toastSlug: null }),
    }),
    {
      name: "cm-cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Toast slug is transient UI — don't persist.
      partialize: (state) => ({ items: state.items, toastSlug: null }),
    },
  ),
);

// ── Derived selectors ────────────────────────────────────────────────

export type CartLine = {
  slug: string;
  qty: number;
  product: CatalogProduct;
  lineTotal: number;
};

/** Catalog product lookup map — the shape every selector takes so cart
 *  logic stays decoupled from the data source. Pass the map from
 *  `useCatalog().productsBySlug` (client) or `getPublicProductIndex()`
 *  (server). */
export type ProductIndex = Readonly<Record<string, CatalogProduct>>;

/** Resolve items + product info + totals. Skips items whose slug no
 *  longer exists in the catalog (e.g. after a product was disabled in
 *  the admin panel). */
export function selectCartLines(
  state: { items: CartItem[] },
  productsBySlug: ProductIndex,
): CartLine[] {
  return state.items
    .map((item) => {
      const product = productsBySlug[item.slug];
      if (!product) return null;
      return {
        slug: item.slug,
        qty: item.qty,
        product,
        lineTotal: product.priceFrom * item.qty,
      };
    })
    .filter((x): x is CartLine => x !== null);
}

export type CartTotals = {
  itemCount: number;
  subtotal: number;
  total: number;
};

export function selectCartTotals(
  state: { items: CartItem[] },
  productsBySlug: ProductIndex,
): CartTotals {
  const lines = selectCartLines(state, productsBySlug);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  return { itemCount, subtotal, total: subtotal };
}

/** Returns up to N products that complement the current items,
 *  excluding items already in the cart. Drives the upsell grid in
 *  the cart drawer. */
export function selectUpsells(
  state: { items: CartItem[] },
  productsBySlug: ProductIndex,
  max = 3,
): CatalogProduct[] {
  if (state.items.length === 0) return [];
  const inCart = new Set(state.items.map((i) => i.slug));
  const suggested = new Map<string, number>();

  for (const item of state.items) {
    const product = productsBySlug[item.slug];
    if (!product?.complementaryWith) continue;
    for (const slug of product.complementaryWith) {
      if (inCart.has(slug)) continue;
      suggested.set(slug, (suggested.get(slug) ?? 0) + 1);
    }
  }

  return Array.from(suggested.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([slug]) => productsBySlug[slug])
    .filter((p): p is CatalogProduct => Boolean(p));
}
