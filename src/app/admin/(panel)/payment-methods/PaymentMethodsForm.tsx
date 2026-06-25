"use client";

// Payment-methods form. Three method cards (CMI / Wafasalaf / Wire
// transfer), each with an enable/disable toggle + method-specific
// editable fields. Submit calls the server action; toggling a method
// off goes through a confirm dialog (production-safe by default).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { PaymentMethodConfig } from "@/server/payment-settings/service";
import { savePaymentMethods } from "./actions";

type Props = { initial: PaymentMethodConfig };

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-paper border border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04] text-[13px] text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-200 focus:outline-none";

const textareaCls =
  "w-full min-h-[64px] px-3 py-2 rounded-lg bg-paper border border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04] text-[13px] text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-200 focus:outline-none";

export function PaymentMethodsForm({ initial }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<PaymentMethodConfig>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<
    "cmi" | "wafasalaf" | "wireTransfer" | null
  >(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await savePaymentMethods(config);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  /** Toggle helper — enabling is instant; disabling requires confirm. */
  const setEnabled = (
    key: "cmi" | "wafasalaf" | "wireTransfer",
    next: boolean,
  ) => {
    if (!next) {
      setPendingDisable(key);
      return;
    }
    setConfig((c) => ({ ...c, [key]: { ...c[key], enabled: true } }));
  };

  const confirmDisable = () => {
    if (!pendingDisable) return;
    const k = pendingDisable;
    setConfig((c) => ({ ...c, [k]: { ...c[k], enabled: false } }));
    setPendingDisable(null);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* CMI — admin-controlled like the others. Demo flow today;
          flipping the toggle adds/removes it from the storefront
          picker immediately. */}
      <MethodCard
        title={config.cmi.label}
        eyebrow="Card payments"
        enabled={config.cmi.enabled}
        onToggle={(v) => setEnabled("cmi", v)}
      >
        <Field label="Display label">
          <input
            type="text"
            className={inputCls}
            value={config.cmi.label}
            onChange={(e) =>
              setConfig((c) => ({ ...c, cmi: { ...c.cmi, label: e.target.value } }))
            }
          />
        </Field>
        <Field label="Status note">
          <input
            type="text"
            className={inputCls}
            value={config.cmi.note}
            onChange={(e) =>
              setConfig((c) => ({ ...c, cmi: { ...c.cmi, note: e.target.value } }))
            }
          />
        </Field>
      </MethodCard>

      {/* Wafasalaf */}
      <MethodCard
        title={config.wafasalaf.label}
        eyebrow="Financing"
        enabled={config.wafasalaf.enabled}
        onToggle={(v) => setEnabled("wafasalaf", v)}
      >
        <Field label="Display label">
          <input
            type="text"
            className={inputCls}
            value={config.wafasalaf.label}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                wafasalaf: { ...c.wafasalaf, label: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Description">
          <input
            type="text"
            className={inputCls}
            value={config.wafasalaf.description}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                wafasalaf: { ...c.wafasalaf, description: e.target.value },
              }))
            }
          />
        </Field>
      </MethodCard>

      {/* Wire transfer */}
      <MethodCard
        title={config.wireTransfer.label}
        eyebrow="Bank transfer"
        enabled={config.wireTransfer.enabled}
        onToggle={(v) => setEnabled("wireTransfer", v)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Display label">
            <input
              type="text"
              className={inputCls}
              value={config.wireTransfer.label}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  wireTransfer: { ...c.wireTransfer, label: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Bank name">
            <input
              type="text"
              className={inputCls}
              placeholder="Banque Centrale Populaire"
              value={config.wireTransfer.bankName}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  wireTransfer: { ...c.wireTransfer, bankName: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Account holder">
            <input
              type="text"
              className={inputCls}
              placeholder="Caisse Manager SARL"
              value={config.wireTransfer.accountHolder}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  wireTransfer: {
                    ...c.wireTransfer,
                    accountHolder: e.target.value,
                  },
                }))
              }
            />
          </Field>
          <Field label="SWIFT / BIC">
            <input
              type="text"
              className={inputCls}
              placeholder="BCPOMAMC"
              value={config.wireTransfer.swift}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  wireTransfer: { ...c.wireTransfer, swift: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="RIB" className="sm:col-span-2">
            <input
              type="text"
              className={inputCls}
              placeholder="0000 0000 0000 0000 0000 0000"
              value={config.wireTransfer.rib}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  wireTransfer: { ...c.wireTransfer, rib: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="IBAN" className="sm:col-span-2">
            <input
              type="text"
              className={inputCls}
              placeholder="MA64 0000 0000 0000 0000 0000 0000"
              value={config.wireTransfer.iban}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  wireTransfer: { ...c.wireTransfer, iban: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Customer-facing reference hint" className="sm:col-span-2">
            <textarea
              className={textareaCls}
              value={config.wireTransfer.referenceHint}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  wireTransfer: {
                    ...c.wireTransfer,
                    referenceHint: e.target.value,
                  },
                }))
              }
            />
          </Field>
        </div>
      </MethodCard>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-medium text-paper hover:bg-ink-soft disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="text-[12px] text-emerald-700 font-medium">
            Saved.
          </span>
        )}
        {error && (
          <span className="text-[12px] text-red-600 font-medium">{error}</span>
        )}
      </div>

      <ConfirmDialog
        open={pendingDisable !== null}
        onCancel={() => setPendingDisable(null)}
        onConfirm={confirmDisable}
        title={
          pendingDisable === "cmi"
            ? "Disable CMI card payments?"
            : pendingDisable === "wafasalaf"
              ? "Disable Wafasalaf financing?"
              : "Disable wire transfer?"
        }
        body={
          <>
            <p>
              Customers will no longer see this payment option on the
              checkout. Existing orders already submitted are unaffected.
            </p>
            <p className="mt-2 text-ink-mute">
              You can re-enable it at any time from this page.
            </p>
          </>
        }
        confirmLabel="Disable"
        tone="destructive"
      />
    </form>
  );
}

