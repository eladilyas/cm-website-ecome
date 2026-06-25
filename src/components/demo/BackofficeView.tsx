"use client";

// Backoffice — the command center for managers.
//
// Phase 4: a single home for every analytical + management surface,
// reachable via a persistent left sidebar. Receipts and Dashboard
// used to be peer top-level tabs; they now live inside here as
// "Receipts" and "Overview" sections. This collapses the top nav
// from 6 → 4 tabs and gives the manager a Linear / Stripe / Notion
// style command center instead of disconnected modules.
//
// Light theme — paper surface, hairline borders, refined typography.
// The cashier POS surfaces (cart + payment + success) stay dark
// (focus mode); manager surfaces are light (analytical).

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useDemoStore } from "@/lib/demoStore";
import { capsFor } from "@/data/demo/activityCapabilities";
import { BackofficeOverview } from "./BackofficeOverview";
import { BackofficeProducts } from "./BackofficeProducts";
import { BackofficeInventory } from "./BackofficeInventory";
import { BackofficeSuppliers } from "./BackofficeSuppliers";
import { BackofficeBom } from "./BackofficeBom";
import { ReceiptsView } from "./ReceiptsView";

type BackofficeSection =
  | "overview"
  | "receipts"
  | "products"
  | "inventory"
  | "bom"
  | "suppliers";

type SectionDef = {
  id: BackofficeSection;
  /** Translation key under `demo.backoffice.sections`. Resolved at
   *  render so locale switches without remount.  */
  labelKey: BackofficeSection;
  icon: React.ReactNode;
  /** Optional capability gate — section hidden when this returns false. */
  gate?: (caps: ReturnType<typeof capsFor>) => boolean;
};

const SECTIONS: SectionDef[] = [
  { id: "overview", labelKey: "overview", icon: <OverviewIcon /> },
  { id: "receipts", labelKey: "receipts", icon: <ReceiptIcon /> },
  { id: "products", labelKey: "products", icon: <ProductsIcon /> },
  { id: "inventory", labelKey: "inventory", icon: <InventoryIcon /> },
  {
    id: "bom",
    labelKey: "bom",
    icon: <BomIcon />,
    // Visible only for activities that can plausibly carry recipes —
    // food kitchens (café, fast-food, restaurant, bakery). Pure retail
    // (market) and pure-service (beauty, barber) verticals hide it.
    gate: (caps) => caps?.hasRecipes === true,
  },
  { id: "suppliers", labelKey: "suppliers", icon: <SuppliersIcon /> },
];

