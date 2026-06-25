// InventoryService — stock-level contract.
//
// Ownership timeline:
//   Phase 1 (now)    — mock data inside demoStore, wrapped by impl/demo/
//   Phase 2          — Platform Postgres (writes go through this layer)
//   Phase 3 (Odoo)   — Odoo becomes source of truth. Inventory writes
//                      from the website become impossible; the service
//                      becomes read-only on impl/odoo/. UI doesn't change
//                      because the read API stays.
//
// Inventory is decoupled from Product so the eventual Odoo migration
// can move ONE domain without disturbing the other.

import type { ProductSlug } from "./types";

export type StockLevel = Readonly<{
  productSlug: ProductSlug;
  onHand: number;
  reserved: number;
  available: number; // onHand - reserved
  reorderThreshold?: number;
  updatedAt: string;
}>;

export type StockMovement = Readonly<{
  id: string;
  productSlug: ProductSlug;
  /** Positive = inbound, negative = outbound. */
  delta: number;
  kind: "sale" | "return" | "adjustment" | "transfer-in" | "transfer-out" | "waste";
  reason?: string;
  occurredAt: string;
  actorUserId?: string;
}>;

export interface InventoryService {
  // Read ────────────────────────────────────────────────────────────────
  getStockLevel(slug: ProductSlug): Promise<StockLevel | null>;
  listLowStock(): Promise<StockLevel[]>;
  listMovements(slug: ProductSlug, limit?: number): Promise<StockMovement[]>;

  // Write (admin) ───────────────────────────────────────────────────────
  /** Adjust stock. Writes a StockMovement + AuditEvent atomically. */
  adjust(
    slug: ProductSlug,
    delta: number,
    kind: StockMovement["kind"],
    reason?: string,
  ): Promise<StockLevel>;

  setReorderThreshold(slug: ProductSlug, threshold: number): Promise<StockLevel>;

  /** Reserve stock when an order enters Processing. */
  reserve(slug: ProductSlug, qty: number): Promise<StockLevel>;
  release(slug: ProductSlug, qty: number): Promise<StockLevel>;
}
