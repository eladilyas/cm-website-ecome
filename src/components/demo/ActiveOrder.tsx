"use client";

// Right pane of the POS workspace — reconstructs screens B1 → B5.
//
// Live cart with line items, qty steppers, per-line delete, computed
// subtotal/total, and the Proceed Order CTA that transitions the stage
// to "payment".

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";
import {
  useDemoStore,
  selectActivityProducts,
  selectOrderTotals,
  activityHasKitchen,
} from "@/lib/demoStore";
import {
  lineSelectionSummary,
  lineUnitPrice,
} from "@/lib/orderMath";
import { BrandLogoMark } from "@/components/ui/BrandLogoMark";
import type { DemoProduct, OrderLine } from "@/data/demo/types";
import {
  CustomItemSheet,
  LineDiscountSheet,
  OrderDiscountSheet,
} from "./CartActions";
import { CustomerPickerSheet } from "./CustomerPickerSheet";
import { CommentSheet } from "./CommentSheet";
import { InlineCommentPanel } from "./InlineCommentPanel";
import { InlineFeePanel } from "./InlineFeePanel";
import { OrderTypePopover } from "./OrderTypePopover";
import {
  ActionMenu,
  ActionMenuItem,
  ActionMenuLabel,
  ActionMenuDivider,
} from "./ActionMenu";
import {
  ORDER_PRESETS,
  presetsForCategory,
  type CommentPreset,
} from "@/data/demo/comments";
import { ACTIVITIES } from "@/data/demo/activities";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ActiveOrder() {
  const tCart = useTranslations("demo.cart");
  const tType = useTranslations("demo.orderType");
  const activity = useDemoStore((s) => s.activity);
  const order = useDemoStore((s) => s.order);
  const setLineQty = useDemoStore((s) => s.setLineQty);
  const removeLine = useDemoStore((s) => s.removeLine);
  const beginPayment = useDemoStore((s) => s.beginPayment);
  const sendToKitchen = useDemoStore((s) => s.sendToKitchen);
  const holdOrder = useDemoStore((s) => s.holdOrder);
  const toggleFlag = useDemoStore((s) => s.toggleFlag);
  const toggleLineUrgent = useDemoStore((s) => s.toggleLineUrgent);
  const setOrderComment = useDemoStore((s) => s.setOrderComment);
  const setLineComment = useDemoStore((s) => s.setLineComment);

  // Wrap with useShallow — selectOrderTotals returns a fresh {subtotal,
  // extras, total} object each call; Object.is would treat each as a new
  // snapshot and trigger infinite re-render.
  const totals = useDemoStore(useShallow(selectOrderTotals));

  // Phase P — cashier identity is now passive (auto-assigned + shown
  // in POSChrome header). ActiveOrder only surfaces the CUSTOMER
  // attribution chip since that's the per-order decision the cashier
  // actually makes.
  const attachedCustomer = useDemoStore((s) => {
    const cid = s.order?.customerId;
    if (!activity || !cid) return null;
    return s.customers[activity]?.find((c) => c.id === cid) ?? null;
  });

  // Sheet state — single source for which cart-companion sheet is
  // open. Declared BEFORE the early return so hooks always run in
  // the same order (rules-of-hooks).
  const [orderDiscountOpen, setOrderDiscountOpen] = useState(false);
  const [customItemOpen, setCustomItemOpen] = useState(false);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  // Inline expansions — replace the previous modal sheets for these
  // simple actions so the cashier never leaves the cart context.
  // Exactly one inline panel can be expanded at a time.
  const [expanded, setExpanded] = useState<"note" | "fee" | null>(null);
  const [orderTypeOpen, setOrderTypeOpen] = useState(false);
  const orderTypeBtnRef = useRef<HTMLButtonElement>(null);
  // Unified order-level action menu (anchored to the eyebrow "•••").
  const [orderMenuOpen, setOrderMenuOpen] = useState(false);
  const orderMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const [lineCommentTarget, setLineCommentTarget] = useState<{
    lineId: string;
    name: string;
    comment: string;
    presets: CommentPreset[];
  } | null>(null);
  const [lineDiscountTarget, setLineDiscountTarget] = useState<{
    lineId: string;
    name: string;
    pct: number;
  } | null>(null);

  if (!order || !activity) return null;

  // Phase 3A — read through the overlay so manager renames / price
  // edits show in the cart immediately. selectActivityProducts is
  // pure; no extra subscription needed (the order changes drive
  // re-renders when lines mutate).
  const products = selectActivityProducts(useDemoStore.getState(), activity);
  const productById = (id: string): DemoProduct | undefined =>
    products.find((p) => p.id === id);

  const isEmpty = order.lines.length === 0;

  return (
    <aside className="h-full flex flex-col bg-night/95 border-l border-white/8">
      {/* Header — identifier + order type. The receipt is never offered
          before payment — that flow was removed; the ticket/receipt is a
          POST-PAYMENT artifact rendered by PaymentSuccess.
          When `order.flags.urgent` is set, a brand-red ribbon sits on
          the top edge so the priority state never leaves the cashier's
          view as they ring more items. */}
      {order.flags.urgent && (
        <div
          aria-hidden
          className="h-[2px] w-full bg-[#E11D2A]"
        />
      )}
      <header className="px-4 pt-2.5 pb-2 border-b border-white/8">
        {/* Title row + order-type chip + customer attachment — all on
            ONE compact line. The "Active order" eyebrow was redundant
            (the cart IS the active order; the order-type chip already
            states intent). Customer attach was a 64px dashed card; now
            a single inline pill. Net: ~80px reclaimed above line items. */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[14px] font-semibold text-paper truncate min-w-0">
            {order.identifier ?? orderTypeLabel(order.type, tType)}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <CustomerAttachPill
              attached={attachedCustomer}
              onClick={() => setCustomerSheetOpen(true)}
            />
            <div className="relative shrink-0">
              <button
                ref={orderTypeBtnRef}
                type="button"
                onClick={() => setOrderTypeOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={orderTypeOpen}
                aria-label={tType("change")}
                className={
                  "inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.12em] text-paper border rounded-full px-2 h-7 transition-colors " +
                  (orderTypeOpen
                    ? "bg-white/[0.10] border-white/25"
                    : "bg-white/[0.05] border-white/15 hover:bg-white/[0.10] hover:border-white/25")
                }
              >
                {orderTypeLabel(order.type, tType)}
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden
                  className={
                    "text-paper/55 transition-transform " +
                    (orderTypeOpen ? "rotate-180" : "")
                  }
                >
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <OrderTypePopover
                open={orderTypeOpen}
                onClose={() => setOrderTypeOpen(false)}
                anchorRef={orderTypeBtnRef}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Line list — flex-1 so it owns whatever vertical space the
          header + footer don't claim. A sticky "Items (N)" eyebrow sits
          at the top of the scroll container so the cashier never has to
          guess where the list is — even when it's a single short row. */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <div className="sticky top-0 z-[2] bg-night/95 backdrop-blur-sm border-b border-white/[0.06] px-3 py-1.5 flex items-center justify-between gap-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-paper/45 shrink-0">
                {tCart("items")}
                <span className="ml-1.5 tabular-nums text-paper/70">
                  {order.lines.length}
                </span>
              </p>
              <button
                ref={orderMenuTriggerRef}
                type="button"
                onClick={() => setOrderMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={orderMenuOpen}
                aria-label={tCart("orderActions")}
                className={
                  "inline-flex items-center justify-center h-6 w-7 rounded-[6px] transition-colors " +
                  (orderMenuOpen
                    ? "bg-white/[0.10] text-paper border border-white/15"
                    : "text-paper/55 hover:text-paper hover:bg-white/[0.06]")
                }
              >
                <DotsIcon />
              </button>
            </div>

            <ActionMenu
              open={orderMenuOpen}
              onClose={() => setOrderMenuOpen(false)}
              anchorRef={orderMenuTriggerRef}
              align="right"
              width={232}
            >
              <ActionMenuLabel>{tCart("orderActions")}</ActionMenuLabel>
              <ActionMenuItem
                icon={<NoteIconSmall />}
                label={order.orderComment ? "Edit order note" : "Add order note"}
                suffix={order.orderComment ? "Active" : undefined}
                onClick={() => {
                  setOrderMenuOpen(false);
                  setExpanded("note");
                }}
              />
              <ActionMenuItem
                icon={<FeeIcon />}
                label="Add fee"
                onClick={() => {
                  setOrderMenuOpen(false);
                  setExpanded("fee");
                }}
              />
              <ActionMenuItem
                icon={<PlusGlyph />}
                label="Add custom item"
                onClick={() => {
                  setOrderMenuOpen(false);
                  setCustomItemOpen(true);
                }}
              />
              <ActionMenuDivider />
              <ActionMenuItem
                icon={<UrgentBoltMenuIcon />}
                label="Mark order urgent"
                active={order.flags.urgent}
                onClick={() => toggleFlag("urgent")}
              />
              <ActionMenuItem
                icon={<DiscountIconMenu />}
                label={
                  order.orderDiscount
                    ? "Edit order discount"
                    : "Apply order discount"
                }
                suffix={
                  order.orderDiscount
                    ? order.orderDiscount.kind === "pct"
                      ? `−${order.orderDiscount.amount}%`
                      : `−${order.orderDiscount.amount}`
                    : undefined
                }
                onClick={() => {
                  setOrderMenuOpen(false);
                  setOrderDiscountOpen(true);
                }}
              />
              <ActionMenuItem
                icon={<HoldGlyph />}
                label="Hold order"
                onClick={() => {
                  setOrderMenuOpen(false);
                  holdOrder();
                }}
              />
            </ActionMenu>

            {/* Inline panels — replace the previous modal sheets for
                Order Note + Add Fee. Slide in/out under the eyebrow row
                so the cashier never loses sight of the line list. */}
            <InlineCommentPanel
              open={expanded === "note"}
              onClose={() => setExpanded(null)}
              presets={activity ? ORDER_PRESETS[activity] : []}
              value={order.orderComment ?? ""}
              onSave={(next) => setOrderComment(next)}
            />
            <InlineFeePanel
              open={expanded === "fee"}
              onClose={() => setExpanded(null)}
            />

            {/* Order-level comment banner — surfaces when set AND the
                inline editor is closed, so a saved note stays visible
                without forcing the editor open. Tap to re-open the
                inline editor. */}
            {order.orderComment && expanded !== "note" && (
              <button
                type="button"
                onClick={() => setExpanded("note")}
                className="block w-full text-left px-3 py-2 bg-amber-400/[0.06] border-b border-amber-400/15 hover:bg-amber-400/[0.10] transition-colors"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-300/85 mb-0.5">
                  Order note
                </p>
                <p className="text-[12px] text-amber-100 leading-snug line-clamp-2">
                  {order.orderComment}
                </p>
              </button>
            )}
            <ul className="p-2.5 md:p-3 space-y-1.5">
              <AnimatePresence initial={false}>
                {order.lines.map((line) => {
                const product = productById(line.productId);
                // `lineDisplayName` (full dotted form) goes to the
                // receipt + kitchen ticket. The cart uses just the
                // product name + a smaller `summary` subtitle so the
                // first line reads cleanly at small widths.
                const unitPrice = product ? lineUnitPrice(product, line) : 0;
                const summary = product
                  ? lineSelectionSummary(product, line)
                  : "";
                return (
                  <motion.li
                    key={line.id}
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: APPLE_EASE }}
                    className="overflow-hidden"
                  >
                    <OrderLineRow
                      line={line}
                      name={product?.name ?? line.productId}
                      summary={summary}
                      unitPrice={unitPrice}
                      onInc={() => setLineQty(line.id, line.qty + 1)}
                      onDec={() => setLineQty(line.id, line.qty - 1)}
                      onRemove={() => removeLine(line.id)}
                      onEditDiscount={() =>
                        setLineDiscountTarget({
                          lineId: line.id,
                          name: product?.name ?? line.productId,
                          pct: line.discountPct ?? 0,
                        })
                      }
                      onToggleUrgent={() => toggleLineUrgent(line.id)}
                      onEditComment={() => {
                        const cat = product
                          ? ACTIVITIES[activity].categories.find(
                              (c) => c.id === product.categoryId,
                            )
                          : undefined;
                        setLineCommentTarget({
                          lineId: line.id,
                          name: product?.name ?? line.productId,
                          comment: line.comment ?? "",
                          presets: presetsForCategory(
                            activity,
                            product?.categoryId,
                            cat?.name,
                          ),
                        });
                      }}
                    />
                    {/* Pass the bare product name (no suffix) plus a
                        separate summary line so the cart shows
                        "Espresso" boldly with "Large · oat milk +5"
                        as a smaller subtitle. The receipt + kitchen
                        ticket get the full dotted `name` form. */}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          </>
        )}
      </div>

      {/* Totals + CTAs.
          Empty cart → collapse to just the disabled CTA row so the
          brand mark in the body has the full middle to itself. No
          zero-state "Total · 0.00 MAD" reads as cleaner + more
          intentional than a stub totals block. */}
      <footer className="border-t border-white/8 px-4 md:px-5 pt-3 pb-4 md:pb-5">
        {!isEmpty && (
          <>
            {/* Compact totals — Apply-discount lives inline next to
                Subtotal as a tiny chip so it doesn't claim a whole row.
                Custom-item moved into the list-eyebrow at the top of the
                line list. Result: footer chrome shrinks ~50% and the
                line list takes the freed space. */}
            <div className="text-[13px]">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-paper/65">{tCart("subtotal")}</span>
                  <button
                    type="button"
                    onClick={() => setOrderDiscountOpen(true)}
                    aria-label={order.orderDiscount ? "Edit order discount" : "Apply order discount"}
                    className={
                      "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10.5px] font-medium tabular-nums border transition-colors " +
                      (order.orderDiscount
                        ? "bg-[#E11D2A]/15 text-[#E11D2A] border-[#E11D2A]/35 hover:bg-[#E11D2A]/20"
                        : "text-paper/75 border-dashed border-white/25 hover:text-paper hover:border-white/45 hover:bg-white/[0.04]")
                    }
                    style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                  >
                    {order.orderDiscount
                      ? (order.orderDiscount.kind === "pct"
                          ? `−${order.orderDiscount.amount}%`
                          : `−${order.orderDiscount.amount}`)
                      : tCart("addDiscount")}
                  </button>
                </div>
                <span className="tabular-nums text-paper">
                  {fmt(totals.subtotal)}
                </span>
              </div>
              {totals.extras > 0 && (
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-paper/65">{tCart("extras")}</span>
                  <span className="tabular-nums text-paper">
                    {fmt(totals.extras)}
                  </span>
                </div>
              )}
              {totals.discount !== 0 && (
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-amber-300/85">
                    {order.orderDiscount?.label ??
                      (order.orderDiscount?.kind === "pct"
                        ? tCart("discountPct", { pct: order.orderDiscount.amount })
                        : tCart("discountFallback"))}
                  </span>
                  <span className="tabular-nums text-amber-300/85">
                    {fmt(totals.discount)}
                  </span>
                </div>
              )}
              <div className="h-px bg-white/8 my-2.5" />
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] text-paper/55">
                  {tCart("total")}
                </span>
                <span className="text-[22px] md:text-[26px] font-semibold tracking-[-0.022em] tabular-nums text-paper">
                  {totals.total.toFixed(2)}{" "}
                  <span className="text-paper/45 text-[11px] uppercase tracking-[0.12em]">
                    MAD
                  </span>
                </span>
              </div>
            </div>
          </>
        )}

        {/* Activity-aware checkout flow:
              • Kitchen activities (café / fast-food / restaurant) follow
                the real two-step pattern: SEND TO KITCHEN first (creates
                a ticket, stamps order.sentAt), THEN take payment when
                the customer is ready to leave. Once sent, an "In service"
                badge appears so the cashier knows the order is live in
                the kitchen.
              • Direct-checkout activities (bakery / market / beauty /
                barber) keep the single-step "Take payment" flow —
                there's no kitchen ceremony for pre-made or service-only
                businesses. */}
        {activity && activityHasKitchen(activity) ? (
          order.sentAt ? (
            <div className={(isEmpty ? "" : "mt-3 ") + "space-y-2.5"}>
              <div className="flex items-center justify-center gap-2 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-[12px] font-medium tracking-[-0.005em]">
                <DotPulse />
                {tCart("inService")}
              </div>
              <div className="grid grid-cols-[1fr_2fr] gap-2">
                <HoldButton
                  disabled={isEmpty}
                  onClick={() => holdOrder()}
                />
                <button
                  type="button"
                  onClick={() => beginPayment("cash")}
                  className="h-11 text-[14px] font-medium rounded-[8px] bg-[#E11D2A] text-white hover:bg-[#c8141f] transition-colors"
                >
                  {tCart("takePaymentAmount", { amount: fmt(totals.total) })}
                </button>
              </div>
            </div>
          ) : (
            <div className={(isEmpty ? "" : "mt-3 ") + "space-y-2"}>
              {/* Order options — flag the order as urgent BEFORE firing
                  the ticket. Once sent, the urgent state is baked into the
                  kitchen ticket; the toggle disappears from the un-sent
                  branch only. */}
              <UrgentToggle
                disabled={isEmpty}
                active={order.flags.urgent}
                onToggle={() => toggleFlag("urgent")}
              />
              <div className="grid grid-cols-[1fr_2fr] gap-2">
                <HoldButton
                  disabled={isEmpty}
                  onClick={() => holdOrder()}
                />
                <button
                  type="button"
                  onClick={sendToKitchen}
                  disabled={isEmpty}
                  className="h-11 text-[14px] font-medium rounded-[8px] bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {order.flags.urgent
                    ? `${tCart("sendToKitchen")} · ${tCart("urgent")}`
                    : tCart("sendToKitchen")}
                </button>
              </div>
              <p className="text-[10.5px] text-paper/40 text-center leading-snug">
                {tCart("kitchenHint")}
              </p>
            </div>
          )
        ) : (
          <div
            className={
              (isEmpty ? "" : "mt-3 ") + "grid grid-cols-[1fr_2fr] gap-2"
            }
          >
            <HoldButton disabled={isEmpty} onClick={() => holdOrder()} />
            <button
              type="button"
              onClick={() => beginPayment("cash")}
              disabled={isEmpty}
              className="h-11 text-[14px] font-medium rounded-[8px] bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isEmpty
                ? tCart("takePayment")
                : tCart("takePaymentAmount", { amount: fmt(totals.total) })}
            </button>
          </div>
        )}
      </footer>

      {/* Cart-companion sheets — mounted at the bottom of the cart
          aside so they overlay the workspace via the shared Sheet
          primitive (absolute inset-0 inside the workspace <main>). */}
      <OrderDiscountSheet
        open={orderDiscountOpen}
        onClose={() => setOrderDiscountOpen(false)}
      />
      <CustomItemSheet
        open={customItemOpen}
        onClose={() => setCustomItemOpen(false)}
      />
      <LineDiscountSheet
        open={lineDiscountTarget !== null}
        onClose={() => setLineDiscountTarget(null)}
        lineId={lineDiscountTarget?.lineId ?? null}
        productName={lineDiscountTarget?.name ?? ""}
        currentPct={lineDiscountTarget?.pct ?? 0}
      />
      {/* Per-order attribution sheet — customer only.
          Cashier identity is passive (POSChrome header). */}
      <CustomerPickerSheet
        open={customerSheetOpen}
        onClose={() => setCustomerSheetOpen(false)}
      />
      {/* Line-level comment stays in a sheet — the per-line context
          (product name + category-aware preset chips) is rich enough to
          warrant the dedicated surface, and the line row itself is too
          tight to host an inline editor without disrupting the list. */}
      <CommentSheet
        open={lineCommentTarget !== null}
        onClose={() => setLineCommentTarget(null)}
        title="Item note"
        subtitle={lineCommentTarget?.name ?? ""}
        presets={lineCommentTarget?.presets ?? []}
        value={lineCommentTarget?.comment ?? ""}
        onSave={(next) => {
          if (lineCommentTarget) setLineComment(lineCommentTarget.lineId, next);
        }}
      />
    </aside>
  );
}

