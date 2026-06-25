"use client";

// Payment sheet — reconstructs screen B6.
//
// Right pane overlays the workspace: method list (left column), and a
// total / change / numpad / tendered entry (right column). Complete
// Payment transitions the stage to "success" and snapshots the receipt.

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import {
  useDemoStore,
  selectOrderTotals,
  giftCardBalance,
  type PaymentMethod,
} from "@/lib/demoStore";
import { capsFor } from "@/data/demo/activityCapabilities";
import { Numpad, applyNumpadKey } from "./Numpad";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type MethodGroup = {
  label: string;
  methods: { id: PaymentMethod; label: string }[];
};

// Master list of every supported method, grouped for UI presentation.
// PaymentSheet filters this against the active activity's
// `enabledPaymentMethods` capability so a bakery doesn't see Glovo and a
// fast-food till doesn't lose its delivery section.
const ALL_METHODS: MethodGroup[] = [
  {
    label: "In-store",
    methods: [
      { id: "cash", label: "Cash" },
      { id: "tpe-mobile", label: "TPE Mobile" },
      { id: "cmi", label: "CMI" },
    ],
  },
  {
    label: "Delivery",
    methods: [
      { id: "glovo", label: "Glovo" },
      { id: "done", label: "Done" },
      { id: "yassir", label: "Yassir" },
    ],
  },
  {
    label: "Other",
    methods: [
      { id: "online", label: "Online Payment" },
      { id: "cash-on-delivery", label: "Cash on Delivery" },
      { id: "card-on-delivery", label: "Card on Delivery" },
      { id: "gift-card", label: "Gift Card" },
      { id: "store-credit", label: "Store Credit" },
    ],
  },
];

