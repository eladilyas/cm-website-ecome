"use client";

// Kitchen Display — five-stage Kanban workflow (Phase α).
//
// Five columns model the real lifecycle of an order from the kitchen's
// perspective: New → Accepted → Preparing → Ready → Delivered. Each card
// advances explicitly via the "Advance" button; the per-stage column also
// surfaces stage-specific affordances (Accept, Start, Mark ready,
// Mark delivered, Clear). Urgent tickets sit pinned to the top of their
// stage and carry a brand-red ribbon; time-in-stage flips amber after
// 10 minutes and red after 20.
//
// Premium light theme: white cards on canvas, hairline dividers, tabular
// numbers throughout, motion via framer-motion AnimatePresence so cards
// glide between columns rather than pop.
//
// Tickets are session-only (refresh wipes — matches a real KDS); the
// activity feed in the Backoffice carries the persisted breadcrumb of
// every stage transition.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  useDemoStore,
  TICKET_STAGES,
  type KitchenTicket,
  type TicketStage,
} from "@/lib/demoStore";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Stage presentation ──────────────────────────────────────────────────
// Tint, label, and the verb shown on the Advance button when a card is
// currently in this stage. The verb describes what advancing does next
// ("Accept" on New → moves to Accepted; "Done" on Ready → marks
// Delivered). Delivered is terminal — the verb is "Clear" to dismiss.

type StageMeta = {
  /** Tailwind colour tokens for the column accent + card badge. */
  dot: string;
  pillBg: string;
  pillText: string;
  pillRing: string;
};

// Stage labels + advance verbs are now resolved at render via the
// `demo.kitchen.stage` / `demo.kitchen.advance` catalogs. Visual
// tokens (colour, ring) stay here because they're not translatable.
const STAGE: Record<TicketStage, StageMeta> = {
  new: {
    dot: "bg-slate-400",
    pillBg: "bg-slate-50",
    pillText: "text-slate-700",
    pillRing: "ring-slate-200",
  },
  accepted: {
    dot: "bg-indigo-400",
    pillBg: "bg-indigo-50",
    pillText: "text-indigo-700",
    pillRing: "ring-indigo-200",
  },
  preparing: {
    dot: "bg-amber-400",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
    pillRing: "ring-amber-200",
  },
  ready: {
    dot: "bg-emerald-500",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
    pillRing: "ring-emerald-200",
  },
  delivered: {
    dot: "bg-ink-mute/50",
    pillBg: "bg-fog",
    pillText: "text-ink-mute",
    pillRing: "ring-hairline",
  },
};

// ── Ordering rules — urgent first, then most-recent stage entry ─────────
function ticketOrder(a: KitchenTicket, b: KitchenTicket): number {
  const ua = a.urgent ? 1 : 0;
  const ub = b.urgent ? 1 : 0;
  if (ua !== ub) return ub - ua; // urgent before non-urgent
  return b.stageChangedAt - a.stageChangedAt; // most recently moved first
}

