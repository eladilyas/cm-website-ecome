"use client";

// OrderTypePopover — anchored dropdown that replaces the modal
// OrderTypeSheet for the order-type badge. Click-outside closes; ESC
// closes; clicking an option commits immediately. Lives inside the cart
// header so it never breaks the cashier's focus.

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { useDemoStore } from "@/lib/demoStore";
import { ACTIVITY_CAPS } from "@/data/demo/activityCapabilities";
import type { OrderType } from "@/data/demo/types";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Keys under `demo.orderType` — resolved at render time so the active
// locale takes effect immediately on FR ↔ EN toggle.
const LABEL_KEY: Record<OrderType, string> = {
  "take-away": "takeAway",
  "dine-in": "dineIn",
  glovo: "glovo",
  done: "done",
};

const SUBLABEL_KEY: Record<OrderType, string> = {
  "take-away": "takeAwaySub",
  "dine-in": "dineInSub",
  glovo: "glovoSub",
  done: "doneSub",
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Ref to the anchor button. Outside-click ignores it so clicking
   *  the toggle button while the popover is open lets the button's
   *  own onClick run the toggle-close — without this, mousedown
   *  closes first and the subsequent onClick reopens it (net effect:
   *  the popover stays stubbornly open). */
  anchorRef?: React.RefObject<HTMLElement | null>;
};

export function OrderTypePopover({ open, onClose, anchorRef }: Props) {
  const activity = useDemoStore((s) => s.activity);
  const order = useDemoStore((s) => s.order);
  const setOrderType = useDemoStore((s) => s.setOrderType);
  const ref = useRef<HTMLDivElement>(null);
  const tType = useTranslations("demo.orderType");

  // Click-outside + ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      // Anchor click escapes outside-close so the toggle button can
      // run its own onClick (toggle to closed) without us closing
      // first and the button immediately reopening.
      if (anchorRef?.current?.contains(target)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    // Schedule click handler one tick out so the click that OPENED the
    // popover doesn't immediately close it.
    const t = window.setTimeout(() => {
      window.addEventListener("mousedown", onDown);
    }, 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose, anchorRef]);

  if (!activity || !order) return null;
  const enabled = ACTIVITY_CAPS[activity].enabledOrderTypes;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.16, ease: APPLE_EASE }}
          className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-[10px] bg-night/95 backdrop-blur-md border border-white/12 shadow-[0_18px_48px_rgba(0,0,0,0.45)] overflow-hidden origin-top-right"
          role="menu"
          aria-label={tType("change")}
        >
          {enabled.map((t) => {
            const active = t === order.type;
            return (
              <button
                key={t}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setOrderType(t);
                  onClose();
                }}
                className={
                  "w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors " +
                  (active
                    ? "bg-[#E11D2A]/15"
                    : "hover:bg-white/[0.05]")
                }
              >
                <div className="min-w-0">
                  <p
                    className={
                      "text-[12.5px] font-medium leading-tight " +
                      (active ? "text-[#E11D2A]" : "text-paper")
                    }
                  >
                    {tType(LABEL_KEY[t])}
                  </p>
                  <p
                    className={
                      "mt-0.5 text-[10.5px] leading-tight " +
                      (active ? "text-[#E11D2A]/85" : "text-paper/55")
                    }
                  >
                    {tType(SUBLABEL_KEY[t])}
                  </p>
                </div>
                {active && (
                  <span aria-hidden className="text-[#E11D2A]">
                    <CheckGlyph />
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CheckGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6.5l2.5 2.5L10 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
