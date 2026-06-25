"use client";

// Industries — Apple-Entertainment-style 2-row cinematic carousel.
//
// Architecture:
//   • 8 industries laid out in a CSS Grid with 2 rows × 4 columns
//     (grid-auto-flow: column → JSX order maps to top-of-col-1,
//      bottom-of-col-1, top-of-col-2, bottom-of-col-2, …).
//   • Single horizontal scroll container — both rows move as ONE
//     synchronized system because they share the same overflow
//     parent. There is no second scroll track.
//   • Edge mask softly fades the leftmost / rightmost ~5% of the
//     strip so tiles dissolve into the section background rather
//     than clipping at a hard edge.
//   • Premium dot navigation below the carousel — 4 dots, one per
//     column. Active dot is elongated pill (Apple's idiom). Scroll
//     position drives active state; tapping a dot smooth-scrolls
//     to that column.
//
// Visual discipline:
//   • Strict gray + light-blue palette (matching Solutions
//     section). Restaurants gets the only light-blue card as
//     hero anchor; Multi-store is the only deep-slate card.
//   • Monoline icon system — 96-unit artboard, 1.6px stroke,
//     currentColor across every industry. Consistency at the
//     stroke level, not via per-card chrome.

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

type IndustryTile = {
  slug: string;
  title: string;
  eyebrow: string;
  tagline: string;
  background: string;
  textTone: "ink" | "paper";
  icon: React.ReactNode;
};

// Column-major order (grid-auto-flow: column): JSX-i = (row, col)
// where row toggles every item, column advances every two items.
//   [Restaurants ] [Retail      ] [Fast food ] [Bar & lounge]
//   [Cafés       ] [Multi-store ] [Bakery    ] [Beauty      ]
//
// Visual properties (gradients, icons, tone) stay code-local — they're
// part of the design system, not copy. Labels (title, eyebrow, tagline)
// resolve through next-intl so each locale gets its own phrasing.

type IndustryVisual = {
  slug: string;
  background: string;
  textTone: "ink" | "paper";
  icon: React.ReactNode;
};

const INDUSTRY_VISUALS: IndustryVisual[] = [
  {
    slug: "restaurants",
    background:
      "linear-gradient(160deg, #ffffff 0%, #f0f5fa 55%, #dbe6f2 100%)",
    textTone: "ink",
    icon: <UtensilsIcon />,
  },
  {
    slug: "cafes",
    background: "linear-gradient(180deg, #f4f6f9 0%, #e5e9ee 100%)",
    textTone: "ink",
    icon: <CoffeeIcon />,
  },
  {
    slug: "retail",
    background: "linear-gradient(180deg, #f1f3f6 0%, #dfe2e7 100%)",
    textTone: "ink",
    icon: <BagIcon />,
  },
  {
    slug: "multi-store",
    background: "linear-gradient(180deg, #1a1d22 0%, #25282e 100%)",
    textTone: "paper",
    icon: <BuildingsIcon />,
  },
  {
    slug: "fast-food",
    background: "linear-gradient(180deg, #f5f7fa 0%, #e1e5eb 100%)",
    textTone: "ink",
    icon: <BurgerIcon />,
  },
  {
    slug: "bakery",
    background: "linear-gradient(180deg, #fafbfc 0%, #ecedf0 100%)",
    textTone: "ink",
    icon: <LoafIcon />,
  },
  {
    slug: "bar",
    background: "linear-gradient(180deg, #f6f7f9 0%, #e6e8ed 100%)",
    textTone: "ink",
    icon: <GlassIcon />,
  },
  {
    slug: "beauty",
    background: "linear-gradient(180deg, #fbfbfc 0%, #eaecf0 100%)",
    textTone: "ink",
    icon: <ScissorsIcon />,
  },
];

function useIndustryTiles(): IndustryTile[] {
  const t = useTranslations("home.industries.tiles");
  return INDUSTRY_VISUALS.map((v) => ({
    ...v,
    title: t(`${v.slug}.title`),
    eyebrow: t(`${v.slug}.eyebrow`),
    tagline: t(`${v.slug}.tagline`),
  }));
}

// ─── Section ─────────────────────────────────────────────────────

export function IndustriesSection() {
  const t = useTranslations("home.industries");
  const tiles = useIndustryTiles();
  return (
    <section
      id="industries"
      data-scheme="light"
      className="relative bg-canvas overflow-hidden"
    >
      <SectionDivider scheme="light" />

      {/* Header */}
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-24 md:pt-32 pb-10 md:pb-14 text-center">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-mute mb-4">
            {t("eyebrow")}
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="text-[clamp(1.875rem,4vw,3rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink"
            style={{ textWrap: "balance" }}
          >
            {t("title")}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 text-[16px] md:text-[17px] leading-[1.55] text-ink-soft max-w-[34rem] mx-auto">
            {t("subtitle")}
          </p>
        </Reveal>
      </div>

      {/* Two-row carousel — native scroll-snap, no dot navigation */}
      <Reveal>
        <div className="relative pb-20 md:pb-28">
          <div
            className="overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
            style={{
              maskImage:
                "linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, black 5%, black 95%, transparent 100%)",
              scrollBehavior: "smooth",
            }}
          >
            <div
              className="grid grid-rows-2 gap-3 md:gap-4 px-4 sm:px-5 lg:px-6"
              style={{
                gridAutoFlow: "column",
                gridAutoColumns: "clamp(280px, 24vw, 360px)",
              }}
            >
              {tiles.map((tile) => (
                <IndustryCard key={tile.slug} tile={tile} />
              ))}
            </div>
          </div>

        </div>
      </Reveal>
    </section>
  );
}

