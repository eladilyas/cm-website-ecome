// /start-free-trial layout — SEO metadata + canonical for the lead
// capture page. Page itself is a client component.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start your free trial — full POS in under an hour",
  description:
    "Four quick fields and a guided setup call. Free Basic plan forever, or Pro from 250 MAD/month per counter. Hardware optional. Local team in Morocco.",
  alternates: { canonical: "/start-free-trial" },
  openGraph: {
    title: "Free trial · Caisse Manager",
    description:
      "Four quick fields and a guided setup call. Free Basic plan forever.",
    url: "/start-free-trial",
  },
};

export default function StartFreeTrialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