export function KitchenView() {
  const activity = useDemoStore((s) => s.activity);
  const tickets = useDemoStore((s) => s.kitchenTickets);
  const advanceTicket = useDemoStore((s) => s.advanceTicket);
  const clearTicket = useDemoStore((s) => s.clearTicket);
  const tK = useTranslations("demo.kitchen");
  const tKv = useTranslations("demo.kitchenView");

  // 1-second tick so the time-in-stage badges update live. The current
  // wall-clock is captured per tick and passed down to TimeBadge so the
  // children stay pure (the impurity lives here at the controller).
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const open = tickets.filter((t) => t.activity === activity);
  const totalItems = open.reduce(
    (s, t) => s + t.items.reduce((n, i) => n + i.qty, 0),
    0,
  );
  const urgentCount = open.filter((t) => t.urgent && !t.voided).length;

  // Group tickets by stage. Each column gets its own array, urgent-first.
  const grouped = TICKET_STAGES.reduce(
    (acc, s) => {
      acc[s] = [];
      return acc;
    },
    {} as Record<TicketStage, KitchenTicket[]>,
  );
  for (const t of open) grouped[t.stage].push(t);
  for (const s of TICKET_STAGES) grouped[s].sort(ticketOrder);

  return (
    <div className="h-full w-full flex flex-col bg-canvas text-ink">
      {/* Header — counts + urgent badge */}
      <header className="shrink-0 bg-paper/95 backdrop-blur-md border-b border-hairline px-6 md:px-8 py-3.5 flex items-baseline justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.005em]">
            {tKv("title")}
          </h2>
          <p className="mt-0.5 text-[11.5px] text-ink-mute tabular-nums">
            {open.length === 0
              ? tK("emptyAll")
              : `${open.length} ${tK("ticketLabel")}${open.length === 1 ? "" : "s"} · ${tK("items", { count: totalItems })}`}
          </p>
        </div>
        {urgentCount > 0 && (
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#E11D2A]/10 text-[#E11D2A] ring-1 ring-[#E11D2A]/20 text-[11px] font-medium tracking-[0.04em]">
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-[#E11D2A]" />
            {tKv("urgentBadge", { count: urgentCount })}
          </span>
        )}
      </header>

      {/* Kanban board — five columns ALWAYS visible, even when zero
          tickets exist. Empty columns render a dashed placeholder so
          the kitchen reads as a complete production system the moment
          the cashier opens it, before the first order fires. */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className="h-full grid gap-2 px-3 md:px-4 py-3 md:py-4"
          style={{
            gridTemplateColumns: `repeat(5, minmax(0, 1fr))`,
          }}
        >
          {TICKET_STAGES.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              tickets={grouped[stage]}
              nowMs={nowMs}
              onAdvance={advanceTicket}
              onClear={clearTicket}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stage column ────────────────────────────────────────────────────────

function StageColumn({
  stage,
  tickets,
  nowMs,
  onAdvance,
  onClear,
}: {
  stage: TicketStage;
  tickets: KitchenTicket[];
  nowMs: number;
  onAdvance: (id: string) => void;
  onClear: (id: string) => void;
}) {
  const meta = STAGE[stage];
  const tK = useTranslations("demo.kitchen");
  const stageLabel = tK(`stage.${stage}`);
  const advanceVerb = tK(`advance.${stage}`);
  const count = tickets.length;
  const items = tickets.reduce(
    (n, t) => n + t.items.reduce((s, i) => s + i.qty, 0),
    0,
  );

  return (
    <section className="flex flex-col h-full min-h-0 min-w-0">
      {/* Column header — stage name + ticket count. Item-count secondary
          on widths that can spare it. Single ellipsis on overflow so
          a narrow column never breaks the header layout. */}
      <header className="shrink-0 flex items-center justify-between gap-1.5 px-2 pb-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            aria-hidden
            className={`shrink-0 w-1.5 h-1.5 rounded-full ${meta.dot}`}
          />
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-soft truncate">
            {stageLabel}
          </p>
          <span className="shrink-0 text-[10px] tabular-nums text-ink-mute">
            {count}
          </span>
        </div>
        {count > 0 && items > 0 && (
          <p className="hidden lg:block shrink-0 text-[9.5px] tabular-nums text-ink-mute">
            {items}
          </p>
        )}
      </header>

      {/* Tickets list — every empty column renders the SAME dash card
          so all 5 columns share an identical height. The "tickets land
          here" hint was previously embedded in the New column only,
          which (a) didn't translate, (b) made the first column ~30px
          taller than the others. The board-level header already says
          "No tickets · the line is clean", so the inline hint was
          redundant. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-2 min-w-0">
        {count === 0 ? (
          <div className="rounded-[8px] border border-dashed border-hairline px-2 py-4 text-center">
            <p className="text-[11px] text-ink-mute">—</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {tickets.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.24, ease: APPLE_EASE }}
                >
                  <TicketCard
                    ticket={t}
                    nowMs={nowMs}
                    onAdvance={() => onAdvance(t.id)}
                    onClear={() => onClear(t.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Ticket card ─────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  nowMs,
  onAdvance,
  onClear,
}: {
  ticket: KitchenTicket;
  nowMs: number;
  onAdvance: () => void;
  onClear: () => void;
}) {
  const meta = STAGE[ticket.stage];
  const tK = useTranslations("demo.kitchen");
  const advanceVerb = tK(`advance.${ticket.stage}`);
  const voided = ticket.voided === true;
  const isTerminal = ticket.stage === "delivered";
  const isUrgent = Boolean(ticket.urgent);

  return (
    <article
      className={
        "relative rounded-[10px] bg-paper border overflow-hidden " +
        (isUrgent && !voided
          ? "border-[#E11D2A]/30 shadow-[0_8px_24px_-12px_rgba(225,29,42,0.25),0_1px_2px_rgba(0,0,0,0.03)]"
          : "border-hairline shadow-[0_1px_2px_rgba(0,0,0,0.03)]") +
        (voided ? " opacity-55" : "")
      }
    >
      {/* Urgent ribbon — single architectural mark for high priority. */}
      {isUrgent && !voided && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px] bg-[#E11D2A]"
        />
      )}

      {voided && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
        >
          <span
            className="text-[14px] font-bold tracking-[0.32em] text-red-600/40 border-2 border-red-500/30 rounded-md px-3 py-0.5 bg-paper/60"
            style={{ transform: "rotate(-12deg)" }}
          >
            {tK("voided")}
          </span>
        </div>
      )}

      <header className="px-2.5 pt-2 pb-2 flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            {isUrgent && !voided && (
              <span
                className="inline-flex items-center h-[14px] px-1 rounded-[3px] bg-[#E11D2A] text-white text-[8.5px] font-semibold uppercase tracking-[0.10em]"
                aria-label="Urgent order"
              >
                Urgent
              </span>
            )}
            <p className="text-[12px] font-semibold text-ink truncate min-w-0">
              {ticket.table}
            </p>
            {ticket.orderType && (
              <span className="inline-flex items-center h-[14px] px-1 rounded-[3px] bg-fog text-ink-soft text-[8.5px] font-medium uppercase tracking-[0.10em]">
                {orderTypeShortLabel(ticket.orderType)}
              </span>
            )}
          </div>
          <TimeBadge ticket={ticket} nowMs={nowMs} />
        </div>
      </header>

      {/* Order-level note — surfaces above the items as an amber strip so
          the line cook sees the order-wide context (VIP, allergy,
          deliver-asap) BEFORE scanning individual items. */}
      {ticket.orderComment && !voided && (
        <div className="mx-2.5 mb-1.5 px-2 py-1 rounded-[4px] bg-amber-50 border border-amber-200">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-amber-700">
            Order note
          </p>
          <p className="mt-0.5 text-[10.5px] text-amber-900 leading-snug">
            {ticket.orderComment}
          </p>
        </div>
      )}

      {/* Items list — urgent items pinned to the top so the line cook
          sees them at the top of the ticket without parsing every row.
          Each urgent item carries an inline ⚡ glyph + brand-red text
          tint so it reads as priority within the ticket. Per-item
          comments render as an amber sub-line beneath the item name. */}
      <ul className="px-2.5 pb-2 space-y-1">
        {[...ticket.items]
          .map((it, i) => ({ ...it, _i: i }))
          .sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))
          .map((it) => (
            <li key={it._i} className="leading-[1.3]">
              <div
                className={
                  "flex items-baseline gap-1.5 text-[11.5px] " +
                  (it.urgent ? "text-[#E11D2A] font-medium" : "text-ink")
                }
              >
                <span
                  className={
                    "tabular-nums shrink-0 w-4 font-medium " +
                    (it.urgent ? "text-[#E11D2A]" : "text-ink-mute")
                  }
                >
                  {it.qty}×
                </span>
                {it.urgent && (
                  <span
                    aria-hidden
                    className="shrink-0 inline-flex items-center justify-center text-[#E11D2A]"
                    title="Urgent — fire first"
                  >
                    <UrgentBoltGlyph />
                  </span>
                )}
                <span className="truncate min-w-0">{it.name}</span>
              </div>
              {it.comment && (
                <p className="ml-5 text-[9.5px] text-amber-700 leading-snug truncate">
                  ★ {it.comment}
                </p>
              )}
            </li>
          ))}
      </ul>

      <footer className="px-2 pb-2 grid grid-cols-[auto_1fr] gap-1 relative z-[3]">
        <button
          type="button"
          onClick={onClear}
          aria-label="Dismiss ticket"
          className="h-7 w-7 rounded-[6px] border border-hairline text-ink-mute hover:text-ink hover:bg-fog flex items-center justify-center transition-colors"
        >
          <CloseIcon />
        </button>
        {voided ? (
          <button
            type="button"
            onClick={onClear}
            className="h-7 px-2 text-[11px] font-medium rounded-[6px] border border-hairline-strong text-ink hover:bg-fog transition-colors inline-flex items-center justify-center truncate"
          >
            Dismiss
          </button>
        ) : (
          <button
            type="button"
            onClick={isTerminal ? onClear : onAdvance}
            className={
              "h-7 px-2 text-[11px] font-medium rounded-[6px] transition-colors inline-flex items-center justify-center gap-1 truncate " +
              (isTerminal
                ? "border border-hairline-strong text-ink hover:bg-fog"
                : "bg-ink text-paper hover:bg-ink-soft")
            }
          >
            <span className="truncate">{advanceVerb}</span>
            {!isTerminal && <ArrowRight />}
          </button>
        )}
      </footer>
    </article>
  );
}

