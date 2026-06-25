"use client";

// Left pane of the POS workspace — operational cashier surface.
//
// Real-POS mental model: categories and products are visible
// SIMULTANEOUSLY. The cashier never navigates "into" a category and back
// out — that's a demo idiom, not a working register. Layout:
//
//   ┌───────────────────────────────────────────┐
//   │ [Cat 1*]  [Cat 2]  [Cat 3]  [Cat 4] [Cat5]│  ← persistent strip
//   ├───────────────────────────────────────────┤
//   │  [Product]  [Product]  [Product]          │
//   │  [Product]  [Product]  [Product]          │  ← products for the
//   │  [Product]  [Product]  [Product]          │    selected category
//   └───────────────────────────────────────────┘
//
// Behavior:
//   • Lands on the first category by default — zero clicks, products
//     immediately visible.
//   • Tapping a category swaps the product grid instantly; the strip
//     stays put.
//   • Activity switch (Café → Bakery → …) automatically jumps to that
//     activity's first category — no orphaned selection.
//   • Adding a product is one tap; a per-tile ×N badge surfaces the
//     current quantity in the active order so the cashier doesn't need
//     to look at the cart to confirm what's already on the ticket.
//   • Animation budget is kept tight (~120 ms colour transitions,
//     no slide-in / cross-fade between category swaps) so the surface
//     feels reactive, not theatrical.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ACTIVITIES } from "@/data/demo/activities";
import { selectActivityProducts, useDemoStore } from "@/lib/demoStore";
import type { DemoProduct } from "@/data/demo/types";
import { CustomizeSheet } from "./CustomizeSheet";

/** Does this product need a customization sheet before it can be
 *  added to the cart? Variants / modifier groups / combo steps all
 *  trigger the wizard. */
function needsCustomization(p: DemoProduct): boolean {
  return Boolean(
    (p.variants && p.variants.length > 0) ||
      (p.modifierGroups && p.modifierGroups.length > 0) ||
      (p.comboSteps && p.comboSteps.length > 0),
  );
}

