"use client";

// InlineFeePanel — replaces the modal sheet for adding a fee. Lives in
// the cart, expanding under the eyebrow row when the "Fee" chip is
// active. Preset fee chips one-tap into the cart; custom amount via
// inline input + Enter. Same focus-preserving pattern as the comment
// panel.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { useDemoStore } from "@/lib/demoStore";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type FeePreset = { id: string; label: string; amount: number };

const PRESETS: FeePreset[] = [
  { id: "delivery", label: "Delivery", amount: 15 },
  { id: "service", label: "Service", amount: 10 },
  { id: "packaging", label: "Packaging", amount: 5 },
  { id: "carry-bag", label: "Carry bag", amount: 2 },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function InlineFeePanel({ open, onClose }: Props) {
  const addExtra = useDemoStore((s) => s.addExtra);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const t = useTranslations("demo.inline.fee");

  const addPreset = (p: FeePreset) => {
    addExtra({ kind: "fee", label: p.label, amount: p.amount });
    onClose();
  };

  const addCustom = () => {
    const a = parseFloat(amount);
    if (!label.trim() || !Number.isFinite(a) || a <= 0) return;
    addExtra({ kind: "fee", label: label.trim(), amount: a });
    setLabel("");
    setAmount("");
    onClose();
  };

  const valid =
    label.trim().length > 0 &&
    parseFloat(amount) > 0 &&
    Number.isFinite(parseFloat(amount));

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="fee-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.24, ease: APPLE_EASE }}
          className="overflow-hidden bg-white/[0.02] border-b border-white/[0.06]"
        >
          <div className="px-3 py-2.5">
            <p className="text-[9.5px] font-medium uppercase tracking-[0.18em] text-paper/45 mb-2">
              {t("title")}
            </p>

            <div className="flex flex-wrap gap-1 mb-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addPreset(p)}
                  className="inline-flex items-center gap-1.5 h-6 px-2 rounded-[5px] text-[10.5px] font-medium border border-white/12 text-paper/75 hover:bg-white/[0.06] hover:text-paper transition-colors"
                >
                  {p.label}
                  <span className="tabular-nums text-paper/55">+{p.amount}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && valid) addCustom();
                  if (e.key === "Escape") onClose();
                }}
                placeholder={t("labelPlaceholder")}
                className="flex-1 h-7 rounded-[5px] bg-white/[0.04] border border-white/12 px-2 text-[11.5px] text-paper placeholder:text-paper/35 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-colors"
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && valid) addCustom();
                  if (e.key === "Escape") onClose();
                }}
                placeholder="0"
                min="0"
                step="0.5"
                className="w-16 h-7 rounded-[5px] bg-white/[0.04] border border-white/12 px-2 text-[11.5px] text-paper placeholder:text-paper/35 tabular-nums focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-colors"
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={!valid}
                className="h-7 px-2.5 text-[11px] font-medium rounded-[5px] bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {t("apply")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
