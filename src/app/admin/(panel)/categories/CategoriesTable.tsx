"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { StatusPill } from "@/components/admin/AdminPrimitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { reorderCategory, toggleCategoryActive } from "./actions";

type Row = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  productCount: number;
};

export function CategoriesTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<Row | null>(null);

  const runToggle = (id: string) =>
    startTransition(async () => {
      await toggleCategoryActive(id);
      router.refresh();
    });

  /** Deactivation cascades to every product in the category (see
   *  src/server/catalog/cascade.ts → disableAllProductsInCategory).
   *  That's destructive enough to require a confirm. Reactivation
   *  is non-cascading and safe — flip instantly. */
  const toggle = (row: Row) => {
    if (row.isActive) {
      setConfirming(row);
      return;
    }
    runToggle(row.id);
  };

  const move = (id: string, dir: "up" | "down") =>
    startTransition(async () => {
      await reorderCategory(id, dir);
      router.refresh();
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead className="admin-thead text-ink-mute text-[11px] uppercase tracking-[0.12em]">
          <tr>
            <th className="text-left font-medium px-5 py-3 w-12">Order</th>
            <th className="text-left font-medium px-5 py-3">Category</th>
            <th className="text-left font-medium px-5 py-3">Products</th>
            <th className="text-left font-medium px-5 py-3">Status</th>
            <th className="w-12 px-5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-canvas/60 transition-colors">
              <td className="px-5 py-3.5">
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    onClick={() => move(r.id, "up")}
                    disabled={pending || i === 0}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-fog disabled:opacity-30 transition-colors"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => move(r.id, "down")}
                    disabled={pending || i === rows.length - 1}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-fog disabled:opacity-30 transition-colors"
                  >
                    ↓
                  </button>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <Link href={`/admin/categories/${r.id}`} className="block">
                  <p className="font-medium text-ink">{r.label}</p>
                  <p className="text-[11.5px] text-ink-mute">/{r.slug}</p>
                </Link>
              </td>
              <td className="px-5 py-3.5 text-ink-soft tabular-nums">
                {r.productCount}
              </td>
              <td className="px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  disabled={pending}
                  className="inline-block"
                  aria-label={
                    r.isActive ? "Deactivate category" : "Activate category"
                  }
                >
                  <StatusPill
                    label={r.isActive ? "Active" : "Inactive"}
                    tone={r.isActive ? "good" : "neutral"}
                  />
                </button>
              </td>
              <td className="px-5 py-3.5 text-right">
                <Link
                  href={`/admin/categories/${r.id}`}
                  className="text-ink-mute hover:text-ink"
                  aria-label="Edit category"
                >
                  →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={confirming !== null}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const row = confirming;
          setConfirming(null);
          if (row) runToggle(row.id);
        }}
        title="Deactivate this category?"
        body={
          confirming ? (
            <>
              <p>
                <strong className="text-ink">{confirming.label}</strong> will
                be hidden from the storefront,
                {confirming.productCount > 0 ? (
                  <>
                    {" "}
                    along with all{" "}
                    <strong className="text-ink">
                      {confirming.productCount}
                    </strong>{" "}
                    products in it.
                  </>
                ) : (
                  " and its products will be hidden along with it."
                )}
              </p>
              <p className="mt-2 text-ink-mute">
                Re-activate the category later; products stay disabled and
                need to be re-enabled individually.
              </p>
            </>
          ) : null
        }
        confirmLabel="Deactivate category"
        tone="destructive"
      />
    </div>
  );
}
