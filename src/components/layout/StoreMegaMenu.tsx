"use client";

// Store mega-menu — vertical category rail + product-photo grid.
//
// Shape borrowed from iMin's product menu (rail of families on the left,
// that family's products as image-first cards on the right), rewritten in
// OUR vocabulary: mono ink/paper/canvas surfaces, hairline rings, 24px
// card radii, Apple easing, and the red accent (#E11D2A) reserved for a
// single hover state. No purple, no saturated status pills.
//
// ── Data source ───────────────────────────────────────────────────────
// Categories AND products come from the live catalog (`useCatalog`,
// hydrated once at the root from Postgres by <CatalogHydrator />). That
// is the same source /shop, /shop/[slug] and the home rail read, so the
// menu can never advertise a product whose detail page 404s.
// src/data/catalog.ts is a seed/migration artifact and is explicitly
// off-limits to new code ("NEW CODE MUST NOT import CATALOG …").
//
// ── Rules ─────────────────────────────────────────────────────────────
//   • A category with zero products is dropped — never an empty grid.
//   • Each category shows at most MAX_TILES tiles. On overflow the last
//     tile becomes "See all N" → /shop?category=<slug>. When nothing
//     overflows, a quiet "Browse <category>" link sits under the grid, so
//     every category has exactly one way through to the full listing.
//   • The rail is a real tablist: roving tabindex, ↑/↓/Home/End, and
//     selection follows focus so the keyboard reaches every grid.
//   • Escape closes the panel and returns focus to the Store trigger.
//
// Desktop-only chrome. The narrow-viewport story is MobileMenu's drill-in
// sheet, which keeps rendering Store's flat `items` list from lib/nav.

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// Locale-aware Link (not next/link). The rest of NavExpansion still uses
// plain next/link, which silently drops the /en prefix for English
// visitors; new links shouldn't inherit that.
import { Link } from "@/i18n/navigation";
import type {
  CatalogCategory,
  CatalogProduct,
} from "@/server/catalog/types";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Red accent. Used on exactly one interaction in this panel (product
 *  name hover, matching CategoryStrip on /shop) — never as a fill. */
const ACCENT = "#E11D2A";

/** Tiles per category, counting the "See all" tile. Two rows of three
 *  at the desktop panel width. */
const MAX_TILES = 6;

/** Focus-ring token set lifted from components/ui/Button.tsx so keyboard
 *  focus in the panel looks identical to focus anywhere else on the site.
 *  The offset colour follows the header scheme. */
function focusRing(onDark: boolean): string {
  return onDark
    ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/40 focus-visible:ring-offset-2 focus-visible:ring-offset-night"
    : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
}

export type StoreTab = {
  /** Live storefront category slug — also the ?category= filter value. */
  slug: string;
  /** DB label, used only when the i18n catalog has no key for the slug. */
  fallbackLabel: string;
  /** Tiles to render, already capped. */
  products: CatalogProduct[];
  /** Total products in the category, before the cap. */
  total: number;
};

/** Sort key for grid order: explicit displayOrder first, then name. */
function byDisplayOrder(a: CatalogProduct, b: CatalogProduct): number {
  const ao = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
  const bo = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  return a.name.localeCompare(b.name);
}

/** Fold the live catalog into rail tabs. Pure — no hooks — so
 *  NavExpansion can call it to decide whether the mega-menu layout is
 *  viable at all before committing to it.
 *
 *  Top-level categories only; a parent absorbs its children's products
 *  (same rule CategoryStrip uses on /shop, where ?category=<parent>
 *  also matches descendants). */
