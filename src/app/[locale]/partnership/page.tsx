// /partnership — landing page for the partner program.
//
// Structure (Partnership1 from Website CM/):
//   1. Hero — "Votre réseau mérite une caisse derrière lui."
//   2. Earnings preview — three tiles (month / 1yr / 3yr) with an
//      explainer paragraph — no interactive slider yet, just the
//      illustrative numbers from the source HTML.
//   3. Why partner — 2-paragraph pitch on skipping the build cost.
//   4. Three tracks — Affiliate / Reseller / Technology, each linking
//      to a dedicated sub-route with the deeper program brief.
//   5. Process — the 3 journey stages (immediate / qualification /
//      onboarding).
//   6. Apply — CTA + DOCX questionnaire download.
//   7. Partner support — teaser card linking to /partnership/support.
//
// Copy resolves through `partnership.*` i18n keys in both FR + EN.
// Sub-routes (/partnership/affiliate, /reseller, /technology,
// /support) are staged for the next batch.

import type { Metadata } from "next";
import { seoAlternates } from "@/lib/seoAlternates";
import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Arrow } from "@/components/ui/Arrow";

type EarningsTile = { period: string; amount: string; hint: string };
type Track = { slug: string; name: string; body: string; ctaLabel: string };
type ProcessStep = { title: string; body: string };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("partnership");
  return {
    alternates: seoAlternates("/partnership", locale), title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PartnershipPage() {
  const t = await getTranslations("partnership");
  const earningsTiles = t.raw("earningsTiles") as EarningsTile[];
  const tracks = t.raw("tracks") as Track[];
  const processSteps = t.raw("processSteps") as ProcessStep[];

  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 md:pt-36 pb-14 md:pb-20">
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
            {t("heroHeadline")}
          </h1>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 text-[17px] md:text-[19px] leading-[1.55] text-ink-soft max-w-[46rem]">
            {t("heroBody")}
          </p>
        </Reveal>
      </section>

      {/* Earnings preview */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[44rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("earningsEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("earningsTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
                {t("earningsBody")}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {earningsTiles.map((tile, i) => (
              <Reveal key={tile.period} delay={0.06 + i * 0.04}>
                <article
                  className={`h-full flex flex-col rounded-2xl p-6 md:p-7 ${
                    i === earningsTiles.length - 1
                      ? "bg-ink text-paper"
                      : "bg-canvas ring-1 ring-hairline text-ink"
                  }`}
                >
                  <p
                    className={`text-[10.5px] font-semibold uppercase tracking-[0.18em] ${
                      i === earningsTiles.length - 1
                        ? "text-paper/60"
                        : "text-ink-mute"
                    }`}
                  >
                    {tile.period}
                  </p>
                  <p className="mt-4 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tabular-nums tracking-[-0.02em] leading-none">
                    {tile.amount}
                  </p>
                  <p
                    className={`mt-3 text-[13px] leading-[1.5] ${
                      i === earningsTiles.length - 1
                        ? "text-paper/70"
                        : "text-ink-soft"
                    }`}
                  >
                    {tile.hint}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.16}>
            <p className="mt-8 text-[13.5px] leading-[1.6] text-ink-mute max-w-[44rem]">
              {t("earningsExampleBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Why partner */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="max-w-[44rem]">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
              {t("whyEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2
              className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink"
              style={{ textWrap: "balance" }}
            >
              {t("whyTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 text-[15px] leading-[1.65] text-ink-soft">
              {t("whyBody1")}
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-4 text-[15px] leading-[1.65] text-ink-soft">
              {t("whyBody2")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Three tracks */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[44rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("tracksEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("tracksTitle")}
              </h2>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {tracks.map((track, i) => (
              <Reveal key={track.slug} delay={0.06 + i * 0.04}>
                <article className="group h-full flex flex-col rounded-2xl bg-canvas ring-1 ring-hairline p-6 md:p-7 transition-all duration-500 hover:-translate-y-0.5 hover:ring-hairline-strong hover:shadow-[0_18px_42px_-28px_rgba(0,0,0,0.22)]"
                  style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                >
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-mute mb-4">
                    0{i + 1}
                  </p>
                  <h3 className="text-[20px] md:text-[22px] font-semibold text-ink tracking-[-0.014em] leading-[1.2]">
                    {track.name}
                  </h3>
                  <p className="mt-3 flex-1 text-[13.5px] md:text-[14px] leading-[1.6] text-ink-soft">
                    {track.body}
                  </p>
                  <Link
                    href={`/partnership/${track.slug}` as "/partnership"}
                    className="mt-5 inline-flex items-center text-[13.5px] font-medium text-ink hover:text-[#E11D2A] transition-colors"
                  >
                    {track.ctaLabel}
                    <Arrow size={13} className="ml-1.5" />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="max-w-[44rem] mb-10 md:mb-14">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
              {t("processEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
              {t("processTitle")}
            </h2>
          </Reveal>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {processSteps.map((step, i) => (
            <Reveal key={step.title} delay={0.06 + i * 0.04}>
              <li className="h-full rounded-2xl bg-paper ring-1 ring-hairline p-5 md:p-6">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-mute mb-3">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="text-[15.5px] font-semibold text-ink leading-[1.3]">
                  {step.title}
                </p>
                <p className="mt-2.5 text-[13.5px] leading-[1.55] text-ink-soft">
                  {step.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Apply */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[46rem]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("applyEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2
                className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink"
                style={{ textWrap: "balance" }}
              >
                {t("applyTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
                {t("applyBody")}
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  href="/downloads/Questionnaire_Partenaire_CaisseManager.docx"
                  variant="primary"
                  size="lg"
                >
                  {t("applyDownload")}
                </Button>
                <Button href="/support#contact" variant="ghost" size="lg">
                  {t("applyContact")}
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Partner support teaser */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
        <Reveal>
          <div className="rounded-2xl bg-paper ring-1 ring-hairline p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            <div className="flex-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("supportEyebrow")}
              </p>
              <h3 className="text-[19px] md:text-[22px] font-semibold text-ink tracking-[-0.014em] leading-[1.25] max-w-[36ch]">
                {t("supportTitle")}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.6] text-ink-soft max-w-[42rem]">
                {t("supportBody")}
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href={"/partnership/support" as "/partnership"}
                className="inline-flex items-center text-[13.5px] font-medium text-ink hover:text-[#E11D2A] transition-colors"
              >
                {t("supportCta")}
                <Arrow size={13} className="ml-1.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
