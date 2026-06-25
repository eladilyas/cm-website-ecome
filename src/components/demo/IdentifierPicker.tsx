"use client";

// Identifier picker — reconstructs screens A5 (table) and A6 (beeper).
//
// Dine-in: left grid of tables 1–12 (tap to select) OR right numpad
// (type table number).
// Take-away: only the right numpad (beeper number).
//
// Pressing Confirm advances stage to "workspace".

import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useDemoStore } from "@/lib/demoStore";
import { Numpad, applyNumpadKey } from "./Numpad";

export function IdentifierPicker() {
  const order = useDemoStore((s) => s.order);
  const setIdentifier = useDemoStore((s) => s.setIdentifier);
  const setStage = useDemoStore((s) => s.setStage);
  const [typed, setTyped] = useState("");

  if (!order) return null;

  const isDineIn = order.type === "dine-in";

  const value = typed.length > 0 ? typed : "—";

  const confirm = () => {
    if (typed.length === 0) return;
    setIdentifier(isDineIn ? `Table ${typed}` : `Beeper ${typed}`);
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-10 md:py-14">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-paper/55 mb-3">
              Step 2 · {isDineIn ? "Table" : "Beeper"}
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-paper">
              {isDineIn
                ? "Pick a table to start the order."
                : "Enter the beeper number to start the order."}
            </h1>
          </Reveal>
        </div>
        <button
          type="button"
          onClick={() => setStage("order-type")}
          className="text-[11px] uppercase tracking-[0.14em] text-paper/55 hover:text-paper transition-colors"
        >
          ← Change order type
        </button>
      </div>

      <div className={`mt-10 grid gap-8 md:gap-10 ${isDineIn ? "md:grid-cols-[1.5fr_1fr]" : "md:grid-cols-[1fr_1fr] max-w-[820px] mx-auto"}`}>
        {/* LEFT — Table grid (dine-in only) */}
        {isDineIn && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-4">
              Floor 1
            </p>
            <TableGrid
              selected={typed}
              onPick={(n) => setTyped(String(n))}
            />
            <p className="mt-6 text-[12px] text-paper/45">
              Or type a table number on the right.
            </p>
          </div>
        )}

        {/* RIGHT — Numpad pane */}
        <div>
          <div className="text-center mb-5">
            <div className="text-[64px] md:text-[72px] font-semibold tracking-[-0.04em] leading-none tabular-nums text-paper">
              {value}
            </div>
            <p className="mt-3 text-[12px] uppercase tracking-[0.14em] text-paper/45">
              {isDineIn ? "Table number" : "Beeper number"}
            </p>
          </div>
          <Numpad
            onPress={(k) => setTyped((cur) => applyNumpadKey(cur, k, { maxLen: 3 }))}
          />
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setTyped("");
                setStage("order-type");
              }}
              className="h-11 px-5 text-[14px] rounded-[10px] border border-white/10 text-paper/85 hover:text-paper hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={typed.length === 0}
              className="h-11 px-6 text-[14px] font-medium rounded-[10px] bg-[#E11D2A] text-white disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-[#c8141f] transition-colors flex-1 sm:flex-initial"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TableGrid({
  selected,
  onPick,
}: {
  selected: string;
  onPick: (n: number) => void;
}) {
  const tables = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const selectedNum = Number(selected) || 0;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 md:gap-3">
      {tables.map((n) => {
        const isSelected = n === selectedNum;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n)}
            className={`relative h-20 md:h-24 rounded-[10px] border transition-all duration-200 active:scale-[0.97] ${
              isSelected
                ? "border-[#E11D2A] bg-[#E11D2A]/10 shadow-[0_0_0_3px_rgba(225,29,42,0.18)]"
                : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            <span className="block text-[12px] uppercase tracking-[0.12em] text-paper/55 mb-1">
              Table
            </span>
            <span className="block text-[24px] md:text-[26px] font-semibold text-paper tabular-nums">
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}
