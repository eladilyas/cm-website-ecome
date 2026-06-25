// Financing status helpers — single source of truth. Mirrors
// `src/server/orders/status.ts` in structure so the two domains share
// vocabulary (bucket / label / tone / state machine).

import type {
  FinancingStatus,
  FinancingAgeBracket,
} from "@prisma/client";

export type FinancingBucket = "pending" | "active" | "terminal";

export const PENDING_STATUSES: FinancingStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "DOCUMENTS_REQUIRED",
  "UNDER_REVIEW",
];

export const ACTIVE_STATUSES: FinancingStatus[] = [
  "APPROVED",
  "ACTIVE",
  "PAID_OFF",
];

export const TERMINAL_STATUSES: FinancingStatus[] = ["REJECTED", "CANCELLED"];

export function classifyFinancingStatus(
  status: FinancingStatus,
): FinancingBucket {
  if (PENDING_STATUSES.includes(status)) return "pending";
  if (ACTIVE_STATUSES.includes(status)) return "active";
  return "terminal";
}

// ── Display labels + tones ────────────────────────────────────────────

export const FINANCING_STATUS_LABEL: Record<FinancingStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Demande envoyée",
  DOCUMENTS_REQUIRED: "Documents requis",
  UNDER_REVIEW: "En cours d'étude",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
  ACTIVE: "Active",
  PAID_OFF: "Soldée",
  CANCELLED: "Annulée",
};

export const FINANCING_STATUS_TONE: Record<
  FinancingStatus,
  "neutral" | "good" | "warn" | "bad" | "info"
> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  DOCUMENTS_REQUIRED: "warn",
  UNDER_REVIEW: "warn",
  APPROVED: "good",
  ACTIVE: "good",
  PAID_OFF: "good",
  REJECTED: "bad",
  CANCELLED: "neutral",
};

export const FINANCING_STATUSES: FinancingStatus[] = [
  ...PENDING_STATUSES,
  ...ACTIVE_STATUSES,
  ...TERMINAL_STATUSES,
];

// ── Age bracket ───────────────────────────────────────────────────────
// Customer-facing "under 60" / "60+" maps cleanly onto Wafasalaf's
// premium-rate distinction. UI uses the strings; service stores enum.

export const AGE_BRACKET_LABEL: Record<FinancingAgeBracket, string> = {
  UNDER_60: "Moins de 60 ans",
  SIXTY_PLUS: "60 ans et plus",
};

export function ageBracketFromCustomerUnion(
  v: "under-60" | "60-plus",
): FinancingAgeBracket {
  return v === "under-60" ? "UNDER_60" : "SIXTY_PLUS";
}

// ── State machine ─────────────────────────────────────────────────────

const TRANSITIONS: Record<FinancingStatus, readonly FinancingStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "DOCUMENTS_REQUIRED", "CANCELLED"],
  DOCUMENTS_REQUIRED: ["SUBMITTED", "UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "DOCUMENTS_REQUIRED"],
  APPROVED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["PAID_OFF", "CANCELLED"],
  PAID_OFF: [],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransitionTo(
  from: FinancingStatus,
  to: FinancingStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatusesFrom(
  from: FinancingStatus,
): FinancingStatus[] {
  return [...TRANSITIONS[from]];
}