export function ProductBrowser() {
  const tCart = useTranslations("demo.cart");
  const tCat = useTranslations("demo.categories");
  const activity = useDemoStore((s) => s.activity);
  const order = useDemoStore((s) => s.order);
  const addLine = useDemoStore((s) => s.addLine);
  // Phase 3A — subscribe to the overlay so manager edits/adds/deletes
  // re-render the grid immediately. Subscribed via a thin
  // pass-through; selectActivityProducts builds the merged list.
  const overrides = useDemoStore((s) =>
    activity ? s.productOverrides[activity] : undefined,
  );
  // Phase 3A — stock + thresholds for low-stock badges on tiles.
  const stock = useDemoStore((s) => (activity ? s.stock[activity] : undefined));
  const thresholds = useDemoStore((s) =>
    activity ? s.stockThresholds[activity] : undefined,
  );

  // Customization sheet state — null when closed. Keeping the
  // product around (not just an id) avoids a re-lookup at render
  // time inside the sheet.
  const [customizing, setCustomizing] = useState<DemoProduct | null>(null);

  // Local UI state — which category the cashier has chosen. Stays as a
  // "preference"; we derive the EFFECTIVE category each render so a
  // stale id from a previous activity (e.g. "burgers" from fast-food
  // when the user just switched to Café) falls back to the new
  // activity's first category without a state-sync effect. Recommended
  // pattern under React 19's no-setState-in-effect lint rule.
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Derive products for the active category. Returns an empty array
  // (with stable identity) when there's no activity yet. Reads through
  // selectActivityProducts so the catalog reflects any Backoffice
  // additions, edits, or deletions in real time. `overrides` is
  // subscribed above so this re-runs when the manager touches the
  // catalog.
  const products = useMemo(() => {
    if (!activity) return [];
    const a = ACTIVITIES[activity];
    const validId =
      categoryId && a.categories.some((c) => c.id === categoryId)
        ? categoryId
        : a.categories[0]?.id;
    if (!validId) return [];
    const merged = selectActivityProducts(useDemoStore.getState(), activity);
    return merged.filter((p) => p.categoryId === validId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, categoryId, overrides]);

  if (!activity) return null;
  const a = ACTIVITIES[activity];

  const qtyInOrder = (productId: string) => {
    if (!order) return 0;
    return order.lines
      .filter((l) => l.productId === productId)
      .reduce((s, l) => s + l.qty, 0);
  };

  const activeCategoryId =
    categoryId && a.categories.some((c) => c.id === categoryId)
      ? categoryId
      : a.categories[0]?.id;

  return (
    // LIGHT-themed cashier surface, structured as a true two-pane POS:
    //   LEFT  — vertical category sidebar (MENU) on bg-paper
    //   RIGHT — product grid on bg-canvas
    // The hybrid surface tones (light cart-half vs. dark checkout-half)
    // stay; this restructure replaces the prior horizontal category
    // strip with a vertical rail, matching the Maison-Lumière-class
    // reference and how real POS systems organise the menu.
    <div className="h-full flex bg-paper text-ink">
      {/* ── Category sidebar ──
            Vertical rail. "MENU" eyebrow at the top, then a flat list
            of categories. Active row carries a brand-red left accent
            stripe + paper-on-canvas background lift. Same dimension
            language as the existing site (10/13 px type, 0.14em
            tracking on eyebrows, hairline dividers). */}
      <aside
        aria-label="Menu categories"
        className="shrink-0 w-[88px] sm:w-[112px] md:w-[128px] border-r border-hairline bg-paper flex flex-col"
      >
        <p className="px-3 sm:px-4 md:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 text-[9.5px] sm:text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
          {tCart("menu")}
        </p>
        <ul role="tablist" aria-label="Categories" className="flex-1 min-h-0 overflow-y-auto pb-3">
          {a.categories.map((c) => {
            const isActive = c.id === activeCategoryId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCategoryId(c.id)}
                  className={
                    "relative w-full text-left px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-medium leading-snug transition-colors duration-150 " +
                    (isActive
                      ? "text-ink bg-canvas"
                      : "text-ink-soft hover:text-ink hover:bg-fog")
                  }
                  style={{
                    transitionTimingFunction:
                      "cubic-bezier(0.32, 0.72, 0, 1)",
                  }}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#E11D2A]"
                    />
                  )}
                  {tCat(c.id)}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ── Product grid ──
            Sits on bg-canvas (one notch off pure paper) so each tile's
            white paper bg reads cleanly against the surface. Two cols
            at small widths, three at md+. The container expands to
            absorb whatever the sidebar leaves. */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-canvas p-3 md:p-3.5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {products.map((p) => {
            const onHand = stock && p.id in stock ? stock[p.id] : undefined;
            const threshold = thresholds?.[p.id] ?? 5;
            const stockStatus: "out" | "low" | "ok" | "untracked" =
              onHand === undefined
                ? "untracked"
                : onHand <= 0
                  ? "out"
                  : onHand <= threshold
                    ? "low"
                    : "ok";
            return (
              <ProductTile
                key={p.id}
                product={p}
                qty={qtyInOrder(p.id)}
                hasOptions={needsCustomization(p)}
                stockStatus={stockStatus}
                onHand={onHand}
                onAdd={() => {
                  // Route to the customization sheet for products
                  // with variants / modifiers / combo steps. Plain
                  // products skip the wizard and ring up in one tap.
                  if (needsCustomization(p)) setCustomizing(p);
                  else addLine(p.id);
                }}
              />
            );
          })}
        </div>
      </div>

      <CustomizeSheet
        open={customizing != null}
        product={customizing}
        onClose={() => setCustomizing(null)}
      />
    </div>
  );
}

// ─── Product tile ────────────────────────────────────────────────────

function ProductTile({
  product,
  qty,
  hasOptions,
  stockStatus,
  onHand,
  onAdd,
}: {
  product: DemoProduct;
  qty: number;
  hasOptions: boolean;
  stockStatus: "out" | "low" | "ok" | "untracked";
  onHand: number | undefined;
  onAdd: () => void;
}) {
  const inOrder = qty > 0;
  const tTile = useTranslations("demo.productBrowser");
  return (
    <motion.button
      type="button"
      onClick={onAdd}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.08, ease: [0.32, 0.72, 0, 1] }}
      title={onHand != null ? `On hand: ${onHand}` : undefined}
      // Compact two-row tile: name on top, price + add affordance on the
      // bottom. `justify-between` makes both rows hug their respective
      // edges so the card never carries an empty band. The in-cart marker
      // is folded inline next to the price.
      //
      // Architectural radii (rounded-[10px]) + h-[76-80] sit the tile at
      // a density that matches a real POS register — the cashier reads
      // 12+ products without scrolling. Two lines of name still fit
      // (line-clamp guards overflow).
      className={
        "group relative h-[76px] md:h-[80px] rounded-[10px] border text-left px-2.5 py-2 transition-colors duration-150 " +
        (inOrder
          ? "border-[#E11D2A]/45 bg-[#E11D2A]/[0.08] hover:bg-[#E11D2A]/[0.12]"
          : "border-hairline bg-paper hover:bg-fog")
      }
    >
      {/* Phase 3A — stock status indicator. Amber dot in the top-
          right corner when at/below threshold (presence signal,
          intentionally no number — managers see counts in the
          Backoffice). Out-of-stock products get a small "Out" pill
          but stay clickable (back-orders happen; the deduction will
          go negative, which Inventory surfaces clearly). */}
      {stockStatus === "low" && (
        <span
          aria-label="Low stock"
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"
        />
      )}
      {stockStatus === "out" && (
        <span
          aria-label="Out of stock"
          className="absolute top-1.5 right-1.5 inline-flex items-center px-1.5 h-[15px] rounded-full text-[8px] font-semibold uppercase tracking-[0.1em] text-red-600 bg-red-100 border border-red-200"
        >
          Out
        </span>
      )}
      <div className="h-full flex flex-col justify-between gap-1.5">
        {/* Name — line-clamp-2 caps overflow on a long product. */}
        <span className="text-[13px] md:text-[13.5px] font-medium text-ink leading-snug line-clamp-2">
          {product.name}
        </span>
        <div className="flex items-end justify-between gap-2">
          <span className="text-[12px] font-medium text-ink-soft tabular-nums">
            {product.price}
            <span className="ml-1 text-[9.5px] uppercase tracking-[0.12em] text-ink-mute">
              MAD
            </span>
            {inOrder && (
              <span className="ml-1.5 text-[11px] font-semibold text-[#E11D2A] tabular-nums">
                ×{qty}
              </span>
            )}
          </span>
          {/* Add affordance — sharper rounded-[6px] square so the tile
              reads as engineered, not consumer-app. Pure brand-red filled
              circle for products with options (the customization wizard
              opener); neutral fog square for plain add. */}
          <span
            aria-hidden
            className={
              "shrink-0 w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors " +
              (hasOptions
                ? "bg-[#E11D2A]/15 text-[#E11D2A]"
                : "bg-fog group-hover:bg-canvas text-ink/85")
            }
            title={hasOptions ? tTile("customize") : tTile("add")}
          >
            {hasOptions ? <ChevronIcon /> : <PlusIcon />}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M4.5 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 3v8M3 7h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
