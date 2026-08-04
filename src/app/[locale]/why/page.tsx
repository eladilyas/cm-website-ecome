// /why — "Pourquoi Caisse Manager" / "Why Caisse Manager".
//
// Editorial four-part page:
//   1. Hero — the "connected ecosystem, not just another platform" pitch
//   2. Modules — one brain, several modules (POS core · Stock · HR-in-dev)
//   3. Integrations — 7 partner cards (CMI · Glovo · Odoo · Done · Brehm · Yassir · Insurance)
//   4. Commitments — hardware warranty + Wafasalaf financing
//   5. Closing CTA
//
// Server component; all copy resolves via next-intl (`whyPage.*`).

import type { Metadata } from "next";
import { seoAlternates } from "@/lib/seoAlternates";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { videoAsset } from "@/lib/mediaConfig";

type ModuleCard = {
  status: string;
  name: string;
  body: string;
  bullets: string[];
};

type IntegrationCard = {
  slug: string;
  name: string;
  body: string;
};

type CommitmentCard = {
  eyebrow: string;
  title: string;
  body: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("whyPage");
  return {
    alternates: seoAlternates("/why", locale),
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function WhyPage() {
  const t = await getTranslations("whyPage");
  const modules = t.raw("modules") as ModuleCard[];
  const integrations = t.raw("integrations") as IntegrationCard[];
  const commitments = t.raw("commitments") as CommitmentCard[];
  const broll = videoAsset(
    "why-caisse-manager-broll",
    "/media/about/pos-in-use.webp",
  );

  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />

      {/* Hero — pitch + b-roll video (or product still while R2 hostname unset) */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 md:pt-36 pb-16 md:pb-24">
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
            <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden ring-1 ring-hairline bg-ink">
              {broll.kind !== "missing" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={broll.src}
                  poster={broll.poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <Image
                  src="/media/about/pos-in-use.webp"
                  alt={t("brollAlt")}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  priority
                  className="object-cover"
                />
              )}
              <p className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-paper/95 text-ink text-[11px] font-medium tabular-nums">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("brollCaption")}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Modules — one brain, several modules */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[44rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("modulesEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("modulesTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[14.5px] md:text-[15px] leading-[1.55] text-ink-soft">
                {t("modulesBody")}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {modules.map((m, i) => {
              const isInDev = m.status === t("statusInDev");
              return (
                <Reveal key={m.name} delay={0.06 + i * 0.04}>
                  <article
                    className={`h-full flex flex-col rounded-2xl bg-canvas ring-1 ring-hairline p-6 md:p-7 ${
                      isInDev ? "opacity-[0.92]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        aria-hidden
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          isInDev ? "bg-amber-400" : "bg-emerald-500"
                        }`}
                      />
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-mute">
                        {m.status}
                      </p>
                    </div>
                    <h3 className="text-[19px] md:text-[20px] font-semibold text-ink tracking-[-0.014em] leading-[1.2]">
                      {m.name}
                    </h3>
                    <p className="mt-3 text-[13.5px] md:text-[14px] leading-[1.6] text-ink-soft">
                      {m.body}
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {m.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-ink-soft"
                        >
                          <BrandCheck variant="chip" size={9} className="mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="max-w-[44rem] mb-10 md:mb-14">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
              {t("integrationsEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
              {t("integrationsTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-[14.5px] md:text-[15px] leading-[1.55] text-ink-soft">
              {t("integrationsBody")}
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {integrations.map((intg, i) => (
            <Reveal key={intg.slug} delay={0.04 + i * 0.02}>
              <article className="h-full rounded-2xl bg-paper ring-1 ring-hairline p-5 md:p-6">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-canvas ring-1 ring-hairline text-[11px] font-bold text-ink"
                  >
                    {intg.name.charAt(0)}
                  </span>
                  <h3 className="text-[15px] font-semibold text-ink tracking-[-0.008em]">
                    {intg.name}
                  </h3>
                </div>
                <p className="mt-3.5 text-[13px] md:text-[13.5px] leading-[1.55] text-ink-soft">
                  {intg.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Commitments */}
      <section className="bg-paper border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="max-w-[44rem] mb-10 md:mb-14">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {t("commitmentsEyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
                {t("commitmentsTitle")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[14.5px] md:text-[15px] leading-[1.55] text-ink-soft">
                {t("commitmentsBody")}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {commitments.map((c, i) => (
              <Reveal key={c.title} delay={0.06 + i * 0.05}>
                <article className="h-full rounded-2xl bg-canvas ring-1 ring-hairline p-6 md:p-7">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-mute mb-3">
                    {c.eyebrow}
                  </p>
                  <h3 className="text-[19px] md:text-[20px] font-semibold text-ink tracking-[-0.014em] leading-[1.25]">
                    {c.title}
                  </h3>
                  <p className="mt-4 text-[14px] md:text-[14.5px] leading-[1.6] text-ink-soft">
                    {c.body}
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
