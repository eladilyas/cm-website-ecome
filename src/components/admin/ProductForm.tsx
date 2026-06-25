"use client";

// Unified product create/edit form. Used by /admin/products/new and
// /admin/products/[id]. Every field on CatalogProduct is exposed,
// including the structured ones (features list, specs table,
// complementary slugs).
//
// Status options follow the brief: en stock / en arrivage / désactivé.
// Out-of-stock stays exposed because the schema supports it and the
// existing frontend may already use it.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUSES,
} from "@/server/products/labels";
import type { ProductInputT } from "@/app/admin/(panel)/products/actions";

/** Strip accents, collapse non-alphanumerics to single hyphens, lower-case.
 *  Mirrors the convention used by the catalog: "Swan 1 Gen 2" → "swan-1-gen-2". */
const slugify = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Category options passed in by the page-level server component.
 *  Driven by the live Category table so admin renames are visible
 *  here without redeploys. */
export type CategoryOption = Readonly<{
  slug: string;
  label: string;
  isActive: boolean;
}>;

export type ProductFormInitial = ProductInputT;

const EMPTY_DEFAULTS: ProductFormInitial = {
  slug: "",
  name: "",
  subline: "",
  tagline: "",
  category: "pos-terminals",
  heroImage: "",
  alt: "",
  shortDescription: "",
  features: [],
  specs: [],
  priceFromMinor: 0,
  currency: "MAD",
  status: "IN_STOCK",
  leadWeeks: null,
  complementaryWithSlugs: [],
  featured: false,
  displayOrder: 100,
  badges: [],
};

type Props = {
  mode: "create" | "edit";
  initial?: Partial<ProductFormInitial>;
  /** Live category options for the dropdown. The page passes them in
   *  so the form stays a pure client component. */
  categoryOptions: readonly CategoryOption[];
  onSubmit: (
    values: ProductFormInitial,
  ) => Promise<{ ok: true; id?: string } | { ok: false; error: string }>;
  /** Redirect after a successful submit. */
  redirectTo?: (id?: string) => string;
};

