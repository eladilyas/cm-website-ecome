"use client";

// Inline Active / Inactive toggle for the /admin/users list.
//
// Two-segment pill (Active · Inactive) with the current state lit.
// Deactivation requires a confirm step — disabling an internal staff
// account is a destructive action (immediate sign-out + access loss).
// Reactivation flips instantly with no confirm.

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { toggleUserActive } from "./actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function UserActiveToggle({
  userId,
  initialActive,
  userLabel,
}: {
  userId: string;
  initialActive: boolean;
  /** Human-readable account label shown in the confirm dialog
   *  (e.g. "ahmed@caissemanager.com"). */
  userLabel?: string;
}) {
  const router = useRouter();
  const [optimisticActive, setOptimisticActive] =
    useOptimistic<boolean>(initialActive);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDisable, setConfirmingDisable] = useState(false);

  const runFlip = () => {
    setError(null);
    startTransition(async () => {
      setOptimisticActive(!optimisticActive);
      const res = await toggleUserActive(userId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const flip = () => {
    if (pending) return;
    // Activations are safe — flip immediately. Deactivations sign the
    // user out everywhere; surface a confirm so it's never accidental.
    if (optimisticActive) {
      setConfirmingDisable(true);
      return;
    }
    runFlip();
  };

  return (
    <span
      className="inline-flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        role="switch"
        aria-checked={optimisticActive}
        onClick={flip}
        disabled={pending}
        title={
          optimisticActive ? "Deactivate account" : "Reactivate account"
        }
        className={
          "inline-flex items-center rounded-full border p-0.5 gap-0.5 transition-colors duration-200 " +
          (optimisticActive
            ? "border-emerald-200 bg-emerald-50"
            : "border-hairline bg-canvas") +
          (pending ? " opacity-70" : "")
        }
      >
        <span
          className={
            "h-6 px-2.5 inline-flex items-center text-[11px] font-medium rounded-full transition-colors duration-200 " +
            (optimisticActive
              ? "bg-paper text-emerald-700 shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)]"
              : "text-ink-mute")
          }
        >
          Active
        </span>
        <span
          className={
            "h-6 px-2.5 inline-flex items-center text-[11px] font-medium rounded-full transition-colors duration-200 " +
            (!optimisticActive
              ? "bg-paper text-ink shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)]"
              : "text-ink-mute")
          }
        >
          Inactive
        </span>
      </button>
      {error && (
        <span className="text-[11px] text-red-600 font-medium">{error}</span>
      )}

      <ConfirmDialog
        open={confirmingDisable}
        onCancel={() => setConfirmingDisable(false)}
        onConfirm={() => {
          setConfirmingDisable(false);
          runFlip();
        }}
        title="Deactivate this account?"
        body={
          <>
            <p>
              {userLabel ? (
                <>
                  <strong className="text-ink">{userLabel}</strong> will be
                  signed out immediately and lose admin access.
                </>
              ) : (
                "This user will be signed out immediately and lose admin access."
              )}
            </p>
            <p className="mt-2 text-ink-mute">
              Their data is preserved — you can reactivate them at any time.
            </p>
          </>
        }
        confirmLabel="Deactivate account"
        cancelLabel="Cancel"
        tone="destructive"
      />
    </span>
  );
}
