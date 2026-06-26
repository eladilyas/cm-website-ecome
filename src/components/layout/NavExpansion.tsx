"use client";

import Link from "next/link";
import type { NavItem } from "@/lib/nav";

type Props = {
  item: NavItem;
  onSelect: () => void;
  scheme: "light" | "dark";
};

// Apple-style content for the expanded navbar. NO chrome — no rounded card,
// no shadow, no border. The container above provides the background surface.
//
// Three rendering modes:
//   1. Store-style mega-menu — item.groups only, no items. First group
//      becomes the hero column, rest become supplementary columns.
//   2. Hybrid (Apple Vision pattern) — item.items AND item.groups both
//      set. Left column is the big-text items list, right columns are
//      the structured groups. The default for Solutions / Support /
//      Company so the dropdown reads as a complete, balanced panel.
//   3. Simple list — item.items only, no groups. Left column only.
//      Fallback for any future top-level entry that doesn't warrant
//      supplementary content.

export function NavExpansion({ item, onSelect, scheme }: Props) {
  const hasGroups = !!item.groups?.length;
  const hasItems = !!item.items?.length;

  const eyebrowClass =
    scheme === "dark"
      ? "text-[12px] font-normal text-paper/55"
      : "text-[12px] font-normal text-ink-mute";

  const heroItemClass =
    scheme === "dark"
      ? "text-paper hover:text-paper/60"
      : "text-ink hover:text-ink-soft";

  const subItemClass =
    scheme === "dark"
      ? "text-paper/85 hover:text-paper"
      : "text-ink hover:text-ink-soft";

  const subDescClass =
    scheme === "dark" ? "text-paper/45" : "text-ink-mute";

  // Hero items list — used by both store-mode (first group) and
  // hybrid-mode (item.items). Refined typography pass: scale dropped
  // from 24-28px @ semibold to 18-22px @ medium for a lighter,
  // more premium feel. Tracking tightened to -0.012em (was the
  // looser default "tracking-tight") and item gap tightened to
  // gap-y-1 so the list reads as a cohesive editorial column rather
  // than a stack of oversized link blocks. Hover relies on opacity
  // shift instead of weight shift — closer to Apple's nav vocabulary.
  const renderHero = (
    eyebrow: string,
    list: { label: string; href: string }[],
  ) => (
    <div>
      <p className={`${eyebrowClass} mb-4`}>{eyebrow}</p>
      <ul className="space-y-1">
        {list.map((sub) => (
          <li key={sub.href}>
            <Link
              href={sub.href}
              onClick={onSelect}
              className={`block text-[clamp(1.125rem,1.6vw,1.375rem)] font-medium tracking-[-0.012em] leading-[1.2] py-1 transition-opacity duration-200 ${heroItemClass}`}
            >
              {sub.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  // Supplementary group — eyebrow + small-text item list with optional
  // descriptions. Refined typography: 13px → 12.5px label, weight
  // medium → normal so the items read as supporting content beneath
  // the hero list rather than competing with it. Description size
  // 12px → 11px and slightly muted further. Tighter row gap and
  // eyebrow margin. Net effect: clearly secondary, premium SaaS
  // feel — closer to Linear / Stripe nav vocabulary.
  const renderGroup = (g: {
    title: string;
    items: { label: string; href: string; description?: string }[];
  }) => (
    <div key={g.title}>
      <p className={`${eyebrowClass} mb-4`}>{g.title}</p>
      <ul className="space-y-2">
        {g.items.map((sub) => (
          <li key={sub.href}>
            <Link
              href={sub.href}
              onClick={onSelect}
              className={`block text-[12.5px] font-normal tracking-[-0.005em] transition-colors duration-200 ${subItemClass}`}
            >
              {sub.label}
            </Link>
            {sub.description ? (
              <span className={`block text-[11px] mt-0.5 leading-snug ${subDescClass}`}>
                {sub.description}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );

  // ─── 1 · Store-style mega-menu — groups only, first is hero ───────
  if (hasGroups && !hasItems) {
    const [hero, ...rest] = item.groups!;

    const cols =
      rest.length === 3
        ? "grid-cols-1 md:grid-cols-[2.2fr_1fr_1.2fr_1fr]"
        : rest.length === 2
          ? "grid-cols-1 md:grid-cols-[2.2fr_1fr_1fr]"
          : "grid-cols-1 md:grid-cols-[2.2fr_1fr]";

    return (
      <div className={`grid ${cols} gap-x-10 gap-y-10`}>
        {renderHero(hero.title, hero.items)}
        {rest.map(renderGroup)}
      </div>
    );
  }

  // ─── 2 · Hybrid — items hero on the left + groups on the right ────
  // Apple Vision pattern. Each `groups` entry becomes an aligned
  // column to the right of the big-text items list. Column widths
  // tuned so the right side fills available space at the same density
  // as the Store dropdown — no empty whitespace beyond the items list.
  if (hasGroups && hasItems) {
    const groupCount = item.groups!.length;
    const cols =
      groupCount === 3
        ? "grid-cols-1 md:grid-cols-[2.2fr_1fr_1fr_1fr]"
        : groupCount === 2
          ? "grid-cols-1 md:grid-cols-[2.2fr_1fr_1fr]"
          : "grid-cols-1 md:grid-cols-[2.2fr_1.4fr]";
    return (
      <div className={`grid ${cols} gap-x-10 gap-y-10`}>
        {renderHero(`Explore ${item.label.toLowerCase()}`, item.items!)}
        {item.groups!.map(renderGroup)}
      </div>
    );
  }

  // ─── 3 · Simple list — items only, no supplementary groups ────────
  // Longer lists wrap across multiple CSS columns so the dropdown
  // fills its horizontal space the way the hybrid layouts do. The
  // breakpoint at 5 items keeps short menus on one column; 7+ items
  // jumps to three columns so 8-entry menus (Store) read as a balanced
  // 3-3-2 layout instead of two tall columns with empty middle.
  const items = item.items!;
  const colClass =
    items.length >= 7
      ? "md:columns-3"
      : items.length >= 5
        ? "md:columns-2"
        : "";
  return (
    <div className="grid grid-cols-1">
      <div>
        <p className={`${eyebrowClass} mb-4`}>
          Explore {item.label.toLowerCase()}
        </p>
        <ul
          className={
            colClass
              ? `${colClass} md:gap-x-10 space-y-1 [&>li]:break-inside-avoid`
              : "space-y-1"
          }
        >
          {items.map((sub) => (
            <li key={sub.href}>
              <Link
                href={sub.href}
                onClick={onSelect}
                className={`block text-[clamp(1.125rem,1.6vw,1.375rem)] font-medium tracking-[-0.012em] leading-[1.2] py-1 transition-opacity duration-200 ${heroItemClass}`}
              >
                {sub.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
