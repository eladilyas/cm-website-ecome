"use client";

// Horizontal category filter for the Shop grid. Sticky-rail on mobile,
// inline pill row on desktop. URL-state via search param so deep-links
// land on a filtered view.
//
// Chips are derived from the live catalog — when the admin disables a
// category it disappears from this rail without a code change.

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useCatalog } from "@/components/catalog/CatalogProvider";

export function CategoryFilter() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { products, categoryLabels } = useCatalog();
  const t = useTranslations("shop");
  const active = params.get("category") ?? "all";

  // Derived from the categories the live products actually occupy.
  //
  // This used to be a hardcoded list — ["pos-terminals", "mobile-pos", "kds",
  // "kiosks"] — from the legacy taxonomy. Those slugs are all soft-disabled in
  // the live DB, so every chip was filtered out by the `categoryLabels[s]`
  // guard and the rail collapsed to "All products" alone. With 76 products in
  // the catalogue that left no way to filter at all.
  //
  // Deriving from the products themselves means the rail cannot drift out of
  // sync with the taxonomy again, and a category with nothing in it never
  // shows a chip that leads to an empty grid.
  const categories = useMemo<{ id: string; label: string }[]>(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    const chips = [...counts.entries()]
      .filter(([slug]) => categoryLabels[slug])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([slug]) => ({ id: slug, label: categoryLabels[slug] }));
    return [{ id: "all", label: t("allProducts") }, ...chips];
  }, [products, categoryLabels, t]);

  const set = (id: string) => {
    const next = new URLSearchParams(params.toString());
    if (id === "all") next.delete("category");
    else next.set("category", id);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div
      role="tablist"
      aria-label="Filter by category"
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0"
    >
      {categories.map((c) => {
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => set(c.id)}
            className={`shrink-0 h-9 px-4 text-[13px] font-medium rounded-full border transition-colors duration-200 ${
              isActive
                ? "border-ink bg-ink text-paper"
                : "border-hairline bg-paper text-ink-soft hover:bg-canvas hover:text-ink"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
