"use client";

// Home-page live POS preview — the "try the real product" moment
// that used to be the custom POSImmersionSection.
//
// Iframes the Bakery-demo tenant (POS only, not the back-office —
// we show the back-office on /demo to keep the home preview focused).
// A compact credentials strip lives above the frame so visitors know
// how to sign in without leaving the page.

import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { Arrow } from "@/components/ui/Arrow";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

const POS_URL = "https://bakery-pos.demo.caisse-manager.ma/";

export function LivePosPreviewSection() {
  const t = useTranslations("home.livePos");

  return (
    <section
      data-scheme="light"
      className="relative bg-canvas overflow-hidden"
    >
      <SectionDivider scheme="light" />
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        {/* Header */}
        <div className="max-w-[42rem] mb-8 md:mb-10">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-4">
              {t("eyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2
              className="text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink"
              style={{ textWrap: "balance" }}
            >
              {t("title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-[15px] md:text-[16px] leading-[1.55] text-ink-soft">
              {t("body")}
            </p>
          </Reveal>
        </div>

        {/* Credentials strip */}
        <Reveal delay={0.1}>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
              {t("credentialsLabel")}
            </p>
            <CopyChip label={t("fields.user")} value="test" />
            <CopyChip label={t("fields.pin")} value="0000" />
            <span className="text-[12px] text-ink-mute">·</span>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink hover:text-[#E11D2A] transition-colors"
            >
              {t("fullDemoCta")}
              <Arrow size={12} />
            </Link>
          </div>
        </Reveal>

        {/* Iframe host — chrome bar + 16:10 iframe */}
        <Reveal delay={0.14}>
          <div className="rounded-2xl bg-ink ring-1 ring-hairline overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-hairline-dark bg-ink text-paper/80">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-paper/25" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-paper/25" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-paper/25" aria-hidden />
              </div>
              <p className="text-[11.5px] text-paper/70 tabular-nums truncate max-w-[52ch]" title={POS_URL}>
                {POS_URL}
              </p>
              <span aria-hidden className="h-2.5 w-2.5" />
            </div>
            <div className="relative w-full bg-paper" style={{ aspectRatio: "16 / 10" }}>
              <iframe
                src={POS_URL}
                title={t("iframeTitle")}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                allow="clipboard-write; fullscreen"
              />
              <a
                href={POS_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-paper/95 text-ink text-[11.5px] font-medium ring-1 ring-hairline hover:bg-paper hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)] transition-shadow"
              >
                {t("openInTab")}
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M4 8l4-4M4.5 4H8v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);
  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        "inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-full text-[11.5px] font-medium transition-colors duration-200 " +
        (copied
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-paper text-ink ring-1 ring-hairline hover:bg-ink hover:text-paper")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
      aria-live="polite"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
      {copied && <span className="text-[10px] font-semibold">✓</span>}
    </button>
  );
}
