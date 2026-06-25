"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { Reveal } from "@/components/ui/Reveal";
import {
  useFooterColumns,
  useFooterLegalLinks,
  FOOTER_SOCIAL,
} from "@/lib/footer";

// Premium dark closing footer — five clearly separated bands:
//
//   ┌────────────────────────────────────────────────────────────────┐
//   │  TOP ACCENT     — 1px brand-red gradient hairline.              │
//   ├────────────────────────────────────────────────────────────────┤
//   │  CTA BAND       — closing conversion push:                       │
//   │                   "Ready to run a smarter counter?"             │
//   │                   [Talk to sales] [Try the demo →]              │
//   ├────────────────────────────────────────────────────────────────┤
//   │  BRAND BLOCK    — logo + tagline + positioning line.            │
//   │                   Full width, calm, sets the tone for the IA.   │
//   ├────────────────────────────────────────────────────────────────┤
//   │  LINK GRID      — six flat columns:                             │
//   │                   Solutions · Industries · Store · Company ·    │
//   │                   Support · Legal                                │
//   ├────────────────────────────────────────────────────────────────┤
//   │  CORPORATE BAND — Caisse Manager SARL · status indicator ·       │
//   │                   Casablanca HQ. Trust signals.                  │
//   ├────────────────────────────────────────────────────────────────┤
//   │  COPYRIGHT BAND — © year · social cluster.                       │
//   └────────────────────────────────────────────────────────────────┘
//
// Surface stays at #0a0a0d. Map backdrop sits behind everything as
// atmospheric brand presence.
//
// Hidden inside /demo/order/* — the POS workspace owns its chrome.

const SURFACE = "#000000";

const HAIRLINE_GRADIENT =
  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 18%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.10) 82%, rgba(255,255,255,0) 100%)";

const ACCENT_GRADIENT =
  "linear-gradient(90deg, rgba(225,29,42,0) 0%, rgba(225,29,42,0.35) 35%, rgba(225,29,42,0.55) 50%, rgba(225,29,42,0.35) 65%, rgba(225,29,42,0) 100%)";

function Hairline() {
  return (
    <div
      aria-hidden
      className="h-px w-full"
      style={{ background: HAIRLINE_GRADIENT }}
    />
  );
}

export function Footer() {
  const pathname = usePathname();
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  const FOOTER_COLUMNS = useFooterColumns();
  const FOOTER_LEGAL = useFooterLegalLinks();
  if (pathname?.startsWith("/demo/order")) return null;

  const year = new Date().getFullYear();

  return (
    <footer
      data-scheme="dark"
      className="relative overflow-hidden text-paper/70"
      style={{ backgroundColor: SURFACE }}
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      {/* Top accent — brand-red gradient hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px z-[1]"
        style={{ background: ACCENT_GRADIENT }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 lg:px-10">
        {/* ── BAND 1 · Closing CTA ─────────────────────────────────
            A confident conversion push that sits at the top of the
            footer. Subtle dark surface, not a boxed banner. */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-y-7 gap-x-12 pt-16 md:pt-20 pb-12 md:pb-14">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-paper/45">
                {tCommon("getStarted")}
              </p>
              <h3 className="mt-3 text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.018em] leading-[1.12] text-paper max-w-[28rem]">
                {t("tagline")}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/support#contact"
                className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#E11D2A] text-paper text-[13px] font-semibold hover:bg-[#cf1925] transition-colors"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
                {t("links.contact")}
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-white/[0.06] text-paper text-[13px] font-semibold border border-white/[0.10] hover:bg-white/[0.10] transition-colors"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
                {t("links.demo")}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        <Hairline />

        {/* ── BAND 2 · Brand block + Link grid ──────────────────────
            Brand block on the left (col-span-3 on lg+), six link
            columns spread across the right (col-span-9 on lg+). On
            mobile the brand sits above the link grid. */}
        <div className="pt-14 md:pt-16 pb-14 md:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-12">
          {/* Brand */}
          <div className="lg:col-span-3">
            <Logo size={28} wordmark white />
            <Reveal>
              <p className="mt-7 text-[clamp(1.05rem,1.4vw,1.25rem)] font-semibold tracking-[-0.012em] leading-[1.25] text-paper max-w-[20rem]">
                {t("brandLine1")}
              </p>
              <p className="mt-2 text-[clamp(1.05rem,1.4vw,1.25rem)] font-normal tracking-[-0.008em] leading-[1.25] text-paper/55 max-w-[20rem]">
                {t("brandLine2")}
              </p>
              <p className="mt-5 text-[12.5px] leading-[1.55] text-paper/55 max-w-[20rem]">
                {t("brandLine3")}
              </p>
            </Reveal>
          </div>

          {/* Link grid — 6 flat columns */}
          <div className="lg:col-span-9">
            <nav
              aria-label="Footer navigation"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10"
            >
              {FOOTER_COLUMNS.map((col) => (
                <div key={col.title}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-paper/55 mb-5">
                    {col.title}
                  </h3>
                  <ul className="space-y-3">
                    {col.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="text-[13px] leading-[1.45] text-paper/75 hover:text-paper transition-colors duration-200"
                          style={{
                            transitionTimingFunction:
                              "cubic-bezier(0.32, 0.72, 0, 1)",
                          }}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        <Hairline />

        {/* ── BAND 3 · Corporate info & status ──────────────────────
            Trust signals — legal entity + HQ + system status. Calm,
            single-line on md+. */}
        <div className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-5 text-[12px] text-paper/55">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="text-paper/70 font-medium tracking-[-0.005em]">
              {t("corpEntity")}
            </span>
            <span className="hidden md:inline text-paper/30">·</span>
            <span>{t("corpCity")}</span>
            <span className="hidden md:inline text-paper/30">·</span>
            <Link
              href="/support#contact"
              className="hover:text-paper transition-colors"
            >
              {t("corpEmail")}
            </Link>
          </div>
          <StatusIndicator label={t("statusOk")} />
        </div>

        <Hairline />

        {/* ── BAND 4 · Copyright + social ───────────────────────────
            Quiet closing line — year, legal links, social. */}
        <div className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-paper/45">
            <span>{t("copyright", { year })}</span>
            {FOOTER_LEGAL.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-paper transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <ul className="flex items-center gap-1">
            {FOOTER_SOCIAL.map((s) => (
              <li key={s.icon}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-paper/55 hover:text-paper hover:bg-white/[0.06] transition-colors"
                  style={{
                    transition: "color 200ms, background-color 200ms",
                  }}
                >
                  <SocialIcon kind={s.icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

// ── Status pill ──────────────────────────────────────────────────────
function StatusIndicator({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[12px] text-paper/55"
      role="status"
      aria-label={label}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: "rgb(52, 211, 153)",
          boxShadow: "0 0 6px rgba(52, 211, 153, 0.55)",
        }}
      />
      {label}
    </span>
  );
}

function SocialIcon({ kind }: { kind: "x" | "linkedin" | "youtube" }) {
  if (kind === "x") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.244 2H21.5l-7.36 8.41L23 22h-6.79l-5.27-6.89L4.83 22H1.57l7.87-8.99L1 2h6.91l4.77 6.31L18.244 2zm-2.38 18h1.88L7.22 4H5.22l10.644 16z" />
      </svg>
    );
  }
  if (kind === "linkedin") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>
  );
}
