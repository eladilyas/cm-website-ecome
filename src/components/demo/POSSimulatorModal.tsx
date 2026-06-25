"use client";

// POSSimulatorModal — full-width immersive overlay that wraps the
// POSWorkspace (in embedded mode) with a top bar containing business-type
// tabs and a close button.
//
// Portaled to document.body at z-[1000] so it escapes every ancestor
// stacking context (Reveal, motion, page sections). Body scroll is locked
// while open.
//
// Switching tabs calls selectActivity(newKey), which the demo store wires
// to "reset stage to order-type and clear the active order" — so the
// modal user starts from the order-type screen for each activity. Clean
// switch, no orphaned state.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ACTIVITY_LIST } from "@/data/demo/activities";
import { useDemoStore } from "@/lib/demoStore";
import { BrandLogoMark } from "@/components/ui/BrandLogoMark";
import { POSWorkspace } from "./POSWorkspace";
import type { ActivityKey } from "@/data/demo/types";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Props = {
  open: boolean;
  /** Business type to open with. */
  initialActivity: ActivityKey | null;
  onClose: () => void;
};

export function POSSimulatorModal({ open, initialActivity, onClose }: Props) {
  const reduce = useReducedMotion();
  const activity = useDemoStore((s) => s.activity);
  const selectActivity = useDemoStore((s) => s.selectActivity);
  const tAct = useTranslations("demo.activities");

  // SSR-safe portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // When the modal opens with an `initialActivity`, sync the store. If the
  // store already had a different activity from a previous session, this
  // overrides it for this entry — so the user lands on the business type
  // they just clicked, not whatever was persisted.
  useEffect(() => {
    if (open && initialActivity) {
      selectActivity(initialActivity);
    }
  }, [open, initialActivity, selectActivity]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: APPLE_EASE }}
          className="fixed inset-0 z-[1000] bg-night/97 backdrop-blur-md flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="POS simulator"
        >
          {/* Top bar — logo + tabs + close. */}
          <header className="shrink-0 border-b border-white/8 bg-night/90 backdrop-blur-xl">
            <div className="mx-auto max-w-[1440px] px-4 md:px-6 h-14 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <CheckLogo />
                <span className="hidden md:inline text-[13px] font-medium text-paper">
                  Caisse Manager
                </span>
                <span className="hidden md:inline text-[11px] uppercase tracking-[0.14em] text-paper/45">
                  POS Simulator
                </span>
              </div>

              {/* Business type tabs */}
              <nav
                role="tablist"
                aria-label="Business type"
                className="flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0"
              >
                {ACTIVITY_LIST.map((a) => {
                  const isActive = a.key === activity;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => selectActivity(a.key)}
                      className={`shrink-0 h-9 px-3.5 text-[12px] md:text-[13px] font-medium rounded-full transition-colors duration-200 ${
                        isActive
                          ? "bg-paper text-ink"
                          : "text-paper/70 hover:text-paper hover:bg-white/[0.06]"
                      }`}
                      style={{
                        transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                      }}
                    >
                      {tAct(a.key)}
                    </button>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close simulator"
                className="shrink-0 h-9 w-9 rounded-lg text-paper/55 hover:text-paper hover:bg-white/[0.06] flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 3l8 8M11 3l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </header>

          {/* Workspace body */}
          <div className="flex-1 min-h-0 bg-night">
            <POSWorkspace embedded />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}

function CheckLogo() {
  return <BrandLogoMark size={22} />;
}