// ── Icons used by the unified ActionMenu engine ─────────────────────────
// All icons sized 13-14px so they sit neatly inside the menu's 16x16
// icon slot. The cart row + eyebrow share these helpers — no per-surface
// re-implementation. NoteIconSmall is reused for the inline ★ comment
// preview under each line's name.

function DotsIcon({ small }: { small?: boolean }) {
  const s = small ? 11 : 13;
  return (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="3" cy="7" r="1.2" fill="currentColor" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
      <circle cx="11" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function NoteIconSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 1.5h6.5L11.5 3.5v9H3v-11ZM9.5 1.5V4H11.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M5 7h4M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function FeeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4v6M5 6h3M5 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function UrgentBoltMenuIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M8 1L1.5 8h4L5 13L12.5 6H8.5L8 1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.25"
      />
    </svg>
  );
}

function DiscountIconMenu() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M11 3l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="4" cy="4" r="1.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="1.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function HoldGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 5v4M8.5 5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ── Customer attach pill ────────────────────────────────────────────
// Compact inline pill rendered in the cart header.
// Empty state: dashed-border "+ Customer" pill (~28px tall).
// Attached state: filled pill with tier dot + name (truncated).
// Tier color tracks the loyalty tier so a glance reveals the segment.

function CustomerAttachPill({
  attached,
  onClick,
}: {
  attached: { name: string; tier?: string | null } | null | undefined;
  onClick: () => void;
}) {
  const t = useTranslations("demo.cart");
  if (!attached) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-dashed border-white/20 text-paper/60 text-[10.5px] uppercase tracking-[0.12em] font-medium hover:border-white/40 hover:text-paper transition-colors"
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        aria-label={t("attachCustomer")}
      >
        <span aria-hidden className="text-[12px] leading-none">+</span>
        {t("customerPlaceholder")}
      </button>
    );
  }
  const tier = (attached.tier ?? "bronze") as
    | "platinum"
    | "gold"
    | "silver"
    | "bronze";
  const tierDot = {
    platinum: "bg-paper",
    gold: "bg-amber-400",
    silver: "bg-paper/70",
    bronze: "bg-amber-700",
  }[tier];

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/[0.06] border border-white/15 text-paper text-[11.5px] hover:bg-white/[0.1] transition-colors max-w-[160px]"
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      title={attached.name}
    >
      <span aria-hidden className={"shrink-0 w-1.5 h-1.5 rounded-full " + tierDot} />
      <span className="truncate font-medium">{attached.name}</span>
    </button>
  );
}

