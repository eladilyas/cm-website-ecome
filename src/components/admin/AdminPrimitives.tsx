// Small reusable admin primitives — page header, stat tile, empty state,
// section card, status pill. Kept in one file so future admin pages
// just import what they need.

import type { ReactNode } from "react";
import Link from "next/link";

// ── Page header ────────────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-10">
      <div>
        {eyebrow && (
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink-mute font-medium mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[clamp(1.5rem,2.8vw,2rem)] font-semibold tracking-[-0.022em] leading-[1.1] text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[14px] text-ink-soft leading-[1.55] max-w-[44rem]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────

export function StatTile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-xl border border-hairline bg-paper px-5 py-4 hover:border-hairline-strong transition-colors duration-200">
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
        {label}
      </p>
      <p className="mt-2 text-[28px] font-semibold tracking-[-0.022em] text-ink tabular-nums">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[12px] text-ink-mute leading-[1.4]">{hint}</p>
      )}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block group">
        {body}
      </Link>
    );
  }
  return body;
}

// ── Section card ───────────────────────────────────────────────────────

export function SectionCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-paper overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.011em] text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[12px] text-ink-soft">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// ── Empty state ────────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description?: string;
  cta?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-hairline-strong bg-paper px-6 py-12 text-center">
      <p className="text-[14px] font-medium text-ink">{title}</p>
      {description && (
        <p className="mt-1.5 text-[12.5px] text-ink-soft max-w-[28rem] mx-auto leading-[1.5]">
          {description}
        </p>
      )}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}

// ── Stats strip ────────────────────────────────────────────────────────
// Compact horizontal KPI row used at the top of list pages — the CRM
// pattern: total + segmented counts visible at a glance. Tighter than
// StatTile so the table starts higher on the page.

export type StatItem = Readonly<{
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}>;

const STAT_DOT: Record<NonNullable<StatItem["tone"]>, string> = {
  neutral: "bg-ink-mute",
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
  info: "bg-indigo-500",
};

export function StatsStrip({ items }: { items: StatItem[] }) {
  return (
    <div className="rounded-xl border border-hairline bg-paper overflow-hidden mb-6">
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-hairline">
        {items.map((s) => (
          <li key={s.label} className="px-5 py-3.5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-ink-mute font-medium flex items-center gap-1.5">
              {s.tone && s.tone !== "neutral" && (
                <span className={`w-1.5 h-1.5 rounded-full ${STAT_DOT[s.tone]}`} />
              )}
              {s.label}
            </div>
            <div className="mt-1 text-[22px] font-semibold tracking-[-0.014em] text-ink tabular-nums leading-none">
              {s.value}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Status pill ────────────────────────────────────────────────────────

type Tone = "neutral" | "good" | "warn" | "bad" | "info";

const TONE_CLS: Record<Tone, string> = {
  neutral: "bg-fog text-ink-soft border-hairline",
  good: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warn: "bg-amber-50 text-amber-700 border-amber-100",
  bad: "bg-red-50 text-red-700 border-red-100",
  info: "bg-indigo-50 text-indigo-700 border-indigo-100",
};

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight " +
        TONE_CLS[tone]
      }
    >
      <span
        className={
          "w-1.5 h-1.5 rounded-full " +
          (tone === "good"
            ? "bg-emerald-500"
            : tone === "warn"
              ? "bg-amber-500"
              : tone === "bad"
                ? "bg-red-500"
                : tone === "info"
                  ? "bg-indigo-500"
                  : "bg-ink-mute")
        }
      />
      {label}
    </span>
  );
}
