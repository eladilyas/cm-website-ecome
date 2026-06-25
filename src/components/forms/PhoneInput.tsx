"use client";

// Shared phone input — premium two-cell field with a flag-aware
// searchable country selector.
//
// Used by every transactional form on the platform (signup, checkout,
// profile) so the visual + behavior is identical end-to-end. Shares
// the same `CountrySelect` portal as the marketing PhoneField on
// /start-free-trial, so the country picker UX is consistent across
// every surface that asks for a phone number.
//
// Visual register:
//   • Boxed pill — hairline border + focus ring + 4px ink/5 glow,
//     matching the rest of the auth + checkout inputs.
//   • Left cell: CountrySelect (flag + dial). Right cell: tel input.
//
// API stays compatible with what every consumer already passes —
// `phoneCode` ("+212") + `phoneNumber` — so this is a drop-in upgrade.

import { useId, useState } from "react";

import { CountrySelect } from "./CountrySelect";
import { COUNTRY_BY_ISO } from "@/data/countries";
import { PHONE_CODES } from "@/data/phoneCodes";

type Props = {
  /** Dial code, e.g. "+212". Matches AccountProfile.phoneCode. */
  phoneCode: string;
  /** National number (no leading zero, no dial). */
  phoneNumber: string;
  onPhoneCodeChange: (code: string) => void;
  onPhoneNumberChange: (num: string) => void;
  errored?: boolean;
  className?: string;
};

/** Resolve dial code → ISO. Defaults to "MA" when the dial is unknown. */
function isoForDial(dial: string): string {
  const found = PHONE_CODES.find((c) => c.code === dial);
  return found?.country ?? "MA";
}

/** ISO → "+<dial>" using the master COUNTRY_BY_ISO table. Falls back
 *  to the existing phoneCode if the ISO isn't in our map. */
function dialForIso(iso: string, fallback: string): string {
  const c = COUNTRY_BY_ISO[iso];
  return c ? `+${c.dial}` : fallback;
}

export function PhoneInput({
  phoneCode,
  phoneNumber,
  onPhoneCodeChange,
  onPhoneNumberChange,
  errored = false,
  className = "",
}: Props) {
  const id = useId();
  const [focused, setFocused] = useState(false);

  const iso = isoForDial(phoneCode);

  return (
    <div
      className={
        "relative flex items-stretch h-[52px] rounded-xl bg-paper border " +
        "transition-[border-color,box-shadow,background-color] duration-200 " +
        "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
        (errored
          ? "border-red-300/80 ring-4 ring-red-500/[0.05] bg-red-50/40"
          : focused
            ? "border-ink/40 ring-4 ring-ink/[0.04]"
            : "border-hairline hover:border-hairline-strong") +
        " " +
        className
      }
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Only blur when focus actually leaves the wrapper (not just
        // between the two inner controls).
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      {/* Country cell */}
      <div className="flex items-center px-3 border-r border-hairline">
        <CountrySelect
          value={iso}
          onChange={(newIso) =>
            onPhoneCodeChange(dialForIso(newIso, phoneCode))
          }
        />
      </div>

      {/* Number cell */}
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={phoneNumber}
        onChange={(e) =>
          onPhoneNumberChange(
            e.target.value.replace(/[^\d\s\-()]/g, ""),
          )
        }
        placeholder="6 00 00 00 00"
        aria-invalid={errored}
        className="flex-1 min-w-0 px-3.5 bg-transparent text-[14px] text-ink placeholder:text-ink-mute/70 outline-none"
      />
    </div>
  );
}
