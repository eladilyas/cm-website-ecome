"use client";

// Context-aware upsell strip for the checkout page.
//
// Reads the current cart lines + their `complementaryWith` slugs,
// computes products that pair well with what's already in the cart
// but aren't there yet, and renders a premium "frequently bought
// together" panel. One-click add via useCartStore.addToCart.
//
// Non-intrusive: tightly capped (max 3 suggestions, max 1 panel),
// dismiss button persists per-session in sessionStorage so users
// who close it once don't see it again on the same checkout.

import Image from "next/image";
import { useMemo, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { useQuickView } from "@/components/quickview/QuickViewProvider";
import type { CatalogProduct } from "@/server/catalog/types";
import { formatPrice } from "@/lib/formatPrice";

const DISMISS_KEY = "cm-checkout-upsell-dismissed";

/** Lazy-initialiser — reads sessionStorage exactly once during the
 *  initial render. Avoids the setState-in-effect anti-pattern that
 *  React 19's purity rule flags. Returns false on the server (no
 *  sessionStorage) so the panel still renders during SSR. */
const readDismissed = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

export function CheckoutUpsells({ cartSlugs }: { cartSlugs: string[] }) {
  const { productsBySlug } = useCatalog();
  const addToCart = useCartStore((s) => s.addToCart);
  const { open: openQuickView } = useQuickView();
  const [dismissed, setDismissed] = useState<boolean>(readDismissed);

  const suggestions: CatalogProduct[] = useMemo(() => {
    if (cartSlugs.length === 0) return [];
    const cartSet = new Set(cartSlugs);
    const seen = new Set<string>();
    const out: CatalogProduct[] = [];
    // Walk every product currently in the cart, pull its
    // complementary slugs, and keep the first 3 that resolve to a
    // real, in-catalog product and aren't already in the cart.
    for (const slug of cartSlugs) {
      const p = productsBySlug[slug];
      if (!p) continue;
      for (const pairSlug of p.complementaryWith ?? []) {
        if (cartSet.has(pairSlug) || seen.has(pairSlug)) continue;
        const pair = productsBySlug[pairSlug];
        if (!pair) continue;
        seen.add(pairSlug);
        out.push(pair);
        if (out.length >= 3) return out;
      }
    }
    return out;
  }, [cartSlugs, productsBySlug]);

  if (dismissed || suggestions.length === 0) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* noop */
    }
  };

  return (
    <section
      aria-labelledby="checkout-upsell-heading"
      className="rounded-xl border border-hairline bg-paper p-4 md:p-5"
    >
      <header className="flex items-baseline justify-between gap-3 mb-3.5">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
            Complete your setup
          </p>
          <h3
            id="checkout-upsell-heading"
            className="mt-0.5 text-[15px] font-semibold text-ink leading-tight"
          >
            Operators on this hardware also order
          </h3>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-[11px] text-ink-mute hover:text-ink transition-colors shrink-0"
          aria-label="Dismiss recommendations"
        >
          Not now
        </button>
      </header>

      <ul className="space-y-2.5">
        {suggestions.map((p) => (
          <li key={p.slug}>
            <div className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas/60 hover:bg-canvas hover:border-hairline-strong p-2.5 transition-colors duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]">
              {/* Tap the row body → Quick View. Keeps the explicit
                  "Add" pill for one-click adders, but lets curious
                  buyers preview without leaving checkout. */}
              <button
                type="button"
                onClick={() => openQuickView(p.slug)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left focus-visible:outline-none"
                aria-label={`Quick view: ${p.name}`}
              >
                <div className="relative w-14 h-14 shrink-0 rounded-md bg-paper border border-hairline overflow-hidden flex items-center justify-center">
                  <Image
                    src={p.heroImage}
                    alt={p.alt}
                    fill
                    sizes="56px"
                    className="object-contain p-1.5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink truncate">
                    {p.name}
                    {p.subline ? (
                      <span className="text-ink-mute font-normal"> · {p.subline}</span>
                    ) : null}
                  </p>
                  <p className="text-[11.5px] text-ink-mute truncate">
                    {p.tagline}
                  </p>
                  <p className="mt-0.5 text-[12px] tabular-nums text-ink-soft">
                    {formatPrice(p.priceFrom)} HT
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => addToCart(p.slug, 1)}
                className="h-9 px-3 inline-flex items-center justify-center rounded-full border border-hairline-strong bg-paper text-[12px] font-medium text-ink hover:bg-ink hover:text-paper hover:border-ink transition-colors duration-200 shrink-0"
              >
                Add
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
