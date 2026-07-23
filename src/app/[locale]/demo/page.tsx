// /demo — the flagship "try it" surface.
//
// Iframes the live Bakery-demo tenant (POS on one tab, back-office on
// the other) and pairs it with a sticky credentials card so visitors
// can sign in with one click of the Copy button. Cross-origin iframes
// can't be filled programmatically from the parent — this is the
// browser's security boundary — so the copy-and-paste flow is the
// best UX we can build without changing the tenant app itself.
//
// The prior editorial template gallery (Café / Bakery / Fast Food /
// etc.) lives at /demo/preview so we don't lose that surface — the
// activity-based marketing tour still exists for anyone who wants a
// polished sales walkthrough rather than the raw production tenant.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LivePosEmbed } from "@/components/demo/LivePosEmbed";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("demo.live");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: true },
  };
}

export default function DemoPage() {
  return (
    <main data-scheme="light" className="bg-canvas min-h-[calc(100vh-64px)]">
      <LivePosEmbed />
    </main>
  );
}
