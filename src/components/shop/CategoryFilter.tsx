"use client";

// Horizontal category filter for the Shop grid. Sticky-rail on mobile,
// inline pill row on desktop. URL-state via search param so deep-links
// land on a filtered view.
//
// Chips are derived from the live catalog — when the admin disables a
// category it disappears from this rail without a code change.

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";

import { useCatalog } from "@/components/catalog/CatalogProvider";

// Slugs surfaced in the /shop chip rail. We curate the order rather
// than dumping every category so the rail stays short; admins can
// adjust display order via /admin/categories and we'll re-surface
// here once that page lands.
const SHOP_CHIP_SLUGS = ["pos-terminals", "mobile-pos", "kds", "kiosks"];

export function CategoryFilter() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { categoryLabels } = useCatalog();
  const active = params.get("category") ?? "all";

  const categories = useMemo<{ id: string; label: string }[]>(
    () => [
      { id: "all", label: "All products" },
      ...SHOP_CHIP_SLUGS.filter((s) => categoryLabels[s]).map((s) => ({
        id: s,
        label: categoryLabels[s],
      })),
    ],
    [categoryLabels],
  );

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
