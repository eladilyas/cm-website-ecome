"use client";

// Top header for the POS workspace.
//
// Shows the active activity name + a small "ago" timestamp + Reset.
// Minimal — the POS is a focused workspace, not a marketing surface.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDemoStore } from "@/lib/demoStore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BrandLogoMark } from "@/components/ui/BrandLogoMark";
import { ParkedOrdersSheet } from "./ParkedOrdersSheet";

export function POSChrome() {
  const activity = useDemoStore((s) => s.activity);
  const reset = useDemoStore((s) => s.reset);
  const stage = useDemoStore((s) => s.stage);
  const router = useRouter();

  // Phase P — passive cashier identity. seedActivityData auto-
  // assigns the first staff member as the cashier on first
  // activity selection, so this chip is always populated by the
  // time the workspace renders. Surfacing it here (header, right
  // side) matches the original Caisse Manager POS pattern — the
  // cashier is identified passively, not via a selection step.
  const cashier = useDemoStore((s) => {
    if (!activity) return null;
    const id = s.currentStaffId[activity];
    if (!id) return null;
    return s.staff[activity]?.find((m) => m.id === id) ?? null;
  });

  // Phase P — Orders on Hold is a first-class POS control.
  // Surfacing it in the header (next to cashier identity) makes
  // the parked queue always discoverable, regardless of cart
  // state. The badge count communicates "you have stuff to come
  // back to" without the cashier needing to remember.
  const parkedCount = useDemoStore((s) =>
    activity
      ? s.parkedOrders.filter((p) => p.activity === activity).length
      : 0,
  );
  const [parkedOpen, setParkedOpen] = useState(false);

  // Live kitchen ticket count — surfaced in the header so the
  // cashier always knows what's still cooking without opening
  // the Kitchen tab. Counts active (non-voided) tickets for the
  // current activity only.
  const kitchenActive = useDemoStore((s) =>
    activity
      ? s.kitchenTickets.filter(
          (t) => t.activity === activity && !t.voided,
        ).length
      : 0,
  );

  // SSR-safe clock: render placeholder on the server (avoids hydration
  // mismatch), then start ticking on mount. Setting initial state on mount
  // is the well-known SSR-safe client-only render pattern; new React Hooks
  // lint flags it as a "smell" but no cleaner alternative exists without
  // server components.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const [resetOpen, setResetOpen] = useState(false);

  const tActivities = useTranslations("demo.activities");
  const tChrome = useTranslations("demo.posChrome");

  if (!activity) return null;
  const activityName = tActivities(activity);

  return (
    <header className="relative z-30 border-b border-white/8 bg-night/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <CheckLogo />
          <div className="hidden md:flex items-baseline gap-3 min-w-0">
            <span className="text-[13px] font-medium text-paper truncate">
              Caisse Manager
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-paper/45 truncate">
              {activityName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <span className="hidden sm:inline text-[11px] text-paper/45 tabular-nums">
            {now
              ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "—"}
          </span>
          <StageDots stage={stage} />
          {kitchenActive > 0 && <KitchenStatusPill count={kitchenActive} />}
          <ParkedHeaderButton
            count={parkedCount}
            onClick={() => setParkedOpen(true)}
          />
          {cashier && <CashierChip name={cashier.name} initials={cashier.initials} />}
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="text-[11px] font-medium text-paper/55 hover:text-paper transition-colors"
          >
            {tChrome("exit")}
          </button>
        </div>
      </div>

      <ParkedOrdersSheet
        open={parkedOpen}
        onClose={() => setParkedOpen(false)}
      />

      <ConfirmDialog
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          reset();
          router.push("/demo");
        }}
        title={tChrome("exitConfirmTitle")}
        body={tChrome("exitConfirmBody")}
        confirmLabel={tChrome("exitConfirmLabel")}
        cancelLabel={tChrome("cancel")}
        tone="destructive"
        scheme="dark"
      />
    </header>
  );
}

function CheckLogo() {
  return <BrandLogoMark size={22} />;
}

// Kitchen status pill — passive header indicator showing how many
// tickets are currently active in the KDS. Auto-hides at zero so
// it never visually competes with the cashier identity / parked
// queue when there's nothing cooking.
function KitchenStatusPill({ count }: { count: number }) {
  return (
    <span
      className="hidden md:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-amber-400/12 text-amber-200 text-[11.5px] font-medium border border-amber-300/30"
      role="status"
      aria-label={`Kitchen · ${count} ticket${count === 1 ? "" : "s"} active`}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300"
        style={{ boxShadow: "0 0 6px rgba(252,211,77,0.6)" }}
      />
      {count} in kitchen
    </span>
  );
}

// Parked-orders entry point. Always visible in the POS header so
// the cashier can review + resume held orders without hunting for
// a button in the cart panel. Badge surfaces the count.
function ParkedHeaderButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  const hasParked = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        hasParked
          ? `Orders on hold · ${count} held`
          : "Orders on hold"
      }
      className={
        "relative inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[11.5px] font-medium transition-colors " +
        (hasParked
          ? "bg-amber-400/12 text-amber-200 border border-amber-300/30 hover:bg-amber-400/20"
          : "text-paper/55 hover:text-paper hover:bg-white/[0.06] border border-transparent")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
      >
        <rect
          x="1.5"
          y="1.5"
          width="9"
          height="9"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path
          d="M5 4.2v3.6M7 4.2v3.6"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
      <span className="hidden md:inline">
        {hasParked ? `${count} on hold` : "Orders on hold"}
      </span>
    </button>
  );
}

// Cashier identity chip — passive header surface. Avatar + name +
// "Cashier" eyebrow. Reads as "you're signed in as" rather than as
// an interactive control. Matches the original Caisse Manager POS
// header (cashier identity in the top-right, never asked for).
function CashierChip({ name, initials }: { name: string; initials: string }) {
  return (
    <span
      className="hidden md:inline-flex items-center gap-2 pr-1 pl-1 h-8 rounded-full text-left"
      title={`On till: ${name}`}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/[0.08] text-paper text-[10.5px] font-semibold tracking-wide"
      >
        {initials}
      </span>
      <span className="flex flex-col leading-tight pr-1">
        <span className="text-[12px] font-medium text-paper">{name}</span>
        <span className="text-[9px] uppercase tracking-[0.14em] text-paper/45 leading-tight">
          Cashier
        </span>
      </span>
    </span>
  );
}

// Stage dots — Apple-style 3-step progress (Cart → Payment →
// Done) shown only during the active checkout transition. The
// onboarding stages (order-type / identifier) were collapsed out
// of the dots because the embedded flow auto-skips them — leaving
// them in created a misleading "you're 60% through" hint when the
// user was actually at the start.
function StageDots({ stage }: { stage: string }) {
  // Only render when the user is actively past the cart, otherwise
  // the dots are noise on the cold workspace.
  if (stage === "workspace" || stage === "order-type" || stage === "identifier") {
    return null;
  }
  const order = ["payment", "success"];
  const i = order.indexOf(stage);
  return (
    <div className="hidden md:flex items-center gap-1.5">
      {/* Cart (always done by this point) */}
      <span
        className="h-1.5 w-1.5 rounded-full bg-emerald-400/85"
        aria-hidden
      />
      {order.map((s, idx) => (
        <span
          key={s}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: idx === i ? 14 : 6,
            backgroundColor:
              idx < i
                ? "rgba(52,211,153,0.85)"
                : idx === i
                  ? "rgba(225,29,42,0.85)"
                  : "rgba(255,255,255,0.18)",
            transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        />
      ))}
    </div>
  );
}
