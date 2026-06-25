"use client";

// Slim product card optimized for the homepage horizontal rail.
//
// Structure mirrors ProductCard's split:
//   • Outer <article> — semantic container; never a clickable element
//     itself (no nested-button HTML errors).
//   • Inner Quick-View <button> wraps the image + identity block.
//     Tap → opens Quick View modal, no page nav.
//   • Footer action row sits as a SEPARATE sibling under the Quick-View
//     button so the CartButton inside it doesn't violate HTML's
//     "buttons cannot contain buttons" rule.
//
// Same Apple-Store-shelf rhythm as the grid card: every rail item
// scans identically except for the device itself.

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

export function RailProductCard({ product }: { product: CatalogProduct }) {
  const categoryLabel = useCategoryLabel(product.category);
  const { open } = useQuickView();
  const t = useTranslations("productCard");
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.45, ease: APPLE_EASE }}
      className="group relative rounded-2xl bg-paper border border-hairline overflow-hidden flex flex-col h-[480px] md:h-[500px] transition-[border-color,box-shadow] duration-500 hover:border-hairline-strong hover:shadow-[0_22px_50px_-18px_rgba(20,30,50,0.22),0_8px_18px_-10px_rgba(20,30,50,0.08)] focus-within:ring-2 focus-within:ring-ink/20 focus-within:ring-offset-2 focus-within:ring-offset-paper"
      style={{
        scrollSnapAlign: "start",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Primary tap surface — image + identity block. Opens Quick
          View. Wrapped in a button so keyboard users can activate
          it the same way. Stops short of the action row below so
          the CartButton stays a sibling, not a descendant. */}
      <button
        type="button"
        onClick={() => open(product.slug)}
        aria-label={t("quickView", { name: product.name })}
        className="text-left focus:outline-none flex flex-col flex-1"
      >
        {/* Image plate — soft canvas backing, generous padding so the
            device floats. Availability badge sits in the top-right of
            the plate so it's visible without crowding the text below. */}
        <div className="relative h-[220px] md:h-[230px] shrink-0 bg-canvas">
          <div className="absolute top-3 right-3 z-[1]">
            <AvailabilityBadge availability={product.availability} size="sm" />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] inset-y-[-6%]"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 50%, rgba(80,130,200,0.08) 0%, rgba(80,130,200,0) 70%)",
            }}
          />
          <Image
            src={product.heroImage}
            alt={product.alt}
            fill
            sizes="280px"
            className="object-contain p-8 transition-transform duration-700 group-hover:scale-[1.035]"
            style={{
              filter:
                "drop-shadow(0 18px 30px rgba(40,80,140,0.10)) drop-shadow(0 3px 6px rgba(0,0,0,0.05))",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>

        {/* Identity block — category, name, delivery hint. Lives
            INSIDE the Quick-View button so tapping the name opens the
            modal (matches the image tap behaviour). */}
        <div className="flex-1 flex flex-col px-5 pt-4 bg-paper border-t border-hairline">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            {categoryLabel}
          </p>
          <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.018em] leading-[1.15] text-ink">
            {product.name}
            {product.subline && (
              <span className="ml-1.5 text-[12px] font-normal text-ink-mute tracking-normal">
                {product.subline}
              </span>
            )}
          </h3>

          <DeliveryHint
            availability={product.availability}
            variant="compact"
            className="mt-2"
          />
        </div>
      </button>

      {/* Price + Add-to-cart + Wafasalaf — sibling of the Quick-View
          button, so the CartButton inside is not a descendant of
          another button (would violate HTML nesting and trigger a
          React hydration mismatch on the homepage rail). Two rows
          so the Wafasalaf chip never crowds the cart action. */}
      <div className="bg-paper px-5 pb-5 pt-3 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.12em] text-ink-mute leading-tight">
              {t("from")}
            </p>
            <p className="text-[15px] font-semibold tabular-nums tracking-[-0.005em] text-ink leading-tight">
              {formatPrice(product.priceFrom)}{" "}
              <span className="text-[10px] uppercase tracking-[0.1em] text-ink-mute font-medium">
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
