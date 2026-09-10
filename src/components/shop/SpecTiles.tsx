// SpecTiles — the four-up "key specs at a glance" row on a product page.
//
// The pattern the founder's reference PDPs use: a row of icon tiles showing
// the few numbers a buyer actually decides on, sitting high on the page,
// with the exhaustive table left further down for people who want it.
//
// ── Why the specs are RANKED, not sliced ──────────────────────────────
// The naive version takes the first four entries of `specs[]`. Measured
// against the real catalogue that yields "Brand / Model / Colour /
// Compatibility" — because those are the most COMMON labels (Brand appears
// on 54 of 76 products, Model on 43). They are identity fields. Nobody
// chooses a terminal because it has a model number.
//
// So tiles are ORDERED by how much they help a decision. `TILE_PRIORITY`
// ranks the labels that make a real selling point (display, processor,
// battery, range, capacity…) and `DEMOTED` sorts identity fields to the
// back so they only ever fill leftover slots.
//
// They are sorted, not filtered — see pickSpecTiles for why excluding them
// was worse. Coverage with the current catalogue: 58 products field four
// tiles, 15 field three, 3 field two. None field zero.

import { Reveal } from "@/components/ui/Reveal";
import type { ProductSpec } from "@/server/catalog/types";

/** Fewer than this and it is not a row. Two is a legitimate strip; one
 *  lone tile reads as a mistake. */
const MIN_TILES = 2;
const MAX_TILES = 4;

/** Labels that make a good tile, best first. Matched case-insensitively on
 *  a substring so "Model reference" and "Operating system" both resolve. */
const TILE_PRIORITY = [
  "display",
  "processor",
  "battery",
  "range",
  "capacity",
  "memory",
  "storage",
  "connectivity",
  "power",
  "frequency",
  "print",
  "scan",
  "weight",
  "dimensions",
  "size",
  "operating system",
  "platform",
  "antenna",
  "form factor",
] as const;

/** Identity / catalogue metadata. Real spec-table content, but it does not
 *  sell anything, so it never wins a tile slot over the list above. */
const DEMOTED = ["brand", "model", "colour", "color", "finish", "type", "use case"];

function rankOf(label: string): number {
  const l = label.toLowerCase();
  const hit = TILE_PRIORITY.findIndex((k) => l.includes(k));
  if (hit >= 0) return hit;
  if (DEMOTED.some((k) => l.includes(k))) return 900;
  // Unknown labels sit between the two: probably product-specific and
  // therefore probably interesting, but not a known decision driver.
  return 500;
}

/** Pick the tiles. Exported so the page can decide whether to render the
 *  section without duplicating the ranking rule.
 *
 *  Demoted labels are sorted LAST, not dropped. Dropping them was a real
 *  mistake: measured against the catalogue it left 38 of 76 products with
 *  no tiles at all, including every flagship iMin terminal — those carry
 *  exactly four specs, two of which ("Model reference", "Brand") are
 *  identity fields, so excluding them fell below the minimum and the row
 *  vanished on the most important products on the site.
 *
 *  Ranking still does the useful work — the decision specs lead — but a
 *  filled row of four with the best two first beats an empty one, and on
 *  hardware a brand and a model reference are genuinely what a buyer
 *  quotes when they order. */
export function pickSpecTiles(specs: readonly ProductSpec[] | undefined) {
  if (!specs?.length) return [];
  const ranked = specs
    .map((s, i) => ({ s, rank: rankOf(s.label), i }))
    // Stable: rank first, then original catalogue order.
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .slice(0, MAX_TILES)
    .map((r) => r.s);
  // A one-tile row is not a row. Two or more is a legitimate strip.
  return ranked.length >= MIN_TILES ? ranked : [];
}

