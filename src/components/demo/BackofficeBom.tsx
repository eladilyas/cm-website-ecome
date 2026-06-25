"use client";

// Bill of Materials manager — dedicated Backoffice sidebar section.
//
// First-class home for managing product recipes (a.k.a. bills of
// materials). Previously BOM editing was buried inside the per-
// product edit sheet and the Inventory > Production tab was hidden
// for activities with no recipes seeded — so visitors landing on the
// café / bakery / fast-food / restaurant templates on first visit
// couldn't see the production feature exists.
//
// This section is gated by `caps.hasRecipes` in BackofficeView so it
// only appears for activities where BOMs make sense (food kitchens).
// Pure retail (market) and pure service (beauty/barber) verticals
// hide it.
//
// Layout:
//   • Stats strip — recipes / finished goods / components-in-use
//   • Recipe cards — one per finished product, listing every component
//     with its quantity and live in-stock count; per-card Edit + Delete
//     actions surface via a quiet right-side button.
//   • Empty state — guidance + a single primary CTA.
//   • Editor sheet — the RecipeEditor pattern reused from
//     BackofficeProducts.tsx, restructured into a standalone Sheet so
//     it can be opened directly (no need to traverse the product edit
//     flow).

import { useMemo, useState } from "react";

import { useDemoStore, selectActivityProducts } from "@/lib/demoStore";
import { ACTIVITIES } from "@/data/demo/activities";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ActivityKey, DemoProduct } from "@/data/demo/types";

import { Sheet } from "./Sheet";

