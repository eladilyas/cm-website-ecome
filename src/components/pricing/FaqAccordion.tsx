"use client";

// FaqAccordion — premium expanding FAQ with smooth height animation and a
// chevron that rotates on open. Apple-style: hairline-divided rows, calm
// typography hierarchy, no heavy chrome.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type FaqRow = { q: string; a: string };

export function FaqAccordion({ items }: { items: FaqRow[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <dl className="max-w-[820px] divide-y divide-hairline border-y border-hairline">
      {items.map((row, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={row.q} delay={Math.min(0.05 + i * 0.03, 0.18)}>
            <div className="py-1">
              <dt>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-6 py-5 md:py-6 text-left"
                >
                  <span className="text-[16px] md:text-[17px] font-medium tracking-[-0.011em] text-ink">
                    {row.q}
                  </span>
                  <Chevron isOpen={isOpen} />
                </button>
              </dt>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.dd
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.36, ease: APPLE_EASE }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 pr-10 text-[14.5px] md:text-[15px] leading-[1.6] text-ink-soft max-w-[60ch]">
                      {row.a}
                    </div>
                  </motion.dd>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        );
      })}
    </dl>
  );
}

function Chevron({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.span
      aria-hidden
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.4, ease: APPLE_EASE }}
      className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-canvas text-ink-soft"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M3.5 5.5L7 9l3.5-3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  );
}
