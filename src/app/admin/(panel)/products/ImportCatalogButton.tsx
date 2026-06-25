"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { importCatalogToDb } from "./actions";

export function ImportCatalogButton({ hasProducts }: { hasProducts: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await importCatalogToDb();
      setMessage(
        `Imported ${res.inserted} product${res.inserted === 1 ? "" : "s"}` +
          (res.skipped > 0 ? ` · ${res.skipped} skipped (already in DB)` : ""),
      );
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-[11.5px] text-ink-mute">{message}</span>
      )}
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-full border border-hairline-strong bg-paper px-4 text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-fog disabled:opacity-50 transition-colors"
        title={
          hasProducts
            ? "Re-run import — already-present slugs are skipped."
            : "One-shot mirror of src/data/catalog.ts into Postgres."
        }
      >
        {pending ? "Importing…" : "Import catalog"}
      </button>
    </div>
  );
}
