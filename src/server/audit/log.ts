// Audit-event helper — one place writes `AuditEvent` rows.
//
// Why a helper instead of `db.auditEvent.create({...})` at call sites:
//   • Standardises the action vocabulary ("order.transition",
//     "user.disable", etc.) — searching the table or grep-checking
//     coverage stays trivial.
//   • Catches the "actor unknown" case — if a privileged action ever
//     fires without a loaded actor (a bug), we still log it as
//     actorUserId=null so the row exists for forensics.
//   • Swallows write failures. An audit-log outage must NEVER block
//     the privileged action it's reporting on; we surface the error
//     to the server log instead.

import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export type AuditAction =
  | "user.disable"
  | "user.enable"
  | "user.role.grant"
  | "user.role.revoke"
  | "product.create"
  | "product.update"
  | "product.disable"
  | "product.status"
  | "category.create"
  | "category.update"
  | "category.toggle"
  | "order.transition"
  | "order.proof.attach"
  | "financing.transition"
  | "settings.payment_methods.update"
  | "lead.assign"
  | "order.assign";

export type AuditEventInput = {
  action: AuditAction;
  actorUserId: string | null;
  actorRole?: string | null;
  resourceType: string;
  resourceId: string;
  /** Snapshot of the resource before the change. Keep small —
   *  enough to reverse-engineer "what changed" without dumping
   *  every column. */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /** Free-form structured context (IP, user-agent excerpt, etc.). */
  metadata?: Record<string, unknown> | null;
  reason?: string | null;
};

/** Record an audit event. Best-effort — failures are logged, never
 *  thrown to the caller. */
export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    // Prisma's Json columns accept `Prisma.JsonNull` (not native null)
    // for the absent case. The helper takes plain Record / null inputs
    // and maps null → JsonNull at the boundary so call sites don't
    // need to know about Prisma's sentinel.
    const toJson = (
      v: Record<string, unknown> | null | undefined,
    ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =>
      v == null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);
    await db.auditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole ?? null,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        before: toJson(input.before),
        after: toJson(input.after),
        metadata: toJson(input.metadata),
        reason: input.reason ?? null,
      },
    });
  } catch (err) {
    // Don't crash the calling flow if audit-logging is degraded.
    // Surface to the server log for ops to act on.
    console.error("[audit] write failed", {
      action: input.action,
      resourceId: input.resourceId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