function OrderLineRow({
  line,
  name,
  summary,
  unitPrice,
  onInc,
  onDec,
  onRemove,
  onEditDiscount,
  onToggleUrgent,
  onEditComment,
}: {
  line: OrderLine;
  name: string;
  /** Variant + modifier summary ("Large · oat milk +5, extra shot
   *  +6"). Empty for plain products. */
  summary: string;
  unitPrice: number;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
  onEditDiscount: () => void;
  onToggleUrgent: () => void;
  onEditComment: () => void;
}) {
  const lineTotal = useMemo(() => unitPrice * line.qty, [unitPrice, line.qty]);
  const tCart = useTranslations("demo.cart");
  const hasDiscount = (line.discountPct ?? 0) > 0;
  const isUrgent = line.urgent === true;
  const hasComment = Boolean(line.comment && line.comment.trim().length > 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  // Compact horizontal layout — every modify control reachable in one
  // row through the unified ActionMenu engine. Density: ~32-40px per
  // row. Inline indicators stay (urgent ring, ★ comment) so the row
  // never goes blind on its own state. The "•••" button anchors the
  // dropdown that lists Edit note, Apply discount, Mark urgent, Remove.
  return (
    <div
      className={
        "group relative rounded-[8px] border transition-colors px-1.5 py-1 flex items-center gap-1.5 " +
        (isUrgent
          ? "border-[#E11D2A]/35 bg-[#E11D2A]/[0.08] hover:bg-[#E11D2A]/[0.10]"
          : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/15")
      }
    >
      {/* Stepper — grouped −/qty/+ control. Larger on mobile so the
          touch target hits Apple's 44px envelope (28×30px buttons +
          padding = ~36-44px effective tap area). Tightens on sm+ where
          pointer precision is higher. */}
      <div className="shrink-0 inline-flex items-center h-8 sm:h-6 rounded-[5px] border border-white/10 bg-white/[0.04] overflow-hidden">
        <button
          type="button"
          onClick={onDec}
          aria-label="Decrease quantity"
          className="h-8 sm:h-6 w-7 sm:w-5 inline-flex items-center justify-center text-paper/85 hover:text-paper hover:bg-white/[0.08] active:scale-95 transition-all text-[14px] sm:text-[13px] font-medium"
        >
          −
        </button>
        <span className="min-w-[20px] sm:min-w-[16px] text-center text-[12.5px] sm:text-[11.5px] font-medium tabular-nums text-paper">
          {line.qty}
        </span>
        <button
          type="button"
          onClick={onInc}
          aria-label="Increase quantity"
          className="h-8 sm:h-6 w-7 sm:w-5 inline-flex items-center justify-center text-paper/85 hover:text-paper hover:bg-white/[0.08] active:scale-95 transition-all text-[14px] sm:text-[13px] font-medium"
        >
          +
        </button>
      </div>

      {/* Name + optional summary + optional line comment. */}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-paper leading-tight truncate">
          {name}
        </p>
        {summary && (
          <p className="text-[10px] text-paper/55 leading-tight truncate">
            {summary}
          </p>
        )}
        {hasComment && (
          <button
            type="button"
            onClick={onEditComment}
            className="block w-full text-left text-[10px] text-amber-300/85 leading-tight truncate hover:text-amber-200 transition-colors"
            title="Edit note"
          >
            ★ {line.comment}
          </button>
        )}
      </div>

      {/* Right cluster — passive state indicators (discount chip when
          active, line total) + single ••• action menu. Active states
          (urgent bg/ring, discount chip, ★ comment under name) keep
          the row self-explanatory; everything else routes through the
          unified ActionMenu so the row stays compact and unfussy. */}
      <div className="shrink-0 flex items-center gap-1">
        {hasDiscount && (
          <span
            className="h-5 px-1 rounded-[4px] text-[9.5px] font-medium tabular-nums bg-[#E11D2A]/15 text-[#E11D2A] flex items-center"
            title={`Line discount: ${line.discountPct}%`}
          >
            −{line.discountPct}%
          </span>
        )}
        <span className="min-w-[48px] text-right text-[12.5px] font-semibold tabular-nums text-paper leading-none">
          {fmt(lineTotal)}
        </span>
        <button
          ref={menuTriggerRef}
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Line actions"
          className={
            "h-7 sm:h-5 w-7 sm:w-5 rounded-[4px] flex items-center justify-center transition-colors " +
            (menuOpen
              ? "bg-white/[0.10] text-paper"
              : "text-paper/40 hover:text-paper hover:bg-white/[0.08]")
          }
        >
          <DotsIcon small />
        </button>
        <ActionMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuTriggerRef}
          align="right"
          width={210}
        >
          <ActionMenuLabel>{tCart("lineActions")}</ActionMenuLabel>
          <ActionMenuItem
            icon={<NoteIconSmall />}
            label={hasComment ? tCart("editNote") : tCart("addNote")}
            suffix={hasComment ? tCart("noteActive") : undefined}
            onClick={() => {
              setMenuOpen(false);
              onEditComment();
            }}
          />
          <ActionMenuItem
            icon={<UrgentBoltMenuIcon />}
            label={tCart("markUrgent")}
            active={isUrgent}
            onClick={onToggleUrgent}
          />
          <ActionMenuItem
            icon={<DiscountIconMenu />}
            label={hasDiscount ? tCart("editDiscount") : tCart("applyDiscount")}
            suffix={hasDiscount ? `−${line.discountPct}%` : undefined}
            onClick={() => {
              setMenuOpen(false);
              onEditDiscount();
            }}
          />
          <ActionMenuDivider />
          <ActionMenuItem
            icon={<TrashIcon />}
            label={tCart("removeFromOrder")}
            danger
            onClick={() => {
              setMenuOpen(false);
              onRemove();
            }}
          />
        </ActionMenu>
      </div>
    </div>
  );
}

function ParkIcon() {
  // Pause/parking-style glyph — two vertical bars inside a rounded
  // square, reads as "held in place" without being a generic pause.
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
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
  );
}

