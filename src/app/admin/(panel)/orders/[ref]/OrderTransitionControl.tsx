"use client";

// Admin order-status transition control.
//
// Destructive / terminal transitions (CANCELLED, REFUNDED) require a
// confirm step. Forward-progress transitions (PENDING → PAID →
// PREPARING → SHIPPED → DELIVERED) apply instantly — operators do
// these multiple times per day and a confirm would just add friction.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { adminTransitionOrder } from "./actions";

type Option = {
  value: OrderStatus;
  label: string;
  tone: "neutral" | "good" | "warn" | "bad" | "info";
};

const TERMINAL_DESTRUCTIVE: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "CANCELLED",
]);

export function OrderTransitionControl({
  orderRef,
  options,
}: {
  orderRef: string;
  options: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingFor, setConfirmingFor] = useState<Option | null>(null);

  const runPick = (status: OrderStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await adminTransitionOrder(orderRef, status);
      if (!res.ok) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const pick = (o: Option) => {
    if (TERMINAL_DESTRUCTIVE.has(o.value)) {
      setConfirmingFor(o);
      return;
    }
    runPick(o.value);
  };

  if (options.length === 0) {
    return (
      <span className="text-[12.5px] text-ink-mute italic">
        Terminal state.
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => pick(o)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-hairline-strong bg-paper text-[12.5px] font-medium text-ink-soft hover:text-ink hover:bg-fog disabled:opacity-50 transition-colors"
        >
          {o.label}
          <span aria-hidden>→</span>
        </button>
      ))}
      {error && (
        <span className="text-[11.5px] font-medium text-red-600 ml-1">
          {error}
        </span>
      )}

      <ConfirmDialog
        open={confirmingFor !== null}
        onCancel={() => setConfirmingFor(null)}
        onConfirm={() => {
          const target = confirmingFor;
          setConfirmingFor(null);
          if (target) runPick(target.value);
        }}
        title="Cancel this order?"
        body={
          <>
            <p>
              <strong className="text-ink">{orderRef}</strong> will move to{" "}
              <strong className="text-ink">
                {confirmingFor?.label.toLowerCase()}
              </strong>{" "}
              and the customer will be notified by email. This is a terminal
              state.
            </p>
            <p className="mt-2 text-ink-mute">
              Already-paid orders require a separate refund through the
              payment provider — this only records the order-side decision.
            </p>
          </>
        }
        confirmLabel="Cancel order"
        tone="destructive"
      />
    </div>
  );
}
