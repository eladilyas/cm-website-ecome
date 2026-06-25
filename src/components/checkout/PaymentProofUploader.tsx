"use client";

// Wire-transfer receipt uploader — same component on both /checkout/
// success and /account/orders/[ref] so the experience is identical
// regardless of where the customer completes the upload.
//
// Architecture: file → base64 (FileReader) → POST /api/orders/[ref]/proof
// → Postgres column `Order.paymentProofJson`. On success the proof
// state updates locally so the UI flips to the "uploaded" branch
// without a full reload (router.refresh() pulls the server-truth
// next render).

"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { DisplayPaymentProof } from "@/server/orders/service";

type PaymentProof = DisplayPaymentProof;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPT = "image/*,application/pdf";

export function PaymentProofUploader({
  orderRef,
  initialProof,
}: {
  orderRef: string;
  initialProof: PaymentProof | null;
}) {
  const router = useRouter();
  const [proof, setProof] = useState<PaymentProof | null>(initialProof);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Format non supporté. Utilisez une image ou un PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Fichier trop volumineux. Taille maximum: 5 MB.");
      return;
    }
    setReading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      const next: PaymentProof = {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        dataUrl,
        uploadedAt: Date.now(),
      };
      try {
        const res = await fetch(`/api/orders/${orderRef}/proof`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(json.error ?? "Échec de l'envoi. Veuillez réessayer.");
          setReading(false);
          return;
        }
        setProof(next);
        setReading(false);
        router.refresh();
      } catch {
        setError("Échec de l'envoi. Veuillez réessayer.");
        setReading(false);
      }
    };
    reader.onerror = () => {
      setReading(false);
      setError("Échec de lecture du fichier. Veuillez réessayer.");
    };
    reader.readAsDataURL(file);
  };

  // The "remove" affordance is intentionally absent — admins handle
  // proof corrections. Re-uploading a new file replaces the previous
  // proof in place.

  // Uploaded state — preview + replace + remove.
  if (proof && proof.dataUrl) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start gap-3">
          <ProofPreview proof={proof} />
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              <CheckIcon />
              Reçu téléchargé
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink truncate">
              {proof.fileName}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-mute tabular-nums">
              {formatBytes(proof.sizeBytes)} · {formatDate(proof.uploadedAt)}
            </p>
            <p className="mt-2 text-[12px] text-ink-soft leading-relaxed">
              Notre équipe vérifiera le reçu et confirmera votre commande dès
              que le virement sera reçu (généralement sous 24h ouvrées).
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-hairline-strong bg-paper text-[12.5px] font-medium text-ink hover:bg-fog transition-colors"
              >
                Remplacer
              </button>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  // Idle state — drop zone + browse button.
  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={reading}
        className="w-full rounded-xl border-2 border-dashed border-hairline-strong bg-canvas hover:bg-fog hover:border-ink/40 px-5 py-6 transition-colors flex flex-col items-center text-center disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        <span className="h-10 w-10 rounded-full bg-paper border border-hairline inline-flex items-center justify-center mb-3">
          {reading ? <Spinner /> : <UploadIcon />}
        </span>
        <p className="text-[13.5px] font-medium text-ink">
          {reading
            ? "Lecture du fichier…"
            : "Télécharger votre reçu de virement"}
        </p>
        <p className="mt-1 text-[11.5px] text-ink-mute leading-snug max-w-[24rem]">
          PNG, JPG ou PDF · 5 MB max. Le scan/photo de l&apos;avis de
          virement bancaire suffit.
        </p>
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 text-[12px] font-medium text-red-700"
        >
          {error}
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ProofPreview({ proof }: { proof: PaymentProof }) {
  const isImage = proof.mimeType.startsWith("image/");
  if (isImage) {
    return (
      <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-canvas border border-hairline">
        <Image
          src={proof.dataUrl}
          alt={proof.fileName}
          fill
          sizes="64px"
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div className="h-16 w-16 shrink-0 rounded-lg bg-canvas border border-hairline inline-flex flex-col items-center justify-center">
      <PdfIcon />
      <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-ink-mute">
        PDF
      </span>
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 13V3M10 3l-3.5 3.5M10 3l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 13v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.6"
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.5l2.5 2.5L9.5 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M6 2.5h6l3 3v10a1.5 1.5 0 0 1-1.5 1.5h-7.5A1.5 1.5 0 0 1 4.5 15.5V4a1.5 1.5 0 0 1 1.5-1.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        className="text-ink-mute"
      />
      <path
        d="M12 2.5v3h3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        className="text-ink-mute"
      />
    </svg>
  );
}