export function buildStoreTabs(
  categories: readonly CatalogCategory[],
  products: readonly CatalogProduct[],
): StoreTab[] {
  const childrenByParent = new Map<string, string[]>();
  for (const c of categories) {
    if (c.parentSlug) {
      const siblings = childrenByParent.get(c.parentSlug) ?? [];
      siblings.push(c.slug);
      childrenByParent.set(c.parentSlug, siblings);
    }
  }

  const topLevel = categories
    .filter((c) => c.isActive && c.parentSlug == null)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const tabs: StoreTab[] = [];
  for (const category of topLevel) {
    const owned = new Set<string>([
      category.slug,
      ...(childrenByParent.get(category.slug) ?? []),
    ]);
    const matched = products
      .filter((p) => owned.has(p.category))
      .sort(byDisplayOrder);

    // Empty category → no tab. Never render an empty grid.
    if (matched.length === 0) continue;

    tabs.push({
      slug: category.slug,
      fallbackLabel: category.label,
      total: matched.length,
      products:
        matched.length > MAX_TILES
          ? matched.slice(0, MAX_TILES - 1)
          : matched,
    });
  }
  return tabs;
}

export function StoreMegaMenu({
  tabs,
  onSelect,
  scheme,
  triggerLabel,
}: {
  tabs: StoreTab[];
  /** Closes the expansion. Fired on link click and on Escape. */
  onSelect: () => void;
  scheme: "light" | "dark";
  /** Visible text of the top-bar item that opened this panel ("Store" /
   *  "Boutique"). Used to find the trigger element so Escape can hand
   *  focus back to it. */
  triggerLabel: string;
}) {
  const onDark = scheme === "dark";
  const t = useTranslations("nav.storeMenu");
  const tCat = useTranslations("shop.categories");

  const [activeSlug, setActiveSlug] = useState(tabs[0]?.slug ?? "");
  // Derived, not stored: a catalog re-hydration can drop the active
  // category out from under us, and falling back to the first tab
  // beats an effect that re-syncs state after paint.
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.slug === activeSlug),
  );
  const active = tabs[activeIndex];

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // The Store trigger in the top bar, captured on mount, so Escape can
  // hand focus back to it (WAI-ARIA: dismissing a popup returns focus to
  // its trigger).
  //
  // Two lookups because Header renders a top-level nav item as a <button
  // aria-haspopup> when it has no href and as a <Link> when it does —
  // Store currently has href="/shop", so it is an anchor with no
  // aria-expanded to match on. Falling back to the visible label is
  // locale-safe: `triggerLabel` is the same message the trigger renders.
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const root = document.querySelector("header nav");
    if (!root) return;
    const expanded = root.querySelector<HTMLElement>(
      '[aria-haspopup="true"][aria-expanded="true"]',
    );
    if (expanded) {
      triggerRef.current = expanded;
      return;
    }
    const label = triggerLabel.trim();
    triggerRef.current =
      Array.from(root.querySelectorAll<HTMLElement>("a, button")).find(
        (el) => el.textContent?.trim() === label,
      ) ?? null;
  }, [triggerLabel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Focus first, close second — deliberately. Header opens a
      // <button> trigger on focus, so focusing one queues a re-open;
      // closing afterwards means React batches both updates in this
      // single event and the close wins. Reversed, the panel would flash
      // back open. (Store is currently a <Link> with no onFocus, so the
      // order is harmless today and correct if it ever becomes a button.)
      triggerRef.current?.focus();
      onSelect();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  // i18n label per slug, with the DB label as the fallback — same
  // resolution order as useCategoryLabel / CategoryStrip.
  const labels = useMemo(() => {
    const out: Record<string, string> = {};
    for (const tab of tabs) {
      const key = tCat(tab.slug);
      out[tab.slug] =
        key && key !== `shop.categories.${tab.slug}` ? key : tab.fallbackLabel;
    }
    return out;
  }, [tabs, tCat]);

  if (!active) return null;

  const select = (index: number, focus = false) => {
    const next = tabs[index];
    if (!next) return;
    setActiveSlug(next.slug);
    if (focus) tabRefs.current[index]?.focus();
  };

  // Vertical tablist keys. Selection follows focus, so arrowing down the
  // rail swaps the grid exactly like hovering does.
  const onRailKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = tabs.length - 1;
    let next: number;
    switch (e.key) {
      case "ArrowDown":
        next = activeIndex === last ? 0 : activeIndex + 1;
        break;
      case "ArrowUp":
        next = activeIndex === 0 ? last : activeIndex - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    select(next, true);
  };

  const eyebrowClass = onDark ? "text-paper/55" : "text-ink-mute";
  const railRest = onDark
    ? "text-paper/70 hover:text-paper hover:bg-paper/[0.06]"
    : "text-ink-soft hover:text-ink hover:bg-ink/[0.035]";
  const railActive = onDark
    ? "bg-paper/[0.12] text-paper"
    : "bg-ink/[0.055] text-ink";
  const panelId = "store-nav-panel";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[196px_1fr] lg:grid-cols-[216px_1fr] gap-x-8 lg:gap-x-12 gap-y-8">
      {/* ── Category rail ───────────────────────────────────────────── */}
      <div>
        <p className={`text-[12px] font-normal mb-3 ${eyebrowClass}`}>
          {t("categoriesEyebrow")}
        </p>
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label={t("railLabel")}
          onKeyDown={onRailKeyDown}
          className="flex flex-col gap-0.5"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.slug === active.slug;
            return (
              <button
                key={tab.slug}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`store-nav-tab-${tab.slug}`}
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                onMouseEnter={() => select(index)}
                onFocus={() => select(index)}
                onClick={() => select(index)}
                className={[
                  "group flex items-center justify-between gap-2 rounded-full",
                  "h-9 pl-3.5 pr-3 text-left text-[13.5px] tracking-[-0.005em]",
                  "transition-[background-color,color] duration-300",
                  focusRing(onDark),
                  isActive ? `${railActive} font-medium` : `${railRest} font-normal`,
                ].join(" ")}
                style={{
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <span className="truncate">{labels[tab.slug]}</span>
                <span
                  aria-hidden
                  className={`text-[11px] tabular-nums transition-opacity duration-300 ${
                    onDark ? "text-paper/40" : "text-ink-mute"
                  } ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
                >
                  {tab.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Product grid for the active category ────────────────────── */}
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={`store-nav-tab-${active.slug}`}
      >
        <motion.div
          // Re-keyed per category so swapping the rail cross-fades the
          // grid instead of snapping. The panel itself stays open.
          key={active.slug}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: APPLE_EASE }}
        >
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-7">
            {active.products.map((product) => (
              <li key={product.slug}>
                <ProductTile
                  product={product}
                  onSelect={onSelect}
                  onDark={onDark}
                  arrivingLabel={t("arrivingSoon")}
                />
              </li>
            ))}

            {active.total > active.products.length && (
              <li>
                <SeeAllTile
                  href={`/shop?category=${active.slug}`}
                  label={t("seeAll", { count: active.total })}
                  ariaLabel={t("seeAllAria", {
                    count: active.total,
                    category: labels[active.slug],
                  })}
                  onSelect={onSelect}
                  onDark={onDark}
                />
              </li>
            )}
          </ul>

          {/* Every category needs one route to its full listing. When the
              grid already shows everything there is no "See all" tile, so
              the quiet text link takes over. */}
          {active.total === active.products.length && (
            <Link
              href={`/shop?category=${active.slug}`}
              onClick={onSelect}
              className={[
                "mt-4 inline-flex items-center gap-1.5 rounded-full px-1 py-1",
                "text-[12.5px] font-normal transition-colors duration-200",
                onDark
                  ? "text-paper/60 hover:text-paper"
                  : "text-ink-mute hover:text-ink",
                focusRing(onDark),
              ].join(" ")}
            >
              {t("browseCategory", { category: labels[active.slug] })}
              <span aria-hidden>→</span>
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Product tile ──────────────────────────────────────────────────────
// Photo first, name second — the iMin arrangement. Everything else the
// grid card carries elsewhere on the site (price, cart button, category
// eyebrow) is deliberately absent: this is navigation, not a shelf.

function ProductTile({
  product,
  onSelect,
  onDark,
  arrivingLabel,
}: {
  product: CatalogProduct;
  onSelect: () => void;
  onDark: boolean;
  arrivingLabel: string;
}) {
  const incoming = product.availability?.status === "incoming";

  const name = onDark
    ? "text-paper/90 group-hover:text-paper"
    : "text-ink group-hover:text-[color:var(--tile-accent)]";

  return (
    <Link
      href={`/shop/${product.slug}`}
      onClick={onSelect}
      className={[
        // NO card chrome — no ring, no plate, no filled background.
        //
        // Each product used to sit in a ringed, padded box, which cost three
        // things: the inset padding shrank the photo, the ring drew a hard
        // edge round every item so the panel read as a wall of containers,
        // and the boxes ate the horizontal room the products needed. The
        // reference menu has none of it — products sit directly on the panel,
        // so the photo is the largest thing on screen and the only container
        // is the panel itself.
        //
        // The hit area is still the whole cell (block link + padding), so
        // nothing is lost in clickability; only the drawn box is gone.
        "group relative block rounded-2xl p-2",
        "transition-colors duration-300",
        onDark ? "hover:bg-paper/[0.04]" : "hover:bg-ink/[0.02]",
        focusRing(onDark),
      ].join(" ")}
      style={
        {
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          "--tile-accent": ACCENT,
        } as React.CSSProperties
      }
    >
      {/* Taller frame, and the p-5 inset is gone — the product now fills the
          room the box used to spend on padding. The assets are transparent
          with the product at 82% of the canvas, so they need no plate behind
          them to read on either surface. */}
      <div className="relative h-[132px] lg:h-[148px]">
        <Image
          src={product.heroImage}
          // Real alt text: the catalog's descriptive `alt` when present,
          // the product name otherwise. Never empty, never a filename.
          alt={product.alt || product.name}
          fill
          sizes="(min-width: 1024px) 300px, 220px"
          className="object-contain transition-transform duration-700 group-hover:scale-[1.05]"
          style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        {incoming && (
          // Quiet outline chip, not a saturated fill — the red accent
          // stays reserved. Reads as metadata, not an alarm.
          <span
            className={[
              "absolute top-0 right-0 inline-flex items-center rounded-full",
              "px-2 py-[3px] text-[9.5px] font-medium uppercase tracking-[0.1em]",
              "ring-1 ring-inset",
              onDark
                ? "bg-night/60 text-paper/70 ring-white/15"
                : "bg-paper/90 text-ink-mute ring-hairline-strong",
            ].join(" ")}
          >
            {arrivingLabel}
          </span>
        )}
      </div>

      {/* Centred under the photo, as in the reference. Fixed two-line box so
          a wrapping name cannot shift the row beneath it. */}
      <p
        className={`mt-3 min-h-[2.4em] text-center line-clamp-2 text-[13px] font-medium tracking-[-0.008em] leading-[1.2] transition-colors duration-200 ${name}`}
      >
        {product.name}
        {product.subline && (
          <span
            className={`ml-1 text-[11.5px] font-normal tracking-normal ${
              onDark ? "text-paper/45" : "text-ink-mute"
            }`}
          >
            {product.subline}
          </span>
        )}
      </p>
    </Link>
  );
}

// ─── "See all N" overflow tile ─────────────────────────────────────────
// Same footprint as a product tile so the grid rhythm holds, but on the
// fog/frost surface with no photo — clearly a route, not a product.

function SeeAllTile({
  href,
  label,
  ariaLabel,
  onSelect,
  onDark,
}: {
  href: string;
  label: string;
  ariaLabel: string;
  onSelect: () => void;
  onDark: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      aria-label={ariaLabel}
      className={[
        // Matches the product tiles: no ring, no filled plate. It occupies a
        // grid cell of the same height so the row stays even, but it reads as
        // a quiet action rather than a fourth box.
        "group flex h-full min-h-[160px] lg:min-h-[172px] flex-col items-center justify-center",
        "gap-2 rounded-2xl text-center px-4 p-2",
        "transition-colors duration-300",
        onDark
          ? "text-paper/70 hover:text-paper hover:bg-paper/[0.04]"
          : "text-ink-soft hover:text-ink hover:bg-ink/[0.02]",
        focusRing(onDark),
      ].join(" ")}
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      <span
        aria-hidden
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset transition-transform duration-500 group-hover:translate-x-0.5 ${
          onDark ? "ring-white/15" : "ring-hairline-strong"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7h9M7.5 3.5L11 7l-3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-[12.5px] font-medium tracking-[-0.005em]">
        {label}
      </span>
    </Link>
  );
}
