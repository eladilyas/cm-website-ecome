// NotificationService — cross-cutting notification fan-out.
//
// Rule: domain code emits events; this service decides what fires.
// Orders, Financing, Tickets all call `notify()` — they NEVER call
// Resend / Twilio / WhatsApp directly. Decoupling means the Odoo
// migration, channel additions, and i18n landings touch one place.

import type { UserId } from "./types";

// ── Events ─────────────────────────────────────────────────────────────
// Strongly-typed event vocabulary. Adding a new event type is the only
// way to introduce a new template; templates without events can't fire.

export type NotificationEventKind =
  // order.*
  | "order.created"
  | "order.payment-verified"
  | "order.shipped"
  | "order.delivered"
  | "order.cancelled"
  // financing.*
  | "financing.submitted"
  | "financing.documents-required"
  | "financing.under-review"
  | "financing.approved"
  | "financing.rejected"
  // support.*
  | "support.ticket-replied"
  | "support.ticket-resolved"
  // account.*
  | "account.password-reset"
  | "account.email-verify"
  | "account.welcome";

export type NotifyInput = Readonly<{
  /** The recipient user id. */
  recipientId: UserId;
  event: NotificationEventKind;
  /** Strongly-typed event payload. Each event has a known shape; the
   *  template engine reads from it. */
  payload: Record<string, unknown>;
  /** Optional override of recipient channel preferences (use sparingly —
   *  e.g. password resets must email regardless of preferences). */
  forceChannels?: NotificationChannel[];
}>;

// ── Channels ────────────────────────────────────────────────────────────

export type NotificationChannel =
  | "email"
  | "sms"
  | "whatsapp"
  | "in-app"
  | "push";

export type NotificationDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "failed";

export type NotificationDelivery = Readonly<{
  id: string;
  recipientId: UserId;
  event: NotificationEventKind;
  channel: NotificationChannel;
  templateId: string;
  templateRevision: number;
  status: NotificationDeliveryStatus;
  queuedAt: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failedAt?: string;
  failureReason?: string;
  /** Provider-specific id (Resend message id, Twilio SID, etc.). */
  externalId?: string;
}>;

// ── Templates ──────────────────────────────────────────────────────────

export type LocaleCode = "fr-MA" | "en" | "ar-MA";

export type NotificationTemplate = Readonly<{
  id: string;
  event: NotificationEventKind;
  channel: NotificationChannel;
  locale: LocaleCode;
  revision: number;
  subject?: string; // email only
  body: string; // markdown or template DSL
  enabled: boolean;
  updatedAt: string;
}>;

// ── Preferences ────────────────────────────────────────────────────────

export type NotificationPreference = Readonly<{
  userId: UserId;
  event: NotificationEventKind;
  channels: NotificationChannel[]; // empty array = muted entirely
  updatedAt: string;
}>;

// ── Service ────────────────────────────────────────────────────────────

export interface NotificationService {
  // Fan-out (domain code calls this) ────────────────────────────────────
  notify(input: NotifyInput): Promise<void>;

  // Customer preferences (portal-facing) ────────────────────────────────
  listPreferences(userId: UserId): Promise<NotificationPreference[]>;
  setPreference(
    userId: UserId,
    event: NotificationEventKind,
    channels: NotificationChannel[],
  ): Promise<NotificationPreference>;

  // Delivery log (admin + customer audit) ───────────────────────────────
  listDeliveries(
    filter: Readonly<{
      recipientId?: UserId;
      event?: NotificationEventKind;
      channel?: NotificationChannel;
      status?: NotificationDeliveryStatus;
      since?: string;
      until?: string;
      limit?: number;
      cursor?: string;
    }>,
  ): Promise<NotificationDelivery[]>;

  // Mobile push tokens ──────────────────────────────────────────────────
  registerPushToken(userId: UserId, token: string, platform: "ios" | "android"): Promise<void>;
  revokePushToken(token: string): Promise<void>;

  // Templates (admin) ───────────────────────────────────────────────────
  listTemplates(filter?: Readonly<{ event?: NotificationEventKind; channel?: NotificationChannel; locale?: LocaleCode }>): Promise<NotificationTemplate[]>;
  upsertTemplate(input: Omit<NotificationTemplate, "id" | "revision" | "updatedAt">): Promise<NotificationTemplate>;
}
