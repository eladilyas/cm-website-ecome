"use client";

// Apple-style drill-in mobile menu.
//
// Two-level navigation that mirrors apple.com's mobile pattern:
//
//   Level 1 (root) — every top-level NAV item as a large-text row.
//                    Items with children show a right chevron and
//                    drill the user one level deeper. Items without
//                    children route directly. A persistent "Quick
//                    links" block (Cart, Sign in / Account) sits
//                    below the primary list.
//
//   Level 2 (drill) — back chevron + parent label at the top, then
//                    every child item rendered flat (groups become
//                    eyebrow-titled sub-sections — same data the
//                    desktop dropdown uses, just stacked).
//
// Why this pattern beats the prior flat list:
//   • The previous mobile sheet rendered EVERY child of EVERY top-
//     level item inline. That was 30+ rows of dense text — exactly
//     what the user flagged.
//   • Drilling shows ~6 rows at the root and ~10 rows in any branch.
//     Each screen has clear hierarchy.
//   • Apple's IA is the most thoroughly tested mobile-menu pattern
//     in the industry. Visitors recognize the affordance instantly.
//
// Animation: panels slide horizontally (-100%/0/100%) using
// AnimatePresence with a single direction prop ("forward" when
// drilling in, "back" when returning). Apple cubic-bezier easing.
// Each panel scrolls independently so deep menus don't fight the
// page underneath.
//
// Accessibility: full-screen dialog, role="dialog", body scroll-lock
// while open, Esc closes, the back chevron is keyboard-focusable.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import { useNavMenu, type NavItem, type NavSubItem, type NavGroup } from "@/lib/nav";
import { Button } from "@/components/ui/Button";
import {
  getInitials,
  type AccountProfile,
} from "@/lib/accountStore";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Props = {
  open: boolean;
  onClose: () => void;
  scheme: "light" | "dark";
  isSignedIn: boolean;
  profile: AccountProfile | null;
  cartCount: number;
};

