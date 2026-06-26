"use client";

// AuthShell — premium split-screen container for /signin + /signup.
//
//   ┌────────────────────────┬───────────────────────┐
//   │                        │                       │
//   │   form panel (paper)   │   brand panel (dark)  │
//   │   children render      │   editorial story     │
//   │   inside here          │                       │
//   │                        │                       │
//   └────────────────────────┴───────────────────────┘
//   On md+ ↓ the right panel hides; the form panel goes full-width
//   and the page reads as a centered card on canvas. The brand
//   storytelling is reserved for desktop where there's room to breathe.
//
// Chrome ownership: the global marketing Header from SiteChrome renders
// above this shell (brand mark, locale switch, cart, sign-in link). We
// intentionally do NOT render a second brand mark here — the prior
// duplicate looked unfinished. Form panel padding accounts for the
// floating header height.

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function AuthShell({
  eyebrow,
  heading,
  subheading,
  children,
  footer,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  subheading?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100svh-72px)] w-full bg-paper lg:bg-canvas flex flex-col">
      {/* Two-column grid on lg+, single column below. */}
      <div className="flex-1 grid lg:grid-cols-[1.05fr_0.95fr] xl:grid-cols-[1fr_0.9fr]">
        {/* ── Form panel ──
            pt accounts for the floating marketing header above (~72px);
            pb keeps breathing room above the footer/page edge. */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.05,
          }}
          className="relative flex items-center justify-center px-6 sm:px-10 lg:px-16 pt-24 pb-10 lg:pt-16 lg:pb-12"
        >
          <div className="w-full max-w-[420px]">
            {/* Editorial header — kept compact so the entire form
                (fields + submit + consent + footer link) fits inside
                a single viewport on standard laptops without scroll. */}
            <div className="mb-5 lg:mb-6">
              <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink-mute font-medium mb-2">
                {eyebrow}
              </p>
              <h1 className="text-[clamp(1.5rem,2.6vw,1.85rem)] font-semibold tracking-[-0.022em] leading-[1.12] text-ink text-balance">
                {heading}
              </h1>
              {subheading && (
                <p className="mt-2.5 text-[13px] text-ink-soft leading-[1.5] max-w-[28rem]">
                  {subheading}
                </p>
              )}
            </div>

            {children}

            {footer && (
              <div className="mt-5 pt-4 border-t border-hairline">
                {footer}
              </div>
            )}
          </div>
        </motion.section>

        {/* ── Brand panel (lg+ only) ── */}
        <BrandPanel />
      </div>
    </div>
  );
}

// ── Brand panel ─────────────────────────────────────────────────────────
// Dark editorial slab on the right. Sells the product, doesn't drown
// the form. Subtle red glow in the lower-left for warmth.

function BrandPanel() {
  const t = useTranslations("auth.brandPanel");
  return (
    <aside
      className="
        relative hidden lg:flex flex-col justify-center gap-12 overflow-hidden
        bg-night text-paper
        px-12 xl:px-16 pt-28 pb-16
      "
    >
      {/* Ambient red glow */}
      <div
        aria-hidden
        className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-[0.18]"
        style={{ background: "radial-gradient(closest-side, #E11D2A, transparent 70%)" }}
      />
      {/* Subtle vignette top-right */}
      <div
        aria-hidden
        className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-[0.15]"
        style={{ background: "radial-gradient(closest-side, #ffffff, transparent 70%)" }}
      />

      {/* Centerpiece quote */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        className="relative max-w-[440px]"
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-paper/55 font-medium mb-5">
          {t("eyebrow")}
        </p>
        <p className="text-[clamp(1.65rem,2.6vw,2.1rem)] font-semibold tracking-[-0.022em] leading-[1.18] text-paper">
          {t("heading")}
        </p>
        <p className="mt-5 text-[14px] text-paper/70 leading-[1.6]">
          {t("body")}
        </p>
        {/* Financing attribution — separates the partner-provided
            financing offering from Caisse Manager's own product so we
            never imply that we operate as a financing institution.
            Quieter typography (smaller, lower opacity) marks it as a
            regulatory note rather than a feature claim. */}
        <p className="mt-3 text-[12px] text-paper/55 leading-[1.55]">
          {t("financingNote")}
        </p>
      </motion.div>

      {/* Footer — trust chips + language switcher.
          The switcher lives on its OWN row, always. Earlier it shared
          the row with the chips via flex-wrap, which meant longer
          translations (FR "Plus de 500 commerces nous font confiance")
          would push the switcher onto a second line while shorter
          translations (EN) kept it inline — different shape per locale.
          Hard-separating the rows guarantees the same vertical rhythm
          regardless of copy length. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
        className="relative flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11.5px] text-paper/55">
          <span className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {t("trustBadge")}
          </span>
          <span aria-hidden className="w-px h-3 bg-hairline-dark" />
          <span>{t("deployment")}</span>
        </div>
        <div>
          <LanguageSwitcher scheme="dark" />
        </div>
      </motion.div>
    </aside>
  );
}
