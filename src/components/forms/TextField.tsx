"use client";

// Apple-style text input — line-only border, floating label, inline error
// hint. No backgrounds, no boxes, no badges. Premium and quiet.

import { forwardRef, useId, useState } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "tel" | "email";
  error?: string;
  /** Shown small, below the field. Optional contextual hint. */
  help?: string;
  autoComplete?: string;
  required?: boolean;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  /** Render a trailing slot (icon, ✓, etc) at the right of the input. */
  trailing?: React.ReactNode;
  /** Forwarded to the input for keyboard handlers etc. */
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type" | "id" | "autoComplete"
  >;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  {
    label,
    value,
    onChange,
    type = "text",
    error,
    help,
    autoComplete,
    required,
    inputMode,
    trailing,
    inputProps,
  },
  ref
) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;
  const float = focused || filled;
  const errored = Boolean(error);

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
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-0 transition-all duration-200 ${
            float
              ? "top-0.5 text-[11px] uppercase tracking-[0.14em] text-ink-mute"
              : "top-1/2 -translate-y-1/2 text-[16px] text-ink-mute"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          {label}
          {required && <span className="text-[#E11D2A] ml-0.5">*</span>}
        </label>

        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={errored}
          aria-describedby={error ? `${id}-err` : help ? `${id}-help` : undefined}
          className="absolute inset-0 w-full pt-5 text-[16px] text-ink bg-transparent outline-none placeholder:text-ink-mute pr-10"
          {...inputProps}
        />

        {trailing && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pt-2 flex items-center">
            {trailing}
          </div>
        )}
      </div>

      {(error || help) && (
        <p
          id={error ? `${id}-err` : `${id}-help`}
          className={`mt-2 text-[12px] leading-[1.4] ${
            error ? "text-[#E11D2A]" : "text-ink-mute"
          }`}
        >
          {error || help}
        </p>
      )}
    </div>
  );
});
