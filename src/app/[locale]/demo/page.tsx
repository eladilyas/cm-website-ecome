"use client";

// /demo — Premium template gallery (V2).
//
// Replaces the V1 flat 2-column picker with a Square / Toast / Linear-
// style template gallery. The Restaurant template is rendered as a
// featured "hero" card (full-width on lg), with the remaining six
// activities in a 3-column grid below. Each card surfaces:
//   • Activity icon + index + name + tagline
//   • Three-line description
//   • Capability badges derived from the activity's ACTIVITY_CAPS row
//     (Kitchen / Calendar / Delivery / Services / Loyalty / Inventory)
//   • Catalog stat line (products · categories)
//   • Try-it CTA with arrow
//
// All cards route to /demo/order after persisting the activity to
// localStorage via the demo store's selectActivity action — which on
// first visit per activity also auto-seeds the customer ledger,
// supplier book, staff list, opening stock, and 7 days of backfilled
// receipts (so the Dashboard is alive from the first second).
//
// Design tokens reused: hairline borders, brand red #E11D2A, Apple
// cubic-bezier easing, paper/night surface tokens from globals.css.

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Reveal } from "@/components/ui/Reveal";
import { ACTIVITIES, ACTIVITY_LIST } from "@/data/demo/activities";
import { ACTIVITY_CAPS } from "@/data/demo/activityCapabilities";
import { useDemoStore } from "@/lib/demoStore";
import { rememberDemoReturn } from "@/lib/demoReturn";
import type { ActivityKey, DemoActivity } from "@/data/demo/types";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Restaurant is the most feature-complete vertical (kitchen + tables +
// table-side flow), so it gets featured-card treatment. The remaining
// six fill a 3-column grid in original ACTIVITY_LIST order, minus
// dine-in.
const FEATURED_KEY: ActivityKey = "dine-in";
const REST_ACTIVITIES = ACTIVITY_LIST.filter((a) => a.key !== FEATURED_KEY);
const FEATURED = ACTIVITIES[FEATURED_KEY];

export default function DemoLandingPage() {
  const select = useDemoStore((s) => s.selectActivity);
  const t = useTranslations("demoLanding");
  const tAct = useTranslations("demo.activities");

  return (
    <section className="relative overflow-hidden">
      {/* Soft red ambient — picks up the brand color behind the cards */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 30%, rgba(225,29,42,0.10) 0%, rgba(225,29,42,0) 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
        {/* Hero */}
        <div className="text-center max-w-[48rem] mx-auto">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-paper/55 mb-5">
              {t("eyebrow")}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="text-[clamp(1.875rem,4.2vw,3.25rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-paper"
              style={{ textWrap: "balance" }}
            >
              {t("heading")}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-[17px] md:text-[19px] leading-[1.5] text-paper/75 max-w-[36rem] mx-auto">
              {t("subheading")}
            </p>
          </Reveal>
        </div>

        {/* Featured — Restaurant */}
        <Reveal delay={0.18}>
          <FeaturedCard
            activity={FEATURED}
            displayName={tAct(FEATURED.key)}
            onSelect={() => {
            rememberDemoReturn("/");
            select(FEATURED_KEY);
          }}
          />
        </Reveal>

        {/* Remaining 6 — 3-column grid on lg */}
        <div className="mt-5 md:mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {REST_ACTIVITIES.map((activity, i) => (
            <Reveal key={activity.key} delay={0.22 + i * 0.05}>
              <ActivityCard
                activity={activity}
                displayName={tAct(activity.key)}
                index={ACTIVITY_LIST.findIndex((x) => x.key === activity.key)}
                onSelect={() => {
                  rememberDemoReturn("/");
                  select(activity.key);
                }}
              />
            </Reveal>
          ))}
        </div>

        {/* Footer CTA — "Don't see yours?" */}
        <Reveal delay={0.55}>
          <div className="mt-16 md:mt-20 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-7 md:p-10 text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-paper/45 mb-3">
              {t("fallback.eyebrow")}
            </p>
            <h3 className="text-[clamp(1.4rem,2.4vw,2rem)] font-semibold tracking-[-0.018em] text-paper">
              {t("fallback.heading")}
            </h3>
            <p className="mt-3 text-[14px] md:text-[15px] text-paper/65 max-w-[36rem] mx-auto">
              {t("fallback.body")}
            </p>
            <Link
              href="/start-free-trial"
              className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-paper text-night text-[13px] font-medium hover:bg-paper/90 transition-colors"
              style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
            >
              {t("fallback.cta")}
              <Arrow />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Featured card (full width on lg) ──────────────────────────────

function FeaturedCard({
  activity,
  displayName,
  onSelect,
}: {
  activity: DemoActivity;
  /** Pre-resolved translated name. Passed in from the parent so we
   *  only hold one `demo.activities` translator at the page root. */
  displayName: string;
  onSelect: () => void;
}) {
  const reduce = useReducedMotion();
  const t = useTranslations("demoLanding");
  const tActivity = useTranslations(`demoLanding.activity.${activity.key}`);
  const caps = ACTIVITY_CAPS[activity.key];
  const badges = badgesFor(activity.key, t);

  return (
    <Link
      id={activity.key}
      href="/demo/order"
      onClick={onSelect}
      className="group relative mt-12 md:mt-16 block rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/40 focus-visible:ring-offset-2 focus-visible:ring-offset-night scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 50%, rgba(225,29,42,0.12) 0%, rgba(225,29,42,0) 75%)",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />

      <motion.div
        whileHover={reduce ? undefined : { y: -2 }}
        transition={{ duration: 0.3, ease: APPLE_EASE }}
        className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 p-7 md:p-10 lg:p-12"
      >
        {/* Left — copy */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#E11D2A]/12 text-[#E11D2A]">
              <ActivityIcon name={activity.key} />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#E11D2A]/85">
              {t("featuredTemplate")}
            </span>
          </div>

          <h2 className="text-[clamp(2rem,3.6vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-paper">
            {displayName}
          </h2>
          <p className="mt-3 text-[16px] md:text-[18px] leading-[1.45] text-paper/75 max-w-[38rem]">
            {tActivity("tagline")}
          </p>
          <p className="mt-4 text-[13px] md:text-[14px] leading-[1.6] text-paper/55 max-w-[40rem]">
            {tActivity("description")}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {badges.map((b) => (
              <Badge key={b.label} accent={b.accent}>
                {b.label}
              </Badge>
            ))}
          </div>

          <div className="mt-8 inline-flex items-center gap-2 text-[14px] text-paper group-hover:gap-3 transition-all duration-300"
            style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <span className="font-medium">{t("tryIt")}</span>
            <Arrow />
          </div>
        </div>

        {/* Right — stat panel */}
        <div className="lg:w-[280px] lg:border-l lg:border-white/10 lg:pl-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-paper/45 mb-5">
            {t("whatsLoaded")}
          </p>
          <dl className="space-y-3.5">
            <Stat label={t("stat.products")} value={String(activity.products.length)} />
            <Stat label={t("stat.categories")} value={String(activity.categories.length)} />
            <Stat
              label={t("stat.taxMode")}
              value={caps.taxMode === "inclusive" ? t("stat.taxInclusive") : t("stat.taxExclusive")}
              suffix={`· ${(caps.taxRate * 100).toFixed(0)}%`}
            />
            <Stat label={t("stat.paymentMethods")} value={String(caps.enabledPaymentMethods.length)} />
            <Stat label={t("stat.backfilledReceipts")} value="~150" suffix={t("stat.sevenDays")} />
          </dl>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Standard activity card ────────────────────────────────────────

function ActivityCard({
  activity,
  displayName,
  index,
  onSelect,
}: {
  activity: DemoActivity;
  displayName: string;
  index: number;
  onSelect: () => void;
}) {
  const reduce = useReducedMotion();
  const t = useTranslations("demoLanding");
  const tActivity = useTranslations(`demoLanding.activity.${activity.key}`);
  const num = String(index + 1).padStart(2, "0");
  const badges = badgesFor(activity.key, t);

  return (
    <Link
      id={activity.key}
      href="/demo/order"
      onClick={onSelect}
      className="group relative block rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/40 focus-visible:ring-offset-2 focus-visible:ring-offset-night scroll-mt-24 h-full"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(225,29,42,0.10) 0%, rgba(225,29,42,0) 70%)",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />

      <motion.div
        whileHover={reduce ? undefined : { y: -2 }}
        transition={{ duration: 0.3, ease: APPLE_EASE }}
        className="relative h-full flex flex-col p-6 md:p-7"
      >
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] text-paper/80">
            <ActivityIcon name={activity.key} />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-paper/40 tabular-nums">
            {num}
          </span>
        </div>

        <h3 className="mt-5 text-[20px] md:text-[22px] font-semibold tracking-[-0.018em] leading-[1.1] text-paper">
          {displayName}
        </h3>
        <p className="mt-1.5 text-[13px] md:text-[14px] leading-[1.45] text-paper/70 line-clamp-2">
          {tActivity("tagline")}
        </p>
        <p className="mt-3 text-[12px] md:text-[13px] leading-[1.55] text-paper/45 line-clamp-3">
          {tActivity("description")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {badges.slice(0, 4).map((b) => (
            <Badge key={b.label} accent={b.accent} compact>
              {b.label}
            </Badge>
          ))}
        </div>

        <div className="mt-auto pt-5 flex items-center justify-between gap-3">
          <span className="text-[11px] text-paper/40 tabular-nums">
            {t("cardFooter", {
              products: activity.products.length,
              categories: activity.categories.length,
            })}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-paper/70 group-hover:text-paper group-hover:gap-2 transition-all duration-300"
            style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
            {t("tryIt")}
            <Arrow />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Sub-pieces ────────────────────────────────────────────────────

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[12px] text-paper/55">{label}</dt>
      <dd className="text-[14px] font-medium text-paper tabular-nums">
        {value}
        {suffix && (
          <span className="ml-1.5 text-[11px] text-paper/45">{suffix}</span>
        )}
      </dd>
    </div>
  );
}

function Badge({
  children,
  accent,
  compact,
}: {
  children: React.ReactNode;
  accent: "neutral" | "red" | "emerald" | "amber" | "indigo";
  compact?: boolean;
}) {
  const tone = {
    neutral: "text-paper/70 border-white/12 bg-white/[0.03]",
    red: "text-[#ff8a92] border-[#E11D2A]/30 bg-[#E11D2A]/[0.06]",
    emerald: "text-emerald-300 border-emerald-400/25 bg-emerald-400/[0.06]",
    amber: "text-amber-300 border-amber-400/25 bg-amber-400/[0.06]",
    indigo: "text-indigo-300 border-indigo-400/25 bg-indigo-400/[0.06]",
  }[accent];

  return (
    <span
      className={
        "inline-flex items-center text-[10px] font-medium uppercase tracking-[0.1em] border rounded-full " +
        (compact ? "px-2 h-[22px]" : "px-2.5 h-[24px]") +
        " " +
        tone
      }
    >
      {children}
    </span>
  );
}

type BadgeSpec = {
  label: string;
  accent: "neutral" | "red" | "emerald" | "amber" | "indigo";
};

/** Derive the capability badge list for a card. Badges are sourced
 *  from ACTIVITY_CAPS — adding a new capability surface in Phase 2+
 *  means adding one row here, not editing each activity.
 *  Labels are translated via the demoLanding catalog. */
function badgesFor(
  key: ActivityKey,
  t: (key: string) => string,
): BadgeSpec[] {
  const caps = ACTIVITY_CAPS[key];
  const activity = ACTIVITIES[key];
  const badges: BadgeSpec[] = [];

  if (caps.hasKitchen) badges.push({ label: t("badges.kitchen"), accent: "red" });
  if (caps.hasCalendar) badges.push({ label: t("badges.calendar"), accent: "indigo" });
  if (caps.hasServices) badges.push({ label: t("badges.services"), accent: "indigo" });
  if (activity.enabledOrderTypes.some((ot) => ot === "glovo" || ot === "done"))
    badges.push({ label: t("badges.delivery"), accent: "amber" });
  if (caps.hasInventory) badges.push({ label: t("badges.inventory"), accent: "neutral" });
  if (caps.hasCustomers) badges.push({ label: t("badges.customers"), accent: "emerald" });
  return badges;
}

// ─── Icons ─────────────────────────────────────────────────────────

function ActivityIcon({ name }: { name: ActivityKey }) {
  switch (name) {
    case "cafe":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 5h8v4.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11 6h1.5a1.5 1.5 0 0 1 0 3H11" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 2.5c.5.4.5 1 0 1.5M7 2.5c.5.4.5 1 0 1.5M9 2.5c.5.4.5 1 0 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    case "bakery":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <ellipse cx="8" cy="9" rx="6" ry="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3.5 9c.5-1 1-1.5 1.5-1.5M6 8c.5-.5 1-1 1.5-1M9 8c.5-.5 1-1 1.5-1M11 9c.5-1 1-1.5 1.5-1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
    case "fast-food":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2.5 7.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4H2.5Z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 10h11M2.5 12.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "dine-in":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 2v6M6 2v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M4 8v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M11 2c-1.5 1.5-2 3-2 5s.5 2 2 2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "market":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 5h10l-1 7H4L3 5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "beauty":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 6c-2 1-2 4 0 5l3-1 3 1c2-1 2-4 0-5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    case "barber":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 3l5 5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="12" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 11h5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
  }
}

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="transition-transform duration-300 group-hover:translate-x-0.5"
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      <path
        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
