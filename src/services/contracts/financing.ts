// FinancingService — financing-application lifecycle contract.
//
// Wafasalaf-shaped financing for hardware bundles. The state machine
// documented in ARCHITECTURE.md §10 is enforced by `transitionStatus`.

import type {
  FinancingAgeBracket,
  FinancingId,
  FinancingRef,
  FinancingRequest,
  FinancingStatus,
  Money,
  UserId,
} from "./types";

export type FinancingFilter = Readonly<{
  applicantUserId?: UserId;
  status?: FinancingStatus | "any";
  since?: string;
  until?: string;
  limit?: number;
  cursor?: string;
}>;

export type CreateFinancingRequestInput = Readonly<{
  applicantUserId: UserId;
  requestedAmount: Money;
  requestedTermMonths: number;
  ageBracket: FinancingAgeBracket;
}>;

export type FinancingStatusTransition = Readonly<{
  requestId: FinancingId;
  from: FinancingStatus;
  to: FinancingStatus;
  actorUserId: UserId;
  reason?: string;
  occurredAt: string;
}>;

export type FinancingDecisionInput = Readonly<{
  requestId: FinancingId;
  approve: boolean;
  reason: string;
  /** When approving, freezes the offered monthly payment and term. */
  offeredMonthlyPayment?: Money;
  offeredTermMonths?: number;
}>;

export interface FinancingService {
  // Read ────────────────────────────────────────────────────────────────
  get(id: FinancingId): Promise<FinancingRequest | null>;
  getByRef(ref: FinancingRef): Promise<FinancingRequest | null>;
  list(filter?: FinancingFilter): Promise<FinancingRequest[]>;
  listHistory(id: FinancingId): Promise<FinancingStatusTransition[]>;

  // Write (customer) ────────────────────────────────────────────────────
  /** Creates as Draft. */
  create(input: CreateFinancingRequestInput): Promise<FinancingRequest>;

  /** Customer submits the application — Draft → Submitted. */
  submit(id: FinancingId, actor: UserId): Promise<FinancingRequest>;

  /** Customer attaches a document (passport, payslip, etc.) via
   *  FileService.upload, then registers the file id here. */
  attachDocument(id: FinancingId, fileId: string): Promise<FinancingRequest>;

  // Write (admin) ───────────────────────────────────────────────────────
  /** Admin requests more documents — Submitted → DocumentsRequired. */
  requestDocuments(
    id: FinancingId,
    actor: UserId,
    reason: string,
  ): Promise<FinancingRequest>;

  /** Admin moves into review — Submitted → UnderReview. */
  startReview(id: FinancingId, actor: UserId): Promise<FinancingRequest>;

  /** Admin issues the final decision. Wraps transitionStatus. */
  decide(
    input: FinancingDecisionInput,
    actor: UserId,
  ): Promise<FinancingRequest>;

  updateInternalNotes(id: FinancingId, notes: string): Promise<FinancingRequest>;

  /** Generic transition — used by edge cases (cancel by customer,
   *  paid-off marker, etc.). Validates the state machine. */
  transitionStatus(
    id: FinancingId,
    next: FinancingStatus,
    actor: UserId,
    reason?: string,
  ): Promise<FinancingRequest>;
}