function MethodCard({
  title,
  eyebrow,
  enabled,
  lockedReason,
  onToggle,
  children,
}: {
  title: string;
  eyebrow: string;
  enabled: boolean;
  lockedReason?: string;
  onToggle: (next: boolean) => void;
  children: React.ReactNode;
}) {
  const locked = Boolean(lockedReason);
  return (
    <section
      className={
        "rounded-xl border p-5 " +
        (locked
          ? "border-hairline bg-canvas/40"
          : enabled
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-hairline bg-paper")
      }
    >
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
            {eyebrow}
          </p>
          <h3 className="mt-0.5 text-[15px] font-semibold text-ink leading-tight">
            {title}
          </h3>
          {lockedReason && (
            <p className="mt-1.5 text-[11.5px] text-amber-700">
              {lockedReason}
            </p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          disabled={locked}
          className={
            "shrink-0 inline-flex items-center rounded-full border p-0.5 gap-0.5 transition-colors " +
            (locked
              ? "border-hairline bg-canvas opacity-60 cursor-not-allowed"
              : enabled
                ? "border-emerald-200 bg-emerald-50"
                : "border-hairline bg-canvas")
          }
        >
          <span
            className={
              "h-6 px-2.5 inline-flex items-center text-[11px] font-medium rounded-full transition-colors " +
              (enabled
                ? "bg-paper text-emerald-700 shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)]"
                : "text-ink-mute")
            }
          >
            Enabled
          </span>
          <span
            className={
              "h-6 px-2.5 inline-flex items-center text-[11px] font-medium rounded-full transition-colors " +
              (!enabled
                ? "bg-paper text-ink shadow-[0_0_0_0.5px_rgba(0,0,0,0.04)]"
                : "text-ink-mute")
            }
          >
            Disabled
          </span>
        </button>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="block text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
