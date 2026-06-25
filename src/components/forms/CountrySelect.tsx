"use client";

// Searchable country-code picker. Trigger is inline (sits inside the
// PhoneField row); the dropdown panel renders via React.createPortal at
// document.body z-[1000] with a viewport-fixed position computed from the
// trigger's bounding box. Portaling escapes every ancestor stacking
// context so the dropdown is always above other form fields, the sticky
// CTA, etc.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  COUNTRIES,
  COUNTRY_BY_ISO,
  flagEmoji,
  searchCountries,
  type Country,
} from "@/data/countries";
import { BrandCheck } from "@/components/ui/BrandCheck";

type Props = {
  value: string; // ISO code
  onChange: (iso: string) => void;
  ariaLabel?: string;
};

type PanelPos = { left: number; top: number; width: number };

const PANEL_WIDTH = 320;
const PANEL_MIN_VIEWPORT_GAP = 16; // keep ≥16px from viewport edges

export function CountrySelect({
  value,
  onChange,
  ariaLabel = "Country code",
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [pos, setPos] = useState<PanelPos | null>(null);

  const current: Country = COUNTRY_BY_ISO[value] ?? COUNTRIES[0];
  const matches = useMemo(() => searchCountries(query, 60), [query]);

  // SSR-safe portal mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Compute the panel position whenever it opens or the viewport changes.
  const recomputePosition = () => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const w = Math.min(PANEL_WIDTH, window.innerWidth - PANEL_MIN_VIEWPORT_GAP * 2);
    let left = r.left;
    if (left + w > window.innerWidth - PANEL_MIN_VIEWPORT_GAP) {
      left = Math.max(PANEL_MIN_VIEWPORT_GAP, window.innerWidth - w - PANEL_MIN_VIEWPORT_GAP);
    }
    setPos({ left, top: r.bottom + 8, width: w });
  };

  useLayoutEffect(() => {
    if (!open) return;
    recomputePosition();
    const onScroll = () => recomputePosition();
    const onResize = () => recomputePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Reset query + highlight + focus search when opening.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setHighlighted(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Click outside (anywhere not the trigger and not the portaled panel) closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // ESC closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const commit = (c: Country) => {
    onChange(c.iso);
    setOpen(false);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && matches[highlighted]) {
      e.preventDefault();
      commit(matches[highlighted]);
    }
  };

  const panel = open && pos && (
    <div
      ref={panelRef}
      role="listbox"
      aria-label="Countries"
      className="fixed z-[1000] rounded-xl border border-hairline-strong bg-paper shadow-[0_18px_40px_rgba(0,0,0,0.18)] overflow-hidden"
      style={{ left: pos.left, top: pos.top, width: pos.width }}
    >
      <div className="p-2 border-b border-hairline">
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
          }}
          onKeyDown={onSearchKey}
          placeholder="Search country or dial code"
          className="w-full h-9 px-3 text-[14px] rounded-lg bg-canvas text-ink placeholder:text-ink-mute outline-none focus:bg-fog transition-colors"
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        />
      </div>
      <ul className="max-h-[280px] overflow-y-auto py-1">
        {matches.length === 0 ? (
          <li className="px-4 py-6 text-center text-[13px] text-ink-mute">No matches.</li>
        ) : (
          matches.map((c, i) => {
            const isHighlighted = i === highlighted;
            const isSelected = c.iso === value;
            return (
              <li key={c.iso}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(c)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`w-full text-left px-3 h-10 flex items-center gap-3 text-[14px] transition-colors duration-100 ${
                    isHighlighted ? "bg-canvas text-ink" : "text-ink-soft hover:bg-canvas hover:text-ink"
                  }`}
                >
                  <span aria-hidden className="text-[18px] leading-none">
                    {flagEmoji(c.iso)}
                  </span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-ink-mute tabular-nums shrink-0">+{c.dial}</span>
                  {isSelected && (
                    <span aria-label="selected" className="text-[#E11D2A] shrink-0">
                      <BrandCheck variant="inline" size={14} />
                    </span>
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[15px] text-ink hover:opacity-80 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ink/20 rounded"
      >
        <span aria-hidden className="text-[18px] leading-none">
          {flagEmoji(current.iso)}
        </span>
        <span className="tabular-nums text-ink-soft">+{current.dial}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          className={`text-ink-mute transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          <path
            d="M2 4l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
