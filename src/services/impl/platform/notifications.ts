// Resend-backed NotificationService.
//
// Extends the demo impl and overrides ONLY the email delivery path —
// everything else (preferences, templates, delivery log, push tokens,
// non-email channels) keeps the in-memory behaviour until the
// corresponding providers land (Twilio for SMS, WhatsApp Cloud, Expo
// push, etc.). Adding a provider is a single method override.
//
// Uses the official `resend` Node SDK. If the user-resolution layer is
// in place (Phase 2), the recipientId resolves to an email; until then
// the caller passes `payload.recipientEmail` and we use that.

import { Resend } from "resend";

import {
  DemoNotificationService,
} from "@/services/impl/demo/notifications";
import type {
  NotificationChannel,
  NotificationDelivery,
  NotifyInput,
} from "@/services/contracts/notifications";

type ResendConfig = Readonly<{
  apiKey: string;
  from: string;
}>;

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class ResendNotificationService extends DemoNotificationService {
  private readonly resend: Resend;

  constructor(private readonly config: ResendConfig) {
    super();
    this.resend = new Resend(config.apiKey);
  }

  protected async deliver(
    input: NotifyInput,
    channel: NotificationChannel,
  ): Promise<NotificationDelivery> {
    if (channel !== "email") {
      // Non-email channels keep the demo behaviour (logged as "sent" with
      // a synthetic external id). Real Twilio / WhatsApp / Expo providers
      // each get their own override in the same shape as this method.
      return super.deliver(input, channel);
    }

    const template = this.resolveTemplate(input.event, "email");
    const queuedAt = nowIso();
    const recipientEmail = pickRecipientEmail(input);
    const templateId = template?.id ?? `demo::${input.event}::email`;
    const templateRevision = template?.revision ?? 1;

    const failedDelivery = (reason: string): NotificationDelivery =>
      Object.freeze({
        id: uid("ndl"),
        recipientId: input.recipientId,
        event: input.event,
        channel: "email",
        templateId,
        templateRevision,
        status: "failed",
        queuedAt,
        failedAt: nowIso(),
        failureReason: reason,
      });

    if (!recipientEmail) {
      const delivery = failedDelivery(
        "No recipient email — either pass payload.recipientEmail or " +
          "wire UserService so recipientId resolves to an email.",
      );
      this.deliveries.unshift(delivery);
      return delivery;
    }

    const subject =
      template?.subject ??
      String(input.payload?.subject ?? `Caisse Manager · ${input.event}`);
    const html =
      template?.body ??
      String(
        input.payload?.html ??
          input.payload?.body ??
          renderFallbackBody(input),
      );

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.config.from,
        to: recipientEmail,
        subject,
        html,
      });

      if (error || !data?.id) {
        const reason = error?.message ?? "Resend returned no message id";
        const delivery = failedDelivery(reason);
        this.deliveries.unshift(delivery);
        return delivery;
      }

      const delivery: NotificationDelivery = Object.freeze({
        id: uid("ndl"),
        recipientId: input.recipientId,
        event: input.event,
        channel: "email",
        templateId,
        templateRevision,
        status: "sent",
        queuedAt,
        sentAt: nowIso(),
        externalId: data.id,
      });
      this.deliveries.unshift(delivery);
      return delivery;
    } catch (err) {
      const delivery = failedDelivery(
        err instanceof Error ? err.message : String(err),
      );
      this.deliveries.unshift(delivery);
      return delivery;
    }
  }
}

function pickRecipientEmail(input: NotifyInput): string | undefined {
  // Two acceptable shapes during pre-Phase-2:
  //   • payload.recipientEmail = "..."  — caller-provided
  //   • payload.email = "..."           — same idea, common shorthand
  // Phase 2 adds UserService and resolves via recipientId.
  const email = input.payload?.recipientEmail ?? input.payload?.email;
  if (typeof email === "string" && email.includes("@")) return email;
  return undefined;
}

function renderFallbackBody(input: NotifyInput): string {
  // Until templates are seeded for each event, send a minimal but
  // non-broken email. Production must replace this with branded HTML.
  const lines: string[] = [];
  lines.push(`<p>Event: <strong>${escape(input.event)}</strong></p>`);
  if (input.payload && typeof input.payload === "object") {
    lines.push(
      `<pre style="font-family:ui-monospace,monospace;font-size:12px;color:#444">` +
        escape(JSON.stringify(input.payload, null, 2)) +
        `</pre>`,
    );
  }
  lines.push(
    `<p style="color:#666;font-size:12px">Caisse Manager — caissemanager.com</p>`,
  );
  return lines.join("\n");
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
