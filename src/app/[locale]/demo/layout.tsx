// Demo route layout.
//
// Sets the dark scheme for the entire /demo subtree (POS = dark by
// convention in the workflow screenshots). The simulator is exploration
// — no gating. The Free Trial form (conversion layer) is the only path
// that captures leads.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POS Simulator — try the full register",
  description:
    "Run a full POS shift in your browser. Ring orders, fire the kitchen, refund, take payment — Caisse Manager's complete operations platform, live demo.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "POS Simulator · Caisse Manager",
    description:
      "Run a full POS shift in your browser. Ring orders, fire the kitchen, refund, take payment.",
    url: "/demo",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-scheme="dark" className="min-h-svh bg-night text-paper">
      {children}
    </div>
  );
}
