// In-memory NotificationService — real contract implementation, demo-grade
// store. Email + SMS + WhatsApp + push pretend to send (status flips to
// "sent" with a synthetic external id); in-app channel always succeeds.
// Templates + preferences + delivery log all live in memory.
//
// The platform impl (Resend / Twilio / WhatsApp Cloud / Expo Push)
// replaces the *delivery transport* — preferences, templates, the
// delivery log, and the public contract behaviour stay identical.

import type {
  LocaleCode,
  NotificationChannel,
  NotificationDelivery,
  NotificationDeliveryStatus,
  NotificationEventKind,
  NotificationPreference,
  NotificationService,
  NotificationTemplate,
  NotifyInput,
} from "@/services/contracts/notifications";
import type { UserId } from "@/services/contracts";

const DEFAULT_CHANNELS: NotificationChannel[] = ["email", "in-app"];

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

type PrefKey = `${UserId}::${NotificationEventKind}`;
const prefKey = (u: UserId, e: NotificationEventKind): PrefKey =>
  `${u}::${e}` as PrefKey;

export class DemoNotificationService implements NotificationService {
  protected readonly deliveries: NotificationDelivery[] = [];
  protected readonly preferences = new Map<PrefKey, NotificationPreference>();
  protected readonly templates = new Map<string, NotificationTemplate>();
  protected readonly pushTokens = new Map<
    string,
    { userId: UserId; platform: "ios" | "android" }
  >();

  // ── Fan-out ──────────────────────────────────────────────────────────

  async notify(input: NotifyInput): Promise<void> {
    const channels = await this.resolveChannels(input);
    for (const channel of channels) {
      await this.deliver(input, channel);
    }
  }

  /** Pick the channels this notification fans out to. Forced channels
   *  bypass preferences (e.g. password resets always email). */
  protected async resolveChannels(
    input: NotifyInput,
  ): Promise<NotificationChannel[]> {
    if (input.forceChannels?.length) return input.forceChannels;
    const pref = this.preferences.get(prefKey(input.recipientId, input.event));
    return pref?.channels ?? DEFAULT_CHANNELS;
  }

  /** Send one delivery on one channel. Demo impl pretends to succeed. */
  protected async deliver(
    input: NotifyInput,
    channel: NotificationChannel,
  ): Promise<NotificationDelivery> {
    const template = this.resolveTemplate(input.event, channel);
    const queuedAt = nowIso();

    const delivery: NotificationDelivery = Object.freeze({
      id: uid("ndl"),
      recipientId: input.recipientId,
      event: input.event,
      channel,
      templateId: template?.id ?? `demo::${input.event}::${channel}`,
      templateRevision: template?.revision ?? 1,
      status: "sent" satisfies NotificationDeliveryStatus,
      queuedAt,
      sentAt: queuedAt,
      externalId: uid("demo"),
    });

    this.deliveries.unshift(delivery);
    return delivery;
  }

  protected resolveTemplate(
    event: NotificationEventKind,
    channel: NotificationChannel,
    locale: LocaleCode = "fr-MA",
  ): NotificationTemplate | undefined {
    for (const t of this.templates.values()) {
      if (
        t.event === event &&
        t.channel === channel &&
        t.locale === locale &&
        t.enabled
      ) {
        return t;
      }
    }
    return undefined;
  }

  // ── Preferences ──────────────────────────────────────────────────────

  async listPreferences(userId: UserId): Promise<NotificationPreference[]> {
    const out: NotificationPreference[] = [];
    for (const p of this.preferences.values()) {
      if (p.userId === userId) out.push(p);
    }
    return out;
  }

  async setPreference(
    userId: UserId,
    event: NotificationEventKind,
    channels: NotificationChannel[],
  ): Promise<NotificationPreference> {
    const pref: NotificationPreference = Object.freeze({
      userId,
      event,
      channels: [...channels],
      updatedAt: nowIso(),
    });
    this.preferences.set(prefKey(userId, event), pref);
    return pref;
  }

  // ── Delivery log ─────────────────────────────────────────────────────

  async listDeliveries(filter: {
    recipientId?: UserId;
    event?: NotificationEventKind;
    channel?: NotificationChannel;
    status?: NotificationDeliveryStatus;
    since?: string;
    until?: string;
    limit?: number;
    cursor?: string;
  }): Promise<NotificationDelivery[]> {
    let items = [...this.deliveries];
    if (filter.recipientId) {
      items = items.filter((d) => d.recipientId === filter.recipientId);
    }
    if (filter.event) items = items.filter((d) => d.event === filter.event);
    if (filter.channel) {
      items = items.filter((d) => d.channel === filter.channel);
    }
    if (filter.status) {
      items = items.filter((d) => d.status === filter.status);
    }
    if (filter.since) {
      items = items.filter((d) => d.queuedAt >= filter.since!);
    }
    if (filter.until) {
      items = items.filter((d) => d.queuedAt <= filter.until!);
    }
    if (filter.limit && filter.limit > 0) {
      items = items.slice(0, filter.limit);
    }
    return items;
  }

  // ── Push tokens ──────────────────────────────────────────────────────

  async registerPushToken(
    userId: UserId,
    token: string,
    platform: "ios" | "android",
  ): Promise<void> {
    this.pushTokens.set(token, { userId, platform });
  }

  async revokePushToken(token: string): Promise<void> {
    this.pushTokens.delete(token);
  }

  // ── Templates ────────────────────────────────────────────────────────

  async listTemplates(filter?: {
    event?: NotificationEventKind;
    channel?: NotificationChannel;
    locale?: LocaleCode;
  }): Promise<NotificationTemplate[]> {
    let items = Array.from(this.templates.values());
    if (filter?.event) items = items.filter((t) => t.event === filter.event);
    if (filter?.channel) {
      items = items.filter((t) => t.channel === filter.channel);
    }
    if (filter?.locale) items = items.filter((t) => t.locale === filter.locale);
    return items;
  }

  async upsertTemplate(
    input: Omit<NotificationTemplate, "id" | "revision" | "updatedAt">,
  ): Promise<NotificationTemplate> {
    // Same (event, channel, locale) replaces in place and bumps revision.
    let existing: NotificationTemplate | undefined;
    for (const t of this.templates.values()) {
      if (
        t.event === input.event &&
        t.channel === input.channel &&
        t.locale === input.locale
      ) {
        existing = t;
        break;
      }
    }

    const template: NotificationTemplate = Object.freeze({
      id: existing?.id ?? uid("tpl"),
      event: input.event,
      channel: input.channel,
      locale: input.locale,
      revision: (existing?.revision ?? 0) + 1,
      subject: input.subject,
      body: input.body,
      enabled: input.enabled,
      updatedAt: nowIso(),
    });
    this.templates.set(template.id, template);
    return template;
  }
}
