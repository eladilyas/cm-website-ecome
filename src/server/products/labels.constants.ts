// Pure label + tone constants for ProductStatus. No DB calls, no
// Prisma client, no `server-only` import — this module is safe for
// client components to consume directly.
//
// Split out from `labels.ts` so a client (`use client`) component
// can import the constants without dragging Prisma into its bundle.
// The dynamic helpers (`getCategoryLabelMap`, `getCategoryOptionsForAdmin`)
// stay in `labels.ts`, which carries an explicit `import "server-only"`
// guard.

import type { ProductStatus } from "@prisma/client";

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  IN_STOCK: "En stock",
  INCOMING: "En arrivage",
  OUT_OF_STOCK: "Rupture",
  DISABLED: "Désactivé",
};

export const PRODUCT_STATUS_TONE: Record<
  ProductStatus,
  "good" | "warn" | "bad" | "neutral"
> = {
  IN_STOCK: "good",
  INCOMING: "warn",
  OUT_OF_STOCK: "bad",
  DISABLED: "neutral",
};

export const PRODUCT_STATUSES: ProductStatus[] = [
  "IN_STOCK",
  "INCOMING",
  "OUT_OF_STOCK",
  "DISABLED",
];
