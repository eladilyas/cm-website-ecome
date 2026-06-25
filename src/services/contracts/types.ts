// Shared domain models — the type vocabulary used across every service
// contract. Pure data shapes. No methods, no behaviour.
//
// Rules:
//   • These types describe DOMAIN concepts, not database rows. The
//     Prisma/Drizzle row types live behind the implementations.
//   • Status enums are explicit string unions, not lookup tables — UI
//     code can switch-case them safely.
//   • Money is always `{ amount: number; currency: "MAD" }`. Don't ship
//     bare numbers across the contract; future multi-currency requires
//     it and bare numbers don't carry the unit.
//   • Timestamps are ISO 8601 strings on the wire. Service implementations
//     parse to Date as needed; contract surfaces stay JSON-clean.

// ── Identity ────────────────────────────────────────────────────────────

export type UserId = string;
export type RoleSlug =
  | "customer"
  | "support"
  | "sales"
  | "admin"
  | "super-admin";

export type User = Readonly<{
  id: UserId;
  email: string;
  fullName: string;
  phone?: string;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  roles: RoleSlug[];
  disabledAt?: string;
}>;

export type Session = Readonly<{
  id: string;
  userId: UserId;
  expiresAt: string;
  createdAt: string;
}>;

// ── Permissions ─────────────────────────────────────────────────────────

export type PermissionResource =
  | "products"
  | "orders"
  | "financing"
  | "users"
  | "files"
  | "audit"
  | "settings";

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve";

// ── Money ───────────────────────────────────────────────────────────────

export type Currency = "MAD";

export type Money = Readonly<{
  amount: number;
  currency: Currency;
}>;

// ── Products ────────────────────────────────────────────────────────────

export type ProductSlug = string;

export type ProductStatus =
  | "in-stock"
  | "incoming"
  | "out-of-stock"
  | "disabled";

export type ProductCategory =
  | "pos-terminals"
  | "mobile-pos"
  | "kiosks"
  | "kds"
  | "cash-drawers"
  | "printers"
  | "scanners"
  | "paging";

export type Product = Readonly<{
  slug: ProductSlug;
  name: string;
  subline?: string;
  tagline: string;
  category: ProductCategory;
  status: ProductStatus;
  heroImage: string;
  alt: string;
  shortDescription: string;
  features: string[];
  specs: ReadonlyArray<{ label: string; value: string }>;
  priceFrom: Money;
  /** Lead time when status is "incoming". */
  leadWeeks?: number;
  /** Slugs of complementary products surfaced on the detail page. */
  complementaryWith: ProductSlug[];
  createdAt: string;
  updatedAt: string;
}>;

// ── Cart + Orders ───────────────────────────────────────────────────────

export type OrderId = string;
export type OrderRef = string; // human-readable, e.g. "ORD-A4B7C9"

export type OrderStatus =
  | "pending"
  | "awaiting-payment"
  | "payment-verification"
  | "processing"
  | "sent-to-odoo"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod =
  | "cmi"
  | "bank-transfer"
  | "cash-on-delivery"
  | "wafasalaf-financing";

export type OrderItem = Readonly<{
  productSlug: ProductSlug;
  /** Snapshot — survives later catalog edits/deletions. */
  name: string;
  subline?: string;
  qty: number;
  unitPrice: Money;
  lineTotal: Money;
}>;

export type OrderTotals = Readonly<{
  subtotal: Money;
  taxTotal: Money;
  shippingTotal: Money;
  grandTotal: Money;
}>;

export type OrderContact = Readonly<{
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  companyIce?: string; // Moroccan ICE registry number
}>;

export type OrderShipping = Readonly<{
  street: string;
  city: string;
  postalCode: string;
  country: "MA";
  notes?: string;
}>;

export type Order = Readonly<{
  id: OrderId;
  ref: OrderRef;
  customerId: UserId;
  items: OrderItem[];
  totals: OrderTotals;
  contact: OrderContact;
  shipping: OrderShipping;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  internalNotes?: string; // admin-only
}>;

// ── Financing ───────────────────────────────────────────────────────────

export type FinancingId = string;
export type FinancingRef = string;

export type FinancingStatus =
  | "draft"
  | "submitted"
  | "documents-required"
  | "under-review"
  | "approved"
  | "rejected"
  | "active"
  | "paid-off"
  | "cancelled";

export type FinancingAgeBracket = "under-60" | "60-plus";

export type FinancingRequest = Readonly<{
  id: FinancingId;
  ref: FinancingRef;
  applicantUserId: UserId;
  requestedAmount: Money;
  requestedTermMonths: number;
  ageBracket: FinancingAgeBracket;
  /** Computed at submission; cached for stability across UI re-renders. */
  monthlyPayment: Money;
  status: FinancingStatus;
  decisionReason?: string;
  documentIds: string[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}>;

// ── Files ───────────────────────────────────────────────────────────────

export type FileId = string;

export type FileCategory =
  | "financing-document"
  | "bank-receipt"
  | "id-proof"
  | "company-document";

export type FileVisibility =
  | "private"
  | "shared-with-admin"
  | "public-signed";

export type FileRecord = Readonly<{
  id: FileId;
  ownerUserId: UserId;
  category: FileCategory;
  relatedResourceType: "order" | "financing-request" | "user";
  relatedResourceId: string;
  storageKey: string; // S3 key
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadedAt: string;
  deletedAt?: string;
  visibility: FileVisibility;
}>;

// ── Audit ───────────────────────────────────────────────────────────────

export type AuditAction =
  // order.*
  | "order.create"
  | "order.transition"
  | "order.update-notes"
  // financing.*
  | "financing.submit"
  | "financing.approve"
  | "financing.reject"
  | "financing.transition"
  // product.*
  | "product.create"
  | "product.update"
  | "product.set-status"
  | "product.delete"
  // user.*
  | "user.login"
  | "user.logout"
  | "user.role-grant"
  | "user.role-revoke"
  // file.*
  | "file.upload"
  | "file.delete"
  | "file.sign-url";

export type AuditEvent = Readonly<{
  id: string;
  occurredAt: string;
  actorUserId?: UserId;
  actorRole?: RoleSlug;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  /** JSON snapshot — survives schema changes. */
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  reason?: string;
}>;

// ── Errors ──────────────────────────────────────────────────────────────
// All service methods may throw these. Implementations should never leak
// raw database errors to consumers.

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(reason: string) {
    super(`Forbidden: ${reason}`);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: ReadonlyArray<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
