"use client";

// Payment success + receipt — reconstructs screen B7.
//
// This is the ONE place the receipt/ticket lives. By contract the cart
// never offers a pre-payment preview — a real cashier system only prints
// after the customer has paid, and the simulator now mirrors that.
//
// Composition:
//   LEFT  — success hero: brand check (scale-in), "Payment successful"
//           headline, total + change stats, action row, soft trial CTA.
//   RIGHT — paper receipt strip: monospaced, dashed dividers, brand
//           wordmark, complete order line-by-line, totals, payment
//           method + tendered + change, "Thank you" closer.
//
// Entrance choreography — the success state owns the first beat and the
// receipt arrives second. Same idea Stripe / Apple Pay use after a
// charge clears: the green check is the moment; the receipt arrives a
// half-beat later as confirmation, not competing for attention.

import Link from "next/link";
import { motion } from "framer-motion";
import { useDemoStore } from "@/lib/demoStore";
import { ACTIVITY_CAPS } from "@/data/demo/activityCapabilities";
import type { ActivityKey } from "@/data/demo/types";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { BrandLogoMark } from "@/components/ui/BrandLogoMark";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  "tpe-mobile": "TPE Mobile",
  glovo: "Glovo",
  done: "Done",
  cmi: "CMI",
  online: "Online Payment",
  "cash-on-delivery": "Cash on Delivery",
  "card-on-delivery": "Card on Delivery",
  yassir: "Yassir",
};

