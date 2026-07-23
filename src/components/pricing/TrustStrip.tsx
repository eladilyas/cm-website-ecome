"use client";

// TrustStrip — four quiet trust signals shown between the plans grid
// and the comparison matrix. Each signal addresses a specific purchase
// anxiety: setup, lock-in, hardware, and local presence.
//
// Copy resolves through next-intl (`pricing.whyItems`) so FR + EN
// render from a single source of truth — the strings were previously
// hard-coded in English and shipped verbatim on /fr/pricing.

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

type WhyItem = { title: string; body: string };

export function TrustStrip() {
  const t = useTranslations("pricing");
  const items = t.raw("whyItems") as WhyItem[];
  const icons: ReactNode[] = [
    <OnboardingIcon key="i0" />,
    <FlexIcon key="i1" />,
    <HardwareIcon key="i2" />,
    <LocalIcon key="i3" />,
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
      {items.map((s, i) => (
        <div
          key={s.title}
          className="h-full rounded-2xl bg-paper p-6 ring-1 ring-hairline transition-all duration-300 hover:ring-hairline-strong hover:-translate-y-0.5"
          style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          <span
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-canvas text-ink"
            aria-hidden
          >
            {icons[i] ?? <OnboardingIcon />}
          </span>
          <h3 className="mt-5 text-[15px] font-semibold tracking-[-0.011em] text-ink">
            {s.title}
          </h3>
          <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-soft">
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function OnboardingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7l6 4 6-4M4 7v10l6 4 6-4V7M14 3l6 4-6 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlexIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12a8 8 0 1 0 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 4v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HardwareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LocalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
