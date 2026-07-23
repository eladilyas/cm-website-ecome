// /events — "Événements" / where we've been.
//
// Structure: hero + 4 event cards + CTA.
// Each event card carries: name, date, location, body, and a video
// placeholder slot (per the source HTML — the actual event MP4s are
// large and stay off-repo until the video hosting decision is made).
//
// Copy lives under `eventsPage.*` in both FR + EN.

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

type EventItem = {
  slug: string;
  name: string;
  date: string;
  location: string;
  body: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("eventsPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EventsPage() {
  const t = await getTranslations("eventsPage");
  const events = t.raw("events") as EventItem[];
  const placeholder = t("videoPlaceholder");

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
            className="text-[clamp(2.25rem,5vw,4rem)] font-semibold tracking-[-0.024em] leading-[1.02] text-ink max-w-[22ch]"
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

      {/* Events grid */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {events.map((e, i) => (
            <Reveal key={e.slug} delay={0.06 + i * 0.04}>
              <article className="h-full rounded-2xl bg-paper ring-1 ring-hairline overflow-hidden">
                {/* Video placeholder — matches the source HTML pattern.
                    When the events MP4s are hosted (Cloudflare Stream,
                    Vimeo, etc.), swap this <div> for an <iframe> or a
                    poster + <video> element keyed by slug. */}
                <div className="relative aspect-[16/9] bg-ink flex items-center justify-center">
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(60% 80% at 50% 40%, rgba(255,255,255,0.06), rgba(0,0,0,0) 70%)",
                    }}
                  />
                  <p className="relative text-[10.5px] font-semibold uppercase tracking-[0.22em] text-paper/55">
                    {placeholder} · {e.name}
                  </p>
                </div>
                <div className="p-6 md:p-7">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-mute">
                    {e.date} · {e.location}
                  </p>
                  <h3 className="mt-3 text-[19px] md:text-[20px] font-semibold text-ink tracking-[-0.014em] leading-[1.25]">
                    {e.name}
                  </h3>
                  <p className="mt-3.5 text-[13.5px] md:text-[14px] leading-[1.6] text-ink-soft">
                    {e.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-paper border-t border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
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
              <Button href="/support#contact" variant="primary" size="lg">
                {t("ctaSales")}
              </Button>
              <Button href="/demo" variant="ghost" size="lg">
                {t("ctaDemo")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