// ── Time-in-stage badge ─────────────────────────────────────────────────
// Surfaces how long a ticket has been in its current stage. Flips amber
// after 10 minutes, red after 20 — so the kitchen can spot a ticket
// that's stuck without scanning numbers.

function TimeBadge({ ticket, nowMs }: { ticket: KitchenTicket; nowMs: number }) {
  const secs = Math.max(0, Math.floor((nowMs - ticket.stageChangedAt) / 1000));
  const mins = Math.floor(secs / 60);

  const label =
    secs < 60
      ? `${secs}s in stage`
      : mins < 60
        ? `${mins}m in stage`
        : `${Math.floor(mins / 60)}h in stage`;

  const tone =
    mins >= 20
      ? "text-[#E11D2A]"
      : mins >= 10
        ? "text-amber-700"
        : "text-ink-mute";

  return (
    <p className={`mt-0.5 text-[10.5px] tabular-nums ${tone}`}>{label}</p>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────

function ArrowRight() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6h7m0 0L6.5 3.5M9 6L6.5 8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M3 3l6 6M9 3l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function orderTypeShortLabel(t: string): string {
  if (t === "take-away") return "Take-away";
  if (t === "dine-in") return "Dine-in";
  if (t === "glovo") return "Glovo";
  if (t === "done") return "Done";
  return t;
}

function UrgentBoltGlyph() {
  return (
    <svg width="9" height="10" viewBox="0 0 11 13" fill="none" aria-hidden>
      <path
        d="M6.5 0.5L0.5 7.5h4L4 12.5L10 5.5H6L6.5 0.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        fill="currentColor"
      />
    </svg>
  );
}

