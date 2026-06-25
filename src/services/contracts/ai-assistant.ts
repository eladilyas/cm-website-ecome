// AIAssistantService — conversational + tool-calling surface.
//
// Design rules:
//   1. The assistant invokes tools EXCLUSIVELY through other service
//      contracts. There is no AI-only backend. Tools wrap things like
//      orderService.list() and inherit those services' permission gates.
//   2. The assistant's authority equals the calling user's authority,
//      enforced by the same `can()` policy as the UI. Tool calls that
//      exceed the user's permissions are rejected before invocation.
//   3. Tool calls are logged to AuditEvents with the actor = the user,
//      not "AI". The AI is a UI affordance, not a separate principal.
//   4. Token + cost accounting per conversation is mandatory — drives
//      rate limiting, billing, and abuse detection.

import type { UserId } from "./types";

// ── Conversations ──────────────────────────────────────────────────────

export type ConversationId = string;

export type ConversationMode =
  /** Customer-facing assistant in the customer portal. */
  | "customer-support"
  /** Operator-facing copilot in the admin portal. */
  | "ops-copilot"
  /** Analytics / reporting assistant. */
  | "admin-analyst";

export type ConversationStatus = "active" | "archived";

export type Conversation = Readonly<{
  id: ConversationId;
  ownerUserId: UserId;
  mode: ConversationMode;
  modelId: string; // e.g. "claude-opus-4-8"
  systemPromptRevision: number;
  title?: string; // auto-summarized after a few turns
  createdAt: string;
  lastMessageAt: string;
  status: ConversationStatus;
}>;

// ── Messages ───────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system" | "tool";

export type Message = Readonly<{
  id: string;
  conversationId: ConversationId;
  role: MessageRole;
  /** The textual payload. For tool calls, this is the tool-call result
   *  rendered for display; the canonical record is in `toolCallId`. */
  content: string;
  /** Set when role === "tool" — references the ToolCall row. */
  toolCallId?: string;
  createdAt: string;
  tokensIn?: number;
  tokensOut?: number;
}>;

// ── Tool calls ─────────────────────────────────────────────────────────

export type ToolName =
  // Customer-facing tools
  | "getMyOrders"
  | "getMyFinancing"
  | "getMyTickets"
  | "createSupportTicket"
  | "searchProducts"
  | "getProductDetails"
  // Ops copilot tools
  | "lookupOrder"
  | "lookupCustomer"
  | "lookupFinancing"
  | "summarizeOrderHistory"
  // Admin analyst tools
  | "queryRevenue"
  | "queryActivity";

export type ToolCall = Readonly<{
  id: string;
  conversationId: ConversationId;
  messageId: string;
  toolName: ToolName;
  arguments: Record<string, unknown>;
  result?: unknown;
  errorMessage?: string;
  latencyMs?: number;
  /** Audited via AuditEvent — the actor is the conversation's owner. */
  startedAt: string;
  finishedAt?: string;
}>;

// ── Usage / cost ───────────────────────────────────────────────────────

export type ConversationUsage = Readonly<{
  conversationId: ConversationId;
  ownerUserId: UserId;
  totalMessages: number;
  totalTokensIn: number;
  totalTokensOut: number;
  /** Computed cost in USD at the modelId's then-current rate. Frozen at
   *  message time so retroactive price changes don't change history. */
  estimatedCostUsd: number;
  updatedAt: string;
}>;

// ── Service ────────────────────────────────────────────────────────────

export interface AIAssistantService {
  // Conversation lifecycle ──────────────────────────────────────────────
  getOrCreateConversation(input: Readonly<{
    userId: UserId;
    mode: ConversationMode;
  }>): Promise<Conversation>;

  listConversations(userId: UserId, mode?: ConversationMode): Promise<Conversation[]>;
  archiveConversation(id: ConversationId): Promise<Conversation>;

  // Messaging ───────────────────────────────────────────────────────────
  /** Append a user message and stream the assistant response. Returns
   *  the assistant message id when the stream completes. Tool calls
   *  resolved during the turn are written to ToolCall rows + AuditEvents
   *  before the message returns. */
  sendMessage(input: Readonly<{
    conversationId: ConversationId;
    content: string;
  }>): Promise<{ assistantMessageId: string }>;

  listMessages(conversationId: ConversationId, limit?: number): Promise<Message[]>;

  // Tool calls (audit + admin observability) ────────────────────────────
  listToolCalls(filter: Readonly<{
    conversationId?: ConversationId;
    toolName?: ToolName;
    ownerUserId?: UserId;
    since?: string;
    limit?: number;
    cursor?: string;
  }>): Promise<ToolCall[]>;

  // Usage / cost ────────────────────────────────────────────────────────
  getUsage(conversationId: ConversationId): Promise<ConversationUsage>;
  listUsageByUser(userId: UserId): Promise<ConversationUsage[]>;
}
