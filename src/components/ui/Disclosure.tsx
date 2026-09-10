"use client";

// Disclosure — collapsible content rows.
//
// Every one of the reference product pages collapses its long tail this way
// (Description, Specifications, Shipping & Returns, Reviews), and the reason
// is mobile: our PDP runs ~8,600px on a phone with everything expanded, so a
// buyer who wants the shipping terms has to scroll past the full spec table
// to reach them. Collapsed, the whole tail becomes a scannable index of
// four rows.
//
// Semantics rather than a div that toggles:
//   • a real <button> per row with aria-expanded and aria-controls
//   • the panel is labelled by its trigger, so a screen reader announces
//     what it belongs to
//   • hidden via the `hidden` attribute, not opacity or height:0, so
//     collapsed content is genuinely out of the a11y tree and out of tab
//     order rather than invisible-but-focusable
//   • one row may start open (`defaultOpen`), because a product page whose
//     description begins collapsed reads as empty
//
// Rows open independently — this is not an accordion that closes its
// siblings. On a spec-heavy page a buyer legitimately wants the dimensions
// and the shipping terms visible at the same time to compare.

import { useId, useState } from "react";

export type DisclosureRow = {
  title: string;
  /** Optional short count/summary shown beside the title, e.g. "12 specs". */
  meta?: string;
  content: React.ReactNode;
};

export function Disclosure({
  rows,
  /** Index of the row open on first paint. -1 for all closed. */
  defaultOpen = 0,
}: {
  rows: DisclosureRow[];
  defaultOpen?: number;
}) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<number>>(
    () => new Set(defaultOpen >= 0 ? [defaultOpen] : []),
  );

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="border-t border-hairline">
      {rows.map((row, i) => {
        const isOpen = open.has(i);
        const panelId = `${baseId}-panel-${i}`;
        const triggerId = `${baseId}-trigger-${i}`;
        return (
          <div key={row.title} className="border-b border-hairline">
            <h3>
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="ease-brand group flex w-full items-center gap-3 py-5 text-left transition-colors duration-200 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <span className="flex-1 text-h3 font-semibold tracking-[-0.012em] text-ink group-hover:text-brand">
                  {row.title}
                </span>
                {row.meta && (
                  <span className="text-mini tabular-nums text-ink-mute">
                    {row.meta}
                  </span>
                )}
                {/* Plus/minus rather than a chevron: the reference pages use
                    it, and it states "this expands" more literally than a
                    rotation does. Built from two rules so the horizontal one
                    can stay while the vertical collapses. */}
                <span
                  aria-hidden
                  className="relative ml-1 grid h-5 w-5 shrink-0 place-items-center text-ink-mute"
                >
                  <span className="absolute h-[1.5px] w-3.5 rounded bg-current" />
                  <span
                    className={`ease-brand absolute h-3.5 w-[1.5px] rounded bg-current transition-transform duration-300 ${
                      isOpen ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="pb-6"
            >
              {row.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
