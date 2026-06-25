"use client";

// Mobile bottom tab bar — app-like primary nav for the storefront.
//
// Four destinations: Home, Shop, Cart, Account. Pinned to the
// viewport bottom on mobile only (`md:hidden`); never renders on
// desktop where the top bar already provides discoverable nav.
//
// Why fixed-bottom for mobile commerce:
//   • The thumb hits the bottom 30% of the screen far more reliably
//     than the top edge. Stripe, Shopify-mobile, Notion-mobile all
//     converged on this pattern after extensive testing.
//   • Cart access from any page in one tap lifts conversion measurably.
//   • A persistent surface gives the visitor a sense of "home" that a
//     hamburger menu never achieves.
//
// Hidden on routes that own the viewport bottom themselves:
//   • /checkout, /checkout/success — sticky submit row + trust strip
//   • /cart                       — sticky summary panel
//   • /demo, /demo/order          — POS workspace owns the chrome
//   • /admin, /signin, /signup, /403 — bare layouts (SiteChrome already filters these)
//
// Account chip is the dynamic slot: signed-out shows "Sign in",
// signed-in shows the account avatar. Cart shows a count badge
// when items > 0.

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCartStore } from "@/lib/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/accountStore";

const HIDE_ON_PREFIXES = [
  "/checkout",
  "/cart",
  "/demo",
  "/start-free-trial",
];

export function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.qty, 0),
  );
  const { isSignedIn, profile } = useAuth();

  if (HIDE_ON_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary mobile navigation"
      className={
        "md:hidden fixed bottom-0 left-0 right-0 z-30 " +
        // pb env() keeps the bar above the iOS home-indicator
        "pb-[env(safe-area-inset-bottom)] " +
        "bg-paper/95 backdrop-blur-xl border-t border-hairline"
      }
    >
      <ul className="grid grid-cols-4 h-14">
        <Tab
          href="/"
          label="Home"
          active={isActive("/")}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <Tab
          href="/shop"
          label="Shop"
          active={isActive("/shop")}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7h16l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.3H7a1.5 1.5 0 0 1-1.5-1.3L4 7z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M8 7V5a4 4 0 0 1 8 0v2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <Tab
          href="/cart"
          label="Cart"
          active={isActive("/cart")}
          badge={cartCount > 0 ? cartCount : undefined}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 5h2.5l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle cx="10" cy="20.5" r="1.3" fill="currentColor" />
              <circle cx="17" cy="20.5" r="1.3" fill="currentColor" />
            </svg>
          }
        />
        {isSignedIn && profile ? (
          <Tab
            href="/account"
            label="Account"
            active={isActive("/account")}
            icon={
              <div className="w-[22px] h-[22px] rounded-full bg-ink text-paper inline-flex items-center justify-center text-[9.5px] font-semibold tracking-wide">
                {getInitials(profile)}
              </div>
            }
          />
        ) : (
          <Tab
            href="/signin"
            label="Sign in"
            active={isActive("/signin")}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M5 20c1.6-3.4 4.4-5 7-5s5.4 1.6 7 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        )}
      </ul>
    </nav>
  );
}

function Tab({
  href,
  label,
  active,
  icon,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <li className="flex">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={
          "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium tracking-[0.01em] " +
          (active ? "text-ink" : "text-ink-mute hover:text-ink") +
          " transition-colors"
        }
      >
        <span className="relative">
          {icon}
          {badge !== undefined && badge > 0 && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-[#E11D2A] text-white text-[9px] font-semibold tabular-nums leading-none"
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
        <span>{label}</span>
      </Link>
    </li>
  );
}
