"use client";

// POS workspace — the stage router for the interactive demo.
//
// Reads `stage` from the Zustand store and renders the appropriate screen.
//
// Two contracts:
//
//   • STANDALONE (default) — runs the full workflow including onboarding:
//       order-type   → OrderTypePicker     (A4)
//       identifier   → IdentifierPicker    (A5 / A6)
//       workspace    → split: ProductBrowser + ActiveOrder   (B1..B5)
//       payment      → PaymentSheet (overlay)                (B6)
//       success      → PaymentSuccess (overlay)              (B7)
//
//   • EMBEDDED (embedded=true) — zero-friction. Onboarding screens are
//     suppressed entirely; the workspace is the ONLY view the user sees.
//     If the persisted store state is stale (legacy stage="order-type"
//     from a session before all activities got skipOrderTypePicker), the
//     workspace re-primes the activity on mount so the user lands inside
//     the POS with a fresh take-away order and no manual setup. Payment
//     overlays still render (they're product behavior, not onboarding).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  useDemoStore,
  activityHasKitchen,
  activityHasCalendar,
} from "@/lib/demoStore";
import { POSChrome } from "./POSChrome";
import { OrderTypePicker } from "./OrderTypePicker";
import { IdentifierPicker } from "./IdentifierPicker";
import { ProductBrowser } from "./ProductBrowser";
import { ActiveOrder } from "./ActiveOrder";
import { PaymentSheet } from "./PaymentSheet";
import { PaymentSuccess } from "./PaymentSuccess";
import { KitchenView } from "./KitchenView";
import { CalendarView } from "./CalendarView";
import { BackofficeView } from "./BackofficeView";
import { ParkedOrdersSheet } from "./ParkedOrdersSheet";

// Phase 4 — top-level nav reduced to 4 tabs. Receipts + Dashboard
// moved inside the Backoffice as sidebar sub-sections. Each tab is
// either the cashier surface (POS) or a workspace the cashier /
// manager opens deliberately.
type WorkspaceView = "pos" | "kitchen" | "calendar" | "backoffice";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type POSWorkspaceProps = {
  /** When true, hide the internal POSChrome (use this when an outer modal /
   *  container provides its own chrome) AND skip the no-activity redirect.
   *  Embedded mode is also strictly zero-friction — onboarding screens
   *  are never rendered. When false (default), the workspace is
   *  standalone and runs the full workflow including onboarding. */
  embedded?: boolean;
};

