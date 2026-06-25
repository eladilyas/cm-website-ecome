// Service registry — selects the right implementation per domain at runtime.
//
// This is the dependency-injection point for the service layer. Server-side
// code (route handlers, server components, tRPC procedures) imports
// `getOrderService()` etc. from here; the registry returns the
// implementation that matches the current platform phase.
//
// Selection rule:
//   • If the corresponding feature is configured (real DB, R2, Odoo,
//     etc.), return the platform / odoo implementation.
//   • Otherwise, fall back to the demo implementation that wraps the
//     existing data or runs entirely in-memory. The site keeps working
//     end-to-end without any backend infrastructure.
//
// Phase 2 cutover is mechanical: implement platform impls, uncomment
// the `isFeatureReady("database")` branches below, deploy with
// `DATABASE_URL` set. Consumer imports never change.
//
// Naming note: accessors are `getXService()`, NOT `useXService()`. The
// `use` prefix is reserved for React Hooks; the React Hooks lint rule
// flags any `useFoo()` reassigning a module-scope variable as a hook
// purity violation. Services are server-side primitives, not hooks.

import { isFeatureReady } from "@/server/env";
import { DemoAuditService } from "./impl/demo/audit";
import { DemoOrderService } from "./impl/demo/orders";
import { DemoFinancingService } from "./impl/demo/financing";
import { DemoProductService } from "./impl/demo/products";
import { DemoFileService } from "./impl/demo/files";
import {
  R2FileService,
  r2ConfigFromEnv,
} from "./impl/platform/files";
import { DemoNotificationService } from "./impl/demo/notifications";
import { ResendNotificationService } from "./impl/platform/notifications";
import { env } from "@/server/env";
import type {
  AuditService,
  FinancingService,
  OrderService,
  ProductService,
} from "./contracts";
import type { FileService } from "./contracts/files";
import type { NotificationService } from "./contracts/notifications";

// ── Singletons ──────────────────────────────────────────────────────────
// Service instances are stateless wrappers (or session-scoped in-memory
// stores in demo mode), so module-singleton is safe. The platform impls
// will keep this pattern — Prisma's `db` client is itself a singleton.

let _audit: AuditService | null = null;
let _orders: OrderService | null = null;
let _financing: FinancingService | null = null;
let _products: ProductService | null = null;
let _files: FileService | null = null;
let _notifications: NotificationService | null = null;

// ── Accessors ──────────────────────────────────────────────────────────
// Each accessor follows the same shape: cached, lazy, demo-fallback.

export function getAuditService(): AuditService {
  if (_audit) return _audit;
  // Phase 2 unlock:
  //   if (isFeatureReady("database")) _audit = new PlatformAuditService();
  _audit = new DemoAuditService();
  return _audit;
}

export function getOrderService(): OrderService {
  if (_orders) return _orders;
  // Phase 2 unlock:
  //   if (isFeatureReady("database")) _orders = new PlatformOrderService(getAuditService());
  _orders = new DemoOrderService(getAuditService());
  return _orders;
}

export function getFinancingService(): FinancingService {
  if (_financing) return _financing;
  // Phase 2 unlock:
  //   if (isFeatureReady("database")) _financing = new PlatformFinancingService(getAuditService());
  _financing = new DemoFinancingService(getAuditService());
  return _financing;
}

export function getProductService(): ProductService {
  if (_products) return _products;
  // Phase 2 unlock:
  //   if (isFeatureReady("odoo"))     _products = new OdooProductService(odooClient);
  //   if (isFeatureReady("database")) _products = new PlatformProductService(db);
  _products = new DemoProductService();
  return _products;
}

export function getFileService(): FileService {
  if (_files) return _files;
  if (isFeatureReady("files")) {
    const cfg = r2ConfigFromEnv();
    // r2ConfigFromEnv mirrors the isFeatureReady("files") guard, but the
    // null-check keeps the type narrow.
    if (cfg) {
      _files = new R2FileService(cfg, getAuditService());
      return _files;
    }
  }
  _files = new DemoFileService(getAuditService());
  return _files;
}

export function getNotificationService(): NotificationService {
  if (_notifications) return _notifications;
  if (isFeatureReady("email") && env.RESEND_API_KEY && env.EMAIL_FROM) {
    _notifications = new ResendNotificationService({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
    });
    return _notifications;
  }
  _notifications = new DemoNotificationService();
  return _notifications;
}

// Future services (ai-assistant, customer-success, content, auth)
// follow the same pattern.
//
// Adding a new service:
//   1. Create the contract in `services/contracts/`.
//   2. Build the demo impl in `services/impl/demo/`.
//   3. Add the singleton + accessor here following the cached/lazy pattern.
//   4. (Phase 2+) Build the platform impl, uncomment the env-guarded branch.

// ── isFeatureReady re-export ───────────────────────────────────────────
// Consumers occasionally need to know whether real services are
// available (e.g. show "sign in with email" only when auth is wired).

export { isFeatureReady };
