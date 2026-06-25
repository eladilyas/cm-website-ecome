"use server";

// Category CRUD actions. All require admin role.

import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth-helpers";
import { CATALOG_TAG } from "@/server/catalog/service";
import { disableAllProductsInCategoryDefault } from "@/server/catalog/cascade";
import { recordAuditEvent } from "@/server/audit/log";

const CategoryInput = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Use lowercase letters, digits, and dashes"),
  label: z.string().min(1).max(80),
  description: z.string().max(500).nullable().optional(),
  heroImage: z.string().max(500).nullable().optional(),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0).max(9999),
});

export type CategoryInputT = z.infer<typeof CategoryInput>;

/** Bump the catalog cache so /shop, the home rail, product detail
 *  pages, and the admin lists all rebuild on the next read. */
function bustCatalogCache() {
  // Next.js 16: `revalidateTag` requires a profile. "max" = invalidate
  // immediately (no stale-while-revalidate window).
  revalidateTag(CATALOG_TAG, "max");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
}

export async function createCategory(
  input: CategoryInputT,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin("/admin/categories/new");
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  try {
    const c = await db.category.create({
      data: {
        slug: d.slug,
        label: d.label,
        description: d.description ?? null,
        heroImage: d.heroImage ?? null,
        isActive: d.isActive,
        displayOrder: d.displayOrder,
      },
    });
    bustCatalogCache();
    return { ok: true, id: c.id };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to create category (slug may be taken).",
    };
  }
}

export async function updateCategory(
  id: string,
  input: CategoryInputT,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin(`/admin/categories/${id}`);
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  try {
    const before = await db.category.findUniqueOrThrow({ where: { id } });
    const after = await db.category.update({
      where: { id },
      data: {
        slug: d.slug,
        label: d.label,
        description: d.description ?? null,
        heroImage: d.heroImage ?? null,
        isActive: d.isActive,
        displayOrder: d.displayOrder,
      },
    });
    // Cascade: if the category just transitioned active → inactive,
    // disable every product in it. Centralized in
    // src/server/catalog/cascade.ts.
    if (before.isActive && !after.isActive) {
      await disableAllProductsInCategoryDefault(after.slug);
    }
    bustCatalogCache();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update category (slug may collide).",
    };
  }
}

export async function toggleCategoryActive(
  id: string,
): Promise<{ ok: true; isActive: boolean; productsDisabled?: number }> {
  const { userId: actorId } = await requireAdmin(`/admin/categories/${id}`);
  const c = await db.category.findUniqueOrThrow({ where: { id } });
  const updated = await db.category.update({
    where: { id },
    data: { isActive: !c.isActive },
  });
  // Cascade: deactivating a category disables every product inside.
  // Activation does NOT inverse-cascade — admin must re-enable each
  // product deliberately.
  let productsDisabled: number | undefined;
  if (c.isActive && !updated.isActive) {
    productsDisabled = await disableAllProductsInCategoryDefault(updated.slug);
  }
  bustCatalogCache();
  await recordAuditEvent({
    action: "category.toggle",
    actorUserId: actorId,
    resourceType: "category",
    resourceId: id,
    before: { isActive: c.isActive },
    after: { isActive: updated.isActive },
    metadata: {
      slug: updated.slug,
      label: updated.label,
      productsDisabled: productsDisabled ?? 0,
    },
  });
  return { ok: true, isActive: updated.isActive, productsDisabled };
}

export async function reorderCategory(
  id: string,
  direction: "up" | "down",
): Promise<{ ok: true }> {
  await requireAdmin(`/admin/categories`);
  // Swap with the adjacent row in the requested direction.
  const all = await db.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
  });
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return { ok: true };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return { ok: true };
  const self = all[idx];
  const other = all[swapIdx];
  await db.$transaction([
    db.category.update({
      where: { id: self.id },
      data: { displayOrder: other.displayOrder },
    }),
    db.category.update({
      where: { id: other.id },
      data: { displayOrder: self.displayOrder },
    }),
  ]);
  bustCatalogCache();
  return { ok: true };
}