export function PaymentSuccess() {
  const receipt = useDemoStore((s) => s.lastReceipt);
  const newOrder = useDemoStore((s) => s.newOrder);

  if (!receipt) return null;

  const date = new Date(receipt.completedAt);
  const dateStr = date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="absolute inset-0 z-40 bg-night/97 backdrop-blur-md overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[960px] grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-10 items-center">
          {/* LEFT — success hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: APPLE_EASE }}
            className="text-center md:text-left"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: APPLE_EASE }}
              className="inline-flex"
            >
              <SuccessIcon />
            </motion.div>
            <h1 className="mt-6 text-[clamp(2rem,4.4vw,3rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-paper">
              Payment successful
            </h1>
            <p className="mt-3 text-[14px] text-paper/55">
              Order #{receipt.id.slice(-6).toUpperCase()} · {dateStr}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 max-w-[420px] mx-auto md:mx-0">
              <Stat label="Total" value={`${receipt.total.toFixed(2)} MAD`} />
              <Stat
                label="Change"
                value={`${receipt.payment.change.toFixed(2)} MAD`}
                accent={receipt.payment.change > 0 ? "amber" : "muted"}
              />
            </div>

            {/* Action row — equal-width buttons via a 2-col grid. Both
                pills are the same physical width so the row reads as a
                balanced primary / secondary pair, not a ragged set of
                fit-to-content buttons. */}
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-[440px] mx-auto md:mx-0">
              <button
                type="button"
                onClick={newOrder}
                className="h-12 text-[14px] font-medium rounded-[10px] bg-[#E11D2A] text-white hover:bg-[#c8141f] transition-colors"
              >
                Start next order
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-12 text-[14px] rounded-[10px] border border-white/10 text-paper/85 hover:bg-white/[0.04] hover:text-paper transition-colors"
              >
                Print receipt
              </button>
            </div>

            {/* Soft conversion prompt — not pushy, just there once the user
                has actually felt the product. Sits below the action row, on
                a hairline divider for visual separation. */}
            <div className="mt-8 pt-6 border-t border-white/8">
              <p className="text-[12px] uppercase tracking-[0.14em] text-paper/40 mb-2">
                Like what you see?
              </p>
              <p className="text-[14px] md:text-[15px] leading-[1.5] text-paper/75">
                Run this on your real counter with your menu, your team, and your tills.{" "}
                <Link
                  href="/start-free-trial"
                  className="text-paper underline-offset-4 hover:underline"
                >
                  Talk to us &rarr;
                </Link>
              </p>
            </div>
          </motion.div>

          {/* RIGHT — receipt strip. Arrives AFTER the success hero has
              settled (delay 0.5s) so the user experiences "paid →
              receipt" as a real two-beat moment, not a simultaneous
              reveal. Stripe / Apple Pay use the same cadence. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.5, ease: APPLE_EASE }}
            className="rounded-[12px] bg-paper text-ink shadow-[0_30px_60px_rgba(0,0,0,0.55)] p-6 md:p-8 font-mono"
          >
            {/* Brand mark + wordmark at the top of the receipt — same
                brand artifact used elsewhere on the site, kept small so
                the receipt reads as paper-with-logo rather than a
                logo-with-text-attached. */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center">
                <BrandLogoMark size={32} />
              </div>
              <p className="mt-2 text-[12px] font-semibold tracking-[0.18em] uppercase">
                Caisse Manager
              </p>
              <p className="mt-1 text-[10px] text-ink-mute uppercase tracking-[0.14em]">
                Order receipt
              </p>
              <p className="mt-3 text-[11px] text-ink-soft">{dateStr}</p>
            </div>

            <div className="mt-5 border-t border-dashed border-ink-mute/30" />

            <div className="mt-4 space-y-1.5 text-[12px]">
              <ReceiptRow label="Order #" value={receipt.id.slice(-6).toUpperCase()} />
              <ReceiptRow label="Type" value={labelForType(receipt.orderType)} />
              {receipt.identifier && (
                <ReceiptRow label={receipt.orderType === "dine-in" ? "Table" : "Beeper"} value={receipt.identifier} />
              )}
            </div>

            <div className="mt-4 border-t border-dashed border-ink-mute/30" />

            <ul className="mt-4 space-y-2 text-[12px]">
              {receipt.lines.map((l, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="tabular-nums w-7 text-ink-mute">{l.qty}×</span>
                  <span className="flex-1 truncate">{l.name}</span>
                  <span className="tabular-nums">{l.subtotal.toFixed(2)}</span>
                </li>
              ))}
              {receipt.extras.map((e, i) => (
                <li key={`extra-${i}`} className="flex items-baseline gap-3 text-ink-soft">
                  <span className="w-7 text-ink-mute">+</span>
                  <span className="flex-1">{e.label}</span>
                  <span className="tabular-nums">{e.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-dashed border-ink-mute/30" />

            <div className="mt-4 space-y-1 text-[12px]">
              <ReceiptRow label="Subtotal" value={receipt.subtotal.toFixed(2)} />
              {receipt.taxTotal != null && receipt.taxTotal > 0 && (
                <ReceiptRow
                  label={`VAT (${vatRateLabel(receipt.activity)})`}
                  value={receipt.taxTotal.toFixed(2)}
                  muted
                />
              )}
              <div className="flex items-baseline justify-between font-semibold text-[14px] mt-1">
                <span>TOTAL</span>
                <span className="tabular-nums">{receipt.total.toFixed(2)} MAD</span>
              </div>
            </div>

            <div className="mt-4 border-t border-dashed border-ink-mute/30" />

            <div className="mt-4 space-y-1 text-[12px]">
              {/* V2C — payments[] always has at least 1 entry. For a
                  single tender this matches V1 visually; for split
                  payments each tender renders on its own row with
                  amount (not tendered) so the math reads cleanly. */}
              {receipt.payments.length > 1 ? (
                receipt.payments.map((p) => (
                  <ReceiptRow
                    key={p.id}
                    label={METHOD_LABEL[p.method] ?? p.method}
                    value={p.amount.toFixed(2)}
                  />
                ))
              ) : (
                <ReceiptRow
                  label={METHOD_LABEL[receipt.payment.method] ?? receipt.payment.method}
                  value={receipt.payment.tendered.toFixed(2)}
                />
              )}
              {receipt.payment.change > 0 && (
                <ReceiptRow label="Change" value={receipt.payment.change.toFixed(2)} />
              )}
            </div>

            <p className="mt-6 text-center text-[10px] text-ink-mute uppercase tracking-[0.14em]">
              Thank you · cm.example.com
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "amber" | "muted";
}) {
  const color =
    accent === "amber"
      ? "text-amber-300"
      : accent === "muted"
        ? "text-paper/45"
        : "text-paper";
  return (
    <div className="rounded-[10px] border border-white/8 bg-white/[0.03] p-4 text-left">
      <p className="text-[10px] uppercase tracking-[0.14em] text-paper/45">
        {label}
      </p>
      <p className={`mt-1.5 text-[22px] md:text-[26px] font-semibold tabular-nums tracking-[-0.022em] ${color}`}>
        {value}
      </p>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={muted ? "text-ink-mute" : "text-ink-soft"}>{label}</span>
      <span className={"tabular-nums " + (muted ? "text-ink-mute" : "")}>
        {value}
      </span>
    </div>
  );
}

function vatRateLabel(activity: ActivityKey): string {
  return `${(ACTIVITY_CAPS[activity].taxRate * 100).toFixed(0)}%`;
}

function SuccessIcon() {
  return <BrandCheck variant="circle" size={28} />;
}

function labelForType(t: string) {
  switch (t) {
    case "take-away":
      return "Take Away";
    case "dine-in":
      return "Dine In";
    case "glovo":
      return "Glovo";
    case "done":
      return "Done";
    default:
      return t;
  }
}
