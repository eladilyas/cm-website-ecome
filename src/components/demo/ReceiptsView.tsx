"use client";

// Receipts — transaction history surface, lives inside Backoffice.
//
// Two-pane: left rail = receipt list grouped by day (Today /
// Yesterday / dated); right pane = selected receipt detail with
// status badge, lines, tax, payments, void/refund actions. The
// outer BackofficeView provides the page header — we render the
// content area only.
//
// Phase 4 — light theme. Paper surface, hairline borders, refined
// typography. Refund sheet uses the light Sheet primitive.

import { useMemo, useState } from "react";
import {
  useDemoStore,
  type CompletedReceipt,
  type PaymentMethod,
  type ReceiptStatus,
} from "@/lib/demoStore";
import { capsFor } from "@/data/demo/activityCapabilities";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Sheet } from "./Sheet";

export function ReceiptsView() {
  const activity = useDemoStore((s) => s.activity);
  const allReceipts = useDemoStore((s) => s.receipts);
  const voidReceipt = useDemoStore((s) => s.voidReceipt);
  const refundReceipt = useDemoStore((s) => s.refundReceipt);

  const receipts = useMemo(
    () =>
      allReceipts
        .filter((r) => r.activity === activity)
        .slice()
        .sort((a, b) => b.completedAt - a.completedAt),
    [allReceipts, activity],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refundSheetOpen, setRefundSheetOpen] = useState(false);
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);

  // Search by receipt ID. The receipt ID is what customers actually
  // hand to the operator (printed on every ticket) — time + amount
  // were noisier and ambiguous (same total at similar times happens
  // dozens of times a day), so we anchor the search on the one value
  // that's unique per receipt.
  const [query, setQuery] = useState("");
  const filteredReceipts = useMemo(
    () => filterReceipts(receipts, query),
    [receipts, query],
  );
  const selected =
    filteredReceipts.find((r) => r.id === selectedId) ??
    receipts.find((r) => r.id === selectedId) ??
    filteredReceipts[0] ??
    receipts[0];

  const caps = capsFor(activity);
  const groups = useMemo(() => groupByDay(filteredReceipts), [filteredReceipts]);
  const isSearching = query.trim().length > 0;

  if (receipts.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center max-w-[320px] px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-fog border border-hairline flex items-center justify-center text-ink-mute mb-4">
            <ReceiptIcon size={20} />
          </div>
          <p className="text-[14px] font-medium text-ink">No receipts yet</p>
          <p className="mt-1.5 text-[12px] text-ink-mute leading-snug">
            Ring an order and complete payment — receipts land here for
            void, refund, and history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full grid grid-cols-1 md:grid-cols-[260px_1fr] overflow-hidden">
      {/* LEFT — receipt list */}
      <aside className="hidden md:flex flex-col border-r border-hairline bg-paper overflow-y-auto">
        {/* Sticky search + count strip. The search input filters by
            receipt ID — operators look up a receipt using the ID
            printed on the ticket the customer hands over. */}
        <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur-md border-b border-hairline px-3 pt-2.5 pb-2 space-y-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Receipt ID — e.g. ku79mx"
              className="w-full h-9 rounded-full bg-canvas border border-hairline pl-8 pr-8 text-[12.5px] text-ink placeholder:text-ink-mute focus:outline-none focus:border-hairline-strong focus:bg-paper transition-colors"
              aria-label="Search receipts by ID"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 inline-flex items-center justify-center rounded-full text-ink-mute hover:text-ink hover:bg-fog transition-colors"
              >
                <ClearIcon />
              </button>
            )}
          </div>
          <p className="text-[10.5px] text-ink-mute tabular-nums flex items-center justify-between gap-2">
            <span>
              {isSearching ? (
                <>
                  <span className="font-medium text-ink">
                    {filteredReceipts.length}
                  </span>{" "}
                  match{filteredReceipts.length === 1 ? "" : "es"}
                  <span className="text-ink-mute/70"> · of {receipts.length}</span>
                </>
              ) : (
                <>
                  {receipts.length} total ·{" "}
                  {receipts.filter((r) => r.status === "paid").length} paid
                </>
              )}
            </span>
            {isSearching && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[10.5px] text-ink-mute hover:text-ink underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </p>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6 py-8 text-center">
            <div>
              <p className="text-[13px] font-medium text-ink">
                No receipt matches.
              </p>
              <p className="mt-1 text-[11.5px] text-ink-mute leading-snug max-w-[20rem]">
                Check the ID printed on the customer&rsquo;s ticket — the
                last 6 characters are the receipt ID.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {groups.map((g) => (
              <li key={g.label}>
                <div className="sticky top-[78px] z-[5] px-4 py-1.5 bg-canvas/95 backdrop-blur-sm border-b border-hairline">
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
                    {g.label}
                  </span>
                </div>
                <ul>
                  {g.receipts.map((r) => {
                    const isSelected = selected?.id === r.id;
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(r.id)}
                          aria-current={isSelected ? "true" : undefined}
                          className={
                            "w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-l-2 " +
                            (isSelected
                              ? "bg-fog border-l-[#E11D2A]"
                              : "border-l-transparent hover:bg-fog/60")
                          }
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-medium text-ink truncate flex items-center gap-1.5">
                              <StatusDot status={r.status} />
                              #{r.id.slice(-6)}
                              {r.refundedFrom && (
                                <span className="text-ink-mute">↩</span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[11px] text-ink-mute tabular-nums">
                              {fmtTime(r.completedAt)} · {r.lines.length} item
                              {r.lines.length === 1 ? "" : "s"}
                            </p>
                          </div>
                          <p
                            className={
                              "text-[13px] font-semibold tabular-nums shrink-0 " +
                              (r.total < 0 ? "text-amber-600" : "text-ink")
                            }
                          >
                            {r.total.toFixed(2)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* RIGHT — detail.
          IMPORTANT: this column must NOT itself scroll. Scrolling is
          owned by the inner body region inside ReceiptDetail so the
          header AND the action footer (Void / Refund) stay pinned to
          the visible viewport at all times. Letting this section
          scroll would carry the action footer off-screen and force
          the operator to scroll back down to find Void/Refund — a
          high-frequency action must always be one click away. */}
      <section className="flex flex-col overflow-hidden min-h-0 bg-canvas">
        {selected ? (
          <ReceiptDetail
            receipt={selected}
            taxRate={caps?.taxRate ?? 0}
            allReceipts={receipts}
            onVoid={() => setVoidConfirmOpen(true)}
            onRefund={() => setRefundSheetOpen(true)}
            onOpenRefund={(refundId) => setSelectedId(refundId)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-mute text-[13px]">
            Select a receipt
          </div>
        )}

        <RefundSheet
          open={refundSheetOpen}
          receipt={selected}
          onClose={() => setRefundSheetOpen(false)}
          onConfirm={(lineIndexes, reason) => {
            if (!selected) return;
            const newId = refundReceipt({
              id: selected.id,
              lines: lineIndexes,
              reason,
            });
            setRefundSheetOpen(false);
            if (newId) setSelectedId(selected.id);
          }}
        />

        <ConfirmDialog
          open={voidConfirmOpen}
          scheme="light"
          tone="destructive"
          title="Void this receipt?"
          body={
            <>
              Voiding marks the receipt as cancelled and removes it from sales
              totals. If a kitchen ticket is still live, it will be flagged
              VOIDED. This cannot be undone.
            </>
          }
          confirmLabel="Void receipt"
          cancelLabel="Keep"
          onCancel={() => setVoidConfirmOpen(false)}
          onConfirm={() => {
            if (selected) voidReceipt(selected.id);
            setVoidConfirmOpen(false);
          }}
        />
      </section>
    </div>
  );
}

// ─── Detail pane ─────────────────────────────────────────────────────

function ReceiptDetail({
  receipt,
  taxRate,
  allReceipts,
  onVoid,
  onRefund,
  onOpenRefund,
}: {
  receipt: CompletedReceipt;
  taxRate: number;
  allReceipts: CompletedReceipt[];
  onVoid: () => void;
  onRefund: () => void;
  onOpenRefund: (id: string) => void;
}) {
  const isRefund = receipt.refundedFrom != null;
  const isFinalRefunded = receipt.status === "refunded";
  const isVoided = receipt.status === "voided";
  const canVoid = receipt.status === "paid" && !isRefund;
  const remainingLineCount =
    receipt.lines.length - (receipt.refundedLineIndexes?.length ?? 0);
  const canRefund =
    !isRefund &&
    (receipt.status === "paid" || receipt.status === "partially-refunded") &&
    remainingLineCount > 0;

  const refundMirrors = isRefund
    ? []
    : allReceipts.filter((r) => r.refundedFrom === receipt.id);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header — flex-pinned to the top of the right pane (was
          `sticky top-0`; converted to flex layout so the parent
          column owns positioning predictably). */}
      <header className="shrink-0 bg-paper border-b border-hairline px-6 md:px-8 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold tracking-[-0.005em] text-ink truncate">
              Receipt #{receipt.id.slice(-6)}
            </h3>
            <StatusBadge status={receipt.status} />
          </div>
          <p className="mt-0.5 text-[11.5px] text-ink-mute tabular-nums">
            {fmtDateTime(receipt.completedAt)}
            {receipt.orderType && (
              <>
                {" · "}
                <span className="capitalize">
                  {receipt.orderType.replace("-", " ")}
                </span>
              </>
            )}
            {receipt.identifier && <> · Table {receipt.identifier}</>}
          </p>
        </div>
      </header>

      {/* Scrolling body — the ONLY scrolling region in this column.
          `min-h-0` lets it actually flex-shrink inside its column. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-8 py-5 space-y-4">
        {/* Refund-link callouts */}
        {isRefund && (
          <Callout tone="amber">
            This is a refund mirror of receipt #
            {receipt.refundedFrom?.slice(-6)}.
          </Callout>
        )}
        {refundMirrors.length > 0 && (
          <Callout tone="amber">
            {isFinalRefunded ? "Fully refunded" : "Partially refunded"} ·{" "}
            <button
              type="button"
              onClick={() => onOpenRefund(refundMirrors[0].id)}
              className="underline underline-offset-2 hover:text-amber-900"
            >
              View refund receipt
            </button>
          </Callout>
        )}
        {receipt.reason && (
          <Callout tone="neutral">
            <span className="text-ink-mute">Reason:</span> {receipt.reason}
          </Callout>
        )}

        {/* Lines */}
        <section className="rounded-[10px] border border-hairline bg-paper overflow-hidden">
          <header className="px-4 py-2.5 border-b border-hairline flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
              Items
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute tabular-nums">
              {receipt.lines.length} line{receipt.lines.length === 1 ? "" : "s"}
            </p>
          </header>
          <ul className="divide-y divide-hairline">
            {receipt.lines.map((l, i) => {
              const refunded = (receipt.refundedLineIndexes ?? []).includes(i);
              return (
                <li
                  key={i}
                  className={
                    "px-4 py-2.5 flex items-baseline justify-between gap-3 " +
                    (refunded ? "opacity-50" : "")
                  }
                >
                  <div className="min-w-0">
                    <p
                      className={
                        "text-[13px] text-ink truncate " +
                        (refunded ? "line-through" : "")
                      }
                    >
                      <span className="tabular-nums text-ink-mute mr-2">
                        {l.qty}×
                      </span>
                      {l.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-mute tabular-nums">
                      {l.price.toFixed(2)} MAD · unit
                      {refunded && (
                        <span className="ml-2 text-amber-700">refunded</span>
                      )}
                    </p>
                  </div>
                  <p
                    className={
                      "text-[13px] font-medium tabular-nums shrink-0 " +
                      (l.subtotal < 0
                        ? "text-amber-600"
                        : refunded
                          ? "line-through text-ink-mute"
                          : "text-ink")
                    }
                  >
                    {l.subtotal.toFixed(2)}
                  </p>
                </li>
              );
            })}
            {receipt.extras.map((e, i) => (
              <li
                key={`ex-${i}`}
                className="px-4 py-2.5 flex items-baseline justify-between gap-3"
              >
                <p
                  className={
                    "text-[13px] truncate " +
                    (e.amount < 0 ? "text-amber-700" : "text-ink-soft")
                  }
                >
                  {e.amount < 0 ? "" : "+ "}
                  {e.label}
                </p>
                <p
                  className={
                    "text-[13px] font-medium tabular-nums shrink-0 " +
                    (e.amount < 0 ? "text-amber-600" : "text-ink")
                  }
                >
                  {e.amount.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Totals */}
        <section className="rounded-[10px] border border-hairline bg-paper p-4">
          <TotalsRow label="Subtotal" value={receipt.subtotal} />
          {receipt.taxTotal != null && (
            <TotalsRow
              label={`VAT (${(taxRate * 100).toFixed(0)}%)`}
              value={receipt.taxTotal}
              muted
            />
          )}
          <div className="mt-2.5 pt-2.5 border-t border-hairline">
            <TotalsRow label="Total" value={receipt.total} bold />
          </div>
        </section>

        {/* Payments */}
        <section className="rounded-[10px] border border-hairline bg-paper p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-3">
            Payments
          </p>
          <ul className="space-y-2">
            {receipt.payments.map((p) => (
              <li
                key={p.id}
                className="flex items-baseline justify-between gap-3 text-[13px]"
              >
                <span className="text-ink-soft">{methodLabel(p.method)}</span>
                <span className="font-medium tabular-nums text-ink">
                  {p.amount.toFixed(2)} MAD
                </span>
              </li>
            ))}
          </ul>
          {receipt.payments[0]?.tendered != null &&
            receipt.payments[0].method === "cash" && (
              <div className="mt-3 pt-3 border-t border-hairline flex items-baseline justify-between text-[12px] text-ink-mute">
                <span>Change given</span>
                <span className="tabular-nums">
                  {(receipt.payments[0].change ?? 0).toFixed(2)} MAD
                </span>
              </div>
            )}
        </section>
      </div>

      {/* Action footer — flex-pinned (shrink-0) to the bottom of the
          right pane. Stays in the visible viewport at all times so the
          operator never has to scroll to find Void / Refund — these
          are high-frequency, time-sensitive actions and must always be
          one click away.
          Voided receipts surface a quiet inline state line instead of
          a separate footer row, so vertical real estate isn't doubled
          up with two stacked footers. */}
      <footer className="shrink-0 px-6 md:px-8 py-3 border-t border-hairline bg-paper/98 backdrop-blur-sm">
        {isVoided ? (
          <p className="text-[12px] text-ink-mute text-center">
            This receipt was voided. No further actions available.
          </p>
        ) : canVoid || canRefund ? (
          <div className="flex items-center justify-end gap-2">
            {canVoid && (
              <button
                type="button"
                onClick={onVoid}
                className="h-10 px-5 text-[13px] font-medium rounded-full border border-hairline-strong text-ink hover:bg-fog transition-colors"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                Void
              </button>
            )}
            {canRefund && (
              <button
                type="button"
                onClick={onRefund}
                className="h-10 px-5 text-[13px] font-semibold rounded-full bg-[#E11D2A] text-white hover:bg-[#c8141f] transition-colors"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                Refund…
              </button>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-ink-mute text-center">
            No actions available on this receipt.
          </p>
        )}
      </footer>
    </div>
  );
}

// ─── Refund sheet ────────────────────────────────────────────────────

function RefundSheet({
  open,
  receipt,
  onClose,
  onConfirm,
}: {
  open: boolean;
  receipt: CompletedReceipt | undefined;
  onClose: () => void;
  onConfirm: (lineIndexes: number[] | "all", reason: string) => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [reason, setReason] = useState("");

  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setSelected(new Set());
      setReason("");
    }
  }

  if (!receipt) return null;

  const alreadyRefunded = new Set(receipt.refundedLineIndexes ?? []);
  const refundable = receipt.lines
    .map((_, i) => i)
    .filter((i) => !alreadyRefunded.has(i));
  const allSelected =
    refundable.length > 0 && refundable.every((i) => selected.has(i));

  const refundAmount = receipt.lines.reduce((sum, l, i) => {
    if (selected.has(i)) return sum + l.subtotal;
    return sum;
  }, 0);

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const selectAll = () => setSelected(new Set(refundable));
  const clearAll = () => setSelected(new Set());

  return (
    <Sheet
      open={open}
      onClose={onClose}
      scheme="light"
      title="Refund items"
      subtitle={`Receipt #${receipt.id.slice(-6)} · pick lines to refund`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-ink-mute tabular-nums">
            {selected.size === 0
              ? "Nothing selected"
              : `${selected.size} line${selected.size === 1 ? "" : "s"} · ${refundAmount.toFixed(2)} MAD`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-[13px] font-medium rounded-lg border border-hairline-strong text-ink hover:bg-fog transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (selected.size === 0) return;
                onConfirm(
                  allSelected
                    ? "all"
                    : Array.from(selected).sort((a, b) => a - b),
                  reason.trim(),
                );
              }}
              disabled={selected.size === 0}
              className="h-10 px-4 text-[13px] font-medium rounded-lg bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Process refund
            </button>
          </div>
        </div>
      }
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
            Lines
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={selectAll}
              className="text-ink-soft hover:text-ink"
              disabled={refundable.length === 0}
            >
              Select all
            </button>
            <span className="text-ink-mute/50">·</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-ink-soft hover:text-ink"
              disabled={selected.size === 0}
            >
              Clear
            </button>
          </div>
        </div>

        <ul className="rounded-[10px] border border-hairline bg-paper divide-y divide-hairline overflow-hidden">
          {receipt.lines.map((l, i) => {
            const isRefunded = alreadyRefunded.has(i);
            const checked = selected.has(i);
            return (
              <li
                key={i}
                className={
                  "px-4 py-3 flex items-center gap-3 " +
                  (isRefunded ? "opacity-50" : "hover:bg-fog/60 cursor-pointer")
                }
                onClick={() => !isRefunded && toggle(i)}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isRefunded}
                  onChange={() => toggle(i)}
                  aria-label={`Refund ${l.name}`}
                  className="h-4 w-4 rounded border-hairline-strong bg-paper accent-[#E11D2A]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink truncate">
                    <span className="tabular-nums text-ink-mute mr-2">
                      {l.qty}×
                    </span>
                    {l.name}
                    {isRefunded && (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.1em] text-amber-700">
                        Already refunded
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-[12px] font-medium tabular-nums text-ink-soft shrink-0">
                  {l.subtotal.toFixed(2)}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-5">
          <label
            htmlFor="refund-reason"
            className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-1.5 block"
          >
            Reason (optional)
          </label>
          <input
            id="refund-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Customer changed their mind · wrong item · …"
            className="w-full h-11 px-3 rounded-lg bg-paper border border-hairline text-[13px] text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink/40"
          />
        </div>
      </div>
    </Sheet>
  );
}

// ─── Helpers / sub-pieces ────────────────────────────────────────────

function TotalsRow({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={
        "flex items-baseline justify-between text-[13px] " +
        (muted ? "text-ink-mute" : "text-ink")
      }
    >
      <span>{label}</span>
      <span
        className={
          "tabular-nums " + (bold ? "text-[15px] font-semibold" : "")
        }
      >
        {value.toFixed(2)}{" "}
        <span className="text-ink-mute text-[11px]">MAD</span>
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: ReceiptStatus }) {
  const map: Record<ReceiptStatus, { label: string; tone: string }> = {
    paid: {
      label: "Paid",
      tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    voided: {
      label: "Voided",
      tone: "text-ink-mute bg-fog border-hairline",
    },
    refunded: {
      label: "Refunded",
      tone: "text-amber-700 bg-amber-50 border-amber-100",
    },
    "partially-refunded": {
      label: "Partial refund",
      tone: "text-amber-700 bg-amber-50/70 border-amber-100",
    },
  };
  const { label, tone } = map[status];
  return (
    <span
      className={
        "inline-flex items-center px-2 h-[20px] rounded-full border text-[10px] font-medium uppercase tracking-[0.1em] " +
        tone
      }
    >
      {label}
    </span>
  );
}

function StatusDot({ status }: { status: ReceiptStatus }) {
  const color = {
    paid: "bg-emerald-500",
    voided: "bg-ink-mute/60",
    refunded: "bg-amber-500",
    "partially-refunded": "bg-amber-500",
  }[status];
  return (
    <span
      className={"inline-block w-1.5 h-1.5 rounded-full shrink-0 " + color}
    />
  );
}

function Callout({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "amber" | "neutral";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-100 bg-amber-50 text-amber-800"
      : "border-hairline bg-paper text-ink-soft";
  return (
    <div
      className={
        "rounded-lg border px-3 py-2 text-[12px] leading-snug " + cls
      }
    >
      {children}
    </div>
  );
}

// ─── Grouping + formatting ───────────────────────────────────────────

type DayGroup = { label: string; receipts: CompletedReceipt[] };

function groupByDay(receipts: CompletedReceipt[]): DayGroup[] {
  const groups = new Map<string, CompletedReceipt[]>();
  const today = startOfDay(Date.now());
  const yesterday = today - 86_400_000;
  for (const r of receipts) {
    const day = startOfDay(r.completedAt);
    const label =
      day === today
        ? "Today"
        : day === yesterday
          ? "Yesterday"
          : new Date(day).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
    const arr = groups.get(label) ?? [];
    arr.push(r);
    groups.set(label, arr);
  }
  return Array.from(groups.entries()).map(([label, receipts]) => ({
    label,
    receipts,
  }));
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtDateTime(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function methodLabel(m: PaymentMethod): string {
  switch (m) {
    case "cash": return "Cash";
    case "tpe-mobile": return "TPE Mobile";
    case "cmi": return "CMI";
    case "glovo": return "Glovo";
    case "done": return "Done";
    case "yassir": return "Yassir";
    case "online": return "Online payment";
    case "cash-on-delivery": return "Cash on delivery";
    case "card-on-delivery": return "Card on delivery";
    case "gift-card": return "Gift card";
    case "store-credit": return "Store credit";
    default: return m;
  }
}

function ReceiptIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 1.5h8v13l-2-1-2 1-2-1-2 1v-13Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6 5h4M6 7.5h4M6 10h2.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M11 11l3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M2 2l6 6M8 2l-6 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Filter helper ────────────────────────────────────────────────────
//
// Receipt-ID search. Substring match against the last 6 characters of
// the receipt ID (the slice the UI surfaces as `#ku79mx`). Leading
// `#` is stripped so the operator can type the ID verbatim from the
// printed ticket.

function filterReceipts(
  receipts: CompletedReceipt[],
  rawQuery: string,
): CompletedReceipt[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return receipts;
  const needle = q.startsWith("#") ? q.slice(1) : q;
  return receipts.filter((r) =>
    r.id.slice(-6).toLowerCase().includes(needle),
  );
}
