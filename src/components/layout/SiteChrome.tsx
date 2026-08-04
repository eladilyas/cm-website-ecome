"use client";

import { useTranslations } from "next-intl";

// SiteChrome — pathname-aware wrapper for the marketing chrome
// (Header, Footer, sticky trial CTA, cart toast).
//
// "Bare" routes opt OUT of the marketing chrome because they're not
// part of the public website experience:
//
//   /admin/*  — the internal operations control panel; carries its own
//               AdminShell (top bar + sidebar) and must never reuse the
//               marketing header/footer.
//   /403      — clean access-denied page; doesn't need chrome.
//
// Auth pages (/signin, /signup) intentionally KEEP the marketing
// header — visitors stay oriented with the brand mark, locale switch,
// cart, and Sign in/Up cross-link in the top bar. AuthShell itself no
// longer renders a duplicate logo.
//
// Locale-aware: the bare check matches both the bare path
// (`/admin/x`) and the locale-prefixed variant (`/en/admin/x`) so the
// gate behaves identically in FR (default, no prefix) and EN.
//
// Living as a single component keeps the decision in ONE place — every
// "is this a public marketing surface" check sits here.
//
// `initialSessionHint` — server-detected signal (presence of a Better-
// Auth session cookie) passed in by [locale]/layout.tsx. Forwarded
// to Header so the SSR HTML already renders the correct chrome
// (chip vs Sign in link) on first paint. Eliminates the brief flash
// of signed-out chrome that previously appeared while useSession() +
// accountStore hydrated on the client.

import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { CartToast } from "@/components/cart/CartToast";
import { AuthBridge } from "@/components/auth/AuthBridge";
import { QuickViewProvider } from "@/components/quickview/QuickViewProvider";

const BARE_PREFIXES = ["/admin", "/403"];

// Locale-aware bare-route test. `usePathname` from next/navigation
// returns the *raw* URL pathname, so EN routes carry the `/en` prefix
// while the FR default does not. Strip the leading locale segment
// before checking so the gate fires identically in both languages.
const LOCALE_SEGMENTS = ["en"];
function stripLocalePrefix(pathname: string): string {
  for (const loc of LOCALE_SEGMENTS) {
    if (pathname === `/${loc}`) return "/";
    if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
  }
  return pathname;
}

function isBareRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const stripped = stripLocalePrefix(pathname);
  return BARE_PREFIXES.some(
    (p) => stripped === p || stripped.startsWith(`${p}/`),
  );
}

export function SiteChrome({
  children,
  initialSessionHint = false,
}: {
  children: React.ReactNode;
  /** Server-side hint that a Better-Auth session cookie is present.
   *  Drives the Header's first-paint chrome so SSR HTML already
   *  shows the chip when the visitor is logged in — no flash. */
  initialSessionHint?: boolean;
}) {
  const pathname = usePathname();
  const tA11y = useTranslations("common");
  const skipLabel = tA11y("skipToContent");
  const bare = isBareRoute(pathname);

  if (bare) {
    return (
      <>
        <AuthBridge />
        {children}
      </>
    );
  }

  return (
    <QuickViewProvider>
      <AuthBridge />
      {/* Skip link — first focusable element on the page, visually hidden
          until focused. Without it a keyboard or screen-reader visitor had
          to traverse the entire header and its dropdowns on every page
          before reaching content. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:inline-flex focus:items-center focus:h-10 focus:px-4 focus:rounded-full focus:bg-ink focus:text-paper focus:text-[13px] focus:font-medium focus:ring-2 focus:ring-paper"
      >
        {skipLabel}
      </a>
      <Header initialSessionHint={initialSessionHint} />
      {/* Bottom padding on mobile so content scrolls clear of the
          fixed tab bar (~56px + safe-area inset). md+ removes the
          padding since the tab bar hides there. */}
      <main
        id="main"
        className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0"
      >
        {children}
      </main>
      <Footer />
      {/* StickyTrialCTA removed. It was `fixed bottom-0 z-40 md:hidden`
          while MobileTabBar is `fixed bottom-0 z-30` — the trial pill sat
          on top of the primary mobile navigation and covered it. The
          trial funnel is already carried by the header CTA and by the
          mobile menu's own persistent bottom CTA, so deleting the third
          copy costs nothing and gives the tab bar back to the visitor. */}
      <CartToast />
      <MobileTabBar />
    </QuickViewProvider>
  );
}
