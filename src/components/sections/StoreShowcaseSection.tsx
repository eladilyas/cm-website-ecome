"use client";

// Store Showcase — premium commerce surface for the homepage.
//
// Apple-Store-shelf layout: editorial header → category chip row →
// horizontal scrolling product rail with peek effect → primary
// CTA to the full /shop. Replaces the previous 3-category-tile
// grid (no products, no prices) with a true product browser that
// gives visitors price clarity and one-click "Add to Quote".
//
// Composition:
//   • Editorial header — eyebrow + 2-line headline + standfirst,
//     same balanced typography as the old tiles
//   • Category chip row — All · POS Terminals · Mobile POS ·
//     Self-Order Kiosks. Local state filters the rail in place;
//     no URL nav (full filtering happens on /shop).
//   • Horizontal product rail — scroll-snap-x mandatory, peek
//     effect on the rightmost card, hover-revealed prev/next
//     arrows on lg+, native touch swipe on mobile. Trailing
//     "View all hardware" card matches Apple's "More to explore"
//     pattern.
//   • Primary CTA — Button → /shop for the full catalog
//
// Padding reduced vs. the prior tile grid (py-28 md:py-40 → pt-14
// pb-20 md:pt-20 md:pb-28) so products appear sooner and the
// section flows more tightly into the page rhythm.
//
// Scheme: light (bg-paper) — sits inside the light home spine.

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Button } from "@/components/ui/Button";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { RailProductCard } from "@/components/shop/RailProductCard";

type ChipId = "all" | string;

// Chips for the homepage rail. Built dynamically from the catalog:
// every top-level active category that has at least one product
// (directly or via a child category) gets a chip. Order follows
// displayOrder. The "all" chip is prepended client-side and never
// persisted.

