"use client";

// Backoffice — Inventory section (light theme).
//
// Per-product stock view. Each row: SKU · Name · On hand ·
// Threshold · Last movement · Status (Healthy / Low / Out). Tinted
// rows for Low/Out. Click any row to adjust stock via Sheet.
//
// Above the table: a "Recent movements" mini-section showing the
// last 8 changes (in / out / waste / adjust / sale) so the manager
// sees what just happened across the floor without leaving the
// page. The 200-entry cap on `stockMovements` (FIFO) keeps the
// localStorage payload bounded.

import { useMemo, useState } from "react";
import { selectActivityProducts, useDemoStore } from "@/lib/demoStore";
import type {
  ActivityKey,
  DemoProduct,
  StockMovement,
  StockMovementKind,
} from "@/data/demo/types";
import { Sheet } from "./Sheet";

export function BackofficeInventory() {
  const activity = useDemoStore((s) => s.activity);
  const stock = useDemoStore((s) => (activity ? s.stock[activity] : undefined));
  const thresholds = useDemoStore((s) =>
    activity ? s.stockThresholds[activity] : undefined,
  );
  const movements = useDemoStore((s) => s.stockMovements);
  const overrides = useDemoStore((s) =>
    activity ? s.productOverrides[activity] : undefined,
  );
  const inventoryMode = useDemoStore((s) =>
    activity ? s.inventoryMode[activity] ?? "stock" : "stock",
  );
  const setInventoryMode = useDemoStore((s) => s.setInventoryMode);

  const [adjusting, setAdjusting] = useState<DemoProduct | null>(null);
  const [producing, setProducing] = useState<DemoProduct | null>(null);

  const products = useMemo(() => {
    if (!activity) return [];
    void overrides;
    return selectActivityProducts(useDemoStore.getState(), activity);
  }, [activity, overrides]);

  const ownMovements = useMemo(
    () => (activity ? movements.filter((m) => m.activity === activity) : []),
    [movements, activity],
  );
  const lastByProduct = useMemo(() => {
    const map = new Map<string, StockMovement>();
    for (const m of ownMovements) {
      if (!map.has(m.productId)) map.set(m.productId, m);
    }
    return map;
  }, [ownMovements]);

  type Row = {
    product: DemoProduct;
    onHand: number | null;
    threshold: number;
    last: StockMovement | undefined;
  };

  const rows: Row[] = useMemo(
    () =>
      products.map((p) => ({
        product: p,
        onHand: stock && p.id in stock ? stock[p.id] : null,
        threshold: thresholds?.[p.id] ?? 5,
        last: lastByProduct.get(p.id),
      })),
    [products, stock, thresholds, lastByProduct],
  );

  if (!activity) return null;

  const stocked = rows.filter((r) => r.onHand != null);
  const lowCount = stocked.filter(
    (r) => (r.onHand ?? 0) <= r.threshold && (r.onHand ?? 0) > 0,
  ).length;
  const outCount = stocked.filter((r) => (r.onHand ?? 0) <= 0).length;

  // Production capability — driven by data, not by activity slug.
  // The Production view manages bill-of-materials recipes (e.g.
  // espresso → beans + milk). If no product in this activity carries
  // `recipeComponents`, Production is meaningless: retail markets,
  // simple bakeries, and any non-recipe vertical fall into this
  // bucket. Hide the entire mode toggle in that case (a single Stock
  // pill in a track reads as a broken control) and force the visible
  // mode back to Stock if it was previously set to Production from a
  // different activity / older state.
  const hasRecipes = products.some(
    (p) => (p.recipeComponents?.length ?? 0) > 0,
  );
  const effectiveMode: "stock" | "production" =
    hasRecipes && inventoryMode === "production" ? "production" : "stock";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Single condensed control row — mode toggle on the left,
          inline KPI strip in the middle (stock mode only), recent
          movements compressed to a 2-col grid on the right. Previously
          this stack consumed ~180px; now it's ~52px so the table /
          production cards land inside the first viewport. */}
      <div className="shrink-0 bg-paper border-b border-hairline px-5 md:px-7 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Mode toggle — only when this activity has at least one
            product with a recipe. Otherwise the toggle collapses
            entirely and the Stock view is the only surface. */}
        {hasRecipes && (
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-canvas border border-hairline shrink-0">
            <ModePill
              active={effectiveMode === "stock"}
              onClick={() => setInventoryMode(activity, "stock")}
              label="Stock"
            />
            <ModePill
              active={effectiveMode === "production"}
              onClick={() => setInventoryMode(activity, "production")}
              label="Production"
            />
          </div>
        )}

        {/* KPI strip — only meaningful in Stock mode. Inline pills
            (was 3 stacked tiles in a 340px grid). */}
        {effectiveMode === "stock" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <StatPill label="Tracked" value={stocked.length} />
            <StatPill
              label="Low"
              value={lowCount}
              tone={lowCount > 0 ? "amber" : "neutral"}
            />
            <StatPill
              label="Out"
              value={outCount}
              tone={outCount > 0 ? "red" : "neutral"}
            />
          </div>
        )}

        {/* Recent movements — pulled inline. Capped to 4 so the row
            stays a single line on lg+ and wraps cleanly below. */}
        {ownMovements.length > 0 && (
          <div className="flex-1 min-w-0 lg:border-l lg:border-hairline lg:pl-5">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {ownMovements.slice(0, 4).map((m) => {
                const p = products.find((pp) => pp.id === m.productId);
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-1.5 text-[11.5px]"
                  >
                    <KindDot kind={m.kind} />
                    <span className="text-ink-soft truncate max-w-[160px]">
                      {p?.name ?? m.productId}
                    </span>
                    <span
                      className={
                        "tabular-nums font-medium " +
                        (m.delta < 0 ? "text-amber-700" : "text-emerald-700")
                      }
                    >
                      {m.delta > 0 ? "+" : ""}
                      {m.delta}
                    </span>
                    <span className="text-ink-mute tabular-nums">
                      · {fmtAgo(m.at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Body — Stock table OR Production view based on the
          effective mode. effectiveMode falls back to "stock" when
          this activity has no recipes, even if the persisted value
          says "production". */}
      {effectiveMode === "production" ? (
        <ProductionView
          products={products}
          stock={stock ?? {}}
          onProduce={(p) => setProducing(p)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto bg-canvas">
          {rows.length === 0 ? (
            <div className="h-full flex items-center justify-center text-ink-mute text-[13px]">
              No products in this catalog.
            </div>
          ) : (
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-paper/95 backdrop-blur-md border-b border-hairline">
              <tr className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                <th className="text-left font-medium px-6 md:px-8 py-2.5">SKU</th>
                <th className="text-left font-medium px-3 py-2.5">Name</th>
                <th className="text-right font-medium px-3 py-2.5">On hand</th>
                <th className="text-right font-medium px-3 py-2.5">Threshold</th>
                <th className="text-left font-medium px-3 py-2.5">Last</th>
                <th className="text-right font-medium px-6 md:px-8 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const stockable = r.onHand != null;
                const isOut = stockable && (r.onHand ?? 0) <= 0;
                const isLow =
                  stockable &&
                  (r.onHand ?? 0) > 0 &&
                  (r.onHand ?? 0) <= r.threshold;
                return (
                  <tr
                    key={r.product.id}
                    onClick={() => stockable && setAdjusting(r.product)}
                    className={
                      "border-b border-hairline transition-colors " +
                      (stockable
                        ? "hover:bg-fog cursor-pointer "
                        : "opacity-50 ") +
                      (isOut
                        ? "bg-red-50/60"
                        : isLow
                          ? "bg-amber-50/60"
                          : "bg-paper")
                    }
                  >
                    <td className="px-6 md:px-8 py-2.5 font-mono text-[12px] text-ink-mute tabular-nums">
                      {r.product.sku ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-ink font-medium">
                      {r.product.name}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {stockable ? (
                        <span
                          className={
                            isOut
                              ? "text-red-700 font-semibold"
                              : isLow
                                ? "text-amber-700 font-semibold"
                                : "text-ink"
                          }
                        >
                          {r.onHand}
                        </span>
                      ) : (
                        <span className="text-ink-mute">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-mute">
                      {stockable ? r.threshold : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-ink-mute text-[12px]">
                      {r.last ? (
                        <span>
                          <KindDot kind={r.last.kind} />{" "}
                          <span className="tabular-nums">
                            {r.last.delta > 0 ? "+" : ""}
                            {r.last.delta}
                          </span>{" "}
                          · {fmtAgo(r.last.at)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 md:px-8 py-2.5 text-right">
                      <StatusBadge
                        status={
                          !stockable
                            ? "untracked"
                            : isOut
                              ? "out"
                              : isLow
                                ? "low"
                                : "healthy"
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      )}

      <AdjustStockSheet
        open={adjusting !== null}
        activity={activity}
        product={adjusting}
        currentStock={
          adjusting && stock && adjusting.id in stock ? stock[adjusting.id] : 0
        }
        currentThreshold={thresholds?.[adjusting?.id ?? ""] ?? 5}
        onClose={() => setAdjusting(null)}
      />
      <ProductionRunSheet
        open={producing !== null}
        product={producing}
        stock={stock ?? {}}
        products={products}
        onClose={() => setProducing(null)}
      />
    </div>
  );
}

// ── AdjustStockSheet ────────────────────────────────────────────────

type AdjustMode = "in" | "out" | "waste" | "set";

function AdjustStockSheet({
  open,
  activity,
  product,
  currentStock,
  currentThreshold,
  onClose,
}: {
  open: boolean;
  activity: ActivityKey;
  product: DemoProduct | null;
  currentStock: number;
  currentThreshold: number;
  onClose: () => void;
}) {
  const adjustStock = useDemoStore((s) => s.adjustStock);
  const setStock = useDemoStore((s) => s.setStock);
  const setStockThreshold = useDemoStore((s) => s.setStockThreshold);

  const [mode, setMode] = useState<AdjustMode>("in");
  const [qty, setQty] = useState<number>(10);
  const [reason, setReason] = useState("");
  const [threshold, setThreshold] = useState<number>(currentThreshold);

  const key = open ? product?.id ?? "" : "__closed__";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setMode("in");
      setQty(10);
      setReason("");
      setThreshold(currentThreshold);
    }
  }

  if (!open || !product) return null;

  const after =
    mode === "set"
      ? qty
      : mode === "in"
        ? currentStock + qty
        : currentStock - qty;
  const delta = after - currentStock;
  const canApply = qty > 0 || mode === "set";

  const apply = () => {
    if (!canApply) return;
    if (mode === "set") {
      setStock(activity, product.id, qty, reason || "Set absolute");
    } else {
      const kind: StockMovementKind =
        mode === "in" ? "in" : mode === "waste" ? "waste" : "out";
      const signed = mode === "in" ? qty : -qty;
      adjustStock(activity, product.id, signed, kind, reason || labelOf(mode));
    }
    if (threshold !== currentThreshold) {
      setStockThreshold(activity, product.id, threshold);
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      scheme="light"
      title={`Adjust · ${product.name}`}
      subtitle={`SKU ${product.sku ?? "—"} · on hand ${currentStock}`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-[13px] font-medium rounded-full border border-hairline-strong text-ink hover:bg-fog transition-colors"
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!canApply}
            className="h-9 px-4 text-[13px] font-semibold rounded-full bg-ink text-paper enabled:hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            Apply
          </button>
        </div>
      }
    >
      {/* Compact body — single column with one tight 2-col field row.
          Net height ~210px (was ~430px) so the entire form fits inside
          the visible viewport with the action footer pinned below. */}
      <div className="px-5 py-3 space-y-3">
        {/* Action — segmented control (was a 4-col grid of h-10 cards
            that ate 64px of vertical and ~600px of horizontal). */}
        <FieldBlock label="Action">
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-canvas border border-hairline">
            {(["in", "out", "waste", "set"] as AdjustMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  "h-7 px-3 text-[11.5px] font-medium rounded-full transition-colors " +
                  (mode === m
                    ? "bg-ink text-paper shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                    : "text-ink-mute hover:text-ink")
                }
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {labelOf(m)}
              </button>
            ))}
          </div>
        </FieldBlock>

        {/* Quantity + Threshold side-by-side. Related numeric inputs
            of the same shape get grouped horizontally — two stacked
            full-width inputs wasted ~80px of vertical for no
            information-density gain. */}
        <div className="grid grid-cols-2 gap-3">
          <FieldBlock label={mode === "set" ? "Set on-hand to" : "Quantity"}>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
              className={STOCK_INPUT_CLASS}
            />
          </FieldBlock>
          <FieldBlock
            label="Low-stock threshold"
            hint="Triggers Low badge in POS + Inventory."
          >
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 0)}
              className={STOCK_INPUT_CLASS}
            />
          </FieldBlock>
        </div>

        {/* Preview — inline strip (was a boxed card with its own
            eyebrow + p-4 padding eating ~80px). Now ~32px:
            eyebrow + result in one row, delta pinned right. */}
        <div className="flex items-center justify-between gap-3 h-9 px-3 rounded-md bg-fog/60 border border-hairline">
          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-mute shrink-0">
            Preview
          </span>
          <span className="text-[12.5px] tabular-nums text-ink-soft">
            <span className="text-ink font-medium">{currentStock}</span>
            <span className="mx-2 text-ink-mute">→</span>
            <span
              className={
                "font-medium " +
                (after <= 0
                  ? "text-red-700"
                  : after <= threshold
                    ? "text-amber-700"
                    : "text-ink")
              }
            >
              {after}
            </span>
          </span>
          <span
            className={
              "text-[12.5px] font-semibold tabular-nums shrink-0 " +
              (delta > 0
                ? "text-emerald-700"
                : delta < 0
                  ? "text-amber-700"
                  : "text-ink-mute")
            }
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </div>

        {/* Reason — kept full-width as it's a free-text field that
            benefits from horizontal room. */}
        <FieldBlock label="Reason (optional)">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Delivery received · expired batch · …"
            className={STOCK_INPUT_CLASS}
          />
        </FieldBlock>
      </div>
    </Sheet>
  );
}

// ── Field helpers for AdjustStockSheet ──────────────────────────────

const STOCK_INPUT_CLASS =
  "w-full h-9 px-3 rounded-lg bg-paper border border-hairline text-[13px] text-ink placeholder:text-ink-mute tabular-nums focus:outline-none focus:border-ink/40 transition-colors";

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1">
        {label}
      </p>
      {children}
      {hint && (
        <p className="mt-1 text-[10.5px] text-ink-mute leading-snug">{hint}</p>
      )}
    </div>
  );
}

// ── Sub-pieces ──────────────────────────────────────────────────────

function StatusBadge({
  status,
}: {
  status: "healthy" | "low" | "out" | "untracked";
}) {
  const map = {
    healthy: {
      label: "Healthy",
      cls: "text-emerald-700 border-emerald-100 bg-emerald-50",
    },
    low: {
      label: "Low",
      cls: "text-amber-700 border-amber-100 bg-amber-50",
    },
    out: { label: "Out", cls: "text-red-700 border-red-100 bg-red-50" },
    untracked: {
      label: "Untracked",
      cls: "text-ink-mute border-hairline bg-fog",
    },
  }[status];
  return (
    <span
      className={
        "inline-flex items-center px-2 h-[20px] rounded-full border text-[10px] font-medium uppercase tracking-[0.1em] " +
        map.cls
      }
    >
      {map.label}
    </span>
  );
}

function KindDot({ kind }: { kind: StockMovementKind }) {
  const color = {
    sale: "bg-red-500",
    in: "bg-emerald-500",
    out: "bg-amber-500",
    waste: "bg-red-500",
    adjust: "bg-ink-mute/60",
  }[kind];
  return (
    <span
      aria-label={kind}
      className={"inline-block w-1.5 h-1.5 rounded-full mr-1.5 " + color}
    />
  );
}

function labelOf(mode: AdjustMode | StockMovementKind): string {
  switch (mode) {
    case "in":     return "Stock in";
    case "out":    return "Stock out";
    case "waste":  return "Waste";
    case "set":    return "Set";
    case "sale":   return "Sale";
    case "adjust": return "Adjust";
  }
}

function fmtAgo(ms: number): string {
  const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ── Mode toggle pill (Phase B) ─────────────────────────────────────

function ModePill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 h-7 rounded-full text-[11.5px] font-medium transition-colors " +
        (active
          ? "bg-paper text-ink shadow-[0_1px_0_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.06)]"
          : "text-ink-mute hover:text-ink")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      {label}
    </button>
  );
}

// Inline KPI pill — replaces the boxed `Stat` tile when we need the
// values flush against the mode toggle in a single condensed row.
// Label on the left, number on the right, both within a hairline pill.
function StatPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "amber" | "red" | "neutral";
}) {
  const valueColor =
    tone === "amber"
      ? "text-amber-700"
      : tone === "red"
        ? "text-red-700"
        : "text-ink";
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-hairline bg-canvas">
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-ink-mute">
        {label}
      </span>
      <span className={"text-[12.5px] font-semibold tabular-nums " + valueColor}>
        {value}
      </span>
    </span>
  );
}

// ── Production view (Phase B) ─────────────────────────────────────
// Lists products that have a recipe (finished goods) as cards with
// a "Produce" CTA + a quick component preview underneath. Products
// without a recipe are quietly relegated to a "Raw materials" row
// at the top so the manager sees the full picture of what feeds
// what.

function ProductionView({
  products,
  stock,
  onProduce,
}: {
  products: DemoProduct[];
  stock: Record<string, number>;
  onProduce: (p: DemoProduct) => void;
}) {
  const finishedGoods = products.filter(
    (p) => (p.recipeComponents?.length ?? 0) > 0,
  );
  const rawMaterials = products.filter(
    (p) =>
      (p.recipeComponents?.length ?? 0) === 0 &&
      p.id in stock,
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  if (finishedGoods.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-canvas">
        <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16">
          <div className="h-12 w-12 rounded-[12px] bg-paper border border-hairline inline-flex items-center justify-center mb-4 text-ink-mute">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold tracking-[-0.005em] text-ink">
            No recipes yet
          </h3>
          <p className="mt-1.5 text-[12.5px] text-ink-soft max-w-[24rem] leading-snug">
            Open any product in Products → Edit → Bill of materials to
            define its components. Once a product has a recipe, you can
            run production batches and watch raw materials transform
            into finished stock.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-canvas">
      <div className="px-5 md:px-7 py-4 space-y-4">
        {/* Finished goods — recipe cards */}
        <section>
          <header className="flex items-baseline gap-2 mb-2">
            <h3 className="text-[13px] font-semibold tracking-[-0.005em] text-ink">
              Finished goods
            </h3>
            <span className="text-[11.5px] text-ink-mute">
              {finishedGoods.length} recipe
              {finishedGoods.length === 1 ? "" : "s"} · ready to produce
            </span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {finishedGoods.map((p) => (
              <RecipeCard
                key={p.id}
                product={p}
                stock={stock}
                componentNames={(p.recipeComponents ?? []).map(
                  (c) => byId.get(c.componentId)?.name ?? c.componentId,
                )}
                onProduce={() => onProduce(p)}
              />
            ))}
          </div>
        </section>

        {/* Raw materials — just the names so the manager sees the
            other half of the production chain. Click to adjust
            stock just like the Stock view (via the inventory tab
            switch). Kept passive (no per-row action) to keep the
            production view focused on recipes + batches. */}
        {rawMaterials.length > 0 && (
          <section className="pt-3 border-t border-hairline">
            <header className="flex items-baseline gap-2 mb-2">
              <h3 className="text-[13px] font-semibold tracking-[-0.005em] text-ink">
                Raw materials
              </h3>
              <span className="text-[11.5px] text-ink-mute">
                {rawMaterials.length} tracked component
                {rawMaterials.length === 1 ? "" : "s"}
              </span>
            </header>
            <ul className="flex flex-wrap gap-2">
              {rawMaterials.map((p) => {
                const qty = stock[p.id] ?? 0;
                const lowish = qty <= 5;
                return (
                  <li
                    key={p.id}
                    className={
                      "inline-flex items-center gap-2 h-8 px-3 rounded-full border text-[11.5px] " +
                      (lowish
                        ? "border-amber-200 bg-amber-50/60 text-amber-900"
                        : "border-hairline bg-paper text-ink-soft")
                    }
                  >
                    <span className="font-medium text-ink">{p.name}</span>
                    <span className="tabular-nums text-ink-mute">
                      · {qty}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function RecipeCard({
  product,
  stock,
  componentNames,
  onProduce,
}: {
  product: DemoProduct;
  stock: Record<string, number>;
  componentNames: string[];
  onProduce: () => void;
}) {
  const onHand = stock[product.id];
  // Compute how many full batches can be produced with the
  // currently-on-hand raw materials.
  const recipe = product.recipeComponents ?? [];
  let maxBatches = Infinity;
  let blocker: string | null = null;
  for (let i = 0; i < recipe.length; i++) {
    const c = recipe[i];
    const have = stock[c.componentId] ?? 0;
    const can = Math.floor(have / c.qty);
    if (can < maxBatches) {
      maxBatches = can;
      if (can === 0) blocker = componentNames[i];
    }
  }
  if (maxBatches === Infinity) maxBatches = 0;

  return (
    <article className="rounded-[10px] border border-hairline bg-paper px-3.5 py-3 flex flex-col gap-2.5">
      <header className="flex items-baseline justify-between gap-2">
        <div className="min-w-0 flex items-baseline gap-2 flex-1">
          <p className="text-[13px] font-semibold tracking-[-0.005em] text-ink truncate">
            {product.name}
          </p>
          {onHand != null && (
            <span className="text-[11px] text-ink-mute tabular-nums shrink-0">
              · {onHand} on hand
            </span>
          )}
        </div>
        <span className="shrink-0 inline-flex items-center px-1.5 h-[18px] rounded-full text-[9.5px] font-semibold uppercase tracking-[0.1em] border border-indigo-200 bg-indigo-50 text-indigo-700">
          Recipe
        </span>
      </header>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-1">
          Built from
        </p>
        <ul className="space-y-0.5">
          {recipe.map((c, i) => {
            const have = stock[c.componentId] ?? 0;
            const enough = have >= c.qty;
            return (
              <li
                key={c.componentId}
                className="flex items-baseline justify-between gap-3 text-[11.5px]"
              >
                <span className="text-ink truncate">
                  <span className="text-ink-mute tabular-nums">{c.qty}×</span>{" "}
                  {componentNames[i]}
                </span>
                <span
                  className={
                    "tabular-nums shrink-0 " +
                    (enough ? "text-ink-mute" : "text-amber-700")
                  }
                >
                  {have} in stock
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 mt-auto border-t border-hairline">
        <p className="text-[11px] text-ink-soft">
          {maxBatches > 0 ? (
            <>
              <span className="text-ink font-medium tabular-nums">
                {maxBatches}
              </span>{" "}
              full {maxBatches === 1 ? "batch" : "batches"}
            </>
          ) : blocker ? (
            <span className="text-amber-700">{blocker} runs short</span>
          ) : (
            <span className="text-ink-mute">No raw materials</span>
          )}
        </p>
        <button
          type="button"
          onClick={onProduce}
          disabled={maxBatches === 0}
          className="h-7 px-3 inline-flex items-center gap-1 text-[11.5px] font-semibold rounded-full bg-ink text-paper enabled:hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          Produce
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 6h6m0 0L6.5 3.5M9 6L6.5 8.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}

// ── ProductionRunSheet (Phase B4) ──────────────────────────────────
// Triggers a production batch. Live preview of component consumption
// + finished-good output. Confirms via `runProduction` store action.

function ProductionRunSheet({
  open,
  product,
  stock,
  products,
  onClose,
}: {
  open: boolean;
  product: DemoProduct | null;
  stock: Record<string, number>;
  products: DemoProduct[];
  onClose: () => void;
}) {
  const runProduction = useDemoStore((s) => s.runProduction);
  const [batches, setBatches] = useState(1);
  const [lastProductId, setLastProductId] = useState<string | null>(null);

  // Reset batch count when the target product changes.
  if (product && product.id !== lastProductId) {
    setLastProductId(product.id);
    setBatches(1);
  }

  if (!product) return null;
  const recipe = product.recipeComponents ?? [];
  const byId = new Map(products.map((p) => [p.id, p]));

  // Max batches the current stock can satisfy.
  let maxBatches = Infinity;
  for (const c of recipe) {
    const have = stock[c.componentId] ?? 0;
    const can = Math.floor(have / c.qty);
    if (can < maxBatches) maxBatches = can;
  }
  if (maxBatches === Infinity) maxBatches = 0;

  const safeBatches = Math.min(batches, maxBatches);
  const canRun = safeBatches > 0;

  const run = () => {
    if (!canRun) return;
    runProduction({
      productId: product.id,
      batches: safeBatches,
      reason: undefined,
    });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      scheme="light"
      title={`Produce · ${product.name}`}
      subtitle="Pick the batch size. Components will be deducted from stock; finished goods will be added."
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-[13px] font-medium rounded-lg border border-hairline-strong text-ink hover:bg-fog transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!canRun}
            className="h-10 px-4 text-[13px] font-semibold rounded-lg bg-ink text-paper enabled:hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {canRun
              ? `Produce ${safeBatches} ${safeBatches === 1 ? "batch" : "batches"}`
              : "Insufficient stock"}
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-5">
        {/* Batch picker */}
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-2">
            Batch size
          </p>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center h-12 rounded-[10px] border border-hairline bg-canvas">
              <button
                type="button"
                onClick={() => setBatches((b) => Math.max(1, b - 1))}
                aria-label="Decrease batches"
                className="h-full w-12 text-[18px] text-ink-mute hover:text-ink"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={batches}
                onChange={(e) =>
                  setBatches(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="w-16 h-full text-center text-[18px] font-semibold tabular-nums bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setBatches((b) => b + 1)}
                aria-label="Increase batches"
                className="h-full w-12 text-[18px] text-ink-mute hover:text-ink"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => setBatches(Math.max(1, maxBatches))}
              disabled={maxBatches <= 0}
              className="h-9 px-3 text-[12px] font-medium rounded-full border border-hairline text-ink-soft hover:text-ink hover:bg-fog disabled:opacity-40 transition-colors"
            >
              Max ({maxBatches})
            </button>
            {batches > maxBatches && (
              <span className="text-[11.5px] text-amber-700">
                Limited to {maxBatches} by raw stock
              </span>
            )}
          </div>
        </div>

        {/* Live consumption preview */}
        <div className="rounded-[10px] bg-canvas border border-hairline p-4">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-2.5">
            Will consume
          </p>
          <ul className="space-y-1.5">
            {recipe.map((c) => {
              const name =
                byId.get(c.componentId)?.name ?? c.componentId;
              const have = stock[c.componentId] ?? 0;
              const needed = c.qty * safeBatches;
              const after = have - needed;
              return (
                <li
                  key={c.componentId}
                  className="flex items-baseline justify-between gap-3 text-[12.5px]"
                >
                  <span className="text-ink truncate">{name}</span>
                  <span className="tabular-nums shrink-0 text-ink-soft">
                    <span className="text-amber-700">−{needed}</span>
                    <span className="text-ink-mute mx-1.5">·</span>
                    {have} → <span className="text-ink font-medium">{after}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 pt-3 border-t border-hairline flex items-baseline justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
              Will produce
            </span>
            <span className="tabular-nums text-[14px] font-semibold text-emerald-700">
              +{safeBatches} {product.name}
            </span>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
