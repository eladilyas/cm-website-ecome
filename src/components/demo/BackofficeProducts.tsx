"use client";

// Backoffice — Products section (light theme).
//
// Table list of every product in the activity's catalog (seeded +
// custom), with filter-by-category and search-by-name/SKU/barcode.
// Click a row to edit; "+ New product" to add. Both open the same
// ProductFormSheet (light Sheet variant).
//
// Phase 3A scope: name, category, price, cost, SKU, barcode, tax
// override. Variants / modifiers / combo / recipe components are
// deferred to Phase 3B.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ACTIVITIES } from "@/data/demo/activities";
import { selectActivityProducts, useDemoStore } from "@/lib/demoStore";
import type { ActivityKey, DemoProduct } from "@/data/demo/types";
import { genBarcode, genSku } from "@/data/demo/seeds/_helpers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Sheet } from "./Sheet";

export function BackofficeProducts() {
  const activity = useDemoStore((s) => s.activity);
  const overrides = useDemoStore((s) =>
    activity ? s.productOverrides[activity] : undefined,
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [editing, setEditing] = useState<DemoProduct | null>(null);
  const [creating, setCreating] = useState(false);

  const tCat = useTranslations("demo.categories");

  const products = useMemo(() => {
    if (!activity) return [];
    void overrides;
    return selectActivityProducts(useDemoStore.getState(), activity);
  }, [activity, overrides]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter)
        return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.sku?.toLowerCase().includes(needle) ||
        p.barcode?.includes(needle)
      );
    });
  }, [products, search, categoryFilter]);

  if (!activity) return null;
  const a = ACTIVITIES[activity];

  const isCustom = (p: DemoProduct): boolean =>
    Boolean(overrides?.added.some((x) => x.id === p.id));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 px-6 md:px-8 py-3 border-b border-hairline bg-paper flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, or barcode…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-canvas border border-hairline text-[13px] text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink/30 focus:bg-paper transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-canvas border border-hairline text-[13px] text-ink focus:outline-none focus:border-ink/30"
        >
          <option value="all">All categories</option>
          {a.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {tCat(c.id)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="h-9 px-3 text-[12.5px] font-medium rounded-lg bg-ink text-paper hover:bg-ink-soft transition-colors"
        >
          + New product
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-canvas">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-mute text-[13px]">
            No products match. Adjust the filter or add a new one.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-paper/95 backdrop-blur-md border-b border-hairline">
              <tr className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                <th className="text-left font-medium px-6 md:px-8 py-2.5">SKU</th>
                <th className="text-left font-medium px-3 py-2.5">Name</th>
                <th className="text-left font-medium px-3 py-2.5">Category</th>
                <th className="text-right font-medium px-3 py-2.5">Price</th>
                <th className="text-right font-medium px-3 py-2.5">Cost</th>
                <th className="text-right font-medium px-3 py-2.5">Margin</th>
                <th className="text-right font-medium px-6 md:px-8 py-2.5">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const cat = a.categories.find((c) => c.id === p.categoryId);
                const margin =
                  p.cost != null && p.price > 0
                    ? ((p.price - p.cost) / p.price) * 100
                    : null;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setEditing(p)}
                    className="border-b border-hairline hover:bg-fog cursor-pointer transition-colors"
                  >
                    <td className="px-6 md:px-8 py-2.5 font-mono text-[12px] text-ink-mute tabular-nums">
                      {p.sku ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-ink font-medium">
                      {p.name}
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">
                      {cat?.name ?? p.categoryId}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                      {p.price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-mute">
                      {p.cost?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {margin == null ? (
                        <span className="text-ink-mute">—</span>
                      ) : (
                        <span
                          className={
                            margin >= 50
                              ? "text-emerald-700 font-medium"
                              : margin >= 25
                                ? "text-ink"
                                : "text-amber-700 font-medium"
                          }
                        >
                          {margin.toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 md:px-8 py-2.5 text-right">
                      <SourceBadge custom={isCustom(p)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer status */}
      <div className="shrink-0 px-6 md:px-8 py-2 border-t border-hairline bg-paper text-[11px] text-ink-mute tabular-nums">
        {filtered.length} of {products.length} shown
        {overrides && overrides.added.length > 0 && (
          <> · {overrides.added.length} custom</>
        )}
        {overrides && overrides.deleted.length > 0 && (
          <> · {overrides.deleted.length} hidden</>
        )}
      </div>

      <ProductFormSheet
        open={creating || editing !== null}
        activity={activity}
        products={products}
        product={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

// ── Form sheet ──────────────────────────────────────────────────────

function ProductFormSheet({
  open,
  activity,
  products,
  product,
  onClose,
}: {
  open: boolean;
  activity: ActivityKey;
  /** Full activity product list — computed + memoized by the
   *  parent BackofficeProducts. Passed in instead of re-subscribed
   *  here to avoid double-subscription edge cases with Zustand. */
  products: DemoProduct[];
  product: DemoProduct | null;
  onClose: () => void;
}) {
  const addProduct = useDemoStore((s) => s.addProduct);
  const updateProduct = useDemoStore((s) => s.updateProduct);
  const deleteProduct = useDemoStore((s) => s.deleteProduct);
  const setStock = useDemoStore((s) => s.setStock);
  const setStockThreshold = useDemoStore((s) => s.setStockThreshold);
  const setRecipe = useDemoStore((s) => s.setRecipe);

  const a = ACTIVITIES[activity];
  const tCat = useTranslations("demo.categories");

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [sku, setSku] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [taxRate, setTaxRate] = useState<string>("");
  const [openingStock, setOpeningStock] = useState<number>(20);
  const [threshold, setThreshold] = useState<number>(5);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [recipe, setRecipeLocal] = useState<
    { componentId: string; qty: number }[]
  >([]);

  const formKey = open ? product?.id ?? "__new__" : "__closed__";
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    if (open) {
      if (product) {
        setName(product.name);
        setCategoryId(product.categoryId);
        setPrice(product.price);
        setCost(product.cost ?? 0);
        setSku(product.sku ?? "");
        setBarcode(product.barcode ?? "");
        setTaxRate(product.taxRate != null ? String(product.taxRate * 100) : "");
        setRecipeLocal(product.recipeComponents ?? []);
      } else {
        setName("");
        setCategoryId(a.categories[0]?.id ?? "");
        setPrice(0);
        setCost(0);
        setSku("");
        setBarcode("");
        setTaxRate("");
        setOpeningStock(20);
        setThreshold(5);
        setRecipeLocal([]);
      }
    }
  }

  if (!open) return null;

  const isEditing = product !== null;
  const canSave = name.trim().length > 0 && price > 0 && categoryId.length > 0;

  const suggestSku = () => {
    if (name && categoryId) setSku(genSku(categoryId, name));
  };
  const suggestBarcode = () => {
    setBarcode(genBarcode(name + categoryId + Date.now()));
  };

  const save = () => {
    if (!canSave) return;
    const patch: Partial<DemoProduct> = {
      name: name.trim(),
      categoryId,
      price,
      cost: cost > 0 ? cost : undefined,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      taxRate: taxRate.trim()
        ? Math.max(0, Math.min(1, parseFloat(taxRate) / 100))
        : undefined,
    };
    if (isEditing) {
      updateProduct(activity, product.id, patch);
      // Apply recipe via setRecipe so the BOM event fires on
      // genuine changes (vs. updateProduct which would emit a
      // generic "edits applied"). Pass the cleaned list.
      setRecipe(
        activity,
        product.id,
        recipe.filter((r) => r.qty > 0 && r.componentId),
      );
    } else {
      const id = `cust_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      addProduct(activity, {
        id,
        name: patch.name!,
        categoryId,
        price,
        cost: patch.cost,
        sku: patch.sku,
        barcode: patch.barcode,
        taxRate: patch.taxRate,
      });
      if (openingStock > 0)
        setStock(activity, id, openingStock, "Opening stock");
      if (threshold > 0) setStockThreshold(activity, id, threshold);
    }
    onClose();
  };

  const remove = () => {
    if (!isEditing) return;
    deleteProduct(activity, product.id);
    onClose();
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        scheme="light"
        title={isEditing ? `Edit · ${product.name}` : "New product"}
        subtitle={
          isEditing
            ? `SKU ${product.sku ?? "—"} · ${product.id}`
            : "Add a new SKU to this activity's catalog"
        }
        footer={
          <div className="flex items-center justify-between gap-3">
            {isEditing ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-9 px-3 text-[12.5px] font-medium rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
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
                onClick={save}
                disabled={!canSave}
                className="h-9 px-4 text-[13px] font-semibold rounded-full bg-ink text-paper enabled:hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {isEditing ? "Save changes" : "Add product"}
              </button>
            </div>
          </div>
        }
      >
        <div className="px-5 py-3 space-y-3">
          <Field label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Espresso · Margherita Pizza · …"
              className={INPUT_CLS}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={INPUT_CLS}
              >
                {a.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tCat(c.id)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tax rate" hint="Override activity default (%)">
              <input
                type="number"
                inputMode="decimal"
                step="1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="10"
                className={INPUT_CLS}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price" required suffix="MAD">
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={price || ""}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Cost" hint="Optional, used for margin" suffix="MAD">
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={cost || ""}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className={INPUT_CLS}
              />
            </Field>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <Field label="SKU">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="COFFEE-ESP"
                className={INPUT_CLS + " font-mono"}
              />
            </Field>
            <button
              type="button"
              onClick={suggestSku}
              disabled={!name || !categoryId}
              className="h-9 px-3 text-[11px] font-medium rounded-lg border border-hairline text-ink-soft hover:text-ink hover:bg-fog disabled:opacity-40 transition-colors"
            >
              Suggest
            </button>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <Field label="Barcode">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))}
                placeholder="6012345678901"
                className={INPUT_CLS + " font-mono tabular-nums"}
              />
            </Field>
            <button
              type="button"
              onClick={suggestBarcode}
              className="h-9 px-3 text-[11px] font-medium rounded-lg border border-hairline text-ink-soft hover:text-ink hover:bg-fog transition-colors"
            >
              Suggest
            </button>
          </div>

          {!isEditing && (
            <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-hairline">
              <Field label="Opening stock">
                <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  value={openingStock}
                  onChange={(e) =>
                    setOpeningStock(parseInt(e.target.value, 10) || 0)
                  }
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Low-stock threshold">
                <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  value={threshold}
                  onChange={(e) =>
                    setThreshold(parseInt(e.target.value, 10) || 0)
                  }
                  className={INPUT_CLS}
                />
              </Field>
            </div>
          )}

          {/* Phase B — Bill of Materials. Editable only on
              existing products; new products are saved first then
              the recipe is added on the next open. Keeps the new-
              product flow uncluttered. */}
          {isEditing && (
            <RecipeEditor
              currentProductId={product.id}
              products={products}
              recipe={recipe}
              onChange={setRecipeLocal}
            />
          )}
        </div>
      </Sheet>

      {isEditing && (
        <ConfirmDialog
          open={confirmDelete}
          scheme="light"
          tone="destructive"
          title="Delete this product?"
          body={
            <>
              The product will be hidden from POS and Inventory. Custom products
              are removed entirely; seeded products are kept in the catalog
              record so the change can be reverted later from a future
              restore UI.
            </>
          }
          confirmLabel="Delete product"
          cancelLabel="Keep"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            remove();
          }}
        />
      )}
    </>
  );
}

// ── Sub-pieces ──────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full h-9 px-3 rounded-lg bg-paper border border-hairline text-[13px] text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink/40 transition-colors";

function Field({
  label,
  required,
  hint,
  suffix,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
          {label}
          {required && <span className="text-[#E11D2A] ml-0.5">*</span>}
        </span>
        {(hint || suffix) && (
          <span className="text-[10px] text-ink-mute">{hint ?? suffix}</span>
        )}
      </div>
      {children}
    </label>
  );
}

function SourceBadge({ custom }: { custom: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center text-[10px] font-medium uppercase tracking-[0.1em] border rounded-full px-2 h-[20px] " +
        (custom
          ? "text-indigo-700 border-indigo-100 bg-indigo-50"
          : "text-ink-mute border-hairline bg-fog")
      }
    >
      {custom ? "Custom" : "Seeded"}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Recipe / BOM editor (Phase B) ───────────────────────────────────
// Visual ingredient picker. Reads as "this product is made from..."
// rather than a technical ERP form. Each row is a component product
// + a qty stepper. Empty state invites "Add ingredient" once with
// a single action chip.

function RecipeEditor({
  currentProductId,
  products,
  recipe,
  onChange,
}: {
  currentProductId: string;
  products: { id: string; name: string; sku?: string }[];
  recipe: { componentId: string; qty: number }[];
  onChange: (next: { componentId: string; qty: number }[]) => void;
}) {
  // Available components = every product except the current one
  // (a product can't include itself as a component).
  const usedIds = new Set(recipe.map((r) => r.componentId));
  const available = products.filter(
    (p) => p.id !== currentProductId && !usedIds.has(p.id),
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  const addBlank = () => {
    if (available.length === 0) return;
    onChange([...recipe, { componentId: available[0].id, qty: 1 }]);
  };

  const updateRow = (
    idx: number,
    patch: Partial<{ componentId: string; qty: number }>,
  ) => {
    onChange(recipe.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (idx: number) => {
    onChange(recipe.filter((_, i) => i !== idx));
  };

  return (
    <section className="pt-3 mt-2 border-t border-hairline">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Bill of materials
          </p>
          <p className="mt-0.5 text-[11.5px] text-ink-soft">
            {recipe.length === 0
              ? "Tracked as a single SKU. Add components to make this a built product."
              : "Each sale deducts these components from stock automatically."}
          </p>
        </div>
        {recipe.length > 0 && (
          <p className="text-[10.5px] text-ink-mute tabular-nums shrink-0">
            {recipe.length} component{recipe.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {recipe.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {recipe.map((r, idx) => {
            const product = byId.get(r.componentId);
            // Pool of options for this row = available + the row's
            // current component so the select still has its own
            // entry to display.
            const options = product
              ? [...available, product]
              : available;
            return (
              <li
                key={`${r.componentId}-${idx}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-2"
              >
                <select
                  value={r.componentId}
                  onChange={(e) =>
                    updateRow(idx, { componentId: e.target.value })
                  }
                  className="h-10 px-3 text-[13px] rounded-lg border border-hairline bg-paper text-ink focus:outline-none focus:border-hairline-strong"
                >
                  {options
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <div className="inline-flex items-center h-10 rounded-lg border border-hairline bg-paper">
                  <button
                    type="button"
                    onClick={() =>
                      updateRow(idx, { qty: Math.max(1, r.qty - 1) })
                    }
                    aria-label="Decrease quantity"
                    className="h-full w-9 text-ink-mute hover:text-ink"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={r.qty}
                    onChange={(e) =>
                      updateRow(idx, {
                        qty: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="w-10 h-full text-center text-[13px] tabular-nums bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateRow(idx, { qty: r.qty + 1 })}
                    aria-label="Increase quantity"
                    className="h-full w-9 text-ink-mute hover:text-ink"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  aria-label="Remove component"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-ink-mute hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3 4h8m-6 0V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1m-4 0v7a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V4"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={addBlank}
        disabled={available.length === 0}
        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium rounded-full border border-dashed border-hairline-strong text-ink-soft hover:text-ink hover:border-ink/40 hover:bg-fog disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M6 2v8M2 6h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Add ingredient
      </button>
    </section>
  );
}
