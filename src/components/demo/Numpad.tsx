"use client";

// Reusable POS numpad.
//
// Rendered in the identifier-picker (table # / beeper #) and the payment
// sheet (cash amount entry). Pure presentational — emits onPress with the
// key label. Tactile 0.97 press scale + 80ms timing.

import { motion } from "framer-motion";

export type NumpadKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "." | "C" | "back";

type Props = {
  onPress: (key: NumpadKey) => void;
  className?: string;
  /** Add a decimal point row. Default true for money entry, false for integer IDs. */
  withDecimal?: boolean;
};

const APPLE_PRESS_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function Numpad({ onPress, className = "", withDecimal = false }: Props) {
  const rows: NumpadKey[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    withDecimal ? ["C", "0", "."] : ["C", "0", "back"],
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {rows.flat().map((k) => (
        <Key key={k} k={k} onPress={onPress} />
      ))}
      {withDecimal && (
        <Key k="back" onPress={onPress} className="col-span-3" />
      )}
    </div>
  );
}

function Key({
  k,
  onPress,
  className = "",
}: {
  k: NumpadKey;
  onPress: (k: NumpadKey) => void;
  className?: string;
}) {
  const label =
    k === "back" ? <BackspaceIcon /> : k === "C" ? "C" : k;

  return (
    <motion.button
      type="button"
      onClick={() => onPress(k)}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.08, ease: [0.32, 0.72, 0, 1] }}
      className={`h-12 md:h-14 rounded-[10px] border border-white/8 bg-white/[0.04] text-paper text-[18px] md:text-[20px] font-medium tabular-nums flex items-center justify-center active:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/30 transition-colors ${className}`}
      style={{ transitionTimingFunction: APPLE_PRESS_EASE }}
    >
      {label}
    </motion.button>
  );
}

function BackspaceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M7 5h9a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 15H7l-4.5-5L7 5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M10 8.5l3 3M13 8.5l-3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Helpers consumers use to fold numpad keys into a numeric string ──

export function applyNumpadKey(current: string, k: NumpadKey, opts?: { decimal?: boolean; maxLen?: number }): string {
  const maxLen = opts?.maxLen ?? 9;
  if (k === "C") return "";
  if (k === "back") return current.slice(0, -1);
  if (k === ".") {
    if (!opts?.decimal) return current;
    if (current.includes(".")) return current;
    if (current === "") return "0.";
    return current + ".";
  }
  if (current.length >= maxLen) return current;
  if (current === "0") return k; // overwrite leading zero
  return current + k;
}
