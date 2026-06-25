"use client";

// Shared category create + edit form. Same shape both modes; slug is
// locked on edit to keep public URLs stable.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { CategoryInputT } from "@/app/admin/(panel)/categories/actions";

type Props = {
  mode: "create" | "edit";
  initial?: Partial<CategoryInputT>;
  onSubmit: (
    values: CategoryInputT,
  ) => Promise<{ ok: true; id?: string } | { ok: false; error: string }>;
  redirectTo?: (id?: string) => string;
};

const DEFAULTS: CategoryInputT = {
  slug: "",
  label: "",
  description: "",
  heroImage: "",
  isActive: true,
  displayOrder: 100,
};

export function CategoryForm({ mode, initial, onSubmit, redirectTo }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<CategoryInputT>({
    ...DEFAULTS,
    ...(initial ?? {}),
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setField = <K extends keyof CategoryInputT>(
    key: K,
    v: CategoryInputT[K],
  ) => setValues((prev) => ({ ...prev, [key]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: CategoryInputT = {
      ...values,
      slug: values.slug.trim().toLowerCase(),
      label: values.label.trim(),
      description: values.description?.trim() || null,
      heroImage: values.heroImage?.trim() || null,
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

  return (
    <form onSubmit={submit} className="rounded-xl border border-hairline bg-paper p-5 md:p-6 max-w-[760px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Slug" required>
          <input
            type="text"
            value={values.slug}
            onChange={(e) => setField("slug", e.target.value)}
            placeholder="pos-terminals"
            required
            disabled={mode === "edit"}
            className={inputCls + (mode === "edit" ? " opacity-60 cursor-not-allowed" : "")}
          />
        </Field>
        <Field label="Display order" required>
          <input
            type="number"
            min="0"
            max="9999"
            value={values.displayOrder}
            onChange={(e) => setField("displayOrder", Number(e.target.value))}
            required
            className={inputCls + " tabular-nums"}
          />
        </Field>
      </div>

      <Field label="Label" required className="mt-4">
        <input
          type="text"
          value={values.label}
          onChange={(e) => setField("label", e.target.value)}
          placeholder="POS Terminals"
          required
          className={inputCls}
        />
      </Field>

      <Field label="Description" className="mt-4">
        <textarea
          value={values.description ?? ""}
          onChange={(e) => setField("description", e.target.value)}
          rows={3}
          placeholder="One-line marketing description shown on the category landing page (future)."
          className={inputCls + " py-3 resize-y min-h-[88px]"}
        />
      </Field>

      <Field label="Hero image path" className="mt-4">
        <input
          type="text"
          value={values.heroImage ?? ""}
          onChange={(e) => setField("heroImage", e.target.value)}
          placeholder="/hardware/category-pos.webp"
          className={inputCls}
        />
      </Field>

      <label className="mt-5 flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => setField("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-hairline-strong text-ink focus:ring-ink/15"
        />
        <span className="text-[13px] text-ink">
          Active — visible on the public site
        </span>
      </label>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          {error}
        </div>
      )}

      <div className="mt-7 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/categories")}
          className="text-[13px] text-ink-mute hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-[13.5px] font-medium text-paper hover:bg-ink-soft disabled:opacity-50 transition-colors"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create category"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full h-11 px-3.5 rounded-lg bg-paper border border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04] text-[13.5px] text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus:outline-none";
