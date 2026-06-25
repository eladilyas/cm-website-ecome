"use client";

// FAQ accordion with smooth height-spring open. One panel open at a time,
// keyboard-accessible (button toggles aria-expanded), and respects
// prefers-reduced-motion for the height transition.

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSupportFaqs, useSupportTopics } from "@/data/support";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Props = {
  /** Filter to a single topic. Omit for "All". */
  topicId?: string | null;
};

export function FAQAccordion({ topicId }: Props) {
  const reduce = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const FAQS = useSupportFaqs();
  const SUPPORT_TOPICS = useSupportTopics();
  const tCommon = useTranslations("common");

  const filtered = topicId ? FAQS.filter((f) => f.topicId === topicId) : FAQS;

  if (filtered.length === 0) {
    return (
      <p className="py-12 text-center text-[14px] text-ink-mute">
        {tCommon("error")}
      </p>
    );
  }

  return (
    <ul className="border-t border-hairline">
      {filtered.map((faq, i) => {
        const isOpen = openIndex === i;
        const topic = SUPPORT_TOPICS.find((t) => t.id === faq.topicId);
        return (
          <li key={i} className="border-b border-hairline">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full text-left py-5 md:py-6 flex items-start justify-between gap-6 group"
            >
              <div className="min-w-0">
                {!topicId && topic && (
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1.5">
                    {topic.label}
                  </p>
                )}
                <p className="text-[16px] md:text-[18px] font-medium text-ink leading-[1.35] tracking-[-0.005em]">
                  {faq.question}
                </p>
              </div>
              <span
                aria-hidden
                className="shrink-0 mt-1 text-ink-mute group-hover:text-ink transition-colors duration-200"
              >
                <PlusIcon open={isOpen} />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: APPLE_EASE }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 md:pb-7 text-[15px] md:text-[16px] leading-[1.55] text-ink-soft max-w-[44rem]">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}

function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="transition-transform duration-300"
      style={{
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        transform: open ? "rotate(45deg)" : "rotate(0deg)",
      }}
    >
      <path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