export function POSWorkspace({ embedded = false }: POSWorkspaceProps = {}) {
  const tTabs = useTranslations("demo.tabs");
  const activity = useDemoStore((s) => s.activity);
  const stage = useDemoStore((s) => s.stage);
  const order = useDemoStore((s) => s.order);
  const selectActivity = useDemoStore((s) => s.selectActivity);
  const router = useRouter();

  // Defer rendering until the Zustand persist middleware has hydrated from
  // localStorage — otherwise the first paint can flash an "empty" workspace
  // before the persisted activity arrives.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Standalone-mode-only: redirect to the activity picker when the user
  // lands here without one selected. In embedded mode the parent modal
  // controls activity selection via tabs.
  useEffect(() => {
    if (!embedded && mounted && !activity) router.push("/demo");
  }, [embedded, mounted, activity, router]);

  // Top-level view switcher inside the embedded simulator chrome —
  // POS (default), Kitchen (gated by activity), Dashboard. Local state
  // so it survives stage changes (e.g. user can be on Dashboard, ring
  // an order via POS, see kitchen tickets appear without losing their
  // dashboard scroll position).
  const [view, setView] = useState<WorkspaceView>("pos");
  const [parkedOpen, setParkedOpen] = useState(false);
  const parkedCount = useDemoStore((s) =>
    s.parkedOrders.filter((p) => p.activity === activity).length,
  );
  const hasKitchen = activityHasKitchen(activity);
  const hasCalendar = activityHasCalendar(activity);

  // View route guard.
  //
  // `view` is local state, but the set of valid views is derived from
  // the currently-selected activity's capabilities. When the operator
  // switches activity (e.g. from Café → Barber) while parked on a view
  // that the new activity doesn't support (Kitchen has no meaning at a
  // barber), the render branch below would short-circuit to `null` and
  // we'd ship a blank pane until the operator manually picked a tab.
  //
  // Fall back to POS — the universal default — whenever the current
  // view is no longer valid. POS is always available (every activity
  // has products to ring) so this is a safe terminal state.
  useEffect(() => {
    if (view === "kitchen" && !hasKitchen) setView("pos");
    else if (view === "calendar" && !hasCalendar) setView("pos");
  }, [view, hasKitchen, hasCalendar]);

  // EMBEDDED zero-friction guard: re-prime the activity ONLY when the
  // user is stuck on an onboarding screen, or when the workspace stage
  // is set but no order exists.
  //
  // Critical: do NOT trigger this on stage="payment" or stage="success".
  // completePayment intentionally sets order=null on success (the order
  // is now a frozen receipt in `lastReceipt`). If we re-primed on
  // !order, the success screen would be instantly clobbered and the
  // user would be bounced back into a fresh workspace — which is the
  // bug this branch guard fixes.
  useEffect(() => {
    if (!embedded || !mounted || !activity) return;
    const needsReset =
      stage === "order-type" ||
      stage === "identifier" ||
      (stage === "workspace" && !order);
    if (needsReset) selectActivity(activity);
  }, [embedded, mounted, activity, stage, order, selectActivity]);

  if (!mounted) return null;
  if (!activity) {
    // Embedded mode: parent provides activity via tabs; render nothing if
    // somehow we get here without one selected.
    return null;
  }

  // Reusable POS grid — extracted so both embedded and standalone
  // workspace branches can render it without duplicating the JSX.
  const posGrid = (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px]">
      <div className="min-h-0 overflow-hidden">
        <ProductBrowser />
      </div>
      <div className="min-h-0 overflow-hidden hidden md:block">
        <ActiveOrder />
      </div>
      {/* Mobile cart drawer fallback */}
      <div className="md:hidden border-t border-white/8">
        <ActiveOrder />
      </div>
    </div>
  );

  return (
    <div
      className={
        embedded
          ? "w-full h-full flex flex-col"
          : "min-h-svh flex flex-col"
      }
    >
      {!embedded && <POSChrome />}

      {/* Workspace tab bar — POS / Kitchen / Calendar / Backoffice.
          Rendered in BOTH embedded mode (inside POSSimulatorModal /
          home preview) AND standalone mode (the /demo/order route)
          so the cashier can switch surfaces regardless of how they
          entered the simulator. Tabs are capability-gated per
          activity: Kitchen hidden for non-kitchen verticals (bakery,
          market, beauty, barber); Calendar hidden for verticals
          without bookings (everything except beauty + barber).

          The "Parked orders" affordance only appears in embedded
          mode — the standalone POSChrome already surfaces it in
          its header, so duplicating it here would double-render. */}
      <nav
        aria-label="Workspace"
        className="shrink-0 flex items-center gap-1 px-3 md:px-4 h-11 border-b border-white/[0.08] bg-night/95"
      >
        <ViewTabButton
          active={view === "pos"}
          onClick={() => setView("pos")}
          icon={<PosIcon />}
          label={tTabs("pos")}
        />
        {hasKitchen && (
          <ViewTabButton
            active={view === "kitchen"}
            onClick={() => setView("kitchen")}
            icon={<KitchenIcon />}
            label={tTabs("kitchen")}
          />
        )}
        {hasCalendar && (
          <ViewTabButton
            active={view === "calendar"}
            onClick={() => setView("calendar")}
            icon={<CalendarIcon />}
            label={tTabs("calendar")}
          />
        )}
        <ViewTabButton
          active={view === "backoffice"}
          onClick={() => setView("backoffice")}
          icon={<BackofficeIcon />}
          label={tTabs("backoffice")}
        />
        {embedded && view === "pos" && (
          <button
            type="button"
            onClick={() => setParkedOpen(true)}
            aria-label={
              parkedCount > 0
                ? tTabs("parkedAria", { count: parkedCount })
                : tTabs("parkedAriaEmpty")
            }
            className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-paper/85 text-[11.5px] font-medium transition-colors"
          >
            <ParkedIcon />
            <span>{tTabs("parked")}</span>
            {parkedCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#E11D2A] text-paper text-[10.5px] font-semibold tabular-nums">
                {parkedCount}
              </span>
            )}
          </button>
        )}
      </nav>

      <main className="relative flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {/* Onboarding screens — STANDALONE ONLY. In embedded mode the
              zero-friction guard above re-primes the activity, so these
              branches never fire. */}
          {!embedded && stage === "order-type" && (
            <motion.div
              key="order-type"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: APPLE_EASE }}
              className="h-full overflow-y-auto"
            >
              <OrderTypePicker />
            </motion.div>
          )}

          {!embedded && stage === "identifier" && (
            <motion.div
              key="identifier"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: APPLE_EASE }}
              className="h-full overflow-y-auto"
            >
              <IdentifierPicker />
            </motion.div>
          )}

          {/* EMBEDDED: render whatever view the user picked.  */}
          {embedded && (
            <motion.div
              key={`view-${view}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: APPLE_EASE }}
              className="absolute inset-0"
            >
              {view === "pos" && posGrid}
              {view === "kitchen" && hasKitchen && <KitchenView />}
              {view === "calendar" && hasCalendar && <CalendarView />}
              {view === "backoffice" && <BackofficeView />}

              {/* Payment overlays render over the active view — they
                  belong to the order flow, not to any one view. */}
              <AnimatePresence>
                {stage === "payment" && <PaymentSheet />}
                {stage === "success" && <PaymentSuccess />}
              </AnimatePresence>

              <ParkedOrdersSheet
                open={parkedOpen}
                onClose={() => setParkedOpen(false)}
              />
            </motion.div>
          )}

          {/* STANDALONE: workspace branch — now view-aware so the
              shared top tab strip can route to POS / Kitchen /
              Calendar / Backoffice the same way the embedded modal
              does. `key={view}` flips the AnimatePresence motion
              for a crisp swap when the operator changes tabs. */}
          {!embedded &&
            (stage === "workspace" ||
              stage === "payment" ||
              stage === "success") && (
            <motion.div
              key={`workspace-${view}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: APPLE_EASE }}
              className="absolute inset-0"
            >
              {view === "pos" && posGrid}
              {view === "kitchen" && hasKitchen && <KitchenView />}
              {view === "calendar" && hasCalendar && <CalendarView />}
              {view === "backoffice" && <BackofficeView />}

              {/* Payment overlays only make sense when the cashier is
                  on the POS view ringing an order — never over the
                  Kitchen / Calendar / Backoffice panes. */}
              <AnimatePresence>
                {view === "pos" && stage === "payment" && <PaymentSheet />}
                {view === "pos" && stage === "success" && <PaymentSuccess />}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── View tab button ────────────────────────────────────────────────

function ViewTabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-colors duration-150 " +
        (active
          ? "bg-white/[0.08] text-paper"
          : "text-paper/60 hover:text-paper hover:bg-white/[0.05]")
      }
      style={{
        transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <span aria-hidden className="text-paper/85">
        {icon}
      </span>
      {label}
    </button>
  );
}

function PosIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1.5" y="2" width="11" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 12h5M7 10v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function KitchenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 6a4 4 0 0 1 8 0v5H3V6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 7.5h4M5 9h2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="11" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 1.5v2M9.5 1.5v2M1.5 6h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function BackofficeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="3" width="10" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 3V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V3M4.5 6.5h5M4.5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function ParkedIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 2h6.5l2.5 2.5V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 6.5h4M5 9h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
