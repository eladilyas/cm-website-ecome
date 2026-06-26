"use client";

// Quick View modal — opens any catalog product without leaving the
// page. Renders only when `slug` is non-null so it costs zero on
// idle pages.
//
// Anatomy (centered card, max 880px wide):
//   • Left column   — hero image (square, contained, hairline border)
//   • Right column  — name + subline + price + tagline + 3 key
//                     features + availability + Add-to-Cart pill +
//                     "See full details" link to /shop/[slug] (for
//                     spec table + SEO).
//
// Premium polish:
//   • Apple cubic-bezier easing on every transition.
//   • Backdrop blur + bg-ink/40 for depth.
//   • Esc + backdrop tap closes.
//   • Body scroll-lock while open so the page doesn't move under it.
//   • Mobile: full-screen sheet that slides up; share the same DOM.

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useCatalog } from "@/components/catalog/CatalogProvider";
import { useCartStore } from "@/lib/cartStore";
import { formatPrice } from "@/lib/formatPrice";
import { AvailabilityBadge } from "@/components/shop/AvailabilityBadge";
import { WafasalafBadge } from "@/components/shop/WafasalafBadge";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function QuickViewModal({
  slug,
  onClose,
}: {
  slug: string | null;
  onClose: () => void;
}) {
  const { productsBySlug } = useCatalog();
  const product = slug ? productsBySlug[slug] ?? null : null;
  const addToCart = useCartStore((s) => s.addToCart);
  const cartItems = useCartStore((s) => s.items);

  const inCartCount = product
    ? cartItems.find((i) => i.slug === product.slug)?.qty ?? 0
    : 0;
  const inCart = inCartCount > 0;

  // Esc-to-close + body-scroll-lock while open.
  useEffect(() => {
    if (!slug) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [slug, onClose]);

  const handleAdd = () => {
    if (!product) return;
    addToCart(product.slug, 1);
    // CartToast surfaces the success globally; the modal stays open
    // so operators can keep browsing related options.
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="qv-root"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: APPLE_EASE }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qv-title"
        >
          {/* Backdrop — tap closes */}
          <button
            type="button"
            aria-label="Close quick view"
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm cursor-default"
          />

          {/* Panel — fixed height on desktop so no product ever forces
              scroll. Mobile falls back to a slide-up sheet capped at
              the viewport height. All text below is line-clamped to a
              fixed line count, so every product fits the same shape. */}
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.24, ease: APPLE_EASE }}
            className="relative w-full sm:max-w-[920px] sm:rounded-2xl bg-paper border border-hairline shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden max-h-[100dvh] sm:h-[560px] sm:max-h-[88vh] flex flex-col"
          >
            {/* Close X */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-paper/85 border border-hairline text-ink-soft hover:text-ink hover:bg-paper transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2 2l10 10M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-[1.05fr_1fr]">
              {/* Image — fills its column, never pushes the layout. */}
              <div className="relative bg-canvas border-b sm:border-b-0 sm:border-r border-hairline aspect-square sm:aspect-auto flex items-center justify-center p-6">
                <Image
                  src={product.heroImage}
                  alt={product.alt}
                  fill
                  sizes="(min-width: 640px) 480px, 100vw"
                  className="object-contain p-4"
                  priority
                />
              </div>

              {/* Body — fixed shape. Every text element below carries
                  a line-clamp so a long-copy product (Swan 1) and a
                  short-copy product (signature pager) render the same
                  height. No scroll anywhere. */}
              <div className="p-5 sm:p-6 flex flex-col gap-3 min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink-mute font-medium">
                    Quick view
                  </p>
                  <h2
                    id="qv-title"
                    className="mt-1 text-[19px] sm:text-[22px] font-semibold tracking-[-0.012em] text-ink leading-[1.18] line-clamp-2"
                  >
                    {product.name}
                    {product.subline ? (
                      <span className="text-ink-mute font-normal">
                        {" "}
                        · {product.subline}
                      </span>
                    ) : null}
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-soft leading-[1.4] line-clamp-2">
                    {product.tagline}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
                    From
                  </span>
                  <span className="text-[22px] font-semibold tabular-nums tracking-[-0.012em] text-ink">
                    {formatPrice(product.priceFrom)}
                  </span>
                  <span className="text-[11.5px] text-ink-mute">HT</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <AvailabilityBadge availability={product.availability} size="md" />
                  <WafasalafBadge amount={product.priceFrom} variant="inline" />
                </div>

                {/* Top 3 features — each clamped to 1 line so the
                    block height is identical across products. */}
                {product.features.length > 0 && (
                  <ul className="space-y-1 text-[12.5px] text-ink-soft min-w-0">
                    {product.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-2 min-w-0">
                        <span
                          aria-hidden
                          className="mt-[7px] w-1 h-1 rounded-full bg-ink-mute shrink-0"
                        />
                        <span className="line-clamp-1 leading-[1.4]" title={f}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className={
                      "h-11 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-medium transition-colors duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
                      (inCart
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        : "bg-ink text-paper hover:bg-ink-soft")
                    }
                  >
                    {inCart
                      ? `In cart · ${inCartCount} · Add another`
                      : "Add to cart"}
                  </button>
                  <Link
                    href={`/shop/${product.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center justify-center text-[12px] text-ink-mute hover:text-ink transition-colors"
                  >
                    See full details →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