export function PaymentSheet() {
  const activity = useDemoStore((s) => s.activity);
  const payment = useDemoStore((s) => s.payment);
  const setPaymentMethod = useDemoStore((s) => s.setPaymentMethod);
  const setTendered = useDemoStore((s) => s.setTendered);
  const setGiftCardCode = useDemoStore((s) => s.setGiftCardCode);
  const addPaymentToSplit = useDemoStore((s) => s.addPaymentToSplit);
  const removePaymentFromSplit = useDemoStore((s) => s.removePaymentFromSplit);
  const completePayment = useDemoStore((s) => s.completePayment);
  const setStage = useDemoStore((s) => s.setStage);

  // Wrap with useShallow — selectOrderTotals returns a fresh object snapshot
  // each call; without shallow-equality Zustand would treat every render as a
  // changed snapshot and infinite-loop.
  const totals = useDemoStore(useShallow(selectOrderTotals));

  // Local mirror of the tendered amount as a typed string so the numpad UX
  // matches a real till entry (leading zeros, decimal, etc).
  const tenderedStr = useDemoStore((s) =>
    s.payment ? (s.payment.tendered ? String(s.payment.tendered) : "") : ""
  );

  // Filter the master method list to what the active activity actually
  // accepts. A bakery shouldn't see Glovo; a barber shouldn't see
  // delivery methods. Groups with zero remaining methods are dropped.
  const methodGroups = useMemo<MethodGroup[]>(() => {
    const caps = capsFor(activity);
    const allowed = caps?.enabledPaymentMethods;
    if (!allowed) return ALL_METHODS;
    const allowedSet = new Set(allowed);
    return ALL_METHODS.map((g) => ({
      ...g,
      methods: g.methods.filter((m) => allowedSet.has(m.id)),
    })).filter((g) => g.methods.length > 0);
  }, [activity]);

  useEffect(() => {
    // Esc closes the sheet (back to workspace).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStage("workspace");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setStage]);

  // Guard: if beginPayment defaulted to a method this activity doesn't
  // accept, snap to the first enabled method. Cheap, runs once when
  // the sheet opens.
  useEffect(() => {
    if (!payment) return;
    const flat = methodGroups.flatMap((g) => g.methods);
    if (flat.length === 0) return;
    if (!flat.some((m) => m.id === payment.method)) {
      setPaymentMethod(flat[0].id);
    }
  }, [payment, methodGroups, setPaymentMethod]);

  if (!payment) return null;

  const total = totals.total;
  const splits = payment.pendingPayments ?? [];
  const paidSoFar = splits.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, total - paidSoFar);

  const tendered = parseFloat(tenderedStr || "0");
  const change = Math.max(0, tendered - remaining);
  const isCash = payment.method === "cash";
  const isGiftCard = payment.method === "gift-card";

  // Gift-card branch: balance derived deterministically from the
  // card # (see giftCardBalance in demoStore). When a valid code is
  // entered, auto-fill the tender to min(balance, remaining).
  const cardCode = payment.giftCardCode ?? "";
  const cardBalance = isGiftCard ? giftCardBalance(cardCode) : 0;
  const cardValid = isGiftCard && cardCode.length >= 4 && cardBalance > 0;
  const cardApplyAmount = cardValid ? Math.min(cardBalance, remaining) : 0;

  // For non-cash, non-gift-card methods, the tender always equals
  // the remaining amount (one tap = approved). Auto-fill so the
  // cashier doesn't have to type.
  const effectiveTender = isCash
    ? tendered
    : isGiftCard
      ? cardApplyAmount
      : remaining;

  const canAddSplit = effectiveTender > 0 && effectiveTender < remaining;
  const canComplete =
    remaining === 0 ||
    effectiveTender >= remaining;

  const press = (k: Parameters<typeof applyNumpadKey>[1]) =>
    setTendered(
      parseFloat(applyNumpadKey(tenderedStr, k, { decimal: true, maxLen: 8 }) || "0")
    );

  const addSplit = () => {
    // For non-cash methods, the active tender wasn't typed — push
    // the effective amount through setTendered first so the
    // committed split has the right value.
    if (!isCash && effectiveTender > 0) {
      setTendered(effectiveTender);
      // Defer so the next addPaymentToSplit reads the updated state.
      // queueMicrotask runs before paint, so the UI never shows the
      // intermediate state.
      queueMicrotask(() => addPaymentToSplit());
    } else {
      addPaymentToSplit();
    }
  };

  const finishPayment = () => {
    // For non-cash methods, sync the tender into state so the final
    // Payment in the receipt carries the right amount.
    if (!isCash && effectiveTender > 0 && tendered !== effectiveTender) {
      setTendered(effectiveTender);
      queueMicrotask(() => completePayment());
    } else {
      completePayment();
    }
  };

  const methodLabelOf = (m: PaymentMethod) =>
    methodGroups.flatMap((g) => g.methods).find((mm) => mm.id === m)?.label ?? m;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: APPLE_EASE }}
      className="absolute inset-0 z-40 bg-night/95 backdrop-blur-sm"
    >
      <div className="h-full flex flex-col">
        <header className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-paper">
            Complete Payment
          </h2>
          <button
            type="button"
            onClick={() => setStage("workspace")}
            aria-label="Close payment"
            className="h-8 w-8 rounded-lg text-paper/55 hover:text-paper hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] overflow-hidden">
          {/* LEFT — Methods, grouped (filtered to active activity's
              enabledPaymentMethods). Stacks above the amount panel on
              mobile + tablet (<lg); becomes a sidebar on lg+ where the
              widescreen viewport can host the side-by-side layout. */}
          <div className="lg:border-r border-b border-white/8 lg:border-b-0 overflow-y-auto px-3 md:px-4 py-3 md:py-4">
            {methodGroups.map((g) => (
              <div key={g.label} className="mb-5 last:mb-0">
                <p className="text-[10px] uppercase tracking-[0.14em] text-paper/45 mb-2 px-2">
                  {g.label}
                </p>
                <ul className="space-y-1">
                  {g.methods.map((m) => {
                    const active = payment.method === m.id;
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`relative w-full text-left px-3 h-11 rounded-lg text-[14px] flex items-center transition-colors ${
                            active
                              ? "bg-[#E11D2A]/12 text-paper"
                              : "text-paper/80 hover:bg-white/[0.04] hover:text-paper"
                          }`}
                        >
                          {active && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#E11D2A]"
                            />
                          )}
                          {m.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* RIGHT — Amounts + active tender + splits */}
          <div className="overflow-y-auto p-4 sm:p-5 md:p-7">
            <div className="w-full max-w-[460px] mx-auto">
              {/* Total + remaining hero */}
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-2">
                  {splits.length > 0 ? "Remaining" : "Total amount"}
                </p>
                <div className="text-[44px] md:text-[56px] font-semibold tracking-[-0.022em] leading-none tabular-nums text-paper">
                  {remaining.toFixed(2)}
                  <span className="ml-2 text-[18px] md:text-[22px] text-paper/45 align-middle">
                    MAD
                  </span>
                </div>
                {splits.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-paper/55 tabular-nums">
                    Order total {total.toFixed(2)} · paid {paidSoFar.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Quick equal-split — only shown before any splits exist
                  and only when the order has a real total. Each chip
                  divides the total into N shares and pre-fills the
                  active tender amount; the cashier picks the method for
                  each share and confirms with "Add to split" + complete
                  on the last chunk. Keeps the multi-tender flow effortless
                  for the most common case (a table of 2-5 splitting
                  evenly) without forcing the cashier to do mental math. */}
              {splits.length === 0 && total > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-paper/45 mb-2 text-center">
                    Split equally
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    {[2, 3, 4, 5].map((n) => {
                      const share = Math.round((total / n) * 100) / 100;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setTendered(share)}
                          className="group inline-flex flex-col items-center justify-center h-12 px-3 rounded-[8px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 transition-colors min-w-[68px]"
                          title={`Each share: ${share.toFixed(2)} MAD`}
                        >
                          <span className="text-[11px] uppercase tracking-[0.10em] text-paper/55 group-hover:text-paper/75 transition-colors">
                            ÷{n}
                          </span>
                          <span className="text-[11.5px] font-medium tabular-nums text-paper/85 leading-none">
                            {share.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pending splits — list with remove */}
              {splits.length > 0 && (
                <div className="mt-5 rounded-[10px] border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  <p className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-[0.14em] text-paper/45">
                    Splits
                  </p>
                  <ul className="divide-y divide-white/[0.04]">
                    {splits.map((p) => (
                      <li
                        key={p.id}
                        className="px-4 py-2.5 flex items-center justify-between gap-3"
                      >
                        <span className="text-[13px] text-paper/85">
                          {methodLabelOf(p.method)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium tabular-nums text-paper">
                            {p.amount.toFixed(2)} MAD
                          </span>
                          <button
                            type="button"
                            onClick={() => removePaymentFromSplit(p.id)}
                            aria-label="Remove split"
                            className="h-7 w-7 rounded text-paper/45 hover:text-paper hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {remaining === 0 ? (
                <div className="mt-6 rounded-[10px] border border-emerald-400/25 bg-emerald-400/[0.05] p-5 text-center">
                  <p className="text-[14px] text-emerald-200">
                    Splits cover the order. Click Complete to finalize.
                  </p>
                </div>
              ) : isCash ? (
                <>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-[10px] border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-paper/45">
                        Tendered
                      </p>
                      <p className="mt-1.5 text-[20px] font-semibold tabular-nums text-paper">
                        {tendered.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-[10px] border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-paper/45">
                        Change
                      </p>
                      <p
                        className={`mt-1.5 text-[20px] font-semibold tabular-nums ${
                          change > 0 ? "text-emerald-400" : "text-paper/45"
                        }`}
                      >
                        {change.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Numpad onPress={press} withDecimal />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[20, 50, 100, 200].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTendered(preset)}
                        className="h-9 px-3 text-[12px] font-medium rounded-lg border border-white/10 bg-white/[0.04] text-paper/85 hover:bg-white/[0.10] hover:text-paper transition-colors tabular-nums"
                      >
                        {preset} MAD
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTendered(Math.ceil(remaining))}
                      className="h-9 px-3 text-[12px] font-medium rounded-lg border border-white/10 bg-white/[0.04] text-paper/85 hover:bg-white/[0.10] hover:text-paper transition-colors tabular-nums"
                    >
                      Exact ({Math.ceil(remaining)})
                    </button>
                  </div>
                </>
              ) : isGiftCard ? (
                <div className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="gift-card-code"
                      className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-1.5 block"
                    >
                      Gift card number
                    </label>
                    <input
                      id="gift-card-code"
                      type="text"
                      inputMode="numeric"
                      value={cardCode}
                      onChange={(e) =>
                        setGiftCardCode(
                          e.target.value.replace(/\D/g, "").slice(0, 16),
                        )
                      }
                      placeholder="Enter 4-16 digits"
                      className="w-full h-12 px-3 rounded-lg bg-white/[0.04] border border-white/[0.10] text-[16px] tracking-[0.12em] text-paper placeholder:text-paper/35 focus:outline-none focus:border-white/[0.25] tabular-nums"
                      autoFocus
                    />
                  </div>
                  {cardValid ? (
                    <div className="rounded-[10px] border border-emerald-400/25 bg-emerald-400/[0.05] p-4 text-center">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-300/85 mb-1">
                        Balance
                      </p>
                      <p className="text-[22px] font-semibold tabular-nums text-paper">
                        {cardBalance.toFixed(2)}{" "}
                        <span className="text-[12px] text-paper/55">MAD</span>
                      </p>
                      <p className="mt-2 text-[12px] text-paper/70">
                        Applying{" "}
                        <span className="text-paper font-medium tabular-nums">
                          {cardApplyAmount.toFixed(2)} MAD
                        </span>{" "}
                        from this card.
                      </p>
                    </div>
                  ) : cardCode.length > 0 ? (
                    <p className="text-[12px] text-amber-300/85 text-center">
                      Card too short — enter at least 4 digits.
                    </p>
                  ) : (
                    <p className="text-[12px] text-paper/55 text-center">
                      Demo accepts any code · balance is derived deterministically.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-[10px] border border-white/8 bg-white/[0.03] p-5 text-center">
                  <p className="text-[14px] text-paper/85">
                    Charge {remaining.toFixed(2)} MAD via{" "}
                    <span className="font-semibold text-paper">
                      {methodLabelOf(payment.method)}
                    </span>
                    .
                  </p>
                  <p className="mt-2 text-[12px] text-paper/55">
                    Demo mode — no real transaction.
                  </p>
                </div>
              )}

              {/* Action row — Cancel + Add to splits + Complete */}
              <div
                className={
                  "mt-7 grid gap-3 " +
                  (remaining > 0 && canAddSplit
                    ? "grid-cols-[auto_1fr_1fr]"
                    : "grid-cols-2")
                }
              >
                <button
                  type="button"
                  onClick={() => setStage("workspace")}
                  className="h-12 px-4 text-[14px] rounded-[10px] border border-white/10 text-paper/85 hover:bg-white/[0.04] hover:text-paper transition-colors"
                >
                  Cancel
                </button>
                {remaining > 0 && canAddSplit && (
                  <button
                    type="button"
                    onClick={addSplit}
                    className="h-12 text-[14px] font-medium rounded-[10px] border border-white/15 bg-white/[0.04] text-paper hover:bg-white/[0.08] transition-colors"
                  >
                    Add to splits
                  </button>
                )}
                <button
                  type="button"
                  onClick={finishPayment}
                  disabled={!canComplete}
                  className="h-12 text-[14px] font-medium rounded-[10px] bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Complete payment
                </button>
              </div>
              {isCash && !canComplete && remaining > 0 && (
                <p className="mt-3 text-center text-[12px] text-paper/50">
                  Tender at least {remaining.toFixed(2)} MAD or add this amount
                  to splits and switch methods.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
