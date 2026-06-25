"use client";

// Navbar theme system — page-based, NOT scroll-based.
//
// Design rule (strict):
//   The header is a stable system component. Its light/dark mode is
//   decided ONCE per page from the route, never from what scrolls under
//   it. No IntersectionObserver, no per-section flips, no "react to the
//   hero" logic — those produced inconsistent contrast and flicker.
//
// To classify a page:
//   • Light-dominant — most of the page is on canvas/paper/fog tones.
//     The navbar is light glass over a transparent surface (`scheme:
//     "light"`). Dark heroes and dark CTAs are momentary sections that
//     the glass blur dampens enough for the dark navbar text to remain
//     readable across them. This is the default.
//   • Dark-dominant — most of the page is on `bg-night`. The navbar is
//     dark glass with paper-tone text (`scheme: "dark"`).
//
// To add a dark-dominant route, add its prefix to DARK_ROUTE_PREFIXES.
// Add only routes that are END-TO-END dark — i.e. their layout sets
// `bg-night` for the whole subtree (not just a single dark hero on an
// otherwise light page). A page with a dark hero but light body is
// still light-dominant; the in-page hero gets dark navbar treatment
// via the `data-header-overlay="hero"` exception in Header.tsx instead.
//
// Transition between schemes is handled by Header.tsx — a 500ms
// cubic-bezier on background-color + backdrop-filter + border-color +
// color, so route changes animate the swap rather than snap. The hook
// itself is pure: it returns the destination scheme, never the
// in-flight one.

import { usePathname } from "next/navigation";

export type HeaderScheme = "light" | "dark";

// Route prefixes that resolve to the dark navbar.
//
//   /demo  — the activity picker (src/app/demo/page.tsx) plus everything
//            in its subtree EXCEPT /demo/order. The /demo layout wraps
//            the whole subtree in `bg-night text-paper`, making it the
//            only end-to-end dark marketing route. /demo/order is the
//            POS workspace, which renders its own POSChrome and hides
//            the marketing Header entirely (see Header.tsx: returns null
//            when pathname startsWith /demo/order).
//
// Add new entries here when (and only when) a route's layout paints the
// entire subtree dark. Don't add a route just because it has a dark
// hero or a dark CTA band — those are handled per-page.
const DARK_ROUTE_PREFIXES: readonly string[] = ["/demo"];

/**
 * Returns true when `pathname` is exactly `prefix` or a child route
 * underneath it. Prevents `/demo-foo` from accidentally matching
 * `/demo` if such a sibling route is added later — a plain
 * `startsWith` would let that slip through.
 */
function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

/**
 * Resolve the header scheme for a given pathname. Pure — same input,
 * same output. No DOM, no side effects, no scroll listening. The
 * exported hook and any future server-rendered branch share this.
 */
export function getHeaderSchemeForRoute(pathname: string | null): HeaderScheme {
  if (!pathname) return "light";
  return DARK_ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
    ? "dark"
    : "light";
}

/**
 * Returns the header scheme for the current route. Re-evaluates only on
 * SPA navigation — never on scroll. Safe to use anywhere a hook can run.
 */
export function useHeaderScheme(): HeaderScheme {
  const pathname = usePathname();
  return getHeaderSchemeForRoute(pathname);
}
