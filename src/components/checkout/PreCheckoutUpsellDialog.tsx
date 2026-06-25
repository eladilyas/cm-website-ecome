"use client";

// Final-moment upsell — surfaces once just before the customer
// hits "Continue to payment", IF the cart has at least one product
// whose top complementary pair isn't already in the cart.
//
// Strict non-intrusion rules:
//   • Shows at most once per session (sessionStorage guard).
//   • Has both an explicit dismiss ("Continue without it") AND an
//     accept ("Add and continue"). Both proceed to the next step;
//     the dialog never blocks checkout.
//   • Esc closes (treated as a dismiss).
//   • Renders as an overlay, not a hard interrupt — focus on the
//     accept button, not on rendering scary copy.

import Image from "next/image";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CatalogProduct } from "@/server/catalog/types";
import { formatPrice } from "@/lib/formatPrice";

const SESSION_KEY = "cm-checkout-pre-upsell-shown";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function PreCheckoutUpsellDialog({
  product,
  open,
  onAccept,
  onSkip,
}: {
  product: CatalogProduct | null;
  open: boolean;
  onAccept: () => void;
  onSkip: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onSkip]);

  return (
    <AnimatePresence>
      {open && product && (
        <motion.div
          key="pre-upsell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: APPLE_EASE }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 bg-ink/30 backdrop-blur-sm"
          onClick={onSkip}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pre-upsell-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: APPLE_EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] rounded-2xl bg-paper shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-hairline overflow-hidden"
          >
            <div className="px-5 pt-5 pb-2">
              <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
                One last thing
              </p>
              <h2
                id="pre-upsell-title"
                className="mt-1 text-[19px] font-semibold text-ink leading-tight"
              >
                Most operators pair this with what&rsquo;s in your cart
              </h2>
              <p className="mt-1.5 text-[13px] text-ink-soft leading-relaxed">
                Adding it now ships everything together and saves a second
                delivery later. You can decline and continue — no problem.
              </p>
            </div>

            <div className="mx-5 my-4 rounded-xl border border-hairline bg-canvas/60 p-3.5 flex items-center gap-3.5">
              <div className="relative w-16 h-16 shrink-0 rounded-lg bg-paper border border-hairline overflow-hidden flex items-center justify-center">
                <Image
                  src={product.heroImage}
                  alt={product.alt}
                  fill
                  sizes="64px"
                  className="object-contain p-2"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink truncate">
                  {product.name}
                  {product.subline ? (
                    <span className="text-ink-mute font-normal">
                      {" "}
                      · {product.subline}
                    </span>
                  ) : null}
                </p>
                <p className="text-[12px] text-ink-mute line-clamp-2">
                  {product.tagline}
                </p>
                <p className="mt-1 text-[13px] tabular-nums font-medium text-ink">
                  {formatPrice(product.priceFrom)} HT
                </p>
              </div>
            </div>

            <div className="px-5 pt-1 pb-5 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onAccept}
                className="h-11 inline-flex items-center justify-center rounded-full bg-ink text-paper text-[13.5px] font-medium hover:bg-ink-soft transition-colors duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] flex-1"
              >
                Add and continue
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="h-11 inline-flex items-center justify-center rounded-full border border-hairline-strong bg-paper text-ink text-[13.5px] font-medium hover:bg-canvas transition-colors duration-200 flex-1"
              >
                Continue without it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** True iff this session has already seen the pre-checkout dialog. */
export function hasSeenPreCheckoutUpsell(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPreCheckoutUpsellSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* noop */
  }
}
