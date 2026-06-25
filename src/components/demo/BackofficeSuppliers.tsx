"use client";

// Backoffice — Suppliers section (light theme).
//
// Card grid (not a table — suppliers are richer than products and
// read better as cards). Each card surfaces: name, contact details,
// lead-time chip, and the categories this supplier serves. Click
// any card to edit; "+ New supplier" opens the same form.

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ACTIVITIES } from "@/data/demo/activities";
import { useDemoStore } from "@/lib/demoStore";
import type { ActivityKey, Supplier } from "@/data/demo/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Sheet } from "./Sheet";

export function BackofficeSuppliers() {
  const activity = useDemoStore((s) => s.activity);
  const suppliers = useDemoStore((s) =>
    activity ? s.suppliers[activity] : [],
  );
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);

  if (!activity) return null;
  const a = ACTIVITIES[activity];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-6 md:px-8 py-3 border-b border-hairline bg-paper flex items-center justify-between gap-3">
        <p className="text-[12px] text-ink-mute">
          {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"} ·{" "}
          {a.categories.length} categories
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="h-9 px-3 text-[12.5px] font-medium rounded-lg bg-ink text-paper hover:bg-ink-soft transition-colors"
        >
          + New supplier
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-5 bg-canvas">
        {suppliers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-mute text-[13px]">
            No suppliers yet. Add one to start tracking the supply side.
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {suppliers.map((s) => (
              <li key={s.id}>
                <SupplierCard
                  supplier={s}
                  activity={activity}
                  onClick={() => setEditing(s)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <SupplierFormSheet
        open={creating || editing !== null}
        activity={activity}
        supplier={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function SupplierCard({
  supplier,
  activity,
  onClick,
}: {
  supplier: Supplier;
  activity: ActivityKey;
  onClick: () => void;
}) {
  const a = ACTIVITIES[activity];
  const tCat = useTranslations("demo.categories");
  const categoryLabels = (supplier.categoryIds ?? [])
    .filter((id) => a.categories.some((c) => c.id === id))
    .map((id) => tCat(id));

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-[10px] border border-hairline bg-paper hover:border-hairline-strong hover:-translate-y-px p-4 md:p-5 transition-all"
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink truncate">
            {supplier.name}
          </p>
          {supplier.contactName && (
            <p className="mt-0.5 text-[12px] text-ink-soft truncate">
              {supplier.contactName}
            </p>
          )}
        </div>
        {supplier.leadDays != null && (
          <span className="shrink-0 inline-flex items-center text-[10px] font-medium uppercase tracking-[0.1em] border border-hairline bg-fog rounded-full px-2 h-[20px] text-ink-soft tabular-nums">
            {supplier.leadDays}d lead
          </span>
        )}
      </div>

      {(supplier.phone || supplier.email) && (
        <div className="mt-3 space-y-0.5">
          {supplier.phone && (
            <p className="text-[12px] text-ink-mute tabular-nums">
              {supplier.phone}
            </p>
          )}
          {supplier.email && (
            <p className="text-[12px] text-ink-mute truncate">
              {supplier.email}
            </p>
          )}
        </div>
      )}

      {categoryLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categoryLabels.slice(0, 4).map((label) => (
            <span
              key={label}
              className="text-[10px] uppercase tracking-[0.1em] text-ink-soft border border-hairline bg-canvas rounded px-1.5 py-0.5"
            >
              {label}
            </span>
          ))}
          {categoryLabels.length > 4 && (
            <span className="text-[10px] uppercase tracking-[0.1em] text-ink-mute">
              +{categoryLabels.length - 4}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function SupplierFormSheet({
  open,
  activity,
  supplier,
  onClose,
}: {
  open: boolean;
  activity: ActivityKey;
  supplier: Supplier | null;
  onClose: () => void;
}) {
  const addSupplier = useDemoStore((s) => s.addSupplier);
  const updateSupplier = useDemoStore((s) => s.updateSupplier);
  const deleteSupplier = useDemoStore((s) => s.deleteSupplier);

  const a = ACTIVITIES[activity];
  const tCat = useTranslations("demo.categories");

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [leadDays, setLeadDays] = useState<number>(3);
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formKey = open ? supplier?.id ?? "__new__" : "__closed__";
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    if (open) {
      if (supplier) {
        setName(supplier.name);
        setContactName(supplier.contactName ?? "");
        setPhone(supplier.phone ?? "");
        setEmail(supplier.email ?? "");
        setLeadDays(supplier.leadDays ?? 3);
        setCategoryIds(new Set(supplier.categoryIds ?? []));
      } else {
        setName("");
        setContactName("");
        setPhone("");
        setEmail("");
        setLeadDays(3);
        setCategoryIds(new Set());
      }
    }
  }

  if (!open) return null;

  const isEditing = supplier !== null;
  const canSave = name.trim().length > 0;

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = () => {
    if (!canSave) return;
    const patch: Partial<Supplier> = {
      name: name.trim(),
      contactName: contactName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      leadDays,
      categoryIds: categoryIds.size > 0 ? Array.from(categoryIds) : undefined,
    };
    if (isEditing) {
      updateSupplier(activity, supplier.id, patch);
    } else {
      const id = `sup_cust_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      addSupplier(activity, { id, name: patch.name!, ...patch });
    }
    onClose();
  };

  const remove = () => {
    if (!isEditing) return;
    deleteSupplier(activity, supplier.id);
    onClose();
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        scheme="light"
        title={isEditing ? `Edit · ${supplier.name}` : "New supplier"}
        subtitle={
          isEditing
            ? `${supplier.id}`
            : "Supplier ledger entry — used by reorder suggestions"
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
                {isEditing ? "Save changes" : "Add supplier"}
              </button>
            </div>
          </div>
        }
      >
        {/* Body — denser layout: name + contact compressed into one
            two-column row at the top, then phone+leadDays in a row,
            email + categories below. Net height ~210px (was ~360px). */}
        <div className="px-5 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Supplier name"
                className={INPUT_CLS}
                autoFocus
              />
            </Field>
            <Field label="Contact person">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact full name"
                className={INPUT_CLS}
              />
            </Field>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Field label="Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6 12 34 56 78"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Lead time" suffix="days">
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={leadDays}
                onChange={(e) => setLeadDays(parseInt(e.target.value, 10) || 0)}
                className={INPUT_CLS}
              />
            </Field>
          </div>

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@supplier.ma"
              className={INPUT_CLS}
            />
          </Field>

          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1.5">
              Categories served
            </p>
            <div className="flex flex-wrap gap-1.5">
              {a.categories.map((c) => {
                const active = categoryIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={
                      "h-7 px-2.5 text-[11px] font-medium rounded-full border transition-colors " +
                      (active
                        ? "border-ink bg-ink text-paper"
                        : "border-hairline bg-paper text-ink-soft hover:text-ink hover:bg-fog")
                    }
                    style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
                  >
                    {tCat(c.id)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Sheet>

      {isEditing && (
        <ConfirmDialog
          open={confirmDelete}
          scheme="light"
          tone="destructive"
          title="Delete this supplier?"
          body="Removes the supplier entry. Existing receipts and stock movements aren't affected. This can't be undone."
          confirmLabel="Delete supplier"
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
