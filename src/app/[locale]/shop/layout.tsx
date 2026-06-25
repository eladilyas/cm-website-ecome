// /shop subtree layout — carries the SEO metadata for the Hardware
// store since the page itself is a "use client" component (can't
// export metadata directly). The page renders inside this layout
// and inherits the title + description.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hardware Store — POS terminals, KDS, printers, cash drawers",
  description:
    "Premium POS hardware for Moroccan operators. Swan desktop terminals, kitchen display screens, Epson printers, cash drawers, 2D scanners, and guest pagers. Bundle monthly with your plan or buy outright.",
  alternates: { canonical: "/shop" },
  keywords: [
    "POS hardware Morocco",
    "Swan POS Maroc",
    "caisse tactile",
    "Epson printer Maroc",
    "kitchen display Maroc",
    "cash drawer Maroc",
    "QR scanner Maroc",
  ],
  openGraph: {
    title: "Hardware Store · Caisse Manager",
    description:
      "Premium POS hardware for Moroccan operators. Bundle monthly or buy outright.",
    url: "/shop",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
