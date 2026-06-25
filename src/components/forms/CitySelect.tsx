"use client";

// Shared city dropdown — Moroccan cities only. Used by every
// transactional form that asks for a shipping or billing city
// (checkout, account profile if billing is later added there).
// Source of truth: src/data/moroccoCities.ts.
//
// Same visual register as PhoneInput so forms feel like one system.

import { MOROCCO_CITIES } from "@/data/moroccoCities";

type Props = {
  value: string;
  onChange: (city: string) => void;
  errored?: boolean;
  className?: string;
  placeholder?: string;
};

export function CitySelect({
  value,
  onChange,
  errored = false,
  className = "",
  placeholder = "Select a city",
}: Props) {
  const borderTone = errored
    ? "border-[#E11D2A]/60 focus:border-[#E11D2A] focus:ring-[#E11D2A]/10"
    : "border-hairline focus:border-hairline-strong focus:ring-ink/10";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        "h-11 w-full rounded-xl border bg-paper px-3.5 text-[14px] text-ink focus:outline-none focus:ring-2 transition-all " +
        borderTone +
        " " +
        className
      }
      autoComplete="address-level2"
      aria-invalid={errored}
    >
      <option value="">{placeholder}</option>
      {MOROCCO_CITIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