export function BackofficeView() {
  const activity = useDemoStore((s) => s.activity);
  const [section, setSection] = useState<BackofficeSection>("overview");
  const tSec = useTranslations("demo.backoffice.sections");
  const tCap = useTranslations("demo.backoffice.captions");
  const tTitle = useTranslations("demo.backoffice.titles");
  const tBo = useTranslations("demo.backoffice");
  const tAct = useTranslations("demo.activities");

  if (!activity) return null;
  const activityName = tAct(activity);
  const caps = capsFor(activity);
  // Filter sections by capability gate. Keeps the sidebar honest for
  // each activity — e.g. BOM disappears on Market / Beauty / Barber
  // where finished-good recipes don't apply.
  const visibleSections = SECTIONS.filter(
    (s) => !s.gate || s.gate(caps),
  );
  // If the persisted section is no longer visible (operator switched
  // activity from one that supported BOM to one that doesn't, while
  // parked on BOM), snap back to Overview — the universal default.
  // Otherwise we'd render a blank pane.
  const resolvedSection = visibleSections.some((s) => s.id === section)
    ? section
    : "overview";
  if (resolvedSection !== section) {
    // Schedule the state update once — React will rerender with the
    // resolved section on next pass.
    queueMicrotask(() => setSection(resolvedSection));
  }
  const current =
    visibleSections.find((s) => s.id === resolvedSection) ?? visibleSections[0];

  return (
    <div className="h-full w-full bg-canvas text-ink flex overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        aria-label="Backoffice sections"
        className="shrink-0 w-[176px] md:w-[192px] bg-paper border-r border-hairline flex flex-col"
      >
        {/* Brand / activity badge — single condensed row, no eyebrow.
            The "BACK OFFICE" eyebrow was redundant with the active tab
            (Backoffice) already highlighted in the top nav. */}
        <div className="px-3.5 md:px-4 py-3 border-b border-hairline">
          <p className="text-[13px] font-semibold text-ink tracking-[-0.005em] truncate">
            {activityName}
          </p>
          {caps && (
            <p className="mt-0.5 text-[10.5px] text-ink-mute tabular-nums">
              {tBo("vat", {
                rate: (caps.taxRate * 100).toFixed(0),
                currency: caps.currency,
              })}
            </p>
          )}
        </div>

        {/* Section nav */}
        <nav role="tablist" className="flex-1 min-h-0 overflow-y-auto p-1.5">
          {visibleSections.map((s) => {
            const active = s.id === resolvedSection;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSection(s.id)}
                title={tCap(s.labelKey)}
                className={
                  "relative w-full flex items-center gap-2.5 px-2.5 h-8 mb-0.5 rounded-lg text-[12.5px] font-medium transition-colors " +
                  (active
                    ? "bg-fog text-ink"
                    : "text-ink-soft hover:text-ink hover:bg-fog/60")
                }
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#E11D2A]"
                  />
                )}
                <span
                  aria-hidden
                  className={active ? "text-ink" : "text-ink-mute"}
                >
                  {s.icon}
                </span>
                {tSec(s.labelKey)}
              </button>
            );
          })}
        </nav>

        {/* Footer hint */}
        <div className="px-3.5 py-2 border-t border-hairline text-[9.5px] uppercase tracking-[0.14em] text-ink-mute">
          {tBo("footer")}
        </div>
      </aside>

      {/* ── Section content ──────────────────────────────────── */}
      <section className="flex-1 min-h-0 flex flex-col overflow-hidden bg-canvas">
        <header className="shrink-0 px-5 md:px-7 py-2.5 border-b border-hairline bg-paper flex items-baseline gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.012em] text-ink shrink-0">
            {resolvedSection === "overview"
              ? tTitle("overviewAt", { activity: activityName })
              : tTitle(resolvedSection)}
          </h2>
          <span aria-hidden className="w-px h-3 bg-hairline" />
          <p className="text-[11.5px] text-ink-mute truncate">
            {tCap(current.labelKey)}
          </p>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          {resolvedSection === "overview" && <BackofficeOverview />}
          {resolvedSection === "receipts" && <ReceiptsView />}
          {resolvedSection === "products" && <BackofficeProducts />}
          {resolvedSection === "inventory" && <BackofficeInventory />}
          {resolvedSection === "bom" && <BackofficeBom />}
          {resolvedSection === "suppliers" && <BackofficeSuppliers />}
        </div>
      </section>
    </div>
  );
}


// ─── Icons ──────────────────────────────────────────────────────────

function OverviewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 11.5V8M5.5 11.5V5M9 11.5V7.5M12.5 11.5V3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.5 1.5h7v11l-1.75-.9-1.75.9-1.75-.9-1.75.9v-11Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M5 4.5h4M5 6.5h4M5 8.5h2.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 4.5l5-2.5 5 2.5v5l-5 2.5-5-2.5v-5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M2 4.5l5 2.5 5-2.5M7 7v5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1.5" y="2" width="11" height="3.5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="6" width="11" height="3.5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="10" width="11" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function BomIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1.5l4.5 2.5v5L7 11.5 2.5 9V4L7 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M7 1.5v10M2.5 4L7 6.5M11.5 4L7 6.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuppliersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M1 9.5V4h7v5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 6h3.5l1.5 2v1.5h-5V6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="3.75" cy="11" r="1.25" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10.25" cy="11" r="1.25" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
