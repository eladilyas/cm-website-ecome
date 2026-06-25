"use client";

// ConfirmDialog — Apple-style modal for destructive / confirming actions.
//
// Custom replacement for window.confirm(). Used anywhere we'd otherwise show
// the browser's native dialog (which breaks the premium brand feel).
//
// Z-LAYER HIERARCHY (entire app):
//   • Marketing header               z-50  (top bar, scroll-aware glass)
//   • StickyTrialCTA                 z-40  (mobile bottom strip)
//   • PaymentSheet / PaymentSuccess  z-40  (scoped to /demo/order workspace)
//   • POSChrome                      z-30
//   • Marketing nav scrim            z-30
//   • CountrySelect dropdown         z-30  (scoped to its trigger)
//   • ConfirmDialog                  z-1000  (portaled to document.body)
//
// The dialog is rendered via React.createPortal into <body>, escaping every
// ancestor stacking context (transform / filter / backdrop-filter) so it
// always sits above every other layer regardless of where it's invoked from.
//
// Centering: fixed inset-0 + flex items-center justify-center centers on
// every viewport. overflow-y-auto allows the (rare) tall dialog to scroll
// inside its container.
//
// Behaviors:
//   • Backdrop blur + dim overlay
//   • Centered card with title + body + Cancel/Confirm buttons
//   • ESC and backdrop click both trigger Cancel
//   • Body scroll locked while open
//   • Focus moves into the dialog on open (Cancel button gets initial focus —
//     the safe default for destructive actions)
//   • Tab cycles between the two buttons (basic focus trap)
//   • Scheme-aware (light/dark) so it works on marketing pages AND the POS
//     dark workspace
//   • Tone-aware (default | destructive | brand) controls the primary button color
//   • Motion: backdrop fade 200ms, card fade+scale (0.96 → 1) over 240ms
//     Apple ease. Both disabled under prefers-reduced-motion.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type ConfirmTone = "default" | "destructive" | "brand";

export type ConfirmDialogProps = {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the user dismisses (ESC, backdrop click, Cancel button). */
  onCancel: () => void;
  /** Called when the user accepts (Confirm button). */
  onConfirm: () => void;
  /** Short title. Apple-style — 1 line, statement, not a question fragment. */
  title: string;
  /** Optional body text underneath the title. */
  body?: React.ReactNode;
  /** Label for the affirmative button. Default "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel button. Default "Cancel". */
  cancelLabel?: string;
  /** Visual scheme of the dialog. Default "light". */
  scheme?: "light" | "dark";
  /** Tone of the confirm action. Drives the primary button color. */
  tone?: ConfirmTone;
};

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  scheme = "light",
  tone = "default",
}: ConfirmDialogProps) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // SSR-safe portal mount target: document.body, resolved on the client only.
  // Portaling escapes any ancestor stacking context (transform / filter /
  // backdrop-filter), guaranteeing the dialog can sit above POSChrome,
  // PaymentSheet, marketing header, sticky CTAs — anything.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Body scroll lock — preserve current overflow on open, restore on close.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Initial focus → Cancel button (safe default).
  useEffect(() => {
    if (!open) return;
    // microtask delay so the element is in the DOM
    const t = requestAnimationFrame(() => cancelRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  // Keyboard: ESC = cancel, Tab = cycle between the two buttons.
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab") {
        // basic 2-element focus trap
        const focused = document.activeElement;
        if (focused === cancelRef.current && !e.shiftKey) {
          e.preventDefault();
          confirmRef.current?.focus();
        } else if (focused === confirmRef.current && e.shiftKey) {
          e.preventDefault();
          cancelRef.current?.focus();
        } else if (focused !== cancelRef.current && focused !== confirmRef.current) {
          // user tabbed outside; pull focus back to confirm or cancel
          e.preventDefault();
          (e.shiftKey ? confirmRef : cancelRef).current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onCancel]);

  const isDark = scheme === "dark";

  // Confirm button color logic.
  //   • destructive → brand red (#E11D2A) — Reset, Delete, Discard
  //   • brand       → brand red filled
  //   • default     → inverse of scheme (ink button on light, paper button on dark)
  const confirmClass =
    tone === "destructive" || tone === "brand"
      ? "bg-[#E11D2A] text-white hover:bg-[#c8141f]"
      : isDark
        ? "bg-paper text-ink hover:bg-paper/90"
        : "bg-ink text-paper hover:bg-ink/85";

  const cancelClass = isDark
    ? "border border-white/15 text-paper/85 hover:bg-white/[0.06] hover:text-paper"
    : "border border-hairline-strong text-ink hover:bg-canvas";

  const cardClass = isDark
    ? "bg-night-soft text-paper border border-white/8"
    : "bg-paper text-ink border border-hairline";

  if (!mounted) return null;

  const dialog = (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby={body ? "confirm-dialog-body" : undefined}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: APPLE_EASE }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
          />

          {/* Card */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: APPLE_EASE }}
            className={`relative w-full max-w-[440px] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${cardClass}`}
          >
            <div className="p-6 md:p-7">
              <h2
                id="confirm-dialog-title"
                className="text-[17px] md:text-[19px] font-semibold tracking-[-0.012em] leading-[1.25]"
              >
                {title}
              </h2>
              {body && (
                <div
                  id="confirm-dialog-body"
                  className={`mt-2 text-[14px] md:text-[15px] leading-[1.5] ${
                    isDark ? "text-paper/70" : "text-ink-soft"
                  }`}
                >
                  {body}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={onCancel}
                  className={`h-10 px-4 rounded-xl text-[14px] font-medium transition-colors duration-200 ${cancelClass} focus-visible:outline-none focus-visible:ring-2 ${
                    isDark
                      ? "focus-visible:ring-paper/40"
                      : "focus-visible:ring-ink/30"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                >
                  {cancelLabel}
                </button>
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={onConfirm}
                  className={`h-10 px-4 rounded-xl text-[14px] font-medium transition-colors duration-200 ${confirmClass} focus-visible:outline-none focus-visible:ring-2 ${
                    tone === "destructive" || tone === "brand"
                      ? "focus-visible:ring-[#E11D2A]/40"
                      : isDark
                        ? "focus-visible:ring-paper/40"
                        : "focus-visible:ring-ink/30"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(dialog, document.body);
}
