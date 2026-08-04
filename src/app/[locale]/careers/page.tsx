// /careers — "Construisez l'écosystème POS avec nous."
//
// Four-part page:
//   1. Hero — mission + brand voice
//   2. Benefits — 6-card grid ("Au-delà du salaire")
//   3. Process — 4-step hiring flow ("Quatre étapes, pas dix")
//   4. Spontaneous application CTA
//
// Copy lives under `careersPage.*` in both FR + EN.

import type { Metadata } from "next";
import { seoAlternates } from "@/lib/seoAlternates";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { videoAsset } from "@/lib/mediaConfig";

type Benefit = { title: string; body: string };
type ProcessStep = { title: string; body: string };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("careersPage");
  return {
    alternates: seoAlternates("/careers", locale), title: t("metaTitle"), description: t("metaDescription") };
}

export default async function CareersPage() {
  const t = await getTranslations("careersPage");
  const benefits = t.raw("benefits") as Benefit[];
  const process = t.raw("process") as ProcessStep[];
  const interview = videoAsset("careers-interview", "/media/careers/anas-interview.webp");

  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />

      {/* Hero — copy left, team interview right */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 md:pt-36 pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-5">
                {t("eyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h1
                className="text-[clamp(2.25rem,4.6vw,3.75rem)] font-semibold tracking-[-0.024em] leading-[1.02] text-ink max-w-[22ch]"
                style={{ textWrap: "balance" }}
              >
                {t("title")}
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-6 text-[17px] md:text-[19px] leading-[1.55] text-ink-soft max-w-[42rem]">
                {t("body")}
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <div className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden ring-1 ring-hairline bg-ink">
              {interview.kind !== "missing" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={interview.src}
                  poster={interview.poster}
                  controls
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Image
                  src="/media/careers/anas-interview.webp"
                  alt={t("interviewAlt")}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              )}
              <p className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-paper/95 text-ink text-[11px] font-medium tabular-nums">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("interviewCaption")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[44rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("benefitsEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("benefitsTitle")}
              </h2>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={0.04 + i * 0.03}>
                <article className="h-full rounded-2xl bg-canvas ring-1 ring-hairline p-5 md:p-6">
                  <h3 className="text-[16px] font-semibold text-ink tracking-[-0.008em] leading-[1.25]">
                    {b.title}
                  </h3>
                  <p className="mt-3 text-[13.5px] md:text-[14px] leading-[1.55] text-ink-soft">
                    {b.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring process */}
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
          <Reveal delay={0.08}>
            <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
              {t("processBody")}
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
              {t("processHeading")}
            </p>
          </Reveal>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {process.map((step, i) => (
            <Reveal key={step.title} delay={0.06 + i * 0.04}>
              <li className="h-full flex flex-col rounded-2xl bg-paper ring-1 ring-hairline p-5 md:p-6">
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

      {/* Spontaneous */}
      <section className="bg-paper border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-4">
              {t("spontaneousEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2
              className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[24ch]"
              style={{ textWrap: "balance" }}
            >
              {t("spontaneousTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mt-5 text-[15px] leading-[1.6] text-ink-soft max-w-[42rem]">
              {t("spontaneousBody")}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8">
              <Button href="/support#contact" variant="primary" size="lg">
                {t("spontaneousCta")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
