// TrustStrip — four quiet trust signals shown between the plans grid and
// the comparison matrix. Each signal addresses a specific purchase
// anxiety: setup, lock-in, hardware, and local presence.
//
// Apple-style: monoline 24px icons, restrained colour, generous spacing.
// No badges, no medallions — just four facts a finance buyer needs to see.

import type { ReactNode } from "react";

type Signal = { icon: ReactNode; title: string; body: string };

const SIGNALS: Signal[] = [
  {
    icon: <OnboardingIcon />,
    title: "Onboarding included",
    body: "Menu import + hardware pairing + a guided first session — typically live within the hour.",
  },
  {
    icon: <FlexIcon />,
    title: "Cancel anytime",
    body: "Plans are month-to-month. Annual and 24-month commitments unlock discounts, never lock-ins.",
  },
  {
    icon: <HardwareIcon />,
    title: "Hardware agnostic",
    body: "Runs on every Android-based POS terminal we ship — and most third-party ones too. Mix and match the till you already use.",
  },
  {
    icon: <LocalIcon />,
    title: "Local team in Morocco",
    body: "Onboarding, repairs, and support handled in-country. Same-day visits across Casablanca, Rabat, Marrakech.",
  },
];

export function TrustStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
      {SIGNALS.map((s) => (
        <div
          key={s.title}
          className="h-full rounded-2xl bg-paper p-6 ring-1 ring-hairline transition-all duration-300 hover:ring-hairline-strong hover:-translate-y-0.5"
          style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          <span
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-canvas text-ink"
            aria-hidden
          >
            {s.icon}
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

// ── Icons — monoline 24px, stroke 1.6, rounded ──────────────────────────

function OnboardingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7l8-4 8 4-8 4-8-4Zm0 5l8 4 8-4M4 17l8 4 8-4"
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
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HardwareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 21h8M12 17v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LocalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
