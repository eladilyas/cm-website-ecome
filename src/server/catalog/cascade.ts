// Category ↔ product cascade rules.
//
// Two business invariants every mutation must preserve. Both are
// enforced HERE — every product/category server action calls into this
// module so the rules can't drift between code paths.
//
//   1. PRODUCT → CATEGORY
//      If a product becomes inactive (status DISABLED/OUT_OF_STOCK)
//      AND its category no longer has any active products, the
//      category is auto-deactivated. Rationale: the storefront should
//      never expose an empty category chip.
//
//   2. CATEGORY → PRODUCT
//      If a category becomes inactive, every product in that category
//      is auto-deactivated (status → DISABLED). The storefront source
//      of truth becomes consistent in one transaction — no admin
//      hunt for orphan listings.
//
// Re-activation does NOT cascade. Bringing a product back to IN_STOCK
// in an inactive category does not flip the category active; bringing
// a category active does not flip its products. This is deliberate —
// the admin should make the inverse decision explicitly so re-enables
// stay intentional.

import type { PrismaClient, ProductStatus } from "@prisma/client";

import { db } from "@/server/db";

const ACTIVE_PRODUCT_STATUSES: ProductStatus[] = ["IN_STOCK", "INCOMING"];

/**
 * Called AFTER a product status change. If the product is now inactive
 * and its category now has zero active products, deactivate the category.
 * Returns the category slug that was auto-deactivated (or `null`).
 *
 * The Prisma client is injected so the action can run inside a
 * transaction when needed.
 */
export async function maybeDeactivateCategoryAfterProductChange(
  prisma: Pick<PrismaClient, "product" | "category">,
  productId: string,
): Promise<string | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true, category: true, deletedAt: true },
  });
  if (!product) return null;

  // If the product is currently active OR soft-deleted, no cascade —
  // the deactivation trigger only fires when this product just became
  // inactive (caller already applied the status update before calling
  // us).
  const isProductActive = ACTIVE_PRODUCT_STATUSES.includes(product.status);
  if (isProductActive) return null;

  const remainingActive = await prisma.product.count({
    where: {
      category: product.category,
      deletedAt: null,
      status: { in: ACTIVE_PRODUCT_STATUSES },
    },
  });
  if (remainingActive > 0) return null;

  // Find the category row and only flip it if it's currently active.
  const cat = await prisma.category.findUnique({
    where: { slug: product.category },
  });
  if (!cat || !cat.isActive) return null;

  await prisma.category.update({
    where: { id: cat.id },
    data: { isActive: false },
  });
  return cat.slug;
}

/**
 * Called when a category transitions from active → inactive. Disables
 * every product in that category (status → DISABLED). Returns the
 * number of products updated.
 *
 * Uses an `updateMany` so all rows flip atomically.
 */
export async function disableAllProductsInCategory(
  prisma: Pick<PrismaClient, "product">,
  categorySlug: string,
): Promise<number> {
  const result = await prisma.product.updateMany({
    where: {
      category: categorySlug,
      deletedAt: null,
      status: { in: ACTIVE_PRODUCT_STATUSES },
    },
    data: { status: "DISABLED" },
  });
  return result.count;
}

/**
 * Same trigger as `maybeDeactivateCategoryAfterProductChange`, keyed by
 * category slug. Used when a product's category itself changes — the
 * previous category may now have zero active products.
 */
export async function maybeDeactivateEmptyCategory(
  prisma: Pick<PrismaClient, "product" | "category">,
  categorySlug: string,
): Promise<string | null> {
  const remainingActive = await prisma.product.count({
    where: {
      category: categorySlug,
      deletedAt: null,
      status: { in: ACTIVE_PRODUCT_STATUSES },
    },
  });
  if (remainingActive > 0) return null;

  const cat = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });
  if (!cat || !cat.isActive) return null;

  await prisma.category.update({
    where: { id: cat.id },
    data: { isActive: false },
  });
  return cat.slug;
}

// ── Convenience wrappers that default to the global Prisma client ─────

export function maybeDeactivateCategoryAfterProductChangeDefault(
  productId: string,
) {
  return maybeDeactivateCategoryAfterProductChange(db, productId);
}

export function maybeDeactivateEmptyCategoryDefault(categorySlug: string) {
  return maybeDeactivateEmptyCategory(db, categorySlug);
}

export function disableAllProductsInCategoryDefault(categorySlug: string) {
  return disableAllProductsInCategory(db, categorySlug);
}
