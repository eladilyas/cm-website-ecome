// HardwareCallout — bridges the pricing experience into the Hardware store.
// Two-column lockup on lg+: headline + value statement on the left, a
// preview grid of four real hardware photos on the right. Each tile is a
// link into /shop. The whole section sits on canvas to differentiate from
// the paper plans grid above.
//
// Positioning note: Caisse Manager sells software. Hardware is sold
// separately, with optional Wafasalaf financing — we never bundle
// hardware into the monthly software plan. Copy here is kept aligned
// with that distinction.

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Arrow } from "@/components/ui/Arrow";

const APPLE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Tile = { slug: string; labelKey: "posTerminals" | "kds" | "printers" | "drawers"; image: string };

const TILES: Tile[] = [
  { slug: "swan-1-gen-2", labelKey: "posTerminals", image: "/hardware/swan-1-gen-2.webp" },
  { slug: "swan-1k-gen-2", labelKey: "kds", image: "/hardware/swan-1k-gen-2.webp" },
  { slug: "epson-printer", labelKey: "printers", image: "/hardware/epson-printer.png" },
  { slug: "drawer", labelKey: "drawers", image: "/hardware/drawer.png" },
];

export function HardwareCallout() {
  const t = useTranslations("pricing.hardware");
  return (
    <div className="rounded-[28px] bg-paper ring-1 ring-hairline overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.2fr] gap-0">
        {/* Left — copy */}
        <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-between gap-10">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.20em] text-ink-mute">
              {t("eyebrow")}
            </p>
            <h2 className="mt-4 text-[clamp(1.375rem,2.4vw,1.875rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink">
              {t("headlineA")} <span className="text-ink-mute">{t("headlineB")}</span>
            </h2>
            <p className="mt-4 text-[14px] leading-[1.55] text-ink-soft max-w-[28rem]">
              {t("body")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-soft transition-colors duration-300"
              style={{ transitionTimingFunction: APPLE_EASE }}
            >
              {t("browseCta")}
              <Arrow className="ml-2" />
            </Link>
            <Link
              href="/start-free-trial"
              className="inline-flex items-center text-[14px] font-medium text-ink hover:text-[#E11D2A] transition-colors duration-200"
              style={{ transitionTimingFunction: APPLE_EASE }}
            >
              {t("talkCta")}
            </Link>
          </div>
        </div>

        {/* Right — 2×2 hardware tile grid */}
        <div className="bg-canvas p-6 md:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-hairline">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {TILES.map((tile) => (
              <Link
                key={tile.slug}
                href={`/shop/${tile.slug}`}
                className="group relative aspect-square rounded-2xl bg-paper ring-1 ring-hairline overflow-hidden transition-all duration-400 hover:ring-hairline-strong hover:-translate-y-0.5"
                style={{ transitionTimingFunction: APPLE_EASE }}
              >
                <div className="absolute inset-0 flex items-center justify-center p-5 md:p-6">
                  <Image
                    src={tile.image}
                    alt={t(`tile.${tile.labelKey}`)}
                    fill
                    sizes="(min-width: 1024px) 220px, 45vw"
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ transitionTimingFunction: APPLE_EASE }}
                  />
                </div>
                <span className="absolute bottom-3 left-4 text-[11.5px] font-medium uppercase tracking-[0.16em] text-ink-mute group-hover:text-ink transition-colors duration-300">
                  {t(`tile.${tile.labelKey}`)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
