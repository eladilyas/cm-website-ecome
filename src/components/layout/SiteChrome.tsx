"use client";

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
import { StickyTrialCTA } from "@/components/layout/StickyTrialCTA";
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
      <Header initialSessionHint={initialSessionHint} />
      {/* Bottom padding on mobile so content scrolls clear of the
          fixed tab bar (~56px + safe-area inset). md+ removes the
          padding since the tab bar hides there. */}
      <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <Footer />
      <StickyTrialCTA />
      <CartToast />
      <MobileTabBar />
    </QuickViewProvider>
  );
}
