"use client";

// /support — clean search-styled hero, topic grid, FAQ accordion (filtered
// by selected topic), contact strip, final CTA. Locale-aware: every label
// + topic + FAQ flows through next-intl via the `useSupportTopics()` and
// `useSupportFaqs()` hooks in src/data/support.tsx.

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { FAQAccordion } from "@/components/support/FAQAccordion";
import { useSupportTopics, useSupportFaqs } from "@/data/support";

export default function SupportPage() {
  const [topicId, setTopicId] = useState<string | null>(null);
  const t = useTranslations("support");
  const SUPPORT_TOPICS = useSupportTopics();
  const FAQS = useSupportFaqs();

  return (
    <>
      {/* ── Hero (canvas) ─────────────────────────────────────────────── */}
      <section data-scheme="light" className="relative overflow-hidden bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <div className="max-w-[760px] mx-auto text-center">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-5">
                {t("eyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1
                className="text-[clamp(1.875rem,4.2vw,3.25rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink"
                style={{ textWrap: "balance" }}
              >
                {t("heroHeadline")}
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-10 relative max-w-[520px] mx-auto">
                <span
                  aria-hidden
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="search"
                  aria-label={t("searchAria")}
                  placeholder={t("searchPlaceholder")}
                  className="w-full h-12 pl-11 pr-4 rounded-full border border-hairline-strong bg-paper text-[15px] text-ink placeholder:text-ink-mute outline-none focus:border-ink transition-colors"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                />
              </div>
              <p className="mt-3 text-[12px] text-ink-mute">{t("searchSoon")}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Topic grid (paper) ────────────────────────────────────────── */}
      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-6">
              {t("browseEyebrow")}
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <TopicTile
              id={null}
              label={t("allTopics")}
              description={t("allTopicsDesc", { count: FAQS.length })}
              active={topicId === null}
              onSelect={() => setTopicId(null)}
            />
            {SUPPORT_TOPICS.map((topic) => (
              <TopicTile
                key={topic.id}
                id={topic.id}
                label={topic.label}
                description={topic.description}
                active={topicId === topic.id}
                onSelect={() => setTopicId(topic.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ accordion (canvas to differentiate from grid) ─────────── */}
      <section id="faq" data-scheme="light" className="bg-canvas scroll-mt-24">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <Reveal>
              <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
                {topicId
                  ? SUPPORT_TOPICS.find((tt) => tt.id === topicId)?.label
                  : t("faqDefaultTitle")}
              </h2>
            </Reveal>
          </div>
          <FAQAccordion topicId={topicId} />
        </div>
      </section>

      {/* ── Contact strip (fog) ───────────────────────────────────────── */}
      <section id="contact" data-scheme="light" className="bg-fog scroll-mt-24">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-5">
              {t("contactEyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[24ch]">
              {t("contactTitle")}
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <ContactTile
              label={t("contactEmail")}
              value="support@caissemanager.com"
              href="mailto:support@caissemanager.com"
            />
            <ContactTile
              label={t("contactWhatsapp")}
              value="+212 6 12 34 56 78"
              href="https://wa.me/212612345678"
            />
            <ContactTile
              label={t("contactPhone")}
              value="+212 5 22 00 00 00"
              href="tel:+212522000000"
            />
          </div>
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

function TopicTile({
  label,
  description,
  active,
  onSelect,
}: {
  id: string | null;
  label: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-2xl border p-5 transition-all duration-200 ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-hairline bg-paper hover:bg-canvas text-ink"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <p
        className={`text-[15px] md:text-[16px] font-semibold tracking-[-0.012em] ${
          active ? "text-paper" : "text-ink"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1.5 text-[13px] leading-[1.45] ${
          active ? "text-paper/75" : "text-ink-soft"
        }`}
      >
        {description}
      </p>
    </button>
  );
}

function ContactTile({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-2xl border border-hairline bg-paper hover:bg-canvas p-5 transition-colors duration-200"
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
        {label}
      </p>
      <p className="mt-1.5 text-[15px] md:text-[16px] font-medium text-ink">
        {value}
      </p>
    </a>
  );
}