export function StoreShowcaseSection() {
  const [chip, setChip] = useState<ChipId>("all");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { products: allProducts, categories } = useCatalog();
  const t = useTranslations("home.store");

  // Top-level categories that have at least one product directly or via
  // a child. Avoids empty chips like "POS Tablette" until a product
  // lands there.
  const homepageCategories = useMemo(() => {
    const childrenByParent = new Map<string, string[]>();
    for (const c of categories) {
      if (c.parentSlug) {
        const list = childrenByParent.get(c.parentSlug) ?? [];
        list.push(c.slug);
        childrenByParent.set(c.parentSlug, list);
      }
    }
    return categories
      .filter((c) => c.isActive && c.parentSlug == null)
      .filter((c) => {
        if (allProducts.some((p) => p.category === c.slug)) return true;
        const kids = childrenByParent.get(c.slug) ?? [];
        return kids.some((k) => allProducts.some((p) => p.category === k));
      })
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categories, allProducts]);

  const chips = useMemo<{ id: ChipId; label: string }[]>(
    () => [
      { id: "all", label: t("chipAll") },
      ...homepageCategories.map((c) => ({ id: c.slug, label: c.label })),
    ],
    [homepageCategories, t],
  );

  const childrenByParent = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of categories) {
      if (c.parentSlug) {
        const list = m.get(c.parentSlug) ?? [];
        list.push(c.slug);
        m.set(c.parentSlug, list);
      }
    }
    return m;
  }, [categories]);

  const products = useMemo(() => {
    if (chip === "all") return allProducts;
    // Parent category filter includes all descendant categories' products.
    const kids = childrenByParent.get(chip) ?? [];
    const slugs = new Set([chip, ...kids]);
    return allProducts.filter((p) => slugs.has(p.category));
  }, [allProducts, chip, childrenByParent]);

  // Snap-aligned scroll-by-card-width. Used by the hover arrows on
  // desktop. We measure the first card to handle rail re-density
  // after a chip filter changes.
  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>(":scope > a, :scope > div > a");
    const step = (firstCard?.offsetWidth ?? 280) + 16;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section data-scheme="light" className="bg-paper">
      <SectionDivider scheme="light" />
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-14 md:pt-20 pb-20 md:pb-28">
        {/* ── Editorial header ──────────────────────────────────────── */}
        <div className="max-w-[44rem]">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-4">
              {t("eyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-[clamp(1.875rem,3.8vw,2.875rem)] font-semibold tracking-[-0.022em] leading-[1.08] text-ink"
              style={{ textWrap: "balance" }}
            >
              {t("headlineLine1")}
              <br />
              {t("headlineLine2")}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 text-[16px] md:text-[17px] leading-[1.5] text-ink-soft max-w-[34rem]">
              {t("subtitle")}
            </p>
          </Reveal>
        </div>

        {/* ── Category chip row + rail nav ──────────────────────────── */}
        <Reveal delay={0.16}>
          <div className="mt-9 md:mt-12 flex items-center justify-between gap-4 flex-wrap">
            <nav
              aria-label={t("filterAria")}
              className="flex items-center gap-1.5 flex-wrap"
            >
              {chips.map((c) => {
                const active = c.id === chip;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setChip(c.id);
                      // Reset scroll to start so the filtered set
                      // begins at card 1, not mid-rail.
                      scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                    }}
                    aria-pressed={active}
                    className={
                      "h-9 px-3.5 text-[12.5px] font-medium rounded-full border transition-colors " +
                      (active
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper text-ink-soft border-hairline hover:text-ink hover:bg-fog")
                    }
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.32, 0.72, 0, 1)",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop-only prev/next arrows. Mobile uses native swipe. */}
            <div className="hidden lg:flex items-center gap-1.5">
              <RailArrow
                direction="prev"
                onClick={() => scrollByCard(-1)}
                label={t("prevAria")}
              />
              <RailArrow
                direction="next"
                onClick={() => scrollByCard(1)}
                label={t("nextAria")}
              />
            </div>
          </div>
        </Reveal>

        {/* ── Horizontal product rail ───────────────────────────────── */}
        <Reveal delay={0.22}>
          <div
            ref={scrollRef}
            className="mt-6 md:mt-8 -mx-6 lg:-mx-10 px-6 lg:px-10 overflow-x-auto scrollbar-hide"
            style={{
              scrollSnapType: "x mandatory",
              scrollPaddingLeft: "1.5rem",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="flex gap-4 md:gap-5 pb-1">
              {products.map((p) => (
                <div
                  key={p.slug}
                  className="shrink-0 w-[78vw] sm:w-[300px] md:w-[280px]"
                >
                  <RailProductCard product={p} />
                </div>
              ))}

              {/* Trailing "View all" card — matches Apple's
                  "More to explore" pattern at the rail's end. */}
              <Link
                href="/shop"
                style={{ scrollSnapAlign: "start" }}
                className="group shrink-0 w-[78vw] sm:w-[300px] md:w-[280px] h-[400px] md:h-[420px] rounded-2xl bg-canvas border border-hairline hover:border-hairline-strong hover:bg-fog flex flex-col items-center justify-center text-center p-8 transition-colors"
              >
                <span className="w-12 h-12 rounded-full border border-hairline-strong flex items-center justify-center text-ink-mute group-hover:text-ink group-hover:border-ink/40 transition-colors">
                  <ArrowLarge />
                </span>
                <p className="mt-5 text-[15px] font-semibold tracking-[-0.005em] text-ink">
                  {t("viewAllTitle")}
                </p>
                <p className="mt-1.5 text-[12.5px] text-ink-mute leading-snug">
                  {t("viewAllDesc")}
                </p>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* ── Primary CTA into /shop ────────────────────────────────── */}
        <Reveal delay={0.32}>
          <div className="mt-10 md:mt-12 flex justify-center">
            <Button href="/shop" variant="primary" size="md">
              {t("exploreCta")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Sub-pieces ──────────────────────────────────────────────────────

function RailArrow({
  direction,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-9 w-9 rounded-full border border-hairline-strong bg-paper text-ink-soft hover:text-ink hover:bg-fog flex items-center justify-center transition-colors"
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d={
            direction === "prev"
              ? "M9 3.5L5.5 7 9 10.5"
              : "M5 3.5L8.5 7 5 10.5"
          }
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function ArrowLarge() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M4 9h10m0 0L9.5 4.5M14 9l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
