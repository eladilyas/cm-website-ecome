// Partnership sub-page block library. Each block renders a consistent
// section (hero · numbered-steps · feature-cards · list · CTA · contact
// channels) so the four sub-pages (affiliate, reseller, technology,
// support) can stay tight without duplicating markup.

import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

// ── Hero ────────────────────────────────────────────────────────────

export function ProgramHero({
  eyebrow,
  title,
  body,
  crumb,
}: {
  eyebrow: string;
  title: string;
  body: string;
  crumb: string;
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 md:pt-36 pb-14 md:pb-20">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-4">
          {crumb} <span className="text-ink-mute/50">›</span> {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={0.04}>
        <h1
          className="text-[clamp(2.25rem,5vw,4.25rem)] font-semibold tracking-[-0.024em] leading-[1.02] text-ink max-w-[22ch]"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h1>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="mt-6 text-[17px] md:text-[19px] leading-[1.55] text-ink-soft max-w-[46rem]">
          {body}
        </p>
      </Reveal>
    </section>
  );
}

// ── Numbered steps ──────────────────────────────────────────────────

export function NumberedSteps({
  eyebrow,
  title,
  items,
  scheme = "paper",
}: {
  eyebrow: string;
  title: string;
  items: { title: string; body: string }[];
  scheme?: "paper" | "canvas";
}) {
  const bg = scheme === "paper" ? "bg-paper border-y border-hairline" : "";
  const cardBg = scheme === "paper" ? "bg-canvas" : "bg-paper";
  return (
    <section className={bg}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="max-w-[44rem] mb-10 md:mb-14">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
              {eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
              {title}
            </h2>
          </Reveal>
        </div>
        <ol
          className={`grid grid-cols-1 gap-4 md:gap-5 ${
            items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {items.map((step, i) => (
            <Reveal key={step.title} delay={0.06 + i * 0.04}>
              <li className={`h-full rounded-2xl ${cardBg} ring-1 ring-hairline p-5 md:p-6`}>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-mute mb-3">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="text-[15.5px] font-semibold text-ink leading-[1.3]">
                  {step.title}
                </p>
                <p className="mt-2.5 text-[13.5px] leading-[1.55] text-ink-soft">
                  {step.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── Feature grid ────────────────────────────────────────────────────

export function FeatureCards({
  eyebrow,
  title,
  body,
  items,
  cols = 3,
  scheme = "canvas",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  items: { title: string; body: string }[];
  cols?: 2 | 3;
  scheme?: "paper" | "canvas";
}) {
  const bg = scheme === "paper" ? "bg-paper border-y border-hairline" : "";
  const cardBg = scheme === "paper" ? "bg-canvas" : "bg-paper";
  const grid = cols === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";
  return (
    <section className={bg}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="max-w-[44rem] mb-10 md:mb-14">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
              {eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
              {title}
            </h2>
          </Reveal>
          {body && (
            <Reveal delay={0.08}>
              <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
                {body}
              </p>
            </Reveal>
          )}
        </div>
        <div className={`grid grid-cols-1 gap-4 md:gap-5 ${grid}`}>
          {items.map((f, i) => (
            <Reveal key={f.title} delay={0.06 + i * 0.03}>
              <article className={`h-full rounded-2xl ${cardBg} ring-1 ring-hairline p-5 md:p-6`}>
                <h3 className="text-[16px] font-semibold text-ink tracking-[-0.008em] leading-[1.25]">
                  {f.title}
                </h3>
                <p className="mt-3 text-[13.5px] md:text-[14px] leading-[1.6] text-ink-soft">
                  {f.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Bullet list (criteria, promises) ─────────────────────────────────

export function BulletList({
  eyebrow,
  title,
  body,
  items,
  scheme = "canvas",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  items: string[];
  scheme?: "paper" | "canvas";
}) {
  const bg = scheme === "paper" ? "bg-paper border-y border-hairline" : "";
  return (
    <section className={bg}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-8 md:gap-14 items-start">
          <div>
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
                {eyebrow}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2
                className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink"
                style={{ textWrap: "balance" }}
              >
                {title}
              </h2>
            </Reveal>
            {body && (
              <Reveal delay={0.08}>
                <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
                  {body}
                </p>
              </Reveal>
            )}
          </div>
          <Reveal delay={0.12}>
            <ul className="space-y-3.5">
              {items.map((line) => (
                <li key={line} className="flex items-start gap-3 text-[15px] leading-[1.55] text-ink-soft">
                  <span
                    aria-hidden
                    className="mt-[9px] h-1.5 w-1.5 rounded-full bg-[#E11D2A] shrink-0"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Contact channels (Partner support: 4 channels) ──────────────────

export function ContactChannels({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: { title: string; body: string }[];
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
      <div className="max-w-[44rem] mb-10 md:mb-14">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-3">
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.04}>
          <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.08] text-ink">
            {title}
          </h2>
        </Reveal>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {items.map((c, i) => (
          <Reveal key={c.title} delay={0.06 + i * 0.04}>
            <article className="h-full rounded-2xl bg-paper ring-1 ring-hairline p-5 md:p-6">
              <h3 className="text-[16px] font-semibold text-ink tracking-[-0.008em] leading-[1.25]">
                {c.title}
              </h3>
              <p className="mt-3 text-[13.5px] md:text-[14px] leading-[1.6] text-ink-soft">
                {c.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── Closing CTA ─────────────────────────────────────────────────────

export function ProgramCta({
  eyebrow,
  title,
  body,
  primaryLabel,
  primaryHref = "/support#contact",
  secondaryLabel,
  secondaryHref,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-paper border-t border-hairline">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-4">
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.04}>
          <h2
            className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[24ch]"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="mt-5 text-[15px] leading-[1.6] text-ink-soft max-w-[42rem]">
            {body}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href={primaryHref} variant="primary" size="lg">
              {primaryLabel}
            </Button>
            {secondaryLabel && secondaryHref && (
              <Button href={secondaryHref} variant="ghost" size="lg">
                {secondaryLabel}
              </Button>
            )}
          </div>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
