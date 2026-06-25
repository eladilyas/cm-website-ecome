// /support layout — SEO metadata for the support hub. The page is a
// client component; the layout carries the meta tags.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — onboarding, troubleshooting, training",
  description:
    "Caisse Manager support for Moroccan operators. Onboarding guides, troubleshooting, hardware pairing, kitchen + multi-store setup, and a local team in Casablanca.",
  alternates: { canonical: "/support" },
  openGraph: {
    title: "Support · Caisse Manager",
    description:
      "Onboarding guides, troubleshooting, and a local team in Casablanca.",
    url: "/support",
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
