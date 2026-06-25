"use client";

// Shop product card — Apple-Store / Stripe-hardware aesthetic with
// commerce signals (price + financing + explicit action).
//
// Anatomy (top → bottom):
//   1. Image plate — generous padding so the device floats. The
//      availability pill anchors the top-right.
//   2. Identity — category eyebrow, name, tagline.
//   3. Delivery hint — small "ships in X" line.
//   4. Footer — divider, two columns: price stack on the left
//      (sticker + Wafasalaf monthly) and Add-to-cart on the right.
//      Explore link removed from the action row to declutter; the
//      whole card body opens Quick View.
//
// Primary tap (image + identity) opens Quick View. CartButton is a
// sibling of the Quick-View button so React doesn't see nested
// buttons. The whole card lifts on hover.

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { CatalogProduct } from "@/server/catalog/types";
import { useCategoryLabel } from "@/components/catalog/CatalogProvider";
import { useQuickView } from "@/components/quickview/QuickViewProvider";
import { formatPrice } from "@/lib/formatPrice";
import { CartButton } from "./CartButton";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { DeliveryHint } from "./DeliveryHint";
import { WafasalafBadge } from "./WafasalafBadge";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ProductCard({ product }: { product: CatalogProduct }) {
  const categoryLabel = useCategoryLabel(product.category);
  const { open } = useQuickView();
  const t = useTranslations("productCard");

  return (
    <motion.article
      // Premium hover stack: gentle lift + warmer shadow + image
      // scales just enough to read as "product comes forward".
      // Spring-style ease gives a softer settle than a flat curve.
      whileHover={{ y: -6 }}
      transition={{ duration: 0.45, ease: APPLE_EASE }}
      className="group relative h-full rounded-2xl overflow-hidden bg-paper border border-hairline transition-[border-color,box-shadow] duration-500 hover:border-hairline-strong hover:shadow-[0_22px_50px_-18px_rgba(20,30,50,0.22),0_8px_18px_-10px_rgba(20,30,50,0.08)] focus-within:ring-2 focus-within:ring-ink/20 focus-within:ring-offset-2 focus-within:ring-offset-paper"
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* Primary clickable surface — opens Quick View. Wraps the
          image plate + identity block. Footer below is a sibling. */}
      <button
        type="button"
        onClick={() => open(product.slug)}
        aria-label={t("quickView", { name: product.name })}
        className="text-left flex flex-col w-full focus-visible:outline-none"
      >
        {/* Image plate — soft canvas backing so the device floats
            against a slightly cooler surface than the card body.
            Availability pill anchors the top-right of the plate so
            it never crowds the identity copy below. */}
        <div className="relative h-[240px] md:h-[260px] bg-canvas overflow-hidden">
          {product.availability && (
            <div className="absolute top-3 right-3 z-[1]">
              <AvailabilityBadge availability={product.availability} size="sm" />
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] inset-y-[-6%]"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 50%, rgba(80,130,200,0.10) 0%, rgba(80,130,200,0) 70%)",
            }}
          />
          <Image
            src={product.heroImage}
            alt={product.alt}
            fill
            sizes="(min-width: 1280px) 380px, (min-width: 768px) 50vw, 100vw"
            className="object-contain p-7 transition-transform duration-700 group-hover:scale-[1.035]"
            style={{
              filter:
                "drop-shadow(0 24px 40px rgba(40,80,140,0.10)) drop-shadow(0 4px 8px rgba(0,0,0,0.06))",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            priority={false}
          />
        </div>

        {/* Identity block */}
        <div className="px-5 md:px-6 pt-4 pb-3 border-t border-hairline">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            {categoryLabel}
          </p>
          <h3 className="mt-1 text-[17px] md:text-[18px] font-semibold tracking-[-0.018em] leading-[1.2] text-ink">
            {product.name}
            {product.subline && (
              <span className="ml-1.5 text-[13px] font-normal text-ink-mute tracking-normal">
                {product.subline}
              </span>
            )}
          </h3>
          <p className="mt-1 text-[13px] leading-[1.45] text-ink-soft line-clamp-2">
            {product.tagline}
          </p>
          <DeliveryHint
            availability={product.availability}
            variant="compact"
            className="mt-2.5"
          />
        </div>
      </button>

      {/* Footer — two rows so the Wafasalaf chip never fights the
          Add-to-cart button for space:
            • Row 1: sticker price (left) + Add to cart (right)
            • Row 2: Wafasalaf financing chip, full row of its own
          Sibling of the Quick-View button so the CartButton (also
          a <button>) is never nested inside another button. */}
      <div className="px-5 md:px-6 pb-5 pt-3 border-t border-hairline space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
              {t("from")}
            </p>
            <p className="mt-0.5 text-[18px] md:text-[19px] font-semibold tabular-nums tracking-[-0.01em] text-ink leading-tight whitespace-nowrap">
              {formatPrice(product.priceFrom)}{" "}
              <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-mute">
                {t("vatExcluded")}
              </span>
            </p>
          </div>
          <CartButton slug={product.slug} size="sm" />
        </div>
        <WafasalafBadge amount={product.priceFrom} variant="compact" />
      </div>
    </motion.article>
  );
}
