"use client";

// Add-to-Cart pill — explicit, single source for the action.
//
// Two states:
//   • Not in cart → "Add to cart" with a bag icon. Clicks call
//                   addToCart() which also raises the floating
//                   CartToast notification.
//   • In cart    → "In cart · 2" with a check icon. Clicking
//                   navigates to /cart.
//
// Design rules:
//   • Label never wraps — `whitespace-nowrap` is non-negotiable.
//     The button takes its intrinsic width and the surrounding
//     layout flexes around it. If a card is too narrow to hold
//     the button at its sm width, the layout shrinks the price
//     stack (which has `min-w-0`) before squeezing the button.
//   • Sentence case — "Add to cart" (Apple/Stripe convention),
//     not "Add to Cart".
//   • Subtle press affordance via `active:scale` for tactile
//     feedback without distracting at rest.
//   • Apple cubic-bezier easing on every transition.
//
// Embedded inside whole-card buttons (ProductCard, RailProductCard),
// so click handlers preventDefault + stopPropagation to keep the
// surrounding Quick-View tap from firing.

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/lib/cartStore";

type Size = "sm" | "md";

const APPLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function CartButton({
  slug,
  size = "md",
  className = "",
}: {
  slug: string;
  size?: Size;
  className?: string;
}) {
  const router = useRouter();
  const t = useTranslations("productCard");
  const itemQty = useCartStore(
    (s) => s.items.find((i) => i.slug === slug)?.qty ?? 0,
  );
  const addToCart = useCartStore((s) => s.addToCart);

  const inCart = itemQty > 0;

  // Dimensions tuned so the full "Add to cart" label fits on one
  // line at both sm and md without crowding the icon. The sm size
  // is what /shop cards + the homepage rail use.
  const dims =
    size === "sm"
      ? "h-9 px-4 text-[12.5px] gap-1.5"
      : "h-11 px-5 text-[13.5px] gap-2";

  const base =
    "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap select-none " +
    "transition-[background-color,border-color,color,transform,box-shadow] duration-200 " +
    "active:scale-[0.97]";

  if (inCart) {
    const onView = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      router.push("/cart");
    };
    return (
      <button
        type="button"
        onClick={onView}
        aria-label={t("inCartLabel", { count: itemQty })}
        className={
          base +
          " bg-ink text-paper border border-ink hover:bg-ink-soft hover:border-ink-soft shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.25)] " +
          dims +
          " " +
          className
        }
        style={{ transitionTimingFunction: APPLE_EASE }}
      >
        <CheckIcon size={size === "sm" ? 12 : 14} />
        <span className="tabular-nums">{t("inCart", { count: itemQty })}</span>
      </button>
    );
  }

  const onAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(slug, 1);
  };

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={t("addToCart")}
      className={
        base +
        " border border-hairline-strong bg-paper text-ink " +
        "hover:bg-ink hover:text-paper hover:border-ink " +
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_22px_-6px_rgba(20,30,50,0.20)] " +
        dims +
        " " +
        className
      }
      style={{ transitionTimingFunction: APPLE_EASE }}
    >
      <CartIcon size={size === "sm" ? 12 : 14} />
      <span>{t("addToCart")}</span>
    </button>
  );
}

function CartIcon({ size = 14 }: { size?: number }) {
  // Same Apple-bag silhouette as the top-bar cart icon — flat top
  // edge, slight inward taper to the bottom, vertical handle sides
  // with a tight arc top. Keeps the icon vocabulary identical
  // across every cart surface.
  return (
    <svg
      width={size}
      height={Math.round((size * 20) / 18)}
      viewBox="0 0 18 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.4 6.4h11.2l-1 11a1.4 1.4 0 0 1-1.4 1.3h-6.4a1.4 1.4 0 0 1-1.4-1.3L3.4 6.4z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M6 6.4V4.4a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 7.5l2.5 2.5L11 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