// Urgent toggle — flips ActiveOrder.flags.urgent. The flag is lifted onto
// the KitchenTicket the moment the order is fired, where it surfaces as a
// brand-red ribbon + auto-pin-to-top inside each Kanban stage column.
// Off-state reads as a subtle outline; on-state fills brand-red so the
// cashier can see priority status at a glance from across the counter.
function UrgentToggle({
  disabled,
  active,
  onToggle,
}: {
  disabled?: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      className={
        "w-full h-9 inline-flex items-center justify-between gap-2 px-3 text-[12.5px] font-medium rounded-lg transition-all " +
        (active
          ? "bg-[#E11D2A]/15 border border-[#E11D2A]/35 text-[#ff8e96]"
          : "bg-white/[0.04] border border-white/12 text-paper/75 enabled:hover:bg-white/[0.08] enabled:hover:text-paper") +
        " disabled:opacity-40 disabled:cursor-not-allowed"
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <span className="flex items-center gap-2">
        <UrgentBoltIcon />
        <UrgentToggleLabel />
      </span>
      <span
        aria-hidden
        className={
          "inline-flex items-center h-[18px] w-8 rounded-full transition-colors " +
          (active ? "bg-[#E11D2A]" : "bg-white/15")
        }
      >
        <span
          className={
            "ml-0.5 h-3.5 w-3.5 rounded-full bg-paper transition-transform " +
            (active ? "translate-x-[14px]" : "translate-x-0")
          }
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        />
      </span>
    </button>
  );
}

function UrgentToggleLabel() {
  const t = useTranslations("demo.cart");
  return <>{t("markUrgent")}</>;
}

function UrgentBoltIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
      <path
        d="M6.5 0.5L0.5 7.5h4L4 12.5L10 5.5H6L6.5 0.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

// Hold Order — secondary primary CTA. Sits to the left of the
// proceed/take-payment button matching the reference POS pattern.
// Visually subordinate (white-frost surface, paper text) so the
// red primary CTA still owns the visual weight.
function HoldButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-11 inline-flex items-center justify-center gap-1.5 text-[13px] font-medium rounded-[8px] bg-white/[0.06] border border-white/15 text-paper enabled:hover:bg-white/[0.10] enabled:hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <ParkIcon />
      <HoldLabel />
    </button>
  );
}

function HoldLabel() {
  const t = useTranslations("demo.cart");
  return <>{t("hold")}</>;
}

function EmptyState() {
  const t = useTranslations("demo.cart");
  return (
    <div className="h-full min-h-0 flex items-center justify-center px-5 py-4 overflow-hidden">
      <div className="flex flex-col items-center justify-center text-center max-w-[18rem] select-none">
        <div
          aria-hidden
          className="opacity-90 pointer-events-none"
          style={{ filter: "drop-shadow(0 8px 22px rgba(225,29,42,0.16))" }}
        >
          <BrandLogoMark size={56} />
        </div>
        <p className="mt-5 text-[13.5px] font-medium text-paper/85 tracking-[-0.005em]">
          {t("emptyTitle")}
        </p>
        <p className="mt-1 text-[11.5px] text-paper/45 leading-snug">
          {t("emptyBody")}
        </p>
      </div>
    </div>
  );
}

function DotPulse() {
  return (
    <span aria-hidden className="relative inline-flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 4h8m-6 0V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-4 0v7a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Map an OrderType to its translation key under `demo.orderType`.
 *  Caller supplies the `t` so SSR/Client render the same locale. */
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

function fmt(n: number): string {
  return `${n.toFixed(2)} MAD`;
}
