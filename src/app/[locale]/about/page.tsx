// /about — "À propos de Caisse Manager".
//
// Six-part editorial page:
//   1. Hero (mission — "Rendre la caisse plus calme")
//   2. Story + timeline (from Agadir to national coverage)
//   3. Vision — one system, several modules
//   4. Coverage — 4 cards + city list
//   5. Partners — 7 partner cards
//   6. Reasons customers pick us — 6-card grid
//   7. Closing CTA
//
// All copy lives in i18n under `aboutPage.*`.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { SectionDivider } from "@/components/ui/SectionDivider";

type TimelineItem = { year: string; title: string; body: string };
type CoverageItem = { title: string; body: string };
type PartnerItem = { name: string; body: string };
type ReasonItem = { title: string; body: string };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AboutPage() {
  const t = await getTranslations("aboutPage");
  const timeline = t.raw("timeline") as TimelineItem[];
  const visionBullets = t.raw("visionBullets") as string[];
  const coverage = t.raw("coverage") as CoverageItem[];
  const partners = t.raw("partners") as PartnerItem[];
  const reasons = t.raw("reasons") as ReasonItem[];

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

      {/* Story + timeline */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[44rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("storyEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("storyTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
                {t("storyBody")}
              </p>
            </Reveal>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {timeline.map((step, i) => (
              <Reveal key={step.year + step.title} delay={0.06 + i * 0.04}>
                <li className="h-full flex flex-col rounded-2xl bg-canvas ring-1 ring-hairline p-5 md:p-6">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-mute mb-3">
                    {step.year}
                  </p>
                  <p className="text-[15px] md:text-[16px] font-semibold text-ink leading-[1.3]">
                    {step.title}
                  </p>
                  <p className="mt-2.5 text-[13.5px] leading-[1.55] text-ink-soft">
                    {step.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Vision */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-8 md:gap-14 items-start">
          <div>
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("visionEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2
                className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink"
                style={{ textWrap: "balance" }}
              >
                {t("visionTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
                {t("visionBody")}
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <ul className="space-y-4">
              {visionBullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 text-[15px] leading-[1.55] text-ink-soft"
                >
                  <BrandCheck variant="chip" size={10} className="mt-1 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Coverage */}
      <section className="bg-paper border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[44rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("coverageEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("coverageTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
                {t("coverageBody")}
              </p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {coverage.map((c, i) => (
              <Reveal key={c.title} delay={0.06 + i * 0.04}>
                <article className="h-full rounded-2xl bg-canvas ring-1 ring-hairline p-5 md:p-6">
                  <h3 className="text-[15.5px] font-semibold text-ink tracking-[-0.008em] leading-[1.25]">
                    {c.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-[1.55] text-ink-soft">
                    {c.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="max-w-[44rem] mb-10 md:mb-14">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
              {t("partnersEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
              {t("partnersTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
              {t("partnersBody")}
            </p>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {partners.map((p, i) => (
            <Reveal key={p.name} delay={0.04 + i * 0.02}>
              <article className="h-full rounded-2xl bg-paper ring-1 ring-hairline p-5 md:p-6">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-canvas ring-1 ring-hairline text-[11px] font-bold text-ink"
                  >
                    {p.name.charAt(0)}
                  </span>
                  <h3 className="text-[15px] font-semibold text-ink tracking-[-0.008em]">
                    {p.name}
                  </h3>
                </div>
                <p className="mt-3.5 text-[13px] md:text-[13.5px] leading-[1.55] text-ink-soft">
                  {p.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Reasons */}
      <section className="bg-paper border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[44rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("reasonsEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("reasonsTitle")}
              </h2>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {reasons.map((r, i) => (
              <Reveal key={r.title} delay={0.04 + i * 0.03}>
                <article className="h-full rounded-2xl bg-canvas ring-1 ring-hairline p-5 md:p-6">
                  <h3 className="text-[16px] font-semibold text-ink tracking-[-0.008em] leading-[1.25]">
                    {r.title}
                  </h3>
                  <p className="mt-3 text-[13.5px] md:text-[14px] leading-[1.55] text-ink-soft">
                    {r.body}
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
            className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[24ch]"
            style={{ textWrap: "balance" }}
          >
            {t("ctaTitle")}
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="mt-5 text-[15px] leading-[1.6] text-ink-soft max-w-[42rem]">
            {t("ctaBody")}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/start-free-trial" variant="primary" size="lg">
              {t("ctaTrial")}
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