export function ProductForm({
  mode,
  initial,
  categoryOptions,
  onSubmit,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormInitial>({
    ...EMPTY_DEFAULTS,
    ...(initial ?? {}),
    features: initial?.features ?? [],
    specs: initial?.specs ?? [],
    complementaryWithSlugs: initial?.complementaryWithSlugs ?? [],
    badges: initial?.badges ?? [],
  });
  // Price input is held as a string so a single trailing decimal point
  // doesn't break the editing UX.
  const [priceMad, setPriceMad] = useState<string>(
    initial?.priceFromMinor != null
      ? (initial.priceFromMinor / 100).toString()
      : "",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Tracks whether the slug field has been edited manually. Once true, the
  // auto-slug-from-name stops overwriting it. Always true in edit mode so
  // existing URLs never silently change while an admin edits a product.
  const [slugTouched, setSlugTouched] = useState<boolean>(
    mode === "edit" || Boolean(initial?.slug),
  );

  // ── helpers ──────────────────────────────────────────────────────────
  const setField = <K extends keyof ProductFormInitial>(
    key: K,
    v: ProductFormInitial[K],
  ) => setValues((prev) => ({ ...prev, [key]: v }));

  /** Name onChange — when slug hasn't been hand-edited, derive it on every
   *  keystroke so the URL preview stays in sync as the admin types. */
  const setName = (nextName: string) =>
    setValues((prev) => ({
      ...prev,
      name: nextName,
      slug: slugTouched ? prev.slug : slugify(nextName),
    }));

  const setSlug = (nextSlug: string) => {
    setSlugTouched(true);
    setField("slug", nextSlug);
  };

  const addFeature = () => setField("features", [...values.features, ""]);
  const setFeature = (i: number, v: string) =>
    setField(
      "features",
      values.features.map((f, idx) => (idx === i ? v : f)),
    );
  const removeFeature = (i: number) =>
    setField(
      "features",
      values.features.filter((_, idx) => idx !== i),
    );

  const addSpec = () =>
    setField("specs", [...values.specs, { label: "", value: "" }]);
  const setSpec = (i: number, patch: Partial<{ label: string; value: string }>) =>
    setField(
      "specs",
      values.specs.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  const removeSpec = (i: number) =>
    setField(
      "specs",
      values.specs.filter((_, idx) => idx !== i),
    );

  const complementaryRaw = useMemo(
    () => values.complementaryWithSlugs.join(", "),
    [values.complementaryWithSlugs],
  );

  // ── submit ───────────────────────────────────────────────────────────
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Normalize: trim, drop blank features/specs, parse price.
    const priceNumber = Number(priceMad);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Price must be a non-negative number in MAD.");
      return;
    }
    const priceFromMinor = Math.round(priceNumber * 100);

    const payload: ProductFormInitial = {
      ...values,
      slug: values.slug.trim().toLowerCase(),
      name: values.name.trim(),
      subline: values.subline?.trim() || null,
      tagline: values.tagline.trim(),
      heroImage: values.heroImage.trim(),
      alt: values.alt.trim(),
      shortDescription: values.shortDescription.trim(),
      features: values.features.map((f) => f.trim()).filter(Boolean),
      specs: values.specs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label && s.value),
      priceFromMinor,
      complementaryWithSlugs: values.complementaryWithSlugs
        .map((s) => s.trim())
        .filter(Boolean),
      featured: Boolean(values.featured),
      displayOrder: Number(values.displayOrder ?? 100),
      badges: (values.badges ?? [])
        .map((b) => b.trim())
        .filter(Boolean),
    };

    startTransition(async () => {
      const res = await onSubmit(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (redirectTo) router.push(redirectTo(res.id));
      else router.refresh();
    });
  };

  // ── render ───────────────────────────────────────────────────────────
  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Identity */}
      <Card title="Identity" description="Name, slug, category, tagline.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" required>
            <input
              type="text"
              value={values.name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Swan 1"
              required
              className={inputCls}
            />
          </Field>
          <Field label="Subline">
            <input
              type="text"
              value={values.subline ?? ""}
              onChange={(e) => setField("subline", e.target.value)}
              placeholder="Gen 2"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Field
            label="Slug"
            required
            hint={
              mode === "create" && !slugTouched
                ? "Auto-generated from name — edit to override."
                : undefined
            }
          >
            <input
              type="text"
              value={values.slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="swan-1-gen-2"
              required
              disabled={mode === "edit"}
              className={inputCls + (mode === "edit" ? " opacity-60 cursor-not-allowed" : "")}
            />
          </Field>
          <Field label="Category" required>
            <select
              value={values.category}
              onChange={(e) => setField("category", e.target.value)}
              className={selectCls}
            >
              {categoryOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                  {!c.isActive ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Tagline" required className="mt-4">
          <input
            type="text"
            value={values.tagline}
            onChange={(e) => setField("tagline", e.target.value)}
            placeholder="Elegance meets exceptional performance."
            required
            className={inputCls}
          />
        </Field>
      </Card>

      {/* Imagery + alt */}
      <Card title="Image" description="Hero image used on /shop cards + detail page.">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4">
          <Field label="Hero image path" required>
            <input
              type="text"
              value={values.heroImage}
              onChange={(e) => setField("heroImage", e.target.value)}
              placeholder="/hardware/swan-1-gen-2.webp"
              required
              className={inputCls}
            />
          </Field>
          <div className="rounded-lg border border-hairline bg-canvas/60 h-[88px] flex items-center justify-center text-[11px] text-ink-mute overflow-hidden">
            {values.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.heroImage}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              "Preview"
            )}
          </div>
        </div>
        <Field label="Alt text" required className="mt-4">
          <input
            type="text"
            value={values.alt}
            onChange={(e) => setField("alt", e.target.value)}
            placeholder="Swan 1 Gen 2 desktop POS terminal…"
            required
            className={inputCls}
          />
        </Field>
      </Card>

      {/* Copy */}
      <Card title="Copy" description="Short description shown on cards + detail page.">
        <Field label="Short description" required>
          <textarea
            value={values.shortDescription}
            onChange={(e) => setField("shortDescription", e.target.value)}
            rows={4}
            required
            className={inputCls + " py-3 resize-y min-h-[100px]"}
            placeholder="2–3 sentences of marketing copy."
          />
        </Field>
      </Card>

      {/* Features list */}
      <Card
        title="Features"
        description="Bullet list shown on the detail page."
        actions={
          <button
            type="button"
            onClick={addFeature}
            className="text-[12.5px] font-medium text-ink hover:underline underline-offset-[5px]"
          >
            + Add feature
          </button>
        }
      >
        {values.features.length === 0 ? (
          <p className="text-[12.5px] text-ink-mute italic">
            No features yet. Click + Add feature to start.
          </p>
        ) : (
          <ul className="space-y-2">
            {values.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={f}
                  onChange={(e) => setFeature(i, e.target.value)}
                  placeholder="Feature description"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="h-10 w-10 inline-flex items-center justify-center text-ink-mute hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  aria-label="Remove feature"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Specs table */}
      <Card
        title="Specifications"
        description="Label / value pairs for the spec table."
        actions={
          <button
            type="button"
            onClick={addSpec}
            className="text-[12.5px] font-medium text-ink hover:underline underline-offset-[5px]"
          >
            + Add spec
          </button>
        }
      >
        {values.specs.length === 0 ? (
          <p className="text-[12.5px] text-ink-mute italic">
            No specs yet. Click + Add spec to build the spec table.
          </p>
        ) : (
          <ul className="space-y-2">
            {values.specs.map((s, i) => (
              <li
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] gap-2 items-center"
              >
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => setSpec(i, { label: e.target.value })}
                  placeholder="Processor"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => setSpec(i, { value: e.target.value })}
                  placeholder="Octa-core ARM A55, 2.0 GHz"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  className="h-10 w-10 inline-flex items-center justify-center text-ink-mute hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  aria-label="Remove spec"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Pricing + status */}
      <Card title="Pricing & status">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Price from (MAD HT)" required>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={priceMad}
              onChange={(e) => setPriceMad(e.target.value)}
              placeholder="4500"
              required
              className={inputCls + " tabular-nums"}
            />
          </Field>
          <Field label="Status" required>
            <select
              value={values.status}
              onChange={(e) =>
                setField("status", e.target.value as ProductFormInitial["status"])
              }
              className={selectCls}
            >
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PRODUCT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Lead weeks"
            hint={values.status === "INCOMING" ? "Required for arrivage" : "Optional"}
          >
            <input
              type="number"
              min="1"
              max="52"
              value={values.leadWeeks ?? ""}
              onChange={(e) =>
                setField(
                  "leadWeeks",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="3"
              className={inputCls + " tabular-nums"}
            />
          </Field>
        </div>
      </Card>

      {/* Merchandising */}
      <Card
        title="Merchandising"
        description="Drives placement on the home rail + /shop ordering + tag badges on cards."
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4">
          <label className="flex items-start gap-3 rounded-lg border border-hairline bg-canvas/60 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(values.featured)}
              onChange={(e) => setField("featured", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-hairline-strong text-ink focus:ring-ink/15"
            />
            <span>
              <span className="block text-[13px] font-medium text-ink">
                Featured
              </span>
              <span className="block text-[11.5px] text-ink-soft mt-0.5 leading-[1.45]">
                Shows up in the home page rail + any &ldquo;featured products&rdquo; section.
              </span>
            </span>
          </label>
          <Field label="Display order">
            <input
              type="number"
              min="0"
              max="9999"
              value={values.displayOrder ?? 100}
              onChange={(e) => setField("displayOrder", Number(e.target.value))}
              className={inputCls + " tabular-nums"}
            />
          </Field>
        </div>
        <Field
          label="Badges / tags"
          hint="Comma-separated. Examples: NEW, PROMO, BEST-SELLER."
          className="mt-4"
        >
          <input
            type="text"
            value={(values.badges ?? []).join(", ")}
            onChange={(e) =>
              setField(
                "badges",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="NEW, BEST-SELLER"
            className={inputCls}
          />
        </Field>
      </Card>

      {/* Linking */}
      <Card
        title="Cross-sell"
        description="Products to suggest alongside this one in the cart and checkout."
      >
        <Field
          label="Complementary slugs"
          hint="Comma-separated. Drives the cart drawer's upsell grid."
        >
          <input
            type="text"
            value={complementaryRaw}
            onChange={(e) =>
              setField(
                "complementaryWithSlugs",
                e.target.value.split(",").map((s) => s.trim()),
              )
            }
            placeholder="swift-1-pro, heron-1-mini, swan-1k-gen-2"
            className={inputCls}
          />
        </Field>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="text-[13px] text-ink-mute hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-[13.5px] font-medium text-paper hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ── shared local primitives ────────────────────────────────────────────

function Card({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-paper">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
        <div>
          <h2 className="text-[14.5px] font-semibold tracking-[-0.011em] text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[12px] text-ink-soft">{description}</p>
          )}
        </div>
        {actions}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {hint && <span className="text-[11px] text-ink-mute">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputCls =
  "w-full h-11 px-3.5 rounded-lg bg-paper border border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04] text-[13.5px] text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus:outline-none";

const selectCls = inputCls + " appearance-none cursor-pointer";
