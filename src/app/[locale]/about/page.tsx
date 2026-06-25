// About page — origin → vision → numbers → CTA. Light arc that ends on
// the dark Final CTA, matching the homepage rhythm. Server-rendered;
// every string flows through next-intl.

import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";

export async function generateMetadata() {
  const t = await getTranslations("about");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tStats = await getTranslations("about.stats");

  const stats = [
    { stat: "200+", label: tStats("counters") },
    { stat: "13", label: tStats("cities") },
    { stat: "1.4M", label: tStats("tickets") },
    { stat: "99.9%", label: tStats("uptime") },
  ];

  return (
    <>
      {/* ── Hero (canvas) ─────────────────────────────────────────────── */}
      <section data-scheme="light" className="relative overflow-hidden bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-5">
              {t("eyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-[-0.022em] leading-[1.02] text-ink max-w-[22ch]"
              style={{ textWrap: "balance" }}
            >
              {t("heroHeadline")}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 text-[19px] md:text-[22px] leading-[1.45] tracking-[-0.005em] text-ink-soft max-w-[36rem]">
              {t("heroBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Vision (paper) ────────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-12 md:gap-20 items-start">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
                {t("visionEyebrow")}
              </p>
            </Reveal>
            <div className="space-y-5">
              <Reveal delay={0.05}>
                <h2 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[22ch]">
                  {t("visionTitle")}
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-[17px] md:text-[19px] leading-[1.55] text-ink-soft max-w-[34rem]">
                  {t("visionBody1")}
                </p>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="text-[15px] md:text-[17px] leading-[1.55] text-ink-mute max-w-[34rem]">
                  {t("visionBody2")}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Numbers (fog) ─────────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-fog">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
              {t("numbersEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[22ch]">
              {t("numbersTitle")}
            </h2>
          </Reveal>

          <dl className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {stats.map((row, i) => (
              <Reveal key={row.label} delay={0.08 + i * 0.04}>
                <div>
                  <dt className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.022em] tabular-nums text-ink leading-none">
                    {row.stat}
                  </dt>
                  <dd className="mt-2 text-[12px] uppercase tracking-[0.14em] text-ink-mute">
                    {row.label}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Final CTA (night) ─────────────────────────────────────────── */}
      <section data-scheme="dark" className="bg-night text-paper">
        <SectionDivider scheme="dark" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32 text-center">
          <Reveal>
            <h2 className="text-[clamp(2rem,4.4vw,3rem)] font-semibold tracking-[-0.022em] leading-[1.05]">
              {t("finalTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-5 text-[17px] md:text-[19px] text-paper/75 max-w-[34rem] mx-auto">
              {t("finalBody")}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Button href="/start-free-trial" variant="invert" size="md">
                {t("finalPrimary")}
              </Button>
              <Button href="/demo" variant="outline" size="md">
                {t("finalSecondary")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
