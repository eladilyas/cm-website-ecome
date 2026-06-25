// Partnership page — modest, premium, matches About / Careers rhythm:
// light hero (canvas) → program detail (paper) → 3-step process (fog) →
// dark final CTA (night). Covers both the referral/affiliation track and
// the reseller/integration track in one page — they share the same
// application path today.

import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";

export async function generateMetadata() {
  const t = await getTranslations("partnership");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PartnershipPage() {
  const t = await getTranslations("partnership");
  const tT = await getTranslations("partnership.tracks");
  const tS = await getTranslations("partnership.steps");

  const TRACKS = [
    { key: "affiliation", eyebrow: tT("affiliation.eyebrow"), title: tT("affiliation.title"), body: tT("affiliation.body") },
    { key: "reseller", eyebrow: tT("reseller.eyebrow"), title: tT("reseller.title"), body: tT("reseller.body") },
    { key: "technology", eyebrow: tT("technology.eyebrow"), title: tT("technology.title"), body: tT("technology.body") },
  ];

  const STEPS = [
    { num: "01", title: tS("step1Title"), body: tS("step1Body") },
    { num: "02", title: tS("step2Title"), body: tS("step2Body") },
    { num: "03", title: tS("step3Title"), body: tS("step3Body") },
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
            <p className="mt-8 text-[19px] md:text-[22px] leading-[1.45] tracking-[-0.005em] text-ink-soft max-w-[38rem]">
              {t("heroBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Tracks (paper) ───────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
              {t("tracksEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[22ch]">
              {t("tracksTitle")}
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {TRACKS.map((track, i) => (
              <Reveal key={track.key} delay={0.08 + i * 0.04}>
                <div className="h-full">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#E11D2A]">
                    {track.eyebrow}
                  </p>
                  <h3 className="mt-3 text-[20px] md:text-[22px] font-semibold tracking-[-0.012em] leading-[1.2] text-ink">
                    {track.title}
                  </h3>
                  <p className="mt-3 text-[15px] md:text-[16px] leading-[1.55] text-ink-soft">
                    {track.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works (fog) ───────────────────────────────────────── */}
      <section data-scheme="light" className="bg-fog">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
              {t("howEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[22ch]">
              {t("howTitle")}
            </h2>
          </Reveal>

          <ol className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {STEPS.map((step, i) => (
              <Reveal key={step.num} delay={0.08 + i * 0.04}>
                <li>
                  <p className="text-[clamp(2rem,3.6vw,2.75rem)] font-semibold tracking-[-0.022em] tabular-nums text-ink leading-none">
                    {step.num}
                  </p>
                  <h3 className="mt-5 text-[18px] md:text-[20px] font-semibold tracking-[-0.012em] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] md:text-[16px] leading-[1.55] text-ink-soft max-w-[26rem]">
                    {step.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
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
              <Button
                href="mailto:partners@caissemanager.com?subject=Partnership%20application"
                variant="invert"
                size="md"
              >
                {t("finalPrimary")}
              </Button>
              <Button href="/support#contact" variant="outline" size="md">
                {t("finalSecondary")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
