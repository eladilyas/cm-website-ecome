// /solutions — Solutions overview page. Editorial hero + a proof
// grid of "already using this ecosystem" customer cards, closing with
// the Ready-to-move CTA.
//
// Content lives in the next-intl catalog under `industryOverview.*`
// so FR + EN stay in sync from one source of truth. Each proof card
// exposes: name, tag (sector · sub-sector), and body.

import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { seoAlternates } from "@/lib/seoAlternates";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Arrow } from "@/components/ui/Arrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

const CANONICAL_SLUGS = [
  "cafe",
  "bakery",
  "fast-food",
  "dine-in",
  "beauty",
  "barber",
  "market",
] as const;

/** Field photography per trade — the same stills the sector detail
 *  pages lead with, so the overview → detail transition feels continuous. */
const SECTOR_IMAGE: Record<(typeof CANONICAL_SLUGS)[number], string> = {
  cafe: "/media/solutions/cafe.webp",
  bakery: "/media/solutions/bakery.webp",
  "fast-food": "/media/solutions/fast-food.webp",
  "dine-in": "/media/solutions/dine-in.webp",
  beauty: "/media/solutions/beauty.webp",
  barber: "/media/solutions/barber.webp",
  market: "/media/solutions/market.webp",
};

type ProofCard = { name: string; tag: string; body: string };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("industryOverview");
  return {
    alternates: seoAlternates("/solutions", locale),
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function IndustriesOverviewPage() {
  const t = await getTranslations("industryOverview");
  const tSol = await getTranslations("nav.solutionsDropdown");

  const proof = t.raw("proof") as ProofCard[];
  const industryLabels: Record<(typeof CANONICAL_SLUGS)[number], string> = {
    cafe: tSol("cafes"),
    bakery: tSol("bakery"),
    "fast-food": tSol("fastFood"),
    "dine-in": tSol("restaurants"),
    beauty: tSol("beauty"),
    barber: tSol("barber"),
    market: tSol("market"),
  };

  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 md:pt-36 pb-16 md:pb-20">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-5">
            {t("eyebrow")}
          </p>
        </Reveal>
        <Reveal delay={0.04}>
          <h1
            className="text-[clamp(2.25rem,5vw,4.25rem)] font-semibold tracking-[-0.024em] leading-[1.02] text-ink max-w-[22ch]"
            style={{ textWrap: "balance" }}
          >
            {t("title")}
          </h1>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 text-[17px] md:text-[19px] leading-[1.55] text-ink-soft max-w-[46rem]">
            {t("body")}
          </p>
        </Reveal>
      </section>

      {/* Sector grid — real photography from the field, one card per
          trade. 2-up on phones, 3-up tablet, 4-up desktop; the last card
          spans two columns below lg so no ragged gap is left behind. */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-20 md:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {CANONICAL_SLUGS.map((slug, i) => (
            <Reveal key={slug} delay={0.03 + i * 0.02}>
              <Link
                href={`/solutions/${slug}`}
                className={`group relative block h-full overflow-hidden rounded-2xl ring-1 ring-hairline bg-ink transition-all duration-500 hover:-translate-y-0.5 hover:ring-hairline-strong hover:shadow-[0_18px_42px_-28px_rgba(0,0,0,0.28)] ${
                  slug === "market" ? "col-span-2 lg:col-span-1" : ""
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
              >
                <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                  <Image
                    src={SECTOR_IMAGE[slug]}
                    alt={industryLabels[slug]}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    loading={i < 4 ? "eager" : "lazy"}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                  />
                  {/* Legibility scrim — keeps the label readable over any
                      photo without washing the image out. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 mb-1.5 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex items-center gap-1.5 text-[14.5px] md:text-[15.5px] font-semibold text-white tracking-[-0.008em]">
                      {industryLabels[slug]}
                      <span className="opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                        <Arrow size={12} />
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Proof grid — "Éprouvé au comptoir, pas seulement sur papier." */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="mb-10 md:mb-14 max-w-[46rem]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("proofEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("proofTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[14.5px] md:text-[15px] leading-[1.55] text-ink-soft">
                {t("proofBody")}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {proof.map((p, i) => (
              <Reveal key={p.name} delay={0.04 + i * 0.02}>
                <article className="h-full rounded-2xl bg-canvas ring-1 ring-hairline p-5 md:p-6">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="text-[15.5px] md:text-[16.5px] font-semibold text-ink tracking-[-0.008em]">
                      {p.name}
                    </h3>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
                      {p.tag}
                    </span>
                  </div>
                  <p className="mt-3 text-[13.5px] md:text-[14px] leading-[1.6] text-ink-soft">
                    {p.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-4">
            {t("ctaEyebrow")}
          </p>
        </Reveal>
        <Reveal delay={0.04}>
          <h2
            className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[22ch]"
            style={{ textWrap: "balance" }}
          >
            {t("ctaTitle")}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/support#contact" variant="primary" size="lg">
              {t("ctaSales")}
            </Button>
            <Button href="/demo" variant="ghost" size="lg">
              {t("ctaDemo")}
            </Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
