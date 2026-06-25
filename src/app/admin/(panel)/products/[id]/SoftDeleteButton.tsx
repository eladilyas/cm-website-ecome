"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { softDeleteProduct } from "../actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function SoftDeleteButton({
  id,
  productName,
}: {
  id: string;
  /** Human-readable product name surfaced inside the confirm body. */
  productName?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const runDelete = () => {
    startTransition(async () => {
      await softDeleteProduct(id);
      router.push("/admin/products");
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-[13px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        {pending ? "Disabling…" : "Disable product"}
      </button>
      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          runDelete();
        }}
        title="Disable this product?"
        body={
          <>
            <p>
              {productName ? (
                <>
                  <strong className="text-ink">{productName}</strong> will be
                  removed from the storefront immediately. New visitors
                  won&rsquo;t see it on /shop or in search results.
                </>
              ) : (
                "This product will be removed from the storefront immediately."
              )}
            </p>
            <p className="mt-2 text-ink-mute">
              Existing orders are unaffected. You can restore the product via
              Prisma Studio if needed.
            </p>
          </>
        }
        confirmLabel="Disable product"
        tone="destructive"
      />
    </>
  );
}
