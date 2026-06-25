// In-memory FinancingService — mirrors the order service pattern.
// State-machine guards + audit logging are enforced identically.

import {
  ConflictError,
  InvalidTransitionError,
  NotFoundError,
  type CreateFinancingRequestInput,
  type FinancingDecisionInput,
  type FinancingFilter,
  type FinancingId,
  type FinancingRef,
  type FinancingRequest,
  type FinancingService,
  type FinancingStatus,
  type FinancingStatusTransition,
  type UserId,
} from "@/services/contracts";
import { canTransitionFinancing } from "@/lib/state-machines/financing";
import { generateFinancingRef } from "@/lib/refs";
import type { AuditService } from "@/services/contracts/audit";

function uid(prefix = "fin"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class DemoFinancingService implements FinancingService {
  private requests = new Map<FinancingId, FinancingRequest>();
  private history = new Map<FinancingId, FinancingStatusTransition[]>();

  constructor(private readonly audit: AuditService) {}

  // ── Read ──────────────────────────────────────────────────────────

  async get(id: FinancingId): Promise<FinancingRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async getByRef(ref: FinancingRef): Promise<FinancingRequest | null> {
    for (const r of this.requests.values()) {
      if (r.ref === ref) return r;
    }
    return null;
  }

  async list(filter?: FinancingFilter): Promise<FinancingRequest[]> {
    let items = Array.from(this.requests.values());

    if (filter?.applicantUserId) {
      items = items.filter(
        (r) => r.applicantUserId === filter.applicantUserId,
      );
    }
    if (filter?.status && filter.status !== "any") {
      items = items.filter((r) => r.status === filter.status);
    }
    if (filter?.since) {
      items = items.filter((r) => r.createdAt >= filter.since!);
    }
    if (filter?.until) {
      items = items.filter((r) => r.createdAt <= filter.until!);
    }

    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    if (filter?.limit && filter.limit > 0) {
      items = items.slice(0, filter.limit);
    }
    return items;
  }

  async listHistory(id: FinancingId): Promise<FinancingStatusTransition[]> {
    return [...(this.history.get(id) ?? [])];
  }

  // ── Customer-side writes ──────────────────────────────────────────

  async create(
    input: CreateFinancingRequestInput,
  ): Promise<FinancingRequest> {
    const now = nowIso();
    // For demo we don't compute the real Wafasalaf monthly payment.
    // The platform impl calls into `lib/wafasalaf.ts` to compute it at
    // submission time. Demo stores 0 — the customer-facing UI knows to
    // re-compute live from the calculator.
    const request: FinancingRequest = Object.freeze({
      id: uid("fin"),
      ref: generateFinancingRef(),
      applicantUserId: input.applicantUserId,
      requestedAmount: input.requestedAmount,
      requestedTermMonths: input.requestedTermMonths,
      ageBracket: input.ageBracket,
      monthlyPayment: { amount: 0, currency: "MAD" as const },
      status: "draft",
      documentIds: [],
      createdAt: now,
      updatedAt: now,
    });

    this.requests.set(request.id, request);
    this.history.set(request.id, []);

    await this.audit.record({
      actorUserId: input.applicantUserId,
      action: "financing.submit", // create-as-draft logs as submit-intent
      resourceType: "financing-request",
      resourceId: request.id,
      after: request,
    });

    return request;
  }

  async submit(
    id: FinancingId,
    actor: UserId,
  ): Promise<FinancingRequest> {
    return this.transition(id, "submitted", actor);
  }

  async attachDocument(
    id: FinancingId,
    fileId: string,
  ): Promise<FinancingRequest> {
    const request = this.requests.get(id);
    if (!request) throw new NotFoundError("FinancingRequest", id);

    const updated: FinancingRequest = Object.freeze({
      ...request,
      documentIds: [...request.documentIds, fileId],
      updatedAt: nowIso(),
    });
    this.requests.set(id, updated);

    await this.audit.record({
      actorUserId: request.applicantUserId,
      action: "financing.submit",
      resourceType: "financing-request",
      resourceId: id,
      metadata: { attachedFileId: fileId },
    });

    return updated;
  }

  // ── Admin-side writes ────────────────────────────────────────────

  async requestDocuments(
    id: FinancingId,
    actor: UserId,
    reason: string,
  ): Promise<FinancingRequest> {
    return this.transition(id, "documents-required", actor, reason);
  }

  async startReview(
    id: FinancingId,
    actor: UserId,
  ): Promise<FinancingRequest> {
    return this.transition(id, "under-review", actor);
  }

  async decide(
    input: FinancingDecisionInput,
    actor: UserId,
  ): Promise<FinancingRequest> {
    const request = this.requests.get(input.requestId);
    if (!request) throw new NotFoundError("FinancingRequest", input.requestId);

    if (request.status !== "under-review") {
      throw new ConflictError(
        `Can only decide on requests in 'under-review' (current: ${request.status})`,
      );
    }

    // First transition to approved/rejected with the decision reason.
    const targetStatus: FinancingStatus = input.approve ? "approved" : "rejected";
    let updated = await this.transition(
      input.requestId,
      targetStatus,
      actor,
      input.reason,
    );

    // For approvals, also freeze the offered terms (which may differ
    // from what the customer requested).
    if (input.approve) {
      updated = Object.freeze({
        ...updated,
        monthlyPayment:
          input.offeredMonthlyPayment ?? updated.monthlyPayment,
        decisionReason: input.reason,
        updatedAt: nowIso(),
      });
      this.requests.set(input.requestId, updated);
    } else {
      updated = Object.freeze({
        ...updated,
        decisionReason: input.reason,
        updatedAt: nowIso(),
      });
      this.requests.set(input.requestId, updated);
    }

    await this.audit.record({
      actorUserId: actor,
      action: input.approve ? "financing.approve" : "financing.reject",
      resourceType: "financing-request",
      resourceId: input.requestId,
      reason: input.reason,
      metadata: input.approve
        ? {
            offeredMonthlyPayment: input.offeredMonthlyPayment,
            offeredTermMonths: input.offeredTermMonths,
          }
        : undefined,
    });

    return updated;
  }

  async updateInternalNotes(
    id: FinancingId,
    notes: string,
  ): Promise<FinancingRequest> {
    const request = this.requests.get(id);
    if (!request) throw new NotFoundError("FinancingRequest", id);

    const updated: FinancingRequest = Object.freeze({
      ...request,
      internalNotes: notes || undefined,
      updatedAt: nowIso(),
    });
    this.requests.set(id, updated);
    return updated;
  }

  async transitionStatus(
    id: FinancingId,
    next: FinancingStatus,
    actor: UserId,
    reason?: string,
  ): Promise<FinancingRequest> {
    return this.transition(id, next, actor, reason);
  }

  // ── Internal: shared transition path ─────────────────────────────

  private async transition(
    id: FinancingId,
    next: FinancingStatus,
    actor: UserId,
    reason?: string,
  ): Promise<FinancingRequest> {
    const request = this.requests.get(id);
    if (!request) throw new NotFoundError("FinancingRequest", id);

    if (request.status === next) return request;

    if (!canTransitionFinancing(request.status, next)) {
      throw new InvalidTransitionError(request.status, next);
    }

    const now = nowIso();
    const updated: FinancingRequest = Object.freeze({
      ...request,
      status: next,
      updatedAt: now,
    });
    this.requests.set(id, updated);

    const transition: FinancingStatusTransition = Object.freeze({
      requestId: id,
      from: request.status,
      to: next,
      actorUserId: actor,
      reason,
      occurredAt: now,
    });
    const hist = this.history.get(id) ?? [];
    hist.push(transition);
    this.history.set(id, hist);

    await this.audit.record({
      actorUserId: actor,
      action: "financing.transition",
      resourceType: "financing-request",
      resourceId: id,
      before: { status: request.status },
      after: { status: next },
      reason,
    });

    return updated;
  }
}
