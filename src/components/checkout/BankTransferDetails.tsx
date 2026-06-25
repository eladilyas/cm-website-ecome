"use client";

// Bank transfer instructions block — beneficiary, RIB, BIC, currency
// + the order reference the customer should include in the wire's
// communication field so ops can match the funds to the right order.
//
// Demo-grade: the bank coordinates here are placeholder values
// representative of a Moroccan business banking setup. Wire to real
// values during commercial onboarding.
//
// Each value has a "copy" button — single biggest UX win for wire
// transfers, since typos in IBAN or reference are the #1 reason a
// transfer can't be matched.

import { useState } from "react";
import { formatPrice } from "@/lib/formatPrice";

const BANK_DETAILS = {
  beneficiary: "Caisse Manager SARL",
  bank: "Attijariwafa Bank",
  rib: "007 780 0001234567890123 45",
  bic: "BCMAMAMC",
  currency: "MAD",
} as const;

export function BankTransferDetails({
  amount,
  orderRef,
}: {
  amount: number;
  orderRef: string;
}) {
  return (
    <section className="rounded-2xl bg-paper border border-hairline overflow-hidden">
      <header className="px-5 py-4 border-b border-hairline">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
          Instructions de virement
        </p>
        <h2 className="mt-0.5 text-[16px] font-semibold tracking-[-0.005em] text-ink">
          Effectuer le virement bancaire
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-soft leading-relaxed">
          Effectuez le virement depuis votre banque en utilisant les
          coordonnées ci-dessous. Mentionnez bien la référence{" "}
          <span className="font-medium text-ink">{orderRef}</span> dans le
          libellé pour que nous puissions identifier votre paiement
          rapidement.
        </p>
      </header>

      <dl className="divide-y divide-hairline">
        <Row label="Bénéficiaire" value={BANK_DETAILS.beneficiary} />
        <Row label="Banque" value={BANK_DETAILS.bank} />
        <Row label="RIB" value={BANK_DETAILS.rib} mono />
        <Row label="BIC / SWIFT" value={BANK_DETAILS.bic} mono />
        <Row
          label="Référence à mentionner"
          value={orderRef}
          mono
          emphasis
        />
        <Row
          label="Montant à virer · TTC"
          value={`${formatPrice(amount)} ${BANK_DETAILS.currency}`}
          emphasis
        />
      </dl>

      <footer className="px-5 py-3.5 bg-canvas border-t border-hairline">
        <p className="text-[11.5px] text-ink-mute leading-relaxed">
          <strong className="font-semibold text-ink-soft">Délai:</strong>{" "}
          Effectuez le virement sous 48h. Votre commande sera expédiée
          dès la réception et la validation des fonds par notre équipe
          (généralement sous 24h ouvrées après le virement).
        </p>
      </footer>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API blocked; silently fail.
    }
  };

  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <dt className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-mute">
          {label}
        </dt>
        <dd
          className={
            "mt-0.5 " +
            (mono ? "font-mono " : "") +
            (emphasis
              ? "text-[15px] font-semibold tracking-[-0.005em] text-ink"
              : "text-[13.5px] text-ink") +
            " tabular-nums truncate"
          }
        >
          {value}
        </dd>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
        className={
          "shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11.5px] font-medium transition-colors " +
          (copied
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-canvas text-ink-soft border border-hairline hover:bg-fog hover:text-ink")
        }
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copié" : "Copier"}
      </button>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="3.5"
        width="7"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5.5 3.5V2.2A.7.7 0 0 1 6.2 1.5h4.6a.7.7 0 0 1 .7.7v7.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
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
