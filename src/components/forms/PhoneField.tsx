"use client";

// International phone input. Layout:
//
//   ┌──────────────────────────────────────────────────────────┐
//   │ PHONE NUMBER *                                            │ ← floating label
//   │ 🇲🇦 +212 ▾  │  6 12 34 56 78                              │ ← always-on row
//   └──────────────────────────────────────────────────────────┘
//
// Because the country selector is always visible, the field is never
// "empty" the way a plain TextField is. The label stays in its compact
// floated position permanently — there is no centered-large state to
// fall back to and therefore no animation jump on focus.
//
// The country dropdown lives inside CountrySelect and renders via
// createPortal at z-[1000], so it always sits above other form fields
// and ancestor stacking contexts (Reveal, motion.div, modals).

import { useId, useState } from "react";
import { CountrySelect } from "./CountrySelect";
import { COUNTRY_BY_ISO } from "@/data/countries";

type Props = {
  /** Local phone digits (no country code). */
  value: string;
  onChange: (v: string) => void;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  onCountryChange: (iso: string) => void;
  error?: string;
  required?: boolean;
};

export function PhoneField({
  value,
  onChange,
  country,
  onCountryChange,
  error,
  required,
}: Props) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const errored = Boolean(error);
  const country2 = COUNTRY_BY_ISO[country];

  return (
    <div className="w-full">
      <div
        className={`relative h-14 border-b transition-colors duration-200 ${
          errored
            ? "border-[#E11D2A]"
            : focused
              ? "border-ink"
              : "border-hairline-strong"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* Label — always floated. The country selector is always visible
            so there's no useful "empty" state to fall back to. */}
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-0 top-0.5 text-[11px] uppercase tracking-[0.14em] text-ink-mute"
        >
          Phone number
          {required && <span className="text-[#E11D2A] ml-0.5">*</span>}
        </label>

        {/* Input row — bottom-aligned within the 56px container so the
            floating label has room above. */}
        <div className="absolute inset-x-0 bottom-2 flex items-center gap-3">
          <CountrySelect value={country} onChange={onCountryChange} />
          <span aria-hidden className="self-center h-5 w-px bg-hairline-strong" />
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={value}
            onChange={(e) => {
              // Allow digits + common formatting chars; libphonenumber-js
              // normalizes both at parse time.
              const clean = e.target.value.replace(/[^\d\s\-()]/g, "");
              onChange(clean);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={country2 ? localExample(country2.iso) : ""}
            aria-invalid={errored}
            aria-describedby={error ? `${id}-err` : undefined}
            className="flex-1 min-w-0 text-[16px] leading-none text-ink bg-transparent outline-none placeholder:text-ink-mute"
          />
        </div>
      </div>

      {error && (
        <p id={`${id}-err`} className="mt-2 text-[12px] leading-[1.4] text-[#E11D2A]">
          {error}
        </p>
      )}
    </div>
  );
}

// Tiny sample of what a local number looks like, used as a low-contrast
// placeholder so the field still suggests "type here". Only a handful of
// per-country hints — anything else falls back to a generic.
function localExample(iso: string): string {
  switch (iso) {
    case "MA": return "6 12 34 56 78";
    case "FR": return "6 12 34 56 78";
    case "ES": return "612 34 56 78";
    case "US": return "(555) 123-4567";
    case "GB": return "7700 900123";
    case "DE": return "151 12345678";
    case "IT": return "312 345 6789";
    case "BE": return "470 12 34 56";
    case "NL": return "6 12345678";
    case "PT": return "912 345 678";
    case "CA": return "(555) 123-4567";
    case "CH": return "78 123 45 67";
    case "AE": return "50 123 4567";
    case "SA": return "50 123 4567";
    case "DZ": return "551 23 45 67";
    case "TN": return "20 123 456";
    case "EG": return "100 123 4567";
    default:  return "phone number";
  }
}
