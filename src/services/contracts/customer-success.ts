// CustomerSuccessService — tickets + conversation threads + health.
//
// Why its own context: support state has a different lifecycle from
// orders and financing. Embedding "support state" inside Order would
// couple two lifecycles that diverge in ops + ownership. The service
// also reads across other contexts (orders, financing, AI conversations)
// to compute customer-health signals — so it sits at the integration
// edge, not inside any single transactional domain.

import type { UserId } from "./types";

// ── Tickets ────────────────────────────────────────────────────────────

export type TicketId = string;
export type TicketRef = string; // e.g. "TKT-2025-A4B7"

export type TicketStatus =
  | "open"
  | "in-progress"
  | "waiting-on-customer"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketCategory =
  | "order-issue"
  | "financing-question"
  | "product-question"
  | "billing"
  | "technical"
  | "feedback"
  | "other";

export type Ticket = Readonly<{
  id: TicketId;
  ref: TicketRef;
  ownerUserId: UserId; // customer who opened
  assignedAgentId?: UserId;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  /** Optional links to related domain objects. */
  relatedOrderId?: string;
  relatedFinancingId?: string;
  /** Snapshot of any AI conversation that escalated into this ticket. */
  originatingConversationId?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  firstResponseAt?: string;
  resolutionTimeMs?: number;
}>;

// ── Conversation threads (messages on a ticket) ────────────────────────

export type MessageAuthorRole = "customer" | "agent" | "system";

export type TicketMessage = Readonly<{
  id: string;
  ticketId: TicketId;
  authorUserId: UserId;
  authorRole: MessageAuthorRole;
  body: string;
  /** Internal-only notes are visible only to agents. */
  internal: boolean;
  attachedFileIds: string[];
  createdAt: string;
}>;

// ── Customer health ────────────────────────────────────────────────────

export type CustomerHealth = Readonly<{
  userId: UserId;
  /** 0-100 composite score. Higher = healthier. */
  score: number;
  /** Last activity across any platform surface. */
  lastActiveAt?: string;
  openTicketCount: number;
  lastOrderAt?: string;
  totalOrderCount: number;
  totalLifetimeValueMad: number;
  /** Notes flagged by agents that should follow this customer across
   *  surfaces (VIP, at-risk, dispute-prone). */
  tags: string[];
  updatedAt: string;
}>;

// ── Service ────────────────────────────────────────────────────────────

export interface CustomerSuccessService {
  // Ticket lifecycle (customer + agent) ─────────────────────────────────
  createTicket(input: Readonly<{
    ownerUserId: UserId;
    subject: string;
    body: string;
    category: TicketCategory;
    priority?: TicketPriority;
    relatedOrderId?: string;
    relatedFinancingId?: string;
    originatingConversationId?: string;
    attachedFileIds?: string[];
  }>): Promise<Ticket>;

  get(id: TicketId): Promise<Ticket | null>;
  getByRef(ref: TicketRef): Promise<Ticket | null>;

  list(filter: Readonly<{
    ownerUserId?: UserId;
    assignedAgentId?: UserId;
    status?: TicketStatus | "any";
    priority?: TicketPriority;
    category?: TicketCategory;
    since?: string;
    until?: string;
    limit?: number;
    cursor?: string;
  }>): Promise<Ticket[]>;

  // Status transitions (the one writer for ticket.status) ───────────────
  transitionStatus(id: TicketId, next: TicketStatus, actor: UserId, reason?: string): Promise<Ticket>;

  // Assignment (admin) ──────────────────────────────────────────────────
  assignAgent(id: TicketId, agentId: UserId, actor: UserId): Promise<Ticket>;
  unassign(id: TicketId, actor: UserId): Promise<Ticket>;
  setPriority(id: TicketId, priority: TicketPriority, actor: UserId): Promise<Ticket>;

  // Messages ────────────────────────────────────────────────────────────
  postMessage(input: Readonly<{
    ticketId: TicketId;
    authorUserId: UserId;
    body: string;
    internal?: boolean;
    attachedFileIds?: string[];
  }>): Promise<TicketMessage>;

  listMessages(ticketId: TicketId, includeInternal?: boolean): Promise<TicketMessage[]>;

  // Customer health (read-only — computed by background job) ────────────
  getHealth(userId: UserId): Promise<CustomerHealth | null>;
  listAtRiskCustomers(limit?: number): Promise<CustomerHealth[]>;
}
