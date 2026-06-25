"use client";

// ActionMenu — the unified contextual action engine for the POS
// simulator. One dropdown component drives every "more actions"
// surface across the cart (eyebrow + each line row), the kitchen
// (per-ticket), and any other surface that needs a compact, focused
// command palette anchored to a trigger.
//
// Why portal? Two cart layers (the dark cart panel + the sticky
// eyebrow) and the kitchen ticket cards both clip via `overflow-hidden`
// at various points. Rendering through createPortal escapes those
// clipping boxes so the menu can float above the entire workspace at
// z-[70] without any container ever cropping it.
//
// Positioning is computed from the trigger's getBoundingClientRect at
// open time + on window resize. The menu prefers right-alignment (its
// right edge lines up with the trigger's right edge) unless that would
// overflow the left viewport edge, in which case it falls back to
// left-alignment. Vertically, it sits 6px below the trigger; if that
// would overflow the bottom of the viewport it flips above.
//
// Esc + click-outside both close.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Empty subscribe handler for useSyncExternalStore — we only care about
 *  the getSnapshot/getServerSnapshot difference (returns true on client,
 *  false on server). No external store actually changes. */
const subscribeNoop = () => () => {};

type Align = "left" | "right";
type Placement = "below" | "above";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Element the menu anchors to. Position recomputed each open. */
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  /** Default: right (menu's right edge aligns with trigger's right). */
  align?: Align;
  /** Default 220px. Override for unusually-content-heavy menus. */
  width?: number;
};

type ResolvedPos = {
  top: number;
  /** Either `left` or `right` is set, never both. */
  left?: number;
  right?: number;
  placement: Placement;
};

export function ActionMenu({
  open,
  onClose,
  anchorRef,
  children,
  align = "right",
  width = 220,
}: Props) {
  const [pos, setPos] = useState<ResolvedPos | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Only render the portal client-side. useSyncExternalStore is the
  // React 19 lint-clean way to read a "are we mounted on the client"
  // signal during render without setState-in-effect.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const resolvePosition = useCallback(() => {
    const trigger = anchorRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 6;
    const estimatedHeight = 280; // generous upper bound for typical menus

    // Vertical: prefer below, flip above if it would overflow.
    let placement: Placement = "below";
    let top = rect.bottom + gap;
    if (top + estimatedHeight > vh - 8 && rect.top - gap - estimatedHeight > 8) {
      placement = "above";
      top = rect.top - gap;
    }

    // Horizontal: prefer the requested side, fall back if it would clip.
    let resolved: Pick<ResolvedPos, "left" | "right"> = {};
    if (align === "right") {
      const right = vw - rect.right;
      if (rect.right - width >= 8) {
        resolved = { right };
      } else {
        resolved = { left: Math.max(8, rect.left) };
      }
    } else {
      const left = rect.left;
      if (left + width <= vw - 8) {
        resolved = { left };
      } else {
        resolved = { right: Math.max(8, vw - rect.right) };
      }
    }

    setPos({ top, placement, ...resolved });
  }, [anchorRef, align, width]);

  // Recompute on open + when the window resizes or scrolls.
  useLayoutEffect(() => {
    if (!open) return;
    resolvePosition();
    const onResize = () => resolvePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, resolvePosition]);

  // Esc + click-outside close. The mousedown listener is registered one
  // tick later so the click that OPENED the menu doesn't immediately
  // close it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      const tgt = e.target as Node;
      if (menuRef.current && menuRef.current.contains(tgt)) return;
      if (anchorRef.current && anchorRef.current.contains(tgt)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      window.addEventListener("mousedown", onDown);
    }, 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose, anchorRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={menuRef}
          role="menu"
          initial={{
            opacity: 0,
            y: pos.placement === "below" ? -4 : 4,
            scale: 0.97,
          }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: pos.placement === "below" ? -4 : 4,
            scale: 0.97,
          }}
          transition={{ duration: 0.16, ease: APPLE_EASE }}
          className="fixed z-[70] rounded-[10px] bg-night/95 backdrop-blur-md border border-white/12 shadow-[0_18px_48px_rgba(0,0,0,0.45)] overflow-hidden py-1 origin-top-right"
          style={{
            width,
            top: pos.placement === "below" ? pos.top : undefined,
            bottom:
              pos.placement === "above"
                ? typeof window !== "undefined"
                  ? window.innerHeight - pos.top
                  : undefined
                : undefined,
            left: pos.left,
            right: pos.right,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Menu item ───────────────────────────────────────────────────────────

type ItemProps = {
  /** Optional leading glyph (16x16 ideal). */
  icon?: ReactNode;
  label: string;
  /** Optional right-aligned suffix — e.g. shortcut, current value badge. */
  suffix?: ReactNode;
  /** When true, the item is the active/selected state of a toggle — gets
   *  a brand-red text tint + check mark on the right. */
  active?: boolean;
  /** Destructive (Remove) — renders in a red destructive tone. */
  danger?: boolean;
  /** Disabled — muted text, no hover. */
  disabled?: boolean;
  onClick: () => void;
};

export function ActionMenuItem({
  icon,
  label,
  suffix,
  active,
  danger,
  disabled,
  onClick,
}: ItemProps) {
  const tone = disabled
    ? "text-paper/30 cursor-not-allowed"
    : danger
      ? "text-red-300 hover:bg-red-500/15 hover:text-red-200"
      : active
        ? "text-[#E11D2A] hover:bg-[#E11D2A]/10"
        : "text-paper hover:bg-white/[0.06]";

  const iconTone = disabled
    ? "text-paper/30"
    : danger
      ? "text-red-300"
      : active
        ? "text-[#E11D2A]"
        : "text-paper/65";

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={
        "w-full px-3 h-9 flex items-center gap-2.5 text-[12.5px] transition-colors " +
        tone
      }
    >
      {icon && (
        <span
          className={"shrink-0 w-4 h-4 inline-flex items-center justify-center " + iconTone}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 text-left truncate">{label}</span>
      {suffix && (
        <span className="shrink-0 text-[10.5px] tabular-nums text-paper/55">
          {suffix}
        </span>
      )}
      {active && !suffix && <CheckGlyph />}
    </button>
  );
}

// ── Eyebrow label inside a menu group ───────────────────────────────────

export function ActionMenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[9.5px] font-medium uppercase tracking-[0.18em] text-paper/40">
      {children}
    </p>
  );
}

// ── Divider ─────────────────────────────────────────────────────────────

export function ActionMenuDivider() {
  return <div className="my-1 h-px bg-white/[0.06]" aria-hidden />;
}

// ── Built-in icons ──────────────────────────────────────────────────────

function CheckGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6.5l2.5 2.5L10 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
