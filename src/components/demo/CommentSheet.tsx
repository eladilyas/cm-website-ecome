"use client";

// CommentSheet — shared bottom sheet used for both order-level and
// line-level comments. Presets surface as one-tap chips above a free
// textarea; tapping a chip appends its label to the comment so a
// cashier can combine "Allergy warning" + "No cutlery" without
// re-typing. Active comment chips render with a brand-red fill.
//
// Same Sheet primitive used across Backoffice (light) but here in the
// dark POS scheme because it overlays the cashier surface.

import { useState } from "react";
import { Sheet } from "./Sheet";
import type { CommentPreset } from "@/data/demo/comments";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Title shown in the sheet header (e.g. "Order note" or "Item note"). */
  title: string;
  /** Optional subtitle — usually the product name for line comments. */
  subtitle?: string;
  /** Activity-aware preset chips. */
  presets: CommentPreset[];
  /** Current comment value. */
  value: string;
  /** Save handler — called with the new comment (or empty string to clear). */
  onSave: (next: string) => void;
};

export function CommentSheet({
  open,
  onClose,
  title,
  subtitle,
  presets,
  value,
  onSave,
}: Props) {
  const [draft, setDraft] = useState(value);
  // Re-seed the draft each time the sheet opens — picks up edits the
  // cashier may have made in another panel. React 19 pattern: detect
  // the open → opening transition during render and reset state then,
  // rather than chasing prop changes from an effect.
  const [wasOpen, setWasOpen] = useState(open);
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
      // Remove this preset.
      setDraft(parts.filter((p) => p !== preset.label).join(" · "));
    } else {
      // Append.
      setDraft([...parts, preset.label].join(" · "));
    }
  };

  const isPresetActive = (preset: CommentPreset) => {
    return draft.split("·").map((p) => p.trim()).includes(preset.label);
  };

  const handleSave = () => {
    onSave(draft.trim());
    onClose();
  };

  const handleClear = () => {
    setDraft("");
    onSave("");
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      scheme="dark"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={!value && !draft}
            className="h-9 px-4 text-[13px] font-medium rounded-[8px] text-paper/65 hover:text-paper hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-9 px-5 text-[13px] font-medium rounded-[8px] bg-[#E11D2A] text-white hover:bg-[#c8141f] transition-colors"
          >
            Save note
          </button>
        </div>
      }
    >
      <div className="p-5">
        {presets.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-paper/45 mb-2.5">
              Quick chips
            </p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const active = isPresetActive(preset);
                const warning = preset.tone === "warning";
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => togglePreset(preset)}
                    className={
                      "inline-flex items-center h-7 px-2.5 rounded-[6px] text-[12px] font-medium transition-colors " +
                      (active
                        ? warning
                          ? "bg-amber-400/20 text-amber-200 border border-amber-300/40"
                          : "bg-[#E11D2A]/15 text-[#E11D2A] border border-[#E11D2A]/35"
                        : warning
                          ? "border border-amber-300/25 text-amber-200/85 hover:bg-amber-400/10"
                          : "border border-white/15 text-paper/75 hover:bg-white/[0.06] hover:text-paper")
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-paper/45 mb-2">
            Note
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a custom note…"
            rows={3}
            className="w-full rounded-[8px] bg-white/[0.04] border border-white/12 px-3 py-2.5 text-[13.5px] text-paper placeholder:text-paper/35 leading-[1.45] focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-colors resize-none"
          />
          <p className="mt-2 text-[10.5px] text-paper/40 leading-snug">
            Tap chips to add or remove. Free text persists alongside chip selections.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
