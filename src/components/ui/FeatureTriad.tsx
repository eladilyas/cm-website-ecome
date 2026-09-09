// FeatureTriad — the catalogue's closing three-column strip.
//
// Bottom of all 13 catalogue pages, identical every time:
//
//   ⚙ Caractéristiques      🔗 Intégrations         🎧 Supports
//     • Accès à distance       • Monétique CMI         • Mises à jour
//     • Mode offline           • Gestion de stock      • Support 7j/7
//     • Fidélisation           • Commandes & livraison • Formation
//
// The details that make it read as the catalogue rather than a generic
// icon row:
//
//   • MONOLINE OUTLINE icons, grey, ~28px, on no background — no filled
//     circle, no tinted chip, no ring. The icon sits directly on white.
//   • The heading is bold ink and sits on the icon's baseline, beside it,
//     not beneath.
//   • Bulleted lists with small round bullets and generous leading.
//   • Nothing is boxed. There is no card. Three columns of plain content
//     separated by whitespace alone — which is exactly why the catalogue
//     feels calm where a card grid would feel busy.
//
// Items accept a trailing node so a bullet can carry a partner logo
// inline, the way the catalogue sets "Monétique intégrée CMI" with the
// CMI wordmark in its own red at the end of the line.

import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

export type TriadColumn = {
  /** Outline icon, ~28px. Pass a monoline SVG at currentColor. */
  icon: ReactNode;
  title: string;
  /** Bullets. A string, or a node when the line ends in a partner mark. */
  items: (string | ReactNode)[];
};

export function FeatureTriad({
  columns,
  className = "",
}: {
  columns: TriadColumn[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 ${className}`}
    >
      {columns.map((col, i) => (
        <Reveal key={col.title} delay={0.04 + i * 0.05}>
          <div>
            <div className="flex items-center gap-3">
              {/* Grey, unboxed, sitting straight on the ground colour. */}
              <span aria-hidden className="shrink-0 text-ink-mute">
                {col.icon}
              </span>
              <h3 className="text-[19px] md:text-[20px] font-bold tracking-[-0.012em] text-ink">
                {col.title}
              </h3>
            </div>
            <ul className="mt-4 space-y-2.5 pl-1">
              {col.items.map((item, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2.5 text-[15px] leading-[1.5] text-ink"
                >
                  <span
                    aria-hidden
                    className="mt-[0.5em] h-[3px] w-[3px] shrink-0 rounded-full bg-ink"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ── The catalogue's three icons ────────────────────────────────────────
   Monoline, 28px artboard, 1.5px stroke, currentColor. Drawn to match the
   catalogue's own set (gear / chain-link / headset) rather than pulled
   from an icon library, so the stroke weight matches the type. */

export function GearIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="3.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M14 3.4v3.1M14 21.5v3.1M24.6 14h-3.1M6.5 14H3.4M21.5 6.5l-2.2 2.2M8.7 19.3l-2.2 2.2M21.5 21.5l-2.2-2.2M8.7 8.7 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M11.4 16.6a4.4 4.4 0 0 1 0-6.2l3.1-3.1a4.4 4.4 0 0 1 6.2 6.2l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16.6 11.4a4.4 4.4 0 0 1 0 6.2l-3.1 3.1a4.4 4.4 0 0 1-6.2-6.2l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeadsetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M5.6 16.3v-2.2a8.4 8.4 0 0 1 16.8 0v2.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="3.4"
        y="15.4"
        width="4.4"
        height="6.6"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="20.2"
        y="15.4"
        width="4.4"
        height="6.6"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M22.4 22v.9a2.6 2.6 0 0 1-2.6 2.6h-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7.4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.6 10h14.8M10 2.6c2 2 3.1 4.7 3.1 7.4s-1.1 5.4-3.1 7.4c-2-2-3.1-4.7-3.1-7.4S8 4.6 10 2.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
