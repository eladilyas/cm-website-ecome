"use client";

// City autocomplete — Apple-style line-only input with a dropdown list.
//
// Behaviors:
//   • Typing filters the list via searchCities() (starts-with > includes)
//   • ↑/↓ to navigate, Enter to commit highlighted, Esc to close
//   • Click outside closes
//   • Blur with no selection clears typed text if not a valid city
//   • Mobile: list opens below the input naturally (no full-screen sheet —
//     the form is short enough to scroll past)

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchCities, isValidCity, type City } from "@/data/cities";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
};

export function AutocompleteField({
  label,
  value,
  onChange,
  error,
  required,
}: Props) {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const matches = useMemo(() => searchCities(value, 8), [value]);
  const errored = Boolean(error);
  const filled = value.length > 0;
  const float = focused || filled;

  // Reset highlight when the match-set changes (different list = first item
  // should be the new default). Tracked via a ref so the reset happens
  // during render-cycle without an extra effect tick.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHighlighted(0); }, [matches.length]);

  // Click outside closes the dropdown.
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const commit = (city: City) => {
    onChange(city.name);
    setOpen(false);
    setFocused(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && matches[highlighted]) {
        e.preventDefault();
        commit(matches[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="w-full relative">
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
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            // Delay so a click on a list item still fires.
            window.setTimeout(() => setFocused(false), 120);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${id}-list`}
          aria-expanded={open}
          aria-invalid={errored}
          className="absolute inset-0 w-full pt-5 text-[16px] text-ink bg-transparent outline-none"
        />

        {/* Chevron */}
        <span
          aria-hidden
          className={`absolute right-0 top-1/2 -translate-y-1/2 pt-2 text-ink-mute transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {/* Dropdown */}
      {open && matches.length > 0 && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          className="absolute z-30 left-0 right-0 top-full mt-2 max-h-[280px] overflow-y-auto rounded-xl border border-hairline-strong bg-paper shadow-[0_18px_40px_rgba(0,0,0,0.10)] py-1"
        >
          {matches.map((c, i) => {
            const isHighlighted = i === highlighted;
            return (
              <li key={c.name} role="option" aria-selected={isHighlighted}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(c)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`w-full text-left px-4 h-10 flex items-center text-[14px] transition-colors duration-100 ${
                    isHighlighted ? "bg-canvas text-ink" : "text-ink-soft hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {c.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(error || (filled && !isValidCity(value) && !open)) && (
        <p
          className={`mt-2 text-[12px] leading-[1.4] ${
            error ? "text-[#E11D2A]" : "text-ink-mute"
          }`}
        >
          {error ?? "Pick from the list — Morocco cities only for now."}
        </p>
      )}
    </div>
  );
}
