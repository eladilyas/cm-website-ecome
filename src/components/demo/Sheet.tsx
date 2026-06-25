"use client";

// Reusable overlay sheet — extracted from PaymentSheet's pattern so
// Phase 2 features (refund picker, modifier wizard, combo wizard,
// split-payment picker, open-price entry, discount picker) share one
// chrome instead of each reinventing the motion + escape + focus
// behavior.
//
// Layout: absolute-positioned inside the parent's positioning context
// (POSWorkspace's <main>), full-bleed on top of the active view.
// Matches PaymentSheet so the visual "depth" is consistent across the
// app — payment, refund, modifier all feel like the same surface
// type.
//
// Why not portaled to body: the POS simulator is embedded inside a
// device chassis on the marketing pages. A body-portaled overlay
// would burst out of the iPad mockup. PaymentSheet stays inside the
// chrome; Sheet does too.

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type SheetScheme = "dark" | "light";

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Header title — left-aligned. Required for a11y (used as
   *  aria-labelledby on the dialog). */
  title: string;
  /** Optional subhead below the title — small muted text. */
  subtitle?: string;
  children: React.ReactNode;
  /** Right-aligned slot in the header (e.g. a status badge or
   *  secondary action). */
  headerExtra?: React.ReactNode;
  /** Sticky footer slot — typically a Cancel / Confirm row. Rendered
   *  inside the bottom border with backdrop blur so long content
   *  scrolls underneath. */
  footer?: React.ReactNode;
  /** Visual scheme. "dark" (default) matches the original PaymentSheet
   *  surface — used inside the POS ringing flow. "light" matches the
   *  Phase 4 management surfaces (Backoffice + Calendar + Kitchen).
   *  Picking the right scheme keeps the sheet visually consistent
   *  with whatever surface launched it. */
  scheme?: SheetScheme;
};

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  headerExtra,
  footer,
  scheme = "dark",
}: SheetProps) {
  const isLight = scheme === "light";
  const surfaceCls = isLight
    ? "bg-canvas/98 backdrop-blur-sm"
    : "bg-night/95 backdrop-blur-sm";
  const headerCls = isLight
    ? "shrink-0 px-5 py-4 border-b border-hairline flex items-center justify-between gap-3"
    : "shrink-0 px-5 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3";
  const titleCls = isLight
    ? "text-[15px] font-semibold text-ink tracking-[-0.005em] truncate"
    : "text-[15px] font-semibold text-paper tracking-[-0.005em] truncate";
  const subtitleCls = isLight
    ? "mt-0.5 text-[11px] text-ink-mute truncate"
    : "mt-0.5 text-[11px] text-paper/55 truncate";
  const closeBtnCls = isLight
    ? "h-8 w-8 rounded-lg text-ink-mute hover:text-ink hover:bg-fog flex items-center justify-center transition-colors"
    : "h-8 w-8 rounded-lg text-paper/55 hover:text-paper hover:bg-white/[0.06] flex items-center justify-center transition-colors";
  const footerCls = isLight
    ? "shrink-0 px-5 py-3 border-t border-hairline bg-paper/90 backdrop-blur-sm"
    : "shrink-0 px-5 py-3 border-t border-white/[0.08] bg-night/80 backdrop-blur-sm";
  // Esc to close — global key handler scoped to when this sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: APPLE_EASE }}
          className={"absolute inset-0 z-40 " + surfaceCls}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.22, ease: APPLE_EASE }}
            onClick={(e) => e.stopPropagation()}
            className="h-full flex flex-col"
          >
            <header className={headerCls}>
              <div className="min-w-0">
                <h2 id="sheet-title" className={titleCls}>
                  {title}
                </h2>
                {subtitle && <p className={subtitleCls}>{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerExtra}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className={closeBtnCls}
                >
                  <CloseIcon />
                </button>
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>

            {footer && <footer className={footerCls}>{footer}</footer>}
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 3l8 8M11 3l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
