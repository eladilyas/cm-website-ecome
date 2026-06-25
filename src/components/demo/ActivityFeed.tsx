"use client";

// ActivityFeed — the "alive" surface on the Backoffice Overview.
//
// Reads the append-only `events` array from the demo store (filtered
// to the currently-selected activity) and renders the most recent
// rows newest-first. Each row carries an icon coded by event kind, a
// one-line label that snapshots the payload, and a relative-time
// caption.
//
// The feed is intentionally STATIC — no auto-refresh ticker, no
// pulsing dot, no auto-scroll. The premium product idiom is calm:
// data is current because Zustand re-renders on store changes, not
// because the component pretends to be live.
//
// All rendering is pure typography + tone — paper surface, hairline
// rows, kind-coded icon dots. No charts, no charts-of-charts.

import { useEffect, useMemo, useState } from "react";
import { useDemoStore } from "@/lib/demoStore";
import type { ActivityEvent } from "@/data/demo/types";

const MAX_VISIBLE = 12;

export function ActivityFeed() {
  const activity = useDemoStore((s) => s.activity);
  const allEvents = useDemoStore((s) => s.events);

  // Format-time anchors. Initialized to 0 (React 19's purity rule
  // forbids Date.now() during render) and seeded in the mount
  // effect, then refreshed once a minute so relative labels
  // ("2 min ago") stay accurate without re-rendering every tick.
  // While tick === 0 (pre-mount) all rows show "Just now" — the
  // brief moment before hydration completes.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTick(Date.now());
    const id = setInterval(() => setTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(
    () =>
      activity
        ? allEvents
            .filter((e) => e.activity === activity)
            .slice(0, MAX_VISIBLE)
        : [],
    [activity, allEvents],
  );

  return (
    <section className="rounded-[10px] border border-hairline bg-paper p-4 md:p-5">
      <header className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink">
          Recent activity
        </h3>
        <p className="text-[11px] text-ink-mute tabular-nums shrink-0">
          {visible.length === 0
            ? "No events yet"
            : `${visible.length} latest`}
        </p>
      </header>

      {visible.length === 0 ? (
        <p className="text-[12px] text-ink-mute py-3">
          Operational events land here as they happen — sales, kitchen
          fires, stock changes, refunds.
        </p>
      ) : (
        <ul className="divide-y divide-hairline -mx-4 mt-1">
          {visible.map((evt) => (
            <FeedRow key={evt.id} event={evt} now={tick} />
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Row ──────────────────────────────────────────────────────────────

function FeedRow({ event, now }: { event: ActivityEvent; now: number }) {
  // `now === 0` means the parent hasn't mounted yet — show a
  // neutral "Just now" stand-in until the hydration effect seeds
  // the real timestamp.
  const safeNow = now || event.at;
  const tone = toneFor(event.kind);
  return (
    <li className="px-4 py-2.5 flex items-start gap-3 hover:bg-fog/60 transition-colors">
      <span
        aria-hidden
        className={`mt-1 inline-flex items-center justify-center h-6 w-6 shrink-0 rounded-full ${tone.bg}`}
      >
        <KindIcon kind={event.kind} className={tone.text} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] text-ink leading-snug">
          <span className="font-medium">{labelFor(event)}</span>
          {detailFor(event) && (
            <span className="ml-1.5 text-ink-mute font-normal">
              {detailFor(event)}
            </span>
          )}
        </p>
      </div>
      <span className="text-[11px] text-ink-mute tabular-nums shrink-0 whitespace-nowrap">
        {relTime(event.at, safeNow)}
      </span>
    </li>
  );
}

// ── Label / detail synthesis ─────────────────────────────────────────
// Pattern-match the event kind to a one-line label + optional detail
// caption. Keeping format logic here (instead of writing pre-rendered
// strings to the store) means renaming or rephrasing later doesn't
// require a state migration.

function labelFor(e: ActivityEvent): string {
  const p = e.payload;
  switch (e.kind) {
    case "sale-completed":
      return `Sale completed${p.amount != null ? ` · ${fmtMAD(p.amount)} MAD` : ""}`;
    case "sale-voided":
      return "Sale voided";
    case "sale-refunded":
      return `Refund processed${p.amount != null ? ` · ${fmtMAD(p.amount)} MAD` : ""}`;
    case "kitchen-fired":
      return `Sent to kitchen${p.qty != null ? ` · ${p.qty} item${p.qty === 1 ? "" : "s"}` : ""}`;
    case "kitchen-stage-changed":
      return `Kitchen ticket ${p.stage ?? "advanced"}`;
    case "stock-adjusted": {
      const delta = p.qty ?? 0;
      const sign = delta > 0 ? "+" : "";
      return `Stock ${p.reason ?? "adjusted"} · ${sign}${delta}`;
    }
    case "stock-low":
      return `Low stock alert${p.qty != null ? ` · ${p.qty} left` : ""}`;
    case "product-added":
      return "Product added";
    case "supplier-added":
      return "Supplier added";
    case "customer-attached":
      return "Customer attached";
    case "appointment-scheduled":
      return "Appointment booked";
    default:
      return "Activity";
  }
}

function detailFor(e: ActivityEvent): string | null {
  const p = e.payload;
  const parts: string[] = [];
  if (p.productName) parts.push(p.productName);
  if (p.customerName) parts.push(p.customerName);
  if (p.staffName) parts.push(p.staffName);
  if (p.supplierName) parts.push(p.supplierName);
  if (e.kind === "sale-completed" && p.paymentMethod) {
    parts.push(p.paymentMethod);
  }
  if (e.kind === "kitchen-fired" && p.reason) parts.push(p.reason);
  return parts.length ? `· ${parts.join(" · ")}` : null;
}

// ── Per-kind tone + icon ─────────────────────────────────────────────

type Tone = { bg: string; text: string };

function toneFor(kind: ActivityEvent["kind"]): Tone {
  switch (kind) {
    case "sale-completed":
      return { bg: "bg-emerald-50", text: "text-emerald-600" };
    case "sale-voided":
      return { bg: "bg-red-50", text: "text-red-600" };
    case "sale-refunded":
      return { bg: "bg-amber-50", text: "text-amber-700" };
    case "kitchen-fired":
    case "kitchen-stage-changed":
      return { bg: "bg-amber-50", text: "text-amber-700" };
    case "stock-low":
      return { bg: "bg-red-50", text: "text-red-600" };
    case "stock-adjusted":
      return { bg: "bg-indigo-50", text: "text-indigo-600" };
    case "product-added":
    case "supplier-added":
      return { bg: "bg-indigo-50", text: "text-indigo-600" };
    case "customer-attached":
      return { bg: "bg-emerald-50", text: "text-emerald-600" };
    case "appointment-scheduled":
      return { bg: "bg-emerald-50", text: "text-emerald-600" };
    default:
      return { bg: "bg-fog", text: "text-ink-mute" };
  }
}

function KindIcon({
  kind,
  className,
}: {
  kind: ActivityEvent["kind"];
  className?: string;
}) {
  const base = "h-3 w-3";
  switch (kind) {
    case "sale-completed":
    case "customer-attached":
    case "appointment-scheduled":
      return (
        <svg viewBox="0 0 12 12" fill="none" className={`${base} ${className}`} aria-hidden>
          <path d="M2.5 6.3l2.3 2.3L9.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sale-voided":
      return (
        <svg viewBox="0 0 12 12" fill="none" className={`${base} ${className}`} aria-hidden>
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "sale-refunded":
      return (
        <svg viewBox="0 0 12 12" fill="none" className={`${base} ${className}`} aria-hidden>
          <path d="M2 6h6a2.5 2.5 0 1 1 0 5H5M2 6l2-2M2 6l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "kitchen-fired":
    case "kitchen-stage-changed":
      return (
        <svg viewBox="0 0 12 12" fill="none" className={`${base} ${className}`} aria-hidden>
          <path d="M2.5 9.5h7M3.5 9.5v-2a2.5 2.5 0 0 1 5 0v2M6 2v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "stock-low":
      return (
        <svg viewBox="0 0 12 12" fill="none" className={`${base} ${className}`} aria-hidden>
          <path d="M6 2l5 8.5H1L6 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6 5.5v2.2M6 9v0.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "stock-adjusted":
      return (
        <svg viewBox="0 0 12 12" fill="none" className={`${base} ${className}`} aria-hidden>
          <rect x="2.5" y="3" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 5.5h7" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "product-added":
    case "supplier-added":
      return (
        <svg viewBox="0 0 12 12" fill="none" className={`${base} ${className}`} aria-hidden>
          <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 12 12" fill="none" className={`${base} ${className}`} aria-hidden>
          <circle cx="6" cy="6" r="2" fill="currentColor" />
        </svg>
      );
  }
}

// ── Formatters ───────────────────────────────────────────────────────

function fmtMAD(n: number): string {
  // Match the existing formatPrice idiom: fr-FR locale, no decimals.
  return new Intl.NumberFormat("fr-FR", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Relative-time string: "Just now", "5 min ago", "2 h ago",
 *  "Yesterday", "Mar 14". Kept short so the row reads at a glance. */
function relTime(at: number, now: number): string {
  const diffMs = Math.max(0, now - at);
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} d ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(at));
}