export function SpecTiles({
  specs,
  eyebrow,
}: {
  specs: readonly ProductSpec[] | undefined;
  eyebrow: string;
}) {
  const tiles = pickSpecTiles(specs);
  if (!tiles.length) return null;

  return (
    <div>
      <Reveal>
        <p className="text-micro font-semibold uppercase tracking-[0.2em] text-ink-mute mb-5">
          {eyebrow}
        </p>
      </Reveal>
      {/* 2-up on phones so the value has room to wrap, 4-up from md.
          Hairline-separated rather than carded: the reference PDPs run
          these as a continuous strip, and boxing four tiles would repeat
          the container-heaviness the catalogue avoids. */}
      <ul className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-hairline">
        {tiles.map((spec) => (
          <li
            key={spec.label}
            className="border-b border-r border-hairline p-4 md:p-5"
          >
            <span aria-hidden className="inline-block text-ink-mute mb-3">
              <SpecIcon label={spec.label} />
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-mute">
              {spec.label}
            </p>
            <p className="mt-1 text-tiny md:text-sm font-semibold leading-[1.35] text-ink">
              {spec.value}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────
   Monoline, 22px, 1.5px stroke, currentColor — same drawing language as
   the catalogue's feature-triad icons. Chosen by keyword off the real spec
   labels in the catalogue, with a neutral chip fallback so an unmapped
   label still renders something deliberate rather than an empty slot. */

function SpecIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  const P = { width: 22, height: 22, viewBox: "0 0 22 22", fill: "none" } as const;
  const S = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const };

  if (l.includes("display") || l.includes("screen")) {
    return (
      <svg {...P} aria-hidden>
        <rect x="2" y="3.5" width="18" height="12" rx="1.6" {...S} />
        <path d="M8 19h6M11 15.5V19" {...S} />
      </svg>
    );
  }
  if (l.includes("processor") || l.includes("platform") || l.includes("operating")) {
    return (
      <svg {...P} aria-hidden>
        <rect x="6" y="6" width="10" height="10" rx="1.4" {...S} />
        <path d="M9 2.5v3M13 2.5v3M9 16.5v3M13 16.5v3M2.5 9h3M2.5 13h3M16.5 9h3M16.5 13h3" {...S} />
      </svg>
    );
  }
  if (l.includes("battery") || l.includes("power")) {
    return (
      <svg {...P} aria-hidden>
        <rect x="2" y="7" width="15" height="8" rx="2" {...S} />
        <path d="M19.5 10v2" {...S} />
        <path d="M5 10.5v1" {...S} />
      </svg>
    );
  }
  if (l.includes("memory") || l.includes("storage")) {
    return (
      <svg {...P} aria-hidden>
        <rect x="3" y="4" width="16" height="5" rx="1.4" {...S} />
        <rect x="3" y="13" width="16" height="5" rx="1.4" {...S} />
        <path d="M6.5 6.5h.01M6.5 15.5h.01" {...S} />
      </svg>
    );
  }
  if (l.includes("range") || l.includes("connectivity") || l.includes("antenna") || l.includes("frequency")) {
    return (
      <svg {...P} aria-hidden>
        <path d="M11 17.5v-6" {...S} />
        <circle cx="11" cy="9.5" r="1.6" {...S} />
        <path d="M6.5 13A6 6 0 0 1 6.5 6M15.5 6a6 6 0 0 1 0 7M3.8 15.6a9.6 9.6 0 0 1 0-12.2M18.2 3.4a9.6 9.6 0 0 1 0 12.2" {...S} />
      </svg>
    );
  }
  if (l.includes("capacity") || l.includes("print") || l.includes("paper")) {
    return (
      <svg {...P} aria-hidden>
        <path d="M5 8V3.5h12V8" {...S} />
        <rect x="2.5" y="8" width="17" height="7" rx="1.6" {...S} />
        <path d="M5.5 15v3.5h11V15" {...S} />
      </svg>
    );
  }
  if (l.includes("weight") || l.includes("dimension") || l.includes("size") || l.includes("form")) {
    return (
      <svg {...P} aria-hidden>
        <path d="M11 3.2 19 7.5v7L11 18.8 3 14.5v-7Z" {...S} />
        <path d="M11 18.8v-7.3M11 11.5 3 7.5M11 11.5 19 7.5" {...S} />
      </svg>
    );
  }
  if (l.includes("scan") || l.includes("barcode")) {
    return (
      <svg {...P} aria-hidden>
        <path d="M3 5.5V3.5h3M19 5.5V3.5h-3M3 16.5v2h3M19 16.5v2h-3" {...S} />
        <path d="M7 7v8M10 7v8M13 7v8M16 7v8" {...S} />
      </svg>
    );
  }
  // Neutral fallback — a spec chip. Deliberate, not an empty slot.
  return (
    <svg {...P} aria-hidden>
      <rect x="3" y="4.5" width="16" height="13" rx="1.8" {...S} />
      <path d="M6.5 9h9M6.5 13h5.5" {...S} />
    </svg>
  );
}
