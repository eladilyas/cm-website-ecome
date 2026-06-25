// Shared status pill for order + financing rows. Tints follow the
// site palette: emerald for healthy/done, amber for in-progress,
// red for blocked, indigo for informational.
//
// Order statuses live in the Postgres OrderStatus enum (Prisma). The
// labels here are the customer-facing French copy the portal uses.

import type { OrderStatus, FinancingStatus } from "@prisma/client";

type Tone = "emerald" | "amber" | "indigo" | "red" | "ink";

const TONE: Record<Tone, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  red: "border-red-200 bg-red-50 text-red-700",
  ink: "border-hairline bg-canvas text-ink-soft",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  PENDING: "ink",
  AWAITING_PAYMENT: "amber",
  PENDING_FINANCING_APPROVAL: "amber",
  FINANCING_REJECTED: "red",
  PAYMENT_VERIFICATION: "amber",
  PROCESSING: "indigo",
  SENT_TO_ODOO: "indigo",
  CONFIRMED: "indigo",
  SHIPPED: "amber",
  DELIVERED: "emerald",
  CANCELLED: "red",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "En attente",
  AWAITING_PAYMENT: "En attente de paiement",
  PENDING_FINANCING_APPROVAL: "Financement en attente d'approbation",
  FINANCING_REJECTED: "Financement refusé",
  PAYMENT_VERIFICATION: "Vérification du paiement",
  PROCESSING: "Payée · en préparation",
  SENT_TO_ODOO: "Validée",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export const FIN_STATUS_TONE: Record<FinancingStatus, Tone> = {
  DRAFT: "ink",
  SUBMITTED: "indigo",
  DOCUMENTS_REQUIRED: "amber",
  UNDER_REVIEW: "amber",
  APPROVED: "emerald",
  ACTIVE: "emerald",
  PAID_OFF: "emerald",
  REJECTED: "red",
  CANCELLED: "ink",
};

export const FIN_STATUS_LABEL: Record<FinancingStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Demande envoyée",
  DOCUMENTS_REQUIRED: "Documents requis",
  UNDER_REVIEW: "En cours d'étude",
  APPROVED: "Approuvée",
  ACTIVE: "Active",
  PAID_OFF: "Soldée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
};

export function StatusBadge({
  tone,
  label,
}: {
  tone: Tone;
  label: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full border text-[10.5px] font-semibold uppercase tracking-[0.08em] " +
        TONE[tone]
      }
    >
      <span
        aria-hidden
        className={
          "w-1.5 h-1.5 rounded-full " +
          ({
            emerald: "bg-emerald-500",
            amber: "bg-amber-500",
            indigo: "bg-indigo-500",
            red: "bg-red-500",
            ink: "bg-ink-mute",
          } as Record<Tone, string>)[tone]
        }
      />
      {label}
    </span>
  );
}