export function BackofficeBom() {
  const activity = useDemoStore((s) => s.activity);
  const stock = useDemoStore((s) =>
    activity ? s.stock[activity] : undefined,
  );
  const overrides = useDemoStore((s) =>
    activity ? s.productOverrides[activity] : undefined,
  );
  const setRecipe = useDemoStore((s) => s.setRecipe);

  const products = useMemo(() => {
    if (!activity) return [];
    void overrides;
    return selectActivityProducts(useDemoStore.getState(), activity);
  }, [activity, overrides]);

  const [editingFor, setEditingFor] = useState<DemoProduct | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DemoProduct | null>(null);

  if (!activity) return null;

  const recipes = products.filter(
    (p) => (p.recipeComponents?.length ?? 0) > 0,
  );

  // Components-in-use — unique component ids across all recipes.
  const componentSet = new Set<string>();
  for (const r of recipes) {
    for (const c of r.recipeComponents ?? []) componentSet.add(c.componentId);
  }

  // Pickable finished goods for the "New recipe" action — anything
  // that doesn't already have a recipe. (Operators can edit the
  // existing recipe by clicking its card.)
  const pickable = products.filter(
    (p) => (p.recipeComponents?.length ?? 0) === 0,
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-canvas">
      {/* Top strip — stats + primary action */}
      <div className="shrink-0 bg-paper border-b border-hairline px-5 md:px-7 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <StatPill label="Recipes" value={recipes.length} />
          <StatPill label="Finished" value={recipes.length} tone="ink" />
          <StatPill
            label="Components"
            value={componentSet.size}
            tone={componentSet.size > 0 ? "ink" : "neutral"}
          />
        </div>
        <p className="hidden md:block text-[11.5px] text-ink-mute flex-1 min-w-0 lg:border-l lg:border-hairline lg:pl-5">
          Recipes deduct components from stock automatically each time the
          finished good is sold. Edit a recipe to add, remove, or change
          component quantities.
        </p>
        <button
          type="button"
          onClick={() => {
            if (pickable.length === 0) return;
            // Pre-pick the first available product; the editor lets
            // the operator change it.
            setEditingFor(pickable[0]);
          }}
          disabled={pickable.length === 0}
          className="h-9 px-4 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper text-[12.5px] font-semibold enabled:hover:bg-ink-soft disabled:opacity-40 transition-colors shrink-0"
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          <PlusIcon /> New recipe
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-7 py-4">
        {recipes.length === 0 ? (
          <EmptyState
            onCreate={() => {
              if (pickable.length > 0) setEditingFor(pickable[0]);
            }}
            canCreate={pickable.length > 0}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {recipes.map((p) => (
              <RecipeCard
                key={p.id}
                product={p}
                products={products}
                stock={stock ?? {}}
                onEdit={() => setEditingFor(p)}
                onDelete={() => setConfirmDelete(p)}
              />
            ))}
          </div>
        )}
      </div>

      <BomEditorSheet
        open={editingFor != null}
        activity={activity}
        products={products}
        product={editingFor}
        onClose={() => setEditingFor(null)}
        onSave={(productId, components) => {
          setRecipe(activity, productId, components);
          setEditingFor(null);
        }}
      />

      {confirmDelete && (
        <ConfirmDialog
          open={confirmDelete != null}
          scheme="light"
          tone="destructive"
          title={`Remove recipe for ${confirmDelete.name}?`}
          body="The product stays in the catalog. Future sales will stop deducting components from stock until a new recipe is defined."
          confirmLabel="Remove recipe"
          cancelLabel="Keep"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (confirmDelete) setRecipe(activity, confirmDelete.id, []);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

// ── Recipe card ─────────────────────────────────────────────────────

function RecipeCard({
  product,
  products,
  stock,
  onEdit,
  onDelete,
}: {
  product: DemoProduct;
  products: DemoProduct[];
  stock: Record<string, number>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const recipe = product.recipeComponents ?? [];

  // Live "how many can we still produce" — bound by the tightest
  // ratio of any component's on-hand to its recipe quantity.
  let maxBatches = Infinity;
  for (const c of recipe) {
    const have = stock[c.componentId] ?? 0;
    const can = Math.floor(have / c.qty);
    if (can < maxBatches) maxBatches = can;
  }
  if (maxBatches === Infinity) maxBatches = 0;

  return (
    <article className="group rounded-[10px] border border-hairline bg-paper px-3.5 py-3 flex flex-col gap-2.5">
      <header className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold tracking-[-0.005em] text-ink truncate">
          {product.name}
        </p>
        <span className="shrink-0 inline-flex items-center px-1.5 h-[18px] rounded-full text-[9.5px] font-semibold uppercase tracking-[0.1em] border border-indigo-200 bg-indigo-50 text-indigo-700">
          {recipe.length} comp
          {recipe.length === 1 ? "" : "s"}
        </span>
      </header>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-1">
          Built from
        </p>
        <ul className="space-y-0.5">
          {recipe.map((c) => {
            const comp = byId.get(c.componentId);
            const have = stock[c.componentId] ?? 0;
            const enough = have >= c.qty;
            return (
              <li
                key={c.componentId}
                className="flex items-baseline justify-between gap-3 text-[11.5px]"
              >
                <span className="text-ink truncate">
                  <span className="text-ink-mute tabular-nums">{c.qty}×</span>{" "}
                  {comp?.name ?? c.componentId}
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
        <p className="text-[11px] text-ink-soft tabular-nums">
          {maxBatches > 0 ? (
            <>
              <span className="text-ink font-medium">{maxBatches}</span> can
              ship now
            </>
          ) : (
            <span className="text-amber-700">Component shortfall</span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="h-7 px-2.5 text-[11.5px] font-medium rounded-full text-ink-soft hover:text-ink hover:bg-fog transition-colors"
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-7 px-2.5 text-[11.5px] font-medium rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Empty state ─────────────────────────────────────────────────────

function EmptyState({
  onCreate,
  canCreate,
}: {
  onCreate: () => void;
  canCreate: boolean;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 py-10">
      <div className="h-12 w-12 rounded-[12px] bg-paper border border-hairline inline-flex items-center justify-center mb-3 text-ink-mute">
        <BomGlyph />
      </div>
      <h3 className="text-[15px] font-semibold tracking-[-0.005em] text-ink">
        No recipes yet
      </h3>
      <p className="mt-1.5 text-[12.5px] text-ink-soft max-w-[26rem] leading-snug">
        Wire a finished product to one or more components from this catalog.
        Every sale will then deduct the components from stock — and the
        Inventory{" "}
        <span className="font-medium">Production</span> tab unlocks so the
        team can fire batches.
      </p>
      <button
        type="button"
        onClick={onCreate}
        disabled={!canCreate}
        className="mt-3.5 h-9 px-4 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper text-[12.5px] font-semibold enabled:hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        <PlusIcon /> New recipe
      </button>
    </div>
  );
}

// ── Editor sheet ────────────────────────────────────────────────────

function BomEditorSheet({
  open,
  activity,
  products,
  product,
  onClose,
  onSave,
}: {
  open: boolean;
  activity: ActivityKey;
  products: DemoProduct[];
  product: DemoProduct | null;
  onClose: () => void;
  onSave: (
    productId: string,
    components: { componentId: string; qty: number }[],
  ) => void;
}) {
  const a = ACTIVITIES[activity];
  void a;

  const [pickedId, setPickedId] = useState<string>("");
  const [rows, setRows] = useState<{ componentId: string; qty: number }[]>([]);

  // Reset on (re)open
  const sentinel = open ? product?.id ?? "" : "__closed__";
  const [lastSentinel, setLastSentinel] = useState(sentinel);
  if (sentinel !== lastSentinel) {
    setLastSentinel(sentinel);
    if (open && product) {
      setPickedId(product.id);
      setRows(product.recipeComponents ?? []);
    }
  }

  if (!open || !product) return null;

  const picked = products.find((p) => p.id === pickedId) ?? product;
  // Components = every product except the picked finished good, minus
  // anything already in the rows.
  const used = new Set(rows.map((r) => r.componentId));
  const componentChoices = products.filter(
    (p) => p.id !== pickedId && !used.has(p.id),
  );

  const canSave =
    pickedId.length > 0 && rows.every((r) => r.componentId && r.qty > 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      scheme="light"
      title={`Recipe · ${picked.name}`}
      subtitle={`${rows.length} component${rows.length === 1 ? "" : "s"} · activity ${activity}`}
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
            onClick={() => onSave(pickedId, rows.filter((r) => r.qty > 0 && r.componentId))}
            disabled={!canSave}
            className="h-9 px-4 text-[13px] font-semibold rounded-full bg-ink text-paper enabled:hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            Save recipe
          </button>
        </div>
      }
    >
      <div className="px-5 py-3 space-y-3">
        <FieldBlock label="Finished product">
          <select
            value={pickedId}
            onChange={(e) => setPickedId(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-paper border border-hairline text-[13px] text-ink focus:outline-none focus:border-ink/40 transition-colors"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FieldBlock>

        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1.5">
            Components
          </p>
          {rows.length === 0 ? (
            <p className="text-[12.5px] text-ink-mute italic mb-2">
              No components yet — add the first one below.
            </p>
          ) : (
            <ul className="space-y-1.5 mb-2">
              {rows.map((row, idx) => {
                // Each row's component dropdown sees the components in
                // OTHER rows as taken (avoids duplicates) but still
                // shows its OWN selection.
                const otherUsed = new Set(
                  rows.filter((_, i) => i !== idx).map((r) => r.componentId),
                );
                const choices = products.filter(
                  (p) => p.id !== pickedId && !otherUsed.has(p.id),
                );
                return (
                  <li
                    key={idx}
                    className="grid grid-cols-[1fr_72px_28px] gap-1.5 items-center"
                  >
                    <select
                      value={row.componentId}
                      onChange={(e) =>
                        setRows(
                          rows.map((r, i) =>
                            i === idx ? { ...r, componentId: e.target.value } : r,
                          ),
                        )
                      }
                      className="w-full h-9 px-2.5 rounded-lg bg-paper border border-hairline text-[12.5px] text-ink focus:outline-none focus:border-ink/40 transition-colors"
                    >
                      {choices.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="1"
                      value={row.qty}
                      onChange={(e) =>
                        setRows(
                          rows.map((r, i) =>
                            i === idx
                              ? { ...r, qty: parseFloat(e.target.value) || 0 }
                              : r,
                          ),
                        )
                      }
                      className="w-full h-9 px-2 rounded-lg bg-paper border border-hairline text-[12.5px] text-ink tabular-nums text-center focus:outline-none focus:border-ink/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setRows(rows.filter((_, i) => i !== idx))
                      }
                      aria-label="Remove component"
                      className="h-9 w-7 rounded-lg inline-flex items-center justify-center text-ink-mute hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              if (componentChoices.length === 0) return;
              setRows([
                ...rows,
                { componentId: componentChoices[0].id, qty: 1 },
              ]);
            }}
            disabled={componentChoices.length === 0}
            className="h-8 px-3 inline-flex items-center gap-1 rounded-full border border-hairline text-ink-soft hover:text-ink hover:bg-fog text-[11.5px] font-medium disabled:opacity-40 transition-colors"
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            <PlusIcon /> Add component
          </button>
        </div>

        <p className="text-[11px] text-ink-mute leading-snug pt-1">
          Selling one <span className="font-medium text-ink-soft">{picked.name}</span>{" "}
          will deduct the listed components from inventory. Use whole numbers
          for unit-based items (1 bun, 2 patties) — fractions are accepted
          when components are bulk-measured (0.4 kg flour, 50 ml milk).
        </p>
      </div>
    </Sheet>
  );
}

// ── Helpers + icons ─────────────────────────────────────────────────

function StatPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "ink" | "neutral";
}) {
  const valueColor = tone === "ink" ? "text-ink" : "text-ink";
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

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M6 2v8M2 6h8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 3.5h9M5.5 3.5V2.5h3V3.5M4 3.5l.5 8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1l.5-8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BomGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
