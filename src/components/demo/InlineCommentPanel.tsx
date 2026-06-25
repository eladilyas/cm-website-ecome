"use client";

// InlineCommentPanel — replaces the modal sheet for order-level notes.
// Sits inline inside the cart, expanding under the eyebrow row when the
// "Note" chip is active. No backdrop, no focus trap, no scroll lock —
// the cashier never leaves the ordering flow to dictate an order note.
//
// Pattern: preset chips appended/toggled as `Allergy · No cutlery · …`
// in the free-text field; cashier can also type freely. Save commits
// the trimmed value; clear wipes it.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { CommentPreset } from "@/data/demo/comments";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Props = {
  open: boolean;
  onClose: () => void;
  /** Activity-aware preset chips. */
  presets: CommentPreset[];
  value: string;
  onSave: (next: string) => void;
};

export function InlineCommentPanel({
  open,
  onClose,
  presets,
  value,
  onSave,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [wasOpen, setWasOpen] = useState(open);
  const t = useTranslations("demo.inline.comment");
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  const togglePreset = (preset: CommentPreset) => {
    const parts = draft
      .split("·")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.includes(preset.label)) {
      setDraft(parts.filter((p) => p !== preset.label).join(" · "));
    } else {
      setDraft([...parts, preset.label].join(" · "));
    }
  };

  const isActive = (preset: CommentPreset) =>
    draft.split("·").map((p) => p.trim()).includes(preset.label);

  const commit = () => {
    onSave(draft.trim());
    onClose();
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="note-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.24, ease: APPLE_EASE }}
          className="overflow-hidden bg-amber-400/[0.04] border-b border-amber-400/15"
        >
          <div className="px-3 py-2.5">
            <p className="text-[9.5px] font-medium uppercase tracking-[0.18em] text-amber-300/85 mb-2">
              {t("title")}
            </p>

            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {presets.map((preset) => {
                  const active = isActive(preset);
                  const warn = preset.tone === "warning";
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => togglePreset(preset)}
                      className={
                        "inline-flex items-center h-6 px-2 rounded-[5px] text-[10.5px] font-medium transition-colors " +
                        (active
                          ? warn
                            ? "bg-amber-400/25 text-amber-100 border border-amber-300/45"
                            : "bg-[#E11D2A]/15 text-[#E11D2A] border border-[#E11D2A]/35"
                          : "border border-white/12 text-paper/75 hover:bg-white/[0.06] hover:text-paper")
                      }
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-1.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") onClose();
                }}
                placeholder={t("placeholder")}
                autoFocus
                className="flex-1 h-7 rounded-[5px] bg-white/[0.04] border border-white/12 px-2 text-[11.5px] text-paper placeholder:text-paper/35 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-colors"
              />
              {draft && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft("");
                    onSave("");
                  }}
                  className="h-7 px-2 text-[10.5px] text-paper/55 hover:text-paper hover:bg-white/[0.06] rounded-[5px] transition-colors"
                >
                  {t("clear")}
                </button>
              )}
              <button
                type="button"
                onClick={commit}
                className="h-7 px-2.5 text-[11px] font-medium rounded-[5px] bg-[#E11D2A] text-white hover:bg-[#c8141f] transition-colors"
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
