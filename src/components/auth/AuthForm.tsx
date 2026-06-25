"use client";

// Premium auth form primitives — shared by /signin and /signup.
//
// Design intent:
//   • Hairline inputs (no heavy boxes). Focus state is a subtle ink
//     border + a 4px ink/5 ring — feels like the input "settles in"
//     rather than lighting up.
//   • Labels live ABOVE inputs (Apple ID-style) at 11px uppercase
//     tracking-wide. Errors render inline-right of the label.
//   • Submit is full-width 52px rounded-full, ink-on-paper, with a
//     spinner replacing the label on submit.
//   • Error banner is a hairline-bordered amber/red strip above the
//     form — never inline-everywhere.
//
// Motion uses the Apple cubic-bezier already declared in globals.css.

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

// ── Field shell ─────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  optional,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
          {label}
          {optional && (
            <span className="ml-1.5 normal-case tracking-normal text-ink-mute/70 font-normal">
              (optional)
            </span>
          )}
        </span>
        {error ? (
          <span className="text-[11px] text-red-600 font-medium">{error}</span>
        ) : hint ? (
          <span className="text-[11px] text-ink-mute">{hint}</span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

// ── Input primitive ─────────────────────────────────────────────────────

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  errored?: boolean;
};

export const AuthInput = forwardRef<HTMLInputElement, InputProps>(
  function AuthInput({ errored, className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={
          // 52px tall input, hairline, generous internal padding,
          // tabular numerals for clean phone / numeric entry.
          "w-full h-[52px] px-4 rounded-xl bg-paper border text-[14px] text-ink " +
          "placeholder:text-ink-mute/70 placeholder:font-normal " +
          "tabular-nums tracking-[-0.005em] " +
          "transition-[border-color,box-shadow,background-color] duration-200 " +
          "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
          "focus:outline-none " +
          (errored
            ? "border-red-300/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/8 bg-red-50/40"
            : "border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04]") +
          (className ? ` ${className}` : "")
        }
        {...rest}
      />
    );
  },
);

// ── Password input with show/hide toggle ────────────────────────────────

type PasswordInputProps = Omit<InputProps, "type"> & {
  ariaLabel?: string;
};

export const AuthPasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function AuthPasswordInput({ errored, ariaLabel, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          aria-label={ariaLabel}
          className={
            "w-full h-[52px] pl-4 pr-12 rounded-xl bg-paper border text-[14px] text-ink " +
            "placeholder:text-ink-mute/70 placeholder:font-normal " +
            "tracking-[-0.005em] " +
            "transition-[border-color,box-shadow,background-color] duration-200 " +
            "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
            "focus:outline-none " +
            (errored
              ? "border-red-300/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/8 bg-red-50/40"
              : "border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04]") +
            (className ? ` ${className}` : "")
          }
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center text-ink-mute hover:text-ink transition-colors rounded-lg"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  },
);

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A11 11 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

// ── Submit button ───────────────────────────────────────────────────────

export function AuthSubmit({
  loading,
  children,
  ...rest
}: {
  loading?: boolean;
  children: ReactNode;
} & InputHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading || rest.disabled}
      className={
        "relative w-full h-[52px] inline-flex items-center justify-center rounded-full " +
        "bg-ink text-paper text-[14px] font-medium tracking-[-0.005em] " +
        "transition-[transform,background-color,box-shadow] duration-200 " +
        "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
        "hover:bg-ink-soft hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] " +
        "active:translate-y-0 " +
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none " +
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-ink/15"
      }
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Spinner() {
  return (
    <span className="relative w-5 h-5" aria-label="Loading">
      <svg
        className="absolute inset-0 animate-spin"
        viewBox="0 0 20 20"
        fill="none"
      >
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        <path
          d="M18 10a8 8 0 0 0-8-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// ── Top-of-form error banner ────────────────────────────────────────────

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200/80 bg-red-50/60 px-4 py-3 text-[13px] text-red-700 leading-[1.4]"
    >
      {message}
    </div>
  );
}