// ─── Industry card — landscape 4:3 ──────────────────────────────

function IndustryCard({ tile }: { tile: IndustryTile }) {
  const isDark = tile.textTone === "paper";
  return (
    <Link
      // Locale-aware Link from @/i18n/navigation: typed as a literal
      // template, locale prefix added automatically when EN is active.
      href={`/industries/${tile.slug}` as never}
      className="snap-start relative overflow-hidden block"
      style={{
        background: tile.background,
        aspectRatio: "4 / 3",
      }}
    >
      {/* Icon stage — upper portion */}
      <div className="absolute inset-x-0 top-0 h-[52%] flex items-center justify-center">
        <div
          className={
            "h-16 w-16 md:h-20 md:w-20 " +
            (isDark ? "text-paper/85" : "text-ink/85")
          }
        >
          {tile.icon}
        </div>
      </div>

      {/* Text — bottom-anchored editorial caption with bold title */}
      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <p
          className={
            "text-[10px] uppercase tracking-[0.2em] font-medium mb-2 " +
            (isDark ? "text-paper/65" : "text-ink-mute")
          }
        >
          {tile.eyebrow}
        </p>
        <h3
          className={
            "text-[clamp(1.4rem,1.8vw,1.85rem)] font-bold tracking-[-0.025em] leading-[1.05] " +
            (isDark ? "text-paper" : "text-ink")
          }
        >
          {tile.title}
        </h3>
        <p
          className={
            "mt-2 text-[12px] md:text-[13px] leading-[1.4] " +
            (isDark ? "text-paper/60" : "text-ink-soft")
          }
        >
          {tile.tagline}
        </p>
      </div>
    </Link>
  );
}

// ─── Monoline icon system ───────────────────────────────────────
//
// 96-unit artboard · 1.6px stroke · round caps and joins ·
// currentColor stroke. One stroke weight across every icon — the
// system creates premium consistency, not per-industry styling.

const ICON_PROPS = {
  viewBox: "0 0 96 96",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "w-full h-full",
};

function UtensilsIcon() {
  return (
    <svg {...ICON_PROPS} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M 32 16 L 32 46" />
      <path d="M 26 16 L 26 26" />
      <path d="M 38 16 L 38 26" />
      <path d="M 26 28 Q 26 32 32 32 Q 38 32 38 28" />
      <path d="M 32 46 L 32 82" />
      <path d="M 64 16 Q 70 24 70 36 Q 70 44 64 48 L 64 82" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg {...ICON_PROPS} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M 22 38 L 70 38 L 66 76 Q 64 82 58 82 L 34 82 Q 28 82 26 76 Z" />
      <path d="M 70 46 Q 82 46 82 58 Q 82 70 70 70" />
      <path d="M 36 28 Q 40 22 36 16 Q 32 10 36 4" />
      <path d="M 46 28 Q 50 22 46 16 Q 42 10 46 4" />
      <path d="M 56 28 Q 60 22 56 16 Q 52 10 56 4" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg {...ICON_PROPS} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M 18 32 L 78 32 L 72 82 L 24 82 Z" />
      <path d="M 34 32 L 34 22 Q 34 12 48 12 Q 62 12 62 22 L 62 32" />
    </svg>
  );
}

function BuildingsIcon() {
  return (
    <svg {...ICON_PROPS} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M 10 36 L 30 22 L 50 36 L 70 22 L 86 36" />
      <path d="M 14 36 L 14 82" />
      <path d="M 46 36 L 46 82" />
      <path d="M 82 36 L 82 82" />
      <path d="M 10 82 L 86 82" />
      <path d="M 22 82 L 22 60 L 30 60 L 30 82" />
      <path d="M 56 82 L 56 60 L 64 60 L 64 82" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg {...ICON_PROPS} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M 18 36 Q 18 22 48 22 Q 78 22 78 36 Z" />
      <path d="M 16 44 Q 24 38 32 44 Q 40 38 48 44 Q 56 38 64 44 Q 72 38 80 44" />
      <rect x="18" y="48" width="60" height="10" rx="2" />
      <path d="M 18 62 L 78 62 Q 78 76 48 76 Q 18 76 18 62 Z" />
    </svg>
  );
}

function LoafIcon() {
  return (
    <svg {...ICON_PROPS} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M 14 50 Q 14 30 30 28 Q 48 24 66 28 Q 82 30 82 50 Q 82 70 66 76 Q 48 80 30 76 Q 14 70 14 50 Z" />
      <path d="M 32 38 L 38 60" />
      <path d="M 46 36 L 52 62" />
      <path d="M 60 38 L 66 60" />
    </svg>
  );
}

function GlassIcon() {
  return (
    <svg {...ICON_PROPS} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M 16 22 L 80 22 L 48 56 Z" />
      <path d="M 48 56 L 48 78" />
      <path d="M 30 78 L 66 78" />
      <circle cx="58" cy="34" r="3" fill="currentColor" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg {...ICON_PROPS} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="26" cy="64" r="10" />
      <circle cx="70" cy="64" r="10" />
      <path d="M 33 56 L 72 14" />
      <path d="M 63 56 L 24 14" />
      <circle cx="48" cy="40" r="2" fill="currentColor" />
    </svg>
  );
}
