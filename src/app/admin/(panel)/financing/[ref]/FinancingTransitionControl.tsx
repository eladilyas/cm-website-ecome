"use client";

// Admin financing-status transition control.
//
// Destructive transitions (REJECTED, CANCELLED) are terminal — once
// applied the application is dead and a customer-facing email goes
// out. Those go through a `ConfirmDialog` with the destructive tone
// so a misclick doesn't kill a deal. Forward-progress transitions
// (UNDER_REVIEW → APPROVED → ACTIVE → PAID_OFF) apply instantly.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FinancingStatus } from "@prisma/client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { adminTransitionFinancing } from "./actions";

type Option = {
  value: FinancingStatus;
  label: string;
  tone: "neutral" | "good" | "warn" | "bad" | "info";
};

const TERMINAL_DESTRUCTIVE: ReadonlySet<FinancingStatus> = new Set([
  "REJECTED",
  "CANCELLED",
]);

export function FinancingTransitionControl({
  requestRef,
  options,
}: {
  requestRef: string;
  options: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingFor, setConfirmingFor] = useState<Option | null>(null);

  const runPick = (status: FinancingStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await adminTransitionFinancing(requestRef, status);
      if (!res.ok) setError(res.error);
      else router.refresh();
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
        title={
          confirmingFor?.value === "REJECTED"
            ? "Reject this financing request?"
            : "Cancel this financing request?"
        }
        body={
          <>
            <p>
              This decision is{" "}
              <strong className="text-ink">final</strong> — the customer
              will be notified by email and the application moves into a
              terminal state with no further transitions.
            </p>
            <p className="mt-2 text-ink-mute">
              Use {confirmingFor?.value === "REJECTED" ? "Reject" : "Cancel"}{" "}
              only when you&rsquo;re certain. If the file needs more
              information, leave it on Under review instead.
            </p>
          </>
        }
        confirmLabel={
          confirmingFor?.value === "REJECTED" ? "Reject" : "Cancel application"
        }
        tone="destructive"
      />
    </div>
  );
}
