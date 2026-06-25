"use client";

// ProductStatusControl — premium segmented control for the 3 admin-facing
// product states (en stock / en arrivage / désactivé). One click → server
// action → optimistic UI + soft pulse on the new active segment.
//
// Used inline on the products list (one per row) AND prominently at the
// top of each product detail page. No modal, no extra navigation.
//
// `OUT_OF_STOCK` exists in the schema but is intentionally NOT exposed
// here — the brief calls for three states. Admin can still set it from
// the full ProductForm dropdown if they ever need it.

import { useOptimistic, useState, useTransition } from "react";
import type { ProductStatus } from "@prisma/client";

import { setProductStatus } from "@/app/admin/(panel)/products/actions";

type ExposedStatus = "IN_STOCK" | "INCOMING" | "DISABLED";

const SEGMENTS: ReadonlyArray<{
  value: ExposedStatus;
  label: string;
  dot: string;
}> = [
  { value: "IN_STOCK", label: "En stock", dot: "bg-emerald-500" },
  { value: "INCOMING", label: "En arrivage", dot: "bg-amber-500" },
  { value: "DISABLED", label: "Désactivé", dot: "bg-ink-mute" },
];

export type Variant = "row" | "hero";

export function ProductStatusControl({
  productId,
  current,
  variant = "row",
  onChange,
}: {
  productId: string;
  current: ProductStatus;
  variant?: Variant;
  /** Optional callback after a successful server update. */
  onChange?: (next: ExposedStatus) => void;
}) {
  // Treat OUT_OF_STOCK as a special read-only state — no segment lights
  // up; user clicks any segment to leave it.
  const initial: ExposedStatus | "OTHER" =
    current === "IN_STOCK" || current === "INCOMING" || current === "DISABLED"
      ? current
      : "OTHER";

  const [optimistic, setOptimistic] = useOptimistic<ExposedStatus | "OTHER">(
    initial,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pick = (next: ExposedStatus) => {
    if (next === optimistic) return;
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const res = await setProductStatus(productId, next);
      if (!res.ok) {
        setError(res.error);
        // useOptimistic auto-reverts when the action settles, but we
        // ALSO need to re-read the prop next render — caller passes
        // current from the server component so refresh takes care of
        // restoring the old state.
        return;
      }
      onChange?.(next);
    });
  };

  const ctnCls =
    variant === "hero"
      ? // Hero size — used on the detail page header. Bigger, brighter.
        "inline-flex items-center rounded-full bg-canvas border border-hairline p-0.5 gap-0.5"
      : // Row size — used inline on the products list. Compact.
        "inline-flex items-center rounded-full bg-canvas border border-hairline p-0.5 gap-0.5";

  const segCls = (active: boolean) =>
    (variant === "hero"
      ? "h-9 px-3.5 text-[12.5px] "
      : "h-7 px-2.5 text-[11.5px] ") +
    "inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight " +
    "transition-[background-color,color,transform] duration-200 " +
    "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
    (active
      ? "bg-paper text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_0.5px_rgba(0,0,0,0.04)]"
      : "text-ink-mute hover:text-ink");

  return (
    <div
      className="inline-flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={ctnCls} aria-label="Product status">
        {SEGMENTS.map((s) => {
          const active = optimistic === s.value;
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => pick(s.value)}
              disabled={pending}
              className={segCls(active) + (pending ? " opacity-70" : "")}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </button>
          );
        })}
      </div>
      {optimistic === "OTHER" && (
        <span className="text-[11px] text-ink-mute italic">
          (currently {current.toLowerCase().replace("_", " ")})
        </span>
      )}
      {error && (
        <span className="text-[11px] text-red-600 font-medium">{error}</span>
      )}
    </div>
  );
}
