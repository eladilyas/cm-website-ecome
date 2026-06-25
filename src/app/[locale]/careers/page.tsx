// Careers page — modest, premium, modeled on About: light arc (canvas →
// paper → fog) ending on a dark Final CTA. Three sections: hero, what
// we look for, current openings (empty-state copy when there are no
// listings live yet). Pure typography composition — no images required.

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";

export async function generateMetadata() {
  const t = await getTranslations("careers");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

// Drop new roles into this array as they open. Empty → page renders a
// calm "no openings right now" empty-state with an evergreen
// general-application mailto. Each role's `href` should be a mailto with
// the role pre-populated in the subject line (no recruiting platform yet).
const OPEN_ROLES: { title: string; team: string; location: string; href: string }[] = [];

export default async function CareersPage() {
  const t = await getTranslations("careers");

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

      {/* ── What we look for (paper) ─────────────────────────────────── */}
      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-12 md:gap-20 items-start">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
                {t("lookForEyebrow")}
              </p>
            </Reveal>
            <div className="space-y-5">
              <Reveal delay={0.05}>
                <h2 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[24ch]">
                  {t("lookForTitle")}
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-[17px] md:text-[19px] leading-[1.55] text-ink-soft max-w-[34rem]">
                  {t("lookForBody1")}
                </p>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="text-[15px] md:text-[17px] leading-[1.55] text-ink-mute max-w-[34rem]">
                  {t("lookForBody2")}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Open roles (fog) ─────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-fog">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
              {t("openEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[22ch]">
              {OPEN_ROLES.length > 0 ? t("openTitleOpen") : t("openTitleClosed")}
            </h2>
          </Reveal>

          {OPEN_ROLES.length > 0 ? (
            <ul className="mt-12 divide-y divide-hairline border-t border-b border-hairline">
              {OPEN_ROLES.map((role, i) => (
                <Reveal key={role.title} delay={0.08 + i * 0.04}>
                  <li>
                    <Link
                      href={role.href}
                      className="group flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-8 py-6 hover:bg-paper/60 transition-colors duration-200 -mx-3 px-3 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[18px] md:text-[20px] font-semibold tracking-[-0.012em] text-ink">
                          {role.title}
                        </p>
                        <p className="mt-1 text-[13px] text-ink-mute">
                          {role.team} · {role.location}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft group-hover:text-ink transition-colors">
                        {t("openApply")}
                        <Arrow />
                      </span>
                    </Link>
                  </li>
                </Reveal>
              ))}
            </ul>
          ) : (
            <Reveal delay={0.08}>
              <p className="mt-6 text-[17px] md:text-[19px] leading-[1.55] text-ink-soft max-w-[36rem]">
                {t("openClosedBody")}
              </p>
            </Reveal>
          )}
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
                href="mailto:careers@caissemanager.com?subject=Introduction"
                variant="invert"
                size="md"
              >
                {t("finalPrimary")}
              </Button>
              <Button href="/about" variant="outline" size="md">
                {t("finalSecondary")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="transition-transform duration-200 group-hover:translate-x-0.5"
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      <path
        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
