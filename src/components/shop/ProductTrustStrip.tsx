// ProductTrustStrip — the thin reassurance band the reference PDPs run
// directly above or below the buy area: shipping, warranty, support.
//
// It earns its place because it answers the three objections a hardware
// buyer has at the moment of decision, and it answers them where the
// decision happens rather than in a footer nobody scrolls to.
//
// Kept deliberately quiet: hairline separators, grey monoline icons, no
// fill, no colour. The reference designs use a tinted bar; ours does not,
// because on our white ground a tinted band would be the loudest thing on
// the page and it is the product photo that should be.

import type { ReactNode } from "react";

export type TrustItem = { title: string; note: string };

export function ProductTrustStrip({
  items,
  className = "",
}: {
  items: TrustItem[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <ul
      className={`grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-hairline border-y border-hairline ${className}`}
    >
      {items.map((item, i) => (
        <li key={item.title} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
          <span aria-hidden className="shrink-0 text-ink-mute mt-0.5">
            {TRUST_ICONS[i % TRUST_ICONS.length]}
          </span>
          <div className="min-w-0">
            <p className="text-tiny font-semibold text-ink leading-tight">
              {item.title}
            </p>
            <p className="mt-0.5 text-mini text-ink-mute leading-snug">
              {item.note}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const S = { stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const };
const P = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none" } as const;

/** Shipping · warranty · support, in that order — matching the order the
 *  reference PDPs use, which is also the order the objections arrive in. */
const TRUST_ICONS: ReactNode[] = [
  // Van
  <svg key="ship" {...P} aria-hidden>
    <path d="M1.8 5.2h9v8.4h-9zM10.8 8.2h4l2.4 2.6v2.8h-6.4z" {...S} />
    <circle cx="5.4" cy="15.4" r="1.6" {...S} />
    <circle cx="14" cy="15.4" r="1.6" {...S} />
  </svg>,
  // Shield with check
  <svg key="warranty" {...P} aria-hidden>
    <path d="M10 2.2l6.2 2.2v5c0 3.4-2.5 6.4-6.2 8.4-3.7-2-6.2-5-6.2-8.4v-5z" {...S} />
    <path d="M7.4 9.8l2 2 3.4-3.6" {...S} />
  </svg>,
  // Headset
  <svg key="support" {...P} aria-hidden>
    <path d="M4 11.4V9.8a6 6 0 0 1 12 0v1.6" {...S} />
    <rect x="2.4" y="10.8" width="3.2" height="4.8" rx="1.6" {...S} />
    <rect x="14.4" y="10.8" width="3.2" height="4.8" rx="1.6" {...S} />
  </svg>,
];
