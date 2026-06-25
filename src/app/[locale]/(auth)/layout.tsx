// Route-group layout for /signin + /signup.
//
// The root layout (src/app/layout.tsx) mounts the marketing Header,
// Footer, sticky trial CTA, and cart toast — all of which are
// distracting on an authentication surface. Auth pages get a minimal
// dedicated chrome (just a brand mark + Help link, rendered by
// AuthShell itself) so the experience reads as a focused product
// environment, not a marketing landing.
//
// The Header/Footer in the root layout are still rendered because
// Next.js route groups don't allow you to opt OUT of a parent layout's
// children. We hide them via the auth shell taking full viewport
// height + position-absolute chrome — see AuthShell. The root
// Header/Footer scroll-out above/below the viewport and aren't visible
// at the initial paint. For full bleed we could later move auth pages
// to a parallel root, but the current solution is invisible to users.

import type { Metadata } from "next";

export const metadata: Metadata = {
  // Auth pages shouldn't show up in search results — they're not
  // canonical content. The root robots config allows indexing by
  // default; we override here.
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
