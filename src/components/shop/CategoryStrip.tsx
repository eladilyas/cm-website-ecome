"use client";

// Apple-Store-style horizontal category strip — small product thumbnails
// with labels below. Sits across the top of the Shop page as the primary
// discovery mechanism.
//
// Behavior:
//   • Built dynamically from `useCatalog()` — the strip surfaces the
//     6-category top-level taxonomy (POS Terminal / POS Tablette / POS
//     Portable / POS Périphériques / POS Kiosk / Accès & Présence) and
//     auto-picks a representative product photo for each.
//   • "All" tile clears the filter. Selecting a category sets the URL
//     `?category=` param consumed by the shop page filter logic — a
//     parent category includes all its children's products.
//   • Categories with zero products are rendered at 40% opacity with a
//     "Bientôt" pill and aren't interactive — communicates ecosystem
//     breadth without breaking expectations.
//   • Horizontally scrollable on narrow viewports; fits without scroll
//     on ≥1280px.

import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useCatalog } from "@/components/catalog/CatalogProvider";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type StripItem = {
  id: string;
  label: string;
  thumbnail:
    | { kind: "image"; src: string; alt: string }
    | { kind: "icon" };
  comingSoon?: boolean;
};

export function CategoryStrip() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const active = params.get("category") ?? "";
  const { products, categories } = useCatalog();
  const t = useTranslations("shop");
  const tCat = useTranslations("shop.categories");

  const labelFor = (c: { slug: string; label: string }): string => {
    const k = tCat(c.slug);
    return k && k !== `shop.categories.${c.slug}` ? k : c.label;
  };

  const strip = useMemo<StripItem[]>(() => {
    // Top-level cats (parentSlug == null), active, ordered by displayOrder.
    const topLevel = categories
      .filter((c) => c.isActive && c.parentSlug == null)
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Set of child→parent slug pairs so a parent category's representative
    // image can fall back to any descendant product.
    const childrenByParent = new Map<string, string[]>();
    for (const c of categories) {
      if (c.parentSlug) {
        const list = childrenByParent.get(c.parentSlug) ?? [];
        list.push(c.slug);
        childrenByParent.set(c.parentSlug, list);
      }
    }

    function representativeProduct(catSlug: string) {
      const direct = products.find((p) => p.category === catSlug);
      if (direct) return direct;
      const kids = childrenByParent.get(catSlug) ?? [];
      for (const k of kids) {
        const p = products.find((q) => q.category === k);
        if (p) return p;
      }
      return null;
    }

    const all: StripItem = {
      id: "",
      label: t("filtersAll"),
      thumbnail: { kind: "icon" },
    };

    const items: StripItem[] = topLevel.map((c) => {
      const rep = representativeProduct(c.slug);
      if (rep) {
        return {
          id: c.slug,
          label: labelFor(c),
          thumbnail: { kind: "image", src: rep.heroImage, alt: rep.alt },
        };
      }
      return {
        id: c.slug,
        label: labelFor(c),
        thumbnail: { kind: "icon" },
        comingSoon: true,
      };
    });

    return [all, ...items];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, products, tCat]);

  const set = (id: string) => {
    const next = new URLSearchParams(params.toString());
    if (id === "") next.delete("category");
    else next.set("category", id);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <nav
      aria-label={t("eyebrow")}
      role="tablist"
      className="relative -mx-6 lg:-mx-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-canvas to-transparent z-10 md:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-canvas to-transparent z-10 md:hidden"
      />

      <div className="flex items-start gap-2 md:gap-3 lg:gap-4 overflow-x-auto scrollbar-hide px-6 lg:px-10 py-2">
        {strip.map((item) => {
          const isActive = active === item.id;
          const disabled = Boolean(item.comingSoon);

          return (
            <motion.button
              key={item.id || "all"}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={disabled}
              onClick={() => !disabled && set(item.id)}
              whileHover={disabled ? undefined : { scale: 1.04, y: -2 }}
              transition={{ duration: 0.3, ease: APPLE_EASE }}
              className={`group shrink-0 flex flex-col items-center w-[96px] sm:w-[108px] md:w-[120px] gap-3 ${
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div
                className={`relative h-20 md:h-24 w-full flex items-center justify-center ${
                  disabled ? "opacity-40" : ""
                }`}
              >
                {item.thumbnail.kind === "image" ? (
                  <Image
                    src={item.thumbnail.src}
                    alt={item.thumbnail.alt}
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                ) : item.id === "" ? (
                  <AllIcon />
                ) : (
                  <PlaceholderIcon />
                )}
              </div>

              <div className="text-center leading-tight">
                <p
                  className={`text-[12px] md:text-[13px] leading-[1.2] transition-colors duration-200 ${
                    isActive
                      ? "text-ink font-semibold"
                      : disabled
                        ? "text-ink-mute font-medium"
                        : "text-ink font-medium group-hover:text-[#E11D2A]"
                  }`}
                >
                  {item.label}
                </p>
                {item.comingSoon && (
                  <p className="mt-1 inline-block text-[9px] font-medium uppercase tracking-[0.14em] text-ink-mute border border-hairline rounded-full px-1.5 py-0.5">
                    {t("comingSoon")}
                  </p>
                )}
                {isActive && (
                  <span
                    aria-hidden
                    className="block mx-auto mt-1.5 h-[3px] w-6 rounded-full bg-[#E11D2A]"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

function AllIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 36 36" fill="none" aria-hidden>
      <rect x="6" y="6" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="20" y="6" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="20" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="20" y="20" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PlaceholderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
