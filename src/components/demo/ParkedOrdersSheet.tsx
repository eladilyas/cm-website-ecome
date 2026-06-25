"use client";

// ParkedOrdersSheet — Phase 5D.
//
// Shows the queue of orders the cashier has held (via the "Hold"
// action on ActiveOrder). Each row: identifier + line count +
// elapsed time + Resume + Discard. Empty state when no orders are
// parked.
//
// Dark scheme — opens inside the POS workspace (the only dark-
// themed surface in the simulator).

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { useDemoStore } from "@/lib/demoStore";
import { Sheet } from "./Sheet";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ParkedOrdersSheet({ open, onClose }: Props) {
  const activity = useDemoStore((s) => s.activity);
  const allParked = useDemoStore((s) => s.parkedOrders);
  const activeOrder = useDemoStore((s) => s.order);
  const resumeOrder = useDemoStore((s) => s.resumeOrder);
  const discardParkedOrder = useDemoStore((s) => s.discardParkedOrder);
  const holdOrder = useDemoStore((s) => s.holdOrder);
  const t = useTranslations("demo.parked");
  const tType = useTranslations("demo.orderType");

  // Tick once a minute so "12 min ago" stays accurate without
  // re-rendering each tick. Hydration-safe init in effect.
  const [now, setNow] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const parked = useMemo(
    () =>
      activity ? allParked.filter((p) => p.activity === activity) : [],
    [activity, allParked],
  );

  const canResumeWithoutPark =
    !activeOrder || activeOrder.lines.length === 0;

  const handleResume = (parkedId: string) => {
    // If there's a live cart with lines, park it first to avoid
    // silently destroying work. The store's resumeOrder defends
    // against this too but the UX should be deliberate.
    if (!canResumeWithoutPark) {
      holdOrder("Auto-parked when resuming another order");
    }
    resumeOrder(parkedId);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("title")}
      subtitle={t("subtitle", { count: parked.length })}
      scheme="dark"
    >
      {parked.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[12.5px] text-paper/55 max-w-[26rem] mx-auto leading-snug">
            {t("emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto -mr-2 pr-2">
          {parked.map((p) => {
            const lineQty = p.order.lines.reduce(
              (s, l) => s + l.qty,
              0,
            );
            return (
              <li
                key={p.id}
                className="rounded-[10px] bg-white/[0.04] border border-white/10 p-3.5 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-paper truncate">
                    {p.order.identifier ?? orderTypeLabel(p.order.type, tType)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-paper/55 tabular-nums">
                    {t("items", { count: lineQty })} ·{" "}
                    {orderTypeLabel(p.order.type, tType)}
                    {p.reason ? ` · ${p.reason}` : ""}
                  </p>
                  <p className="mt-1 text-[10.5px] text-paper/45 tabular-nums">
                    {t("heldAgo", { duration: relTime(p.at, now || p.at, t) })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResume(p.id)}
                    className="h-8 px-3 rounded-full bg-paper text-ink text-[11.5px] font-semibold hover:bg-paper/85 transition-colors"
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.32, 0.72, 0, 1)",
                    }}
                  >
                    {t("resume")}
                  </button>
                  <button
                    type="button"
                    onClick={() => discardParkedOrder(p.id)}
                    aria-label={t("discard")}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-full text-paper/55 hover:text-red-300 hover:bg-white/[0.05] transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M3 3l6 6M9 3l-6 6"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

// ── helpers ───────────────────────────────────────────────────────

function orderTypeLabel(
  type: string,
  t: (key: string) => string,
): string {
  switch (type) {
    case "take-away":
      return t("takeAway");
    case "dine-in":
      return t("dineIn");
    case "glovo":
      return t("glovo");
    case "done":
      return t("done");
    default:
      return type;
  }
}

// Relative-time formatter. Uses ICU plurals from the catalog so
// "12 min" / "12 min" stays language-correct without ad-hoc " ago"
// concatenation.
function relTime(at: number, now: number, t: ReturnType<typeof useTranslations>): string {
  const min = Math.max(0, Math.floor((now - at) / 60_000));
  if (min < 1) return t.has("justNow") ? t("justNow") : `${min} min`;
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  return `${hr} h`;
}
