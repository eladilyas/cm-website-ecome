"use client";

// Cart toast — floating notification shown after Add to Cart.
//
// Sits top-right under the header, slides in + fades. Replaces the
// drawer's auto-open behaviour with something less intrusive: the
// user can keep browsing without being interrupted by a modal panel.
// Auto-dismisses after 5 seconds; manual close button always
// available. Updates in-place when the user adds another product
// (no stacking — the toast always shows the most recent add).
//
// Portaled to document.body so it escapes every ancestor stacking
// context. Pointer-events isolated to the toast itself (the rest
// of the page stays fully interactive while the toast is up).

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { formatPrice } from "@/lib/formatPrice";
import { Arrow } from "@/components/ui/Arrow";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const AUTO_DISMISS_MS = 5000;

export function CartToast() {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const toastSlug = useCartStore((s) => s.toastSlug);
  const dismissToast = useCartStore((s) => s.dismissToast);
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.qty, 0),
  );
  const itemQty = useCartStore((s) =>
    toastSlug ? s.items.find((i) => i.slug === toastSlug)?.qty ?? 0 : 0,
  );

  // SSR-safe mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Auto-dismiss timer. Re-arms whenever toastSlug changes, so
  // adding a new item before the previous timer fires resets the
  // window — keeps the toast visible for a fresh 5s for each new
  // add.
  useEffect(() => {
    if (!toastSlug) return;
    const id = window.setTimeout(() => dismissToast(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [toastSlug, dismissToast]);

  // Close on route change so the toast doesn't linger across pages.
  useEffect(() => {
    if (toastSlug) dismissToast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Suppress on POS workspace + on the dedicated /cart page (toast
  // is redundant when you're already looking at the cart).
  const suppressed =
    pathname?.startsWith("/demo/order") || pathname === "/cart";

  const { productsBySlug } = useCatalog();
  const product = useMemo(
    () => (toastSlug ? productsBySlug[toastSlug] : undefined),
    [toastSlug, productsBySlug],
  );

  if (!mounted) return null;
  if (suppressed) return null;

  const node = (
    <AnimatePresence>
      {toastSlug && product && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16, y: -4 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
          transition={{ duration: reduce ? 0 : 0.28, ease: APPLE_EASE }}
          className="fixed top-[84px] right-4 sm:right-6 z-[900] w-[calc(100vw-2rem)] sm:w-[360px] pointer-events-auto"
        >
          <div className="rounded-2xl bg-paper border border-hairline shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden">
            {/* Header — confirmation eyebrow + close */}
            <div className="px-4 pt-3.5 flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700">
                <CheckIcon />
                Added to cart
              </p>
              <button
                type="button"
                onClick={dismissToast}
                aria-label="Dismiss notification"
                className="h-7 w-7 rounded-lg text-ink-mute hover:text-ink hover:bg-canvas flex items-center justify-center transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3 3l6 6M9 3l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Body — thumbnail + name + qty/price */}
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="relative shrink-0 h-14 w-14 rounded-lg bg-canvas overflow-hidden">
                <Image
                  src={product.heroImage}
                  alt={product.alt}
                  fill
                  sizes="56px"
                  className="object-contain p-1.5"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium tracking-[-0.005em] text-ink truncate">
                  {product.name}
                  {product.subline && (
                    <span className="ml-1.5 text-[12px] font-normal text-ink-mute">
                      {product.subline}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[11.5px] text-ink-mute tabular-nums">
                  {formatPrice(product.priceFrom)} · qty {itemQty}
                </p>
              </div>
            </div>

            {/* Footer — primary CTA + cart summary */}
            <div className="px-4 pb-3.5 pt-1 flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-ink-mute tabular-nums">
                Cart · {cartCount} item{cartCount === 1 ? "" : "s"}
              </p>
              <Link
                href="/cart"
                onClick={dismissToast}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[12.5px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
                View cart
                <Arrow size={12} strokeWidth={1.4} />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.5l2.5 2.5L10 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
