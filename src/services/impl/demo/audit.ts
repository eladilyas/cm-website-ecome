// In-memory AuditService — append-only ring buffer for dev + tests.
//
// This is NOT a mock. It's a real implementation of the contract that
// satisfies every method correctly; it just stores events in memory
// instead of Postgres. The platform impl reads from the AuditEvent
// table. Both behave identically from the consumer's perspective.
//
// Capacity: 5000 events. When full, drops the oldest. This matches the
// "cold archive" boundary from ARCHITECTURE.md §11 — production keeps
// 2 years online + archives older events; the demo's 5K cap is the
// dev/test equivalent.

import type { AuditEvent } from "@/services/contracts";
import type {
  AuditFilter,
  AuditService,
  RecordInput,
} from "@/services/contracts/audit";

const CAPACITY = 5000;

function uid(prefix = "ae"): string {
  // Demo IDs — production swaps for proper UUIDs. The prefix lets dev
  // logs visually distinguish event kinds.
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class DemoAuditService implements AuditService {
  private events: AuditEvent[] = [];

  async record(input: RecordInput): Promise<AuditEvent> {
    const event: AuditEvent = Object.freeze({
      id: uid("ae"),
      occurredAt: nowIso(),
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      before: input.before,
      after: input.after,
      metadata: input.metadata,
      reason: input.reason,
    });

    this.events.push(event);

    // Ring-buffer behaviour: keep newest CAPACITY events. The platform
    // implementation doesn't need this — it appends forever, archives
    // by date.
    if (this.events.length > CAPACITY) {
      this.events.splice(0, this.events.length - CAPACITY);
    }

    return event;
  }

  async list(filter?: AuditFilter): Promise<AuditEvent[]> {
    let result = [...this.events];

    if (filter?.actorUserId) {
      result = result.filter((e) => e.actorUserId === filter.actorUserId);
    }
    if (filter?.resourceType) {
      result = result.filter((e) => e.resourceType === filter.resourceType);
    }
    if (filter?.resourceId) {
      result = result.filter((e) => e.resourceId === filter.resourceId);
    }
    if (filter?.action) {
      result = result.filter((e) => e.action === filter.action);
    }
    if (filter?.since) {
      result = result.filter((e) => e.occurredAt >= filter.since!);
    }
    if (filter?.until) {
      result = result.filter((e) => e.occurredAt <= filter.until!);
    }

    // Newest first — matches admin UI expectations.
    result.reverse();

    if (filter?.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }
    return result;
  }

  async listForResource(
    resourceType: string,
    resourceId: string,
  ): Promise<AuditEvent[]> {
    return this.list({ resourceType, resourceId });
  }
}
