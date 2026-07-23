// /demo/live — iframe embed of the real live Bakery demo tenant.
//
// Two tabs (POS + Back-office) both point at the real production URLs
// (bakery-pos.demo.caisse-manager.ma + bakery-backoffice…). Neither
// remote sends X-Frame-Options or a frame-ancestors CSP, so embedding
// works. The client component owns state (which tab is active + copy
// button feedback).
//
// The custom `/demo` simulator stays as-is so we retain the polished
// marketing-preview experience; `/demo/live` is the "try the real
// thing" alternative.

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

export default function LiveDemoPage() {
  return (
    <main data-scheme="light" className="bg-canvas min-h-[calc(100vh-64px)]">
      <LivePosEmbed />
    </main>
  );
}
