// AuditService — the audit trail.
//
// Every mutating service method writes one AuditEvent. The audit table is
// append-only — events are never updated or deleted, only archived to
// cold storage after retention windows expire (see ARCHITECTURE.md §11).

import type {
  AuditAction,
  AuditEvent,
  PermissionResource,
  RoleSlug,
  UserId,
} from "./types";

export type AuditFilter = Readonly<{
  actorUserId?: UserId;
  resourceType?: PermissionResource | string;
  resourceId?: string;
  action?: AuditAction;
  since?: string;
  until?: string;
  limit?: number;
  cursor?: string;
}>;

export type RecordInput = Readonly<{
  actorUserId?: UserId;
  actorRole?: RoleSlug;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  reason?: string;
}>;

export interface AuditService {
  /** Write a new event. Append-only. Callers should NOT swallow this —
   *  failure to log is a deployment-critical signal. */
  record(input: RecordInput): Promise<AuditEvent>;

  /** Read events. Gated upstream by `can(user, "view", "audit")`. */
  list(filter?: AuditFilter): Promise<AuditEvent[]>;

  /** Resource-scoped read — convenience method for the resource detail
   *  pages ("show me everything that ever happened to this order"). */
  listForResource(
    resourceType: string,
    resourceId: string,
  ): Promise<AuditEvent[]>;
}
