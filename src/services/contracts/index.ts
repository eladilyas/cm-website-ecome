// Service contracts — re-export surface.
//
// UI code should import contracts and types from this barrel, not from
// the individual files. The barrel is the stable public API of the
// service layer.
//
// Architecture v2 — 10 contracts: identity (auth) + 6 core domains
// (products, inventory, orders, financing, files, audit) + 4 new v2
// domains (notifications, ai-assistant, customer-success, content).

export * from "./types";

export type { AuthService, SignInInput, SignUpInput } from "./auth";

export type {
  ProductService,
  ProductFilter,
  CreateProductInput,
  UpdateProductInput,
} from "./products";

export type {
  InventoryService,
  StockLevel,
  StockMovement,
} from "./inventory";

export type {
  OrderService,
  OrderFilter,
  CreateOrderInput,
  OrderStatusTransition,
} from "./orders";

export type {
  FinancingService,
  FinancingFilter,
  CreateFinancingRequestInput,
  FinancingStatusTransition,
  FinancingDecisionInput,
} from "./financing";

export type {
  FileService,
  UploadInput,
  SignedUrl,
} from "./files";

export type {
  AuditService,
  AuditFilter,
  RecordInput as AuditRecordInput,
} from "./audit";

// ── v2 additions ────────────────────────────────────────────────────────

export type {
  NotificationService,
  NotificationEventKind,
  NotificationChannel,
  NotificationDelivery,
  NotificationDeliveryStatus,
  NotificationTemplate,
  NotificationPreference,
  NotifyInput,
  LocaleCode,
} from "./notifications";

export type {
  AIAssistantService,
  Conversation,
  ConversationId,
  ConversationMode,
  ConversationStatus,
  ConversationUsage,
  Message as AIMessage,
  MessageRole as AIMessageRole,
  ToolCall,
  ToolName,
} from "./ai-assistant";

export type {
  CustomerSuccessService,
  Ticket,
  TicketId,
  TicketRef,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketMessage,
  CustomerHealth,
} from "./customer-success";

export type {
  ContentService,
  ContentNode,
  ContentRevision,
  ContentType,
  SurfaceKey,
} from "./content";