export function MobileMenu({
  open,
  onClose,
  scheme,
  isSignedIn,
  profile,
  cartCount,
}: Props) {
  const onDark = scheme === "dark";
  const [drillTo, setDrillTo] = useState<NavItem | null>(null);

  // Esc closes the menu entirely (not just the drill). Body-scroll
  // lock while open so the page underneath doesn't scroll behind
  // the sheet — Apple's mobile menu does the same.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Reset drill state when the sheet closes so reopening lands on
  // the root level — visitors expect a fresh entry point. Uses the
  // "store previous prop in state" pattern (sync block in render)
  // so React 19's purity rule doesn't fire on setState-in-effect.
  const [openTracker, setOpenTracker] = useState(open);
  if (openTracker !== open) {
    setOpenTracker(open);
    if (!open) setDrillTo(null);
  }

  // Helper: pressing a NAV row with children drills in; without
  // children, it just navigates (handled by the <Link>).
  const handleRowTap = (item: NavItem) => {
    if (hasChildren(item)) setDrillTo(item);
  };

  // Memoised because NAV is a module-level constant — referentially
  // stable, but freezes the closure for the panel children.
  const rootPanel = useMemo(
    () => (
      <RootPanel
        scheme={scheme}
        isSignedIn={isSignedIn}
        profile={profile}
        cartCount={cartCount}
        onRowTap={handleRowTap}
        onClose={onClose}
      />
    ),
    [scheme, isSignedIn, profile, cartCount, onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: APPLE_EASE }}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={
            "fixed inset-x-0 top-11 sm:top-12 bottom-0 z-[55] md:hidden " +
            (onDark ? "bg-night text-paper" : "bg-paper text-ink")
          }
        >
          {/* Two-pane horizontal slider. The drilled panel slides
              in from the right; the root panel translates -X out.
              Both panels are absolutely positioned so they share
              the same scroll-independent viewport. */}
          <div className="relative h-full overflow-hidden">
            {/* Root panel */}
            <motion.div
              animate={{ x: drillTo ? "-100%" : "0%" }}
              transition={{ duration: 0.32, ease: APPLE_EASE }}
              className="absolute inset-0 overflow-y-auto"
            >
              {rootPanel}
            </motion.div>

            {/* Drilled-in panel — renders only when we have a
                target. Sliding from the right gives the user a
                clear "we went somewhere" cue. */}
            <AnimatePresence>
              {drillTo && (
                <motion.div
                  key={drillTo.label}
                  initial={{ x: "100%" }}
                  animate={{ x: "0%" }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.32, ease: APPLE_EASE }}
                  className="absolute inset-0 overflow-y-auto"
                >
                  <DrillPanel
                    item={drillTo}
                    scheme={scheme}
                    onBack={() => setDrillTo(null)}
                    onClose={onClose}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Root panel ────────────────────────────────────────────────────

function RootPanel({
  scheme,
  isSignedIn,
  profile,
  cartCount,
  onRowTap,
  onClose,
}: {
  scheme: "light" | "dark";
  isSignedIn: boolean;
  profile: AccountProfile | null;
  cartCount: number;
  onRowTap: (item: NavItem) => void;
  onClose: () => void;
}) {
  const onDark = scheme === "dark";
  const dividerCls = onDark ? "divide-white/10" : "divide-hairline";
  const mutedCls = onDark ? "text-paper/55" : "text-ink-mute";
  const nav = useNavMenu();
  const t = useTranslations("nav");

  return (
    <div className="px-6 pt-6 pb-24">
      <ul className={"divide-y " + dividerCls}>
        {nav.map((item) => (
          <li key={item.label}>
            {hasChildren(item) ? (
              <button
                type="button"
                onClick={() => onRowTap(item)}
                className="w-full flex items-center justify-between gap-3 py-4 text-left"
              >
                <span className="text-[22px] font-semibold tracking-[-0.012em]">
                  {item.label}
                </span>
                <Chevron direction="right" muted={onDark} />
              </button>
            ) : (
              <Link
                href={item.href ?? "#"}
                onClick={onClose}
                className="flex items-center justify-between gap-3 py-4"
              >
                <span className="text-[22px] font-semibold tracking-[-0.012em]">
                  {item.label}
                </span>
                <Chevron direction="right" muted={onDark} />
              </Link>
            )}
          </li>
        ))}
      </ul>

      {/* Quick links — account, cart, help. Smaller text + muted
          color so the primary nav stays the visual anchor. */}
      <section className="mt-8">
        <p
          className={
            "text-[11px] uppercase tracking-[0.16em] font-medium mb-3 " +
            mutedCls
          }
        >
          Quick links
        </p>
        <ul className={"divide-y " + dividerCls}>
          {/* Cart intentionally NOT surfaced here — the persistent
              MobileTabBar at the viewport bottom already carries a
              cart icon with the same badge. A second cart row in
              this quick-links list was redundant and made the
              drawer feel cluttered. */}
          {isSignedIn && profile ? (
            <>
              <QuickLink
                href="/account"
                label="My account"
                onClick={onClose}
                muted={onDark}
              >
                {getInitials(profile)}
              </QuickLink>
              <QuickLink
                href="/account/orders"
                label="Orders"
                onClick={onClose}
                muted={onDark}
              />
              <QuickLink
                href="/account/financing"
                label="Financing"
                onClick={onClose}
                muted={onDark}
              />
            </>
          ) : (
            <QuickLink
              href="/signin"
              label="Sign in"
              onClick={onClose}
              muted={onDark}
            />
          )}
          <QuickLink
            href="/support"
            label="Support"
            onClick={onClose}
            muted={onDark}
          />
        </ul>
      </section>

      {/* Persistent primary CTA at the bottom — most visitors land on
          the menu with a buying intent, so the trial entry is one tap
          away regardless of which screen they're on. */}
      <div className="mt-8">
        <Button
          href="/start-free-trial"
          variant={onDark ? "invert" : "primary"}
          size="md"
          className="w-full"
        >
          {t("startTrial")}
        </Button>
      </div>
    </div>
  );
}

// ─── Drill-in panel ────────────────────────────────────────────────

function DrillPanel({
  item,
  scheme,
  onBack,
  onClose,
}: {
  item: NavItem;
  scheme: "light" | "dark";
  onBack: () => void;
  onClose: () => void;
}) {
  const onDark = scheme === "dark";
  const mutedCls = onDark ? "text-paper/55" : "text-ink-mute";
  const subRowCls = onDark
    ? "text-paper hover:text-paper"
    : "text-ink hover:text-ink";

  return (
    <div className={(onDark ? "bg-night text-paper " : "bg-paper text-ink ") + "px-6 pt-3 pb-24"}>
      {/* Back row — chevron + parent label. Tapping anywhere here
          returns to the root level. */}
      <button
        type="button"
        onClick={onBack}
        className={
          "inline-flex items-center gap-1.5 py-2 mb-2 -ml-1.5 text-[13px] font-medium " +
          mutedCls
        }
        aria-label="Back"
      >
        <Chevron direction="left" muted={onDark} />
        <span>Menu</span>
      </button>

      <h2 className="text-[26px] font-semibold tracking-[-0.014em] leading-tight mb-5">
        {item.label}
      </h2>

      {/* If the item has a direct href, surface a top-of-list link
          to the section landing page — visitors who want the
          overview, not a sub-item. */}
      {item.href && (
        <Link
          href={item.href}
          onClick={onClose}
          className={
            "block text-[16px] font-medium py-3 border-b " +
            (onDark ? "border-white/10" : "border-hairline") +
            " " +
            subRowCls
          }
        >
          {`All of ${item.label}`}{" "}
          <span className={"text-[13px] font-normal " + mutedCls}>→</span>
        </Link>
      )}

      {/* Flat children — rendered before grouped children since
          they tend to be the "primary list" (Apple's main category
          rows) and grouped children are the "Quick links" / "Shop
          special stores" footer. */}
      {item.items && item.items.length > 0 && (
        <ul className="mt-2">
          {item.items.map((sub) => (
            <SubItemRow
              key={sub.href}
              sub={sub}
              onClose={onClose}
              onDark={onDark}
            />
          ))}
        </ul>
      )}

      {item.groups?.map((group: NavGroup) => (
        <section key={group.title} className="mt-7">
          <p
            className={
              "text-[11px] uppercase tracking-[0.16em] font-medium mb-2 " +
              mutedCls
            }
          >
            {group.title}
          </p>
          <ul>
            {group.items.map((sub) => (
              <SubItemRow
                key={sub.href}
                sub={sub}
                onClose={onClose}
                onDark={onDark}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SubItemRow({
  sub,
  onClose,
  onDark,
}: {
  sub: NavSubItem;
  onClose: () => void;
  onDark: boolean;
}) {
  return (
    <li>
      <Link
        href={sub.href}
        onClick={onClose}
        className={
          "block py-3 border-b " +
          (onDark ? "border-white/10" : "border-hairline")
        }
      >
        <span className="block text-[16px] font-medium tracking-[-0.005em]">
          {sub.label}
        </span>
        {sub.description && (
          <span
            className={
              "block text-[12.5px] mt-0.5 " +
              (onDark ? "text-paper/55" : "text-ink-mute")
            }
          >
            {sub.description}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── Quick-link primitive ──────────────────────────────────────────

function QuickLink({
  href,
  label,
  onClick,
  muted,
  children,
}: {
  href: string;
  label: string;
  onClick: () => void;
  muted: boolean;
  /** Optional right-aligned hint (badge, count, initials). */
  children?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center justify-between gap-3 py-3"
      >
        <span className="text-[16px] font-medium tracking-[-0.005em]">
          {label}
        </span>
        <span
          className={
            "inline-flex items-center gap-2 text-[12.5px] " +
            (muted ? "text-paper/55" : "text-ink-mute")
          }
        >
          {children}
          <Chevron direction="right" muted={muted} size="sm" />
        </span>
      </Link>
    </li>
  );
}

// ─── Chevron primitive ─────────────────────────────────────────────

function Chevron({
  direction,
  muted,
  size = "md",
}: {
  direction: "left" | "right";
  muted: boolean;
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? 8 : 10;
  const h = size === "sm" ? 12 : 14;
  const d =
    direction === "right"
      ? "M1 1l5 6-5 6"
      : "M6 1L1 7l5 6";
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 8 14"
      fill="none"
      aria-hidden
      className={muted ? "text-paper/45" : "text-ink-mute"}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function hasChildren(item: NavItem): boolean {
  return Boolean(
    (item.items && item.items.length > 0) ||
      (item.groups && item.groups.length > 0),
  );
}
