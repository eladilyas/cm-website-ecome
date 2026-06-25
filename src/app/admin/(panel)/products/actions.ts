"use server";

// Product CRUD actions + a one-shot importer that mirrors the static
// catalog file (src/data/catalog.ts) into Postgres so the first-time
// setup doesn't require typing every product by hand.
//
// All actions require admin OR super-admin.

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth-helpers";
import { CATALOG } from "@/data/catalog";
import { CATALOG_TAG } from "@/server/catalog/service";
import {
  maybeDeactivateCategoryAfterProductChangeDefault,
  maybeDeactivateEmptyCategoryDefault,
} from "@/server/catalog/cascade";
import { recordAuditEvent } from "@/server/audit/log";

/** Bump the catalog cache so /shop, the home rail, product detail
 *  pages, and the admin lists all rebuild on the next read. */
function bustCatalogCache(slug?: string) {
  // Next.js 16: `revalidateTag` requires a profile. "max" = invalidate
  // immediately (no stale-while-revalidate window).
  revalidateTag(CATALOG_TAG, "max");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/shop/${slug}`);
}

// ── Schema ─────────────────────────────────────────────────────────────

const SpecSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(500),
});

const ProductInput = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Use lowercase letters, digits, and dashes"),
  name: z.string().min(1).max(120),
  subline: z.string().max(120).optional().nullable(),
  tagline: z.string().min(1).max(240),
  category: z.string().min(1),
  heroImage: z.string().min(1),
  alt: z.string().min(1).max(240),
  shortDescription: z.string().min(1).max(1000),
  features: z.array(z.string().min(1).max(280)).max(20),
  specs: z.array(SpecSchema).max(20),
  priceFromMinor: z.number().int().nonnegative(),
  currency: z.string().default("MAD"),
  status: z.enum(["IN_STOCK", "INCOMING", "OUT_OF_STOCK", "DISABLED"]),
  leadWeeks: z.number().int().min(1).max(52).nullable().optional(),
  complementaryWithSlugs: z.array(z.string()).default([]),
  // Merchandising controls.
  featured: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(9999).default(100),
  badges: z.array(z.string().min(1).max(40)).max(8).default([]),
});

export type ProductInputT = z.infer<typeof ProductInput>;

// ── Create / Update ────────────────────────────────────────────────────

export async function createProduct(
  input: ProductInputT,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin("/admin/products/new");
  const parsed = ProductInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  try {
    const created = await db.product.create({
      data: {
        slug: d.slug,
        name: d.name,
        subline: d.subline ?? null,
        tagline: d.tagline,
        category: d.category,
        heroImage: d.heroImage,
        alt: d.alt,
        shortDescription: d.shortDescription,
        features: d.features,
        specs: d.specs,
        priceFromMinor: d.priceFromMinor,
        currency: d.currency,
        status: d.status,
        leadWeeks: d.leadWeeks ?? null,
        complementaryWithSlugs: d.complementaryWithSlugs,
        featured: d.featured,
        displayOrder: d.displayOrder,
        badges: d.badges,
      },
    });
    bustCatalogCache(d.slug);
    return { ok: true, id: created.id };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to create product (slug may be taken).",
    };
  }
}

export async function updateProduct(
  id: string,
  input: ProductInputT,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin(`/admin/products/${id}`);
  const parsed = ProductInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  try {
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Product not found." };

    await db.product.update({
      where: { id },
      data: {
        slug: d.slug,
        name: d.name,
        subline: d.subline ?? null,
        tagline: d.tagline,
        category: d.category,
        heroImage: d.heroImage,
        alt: d.alt,
        shortDescription: d.shortDescription,
        features: d.features,
        specs: d.specs,
        priceFromMinor: d.priceFromMinor,
        currency: d.currency,
        status: d.status,
        leadWeeks: d.leadWeeks ?? null,
        complementaryWithSlugs: d.complementaryWithSlugs,
        featured: d.featured,
        displayOrder: d.displayOrder,
        badges: d.badges,
      },
    });
    // Cascade rules:
    //   • Always check the new category (status change in the form may
    //     have just deactivated this product).
    //   • If the product moved categories, also check the OLD category —
    //     it may have lost its last active product.
    await maybeDeactivateCategoryAfterProductChangeDefault(id);
    if (existing.category !== d.category) {
      await maybeDeactivateEmptyCategoryDefault(existing.category);
    }

    bustCatalogCache(d.slug);
    revalidatePath(`/admin/products/${id}`);
    if (existing.slug !== d.slug) revalidatePath(`/shop/${existing.slug}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update product.",
    };
  }
}

// ── Inline status change ───────────────────────────────────────────────
// One-shot status flip used by the segmented control on the products
// list + detail page. Cheap action — single UPDATE + cache invalidation.

const StatusInput = z.enum(["IN_STOCK", "INCOMING", "OUT_OF_STOCK", "DISABLED"]);

export async function setProductStatus(
  id: string,
  status: z.infer<typeof StatusInput>,
): Promise<{ ok: true; status: z.infer<typeof StatusInput> } | { ok: false; error: string }> {
  const { userId: actorId } = await requireAdmin(`/admin/products/${id}`);
  const parsed = StatusInput.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: "Invalid status." };
  }
  try {
    const previous = await db.product.findUnique({
      where: { id },
      select: { status: true, slug: true, name: true },
    });
    const row = await db.product.update({
      where: { id },
      data: { status: parsed.data },
      select: { slug: true, status: true },
    });
    // Cascade: if this product is now inactive AND its category has
    // no other active products, deactivate the category. Centralized
    // in src/server/catalog/cascade.ts.
    await maybeDeactivateCategoryAfterProductChangeDefault(id);
    bustCatalogCache(row.slug);
    await recordAuditEvent({
      action: "product.status",
      actorUserId: actorId,
      resourceType: "product",
      resourceId: id,
      before: { status: previous?.status ?? null },
      after: { status: row.status },
      metadata: { slug: row.slug, name: previous?.name ?? null },
    });
    return { ok: true, status: row.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update status.",
    };
  }
}

// ── Soft delete ────────────────────────────────────────────────────────

export async function softDeleteProduct(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId: actorId } = await requireAdmin(`/admin/products/${id}`);
  const row = await db.product.update({
    where: { id },
    data: { deletedAt: new Date(), status: "DISABLED" },
  });
  // Soft-delete drops the product from active counts too, so the
  // category cascade fires the same way as a status flip.
  await maybeDeactivateEmptyCategoryDefault(row.category);
  bustCatalogCache(row.slug);
  await recordAuditEvent({
    action: "product.disable",
    actorUserId: actorId,
    resourceType: "product",
    resourceId: id,
    metadata: { slug: row.slug, name: row.name, category: row.category },
  });
  return { ok: true };
}

// ── Importer — one-shot mirror from src/data/catalog.ts ────────────────

export async function importCatalogToDb(): Promise<{
  ok: true;
  inserted: number;
  skipped: number;
}> {
  await requireAdmin("/admin/products");

  let inserted = 0;
  let skipped = 0;

  for (const p of CATALOG) {
    const existing = await db.product.findUnique({
      where: { slug: p.slug },
    });
    if (existing) {
      skipped++;
      continue;
    }

    // Map the static catalog status to ProductStatus.
    const status =
      p.availability?.status === "incoming" ? "INCOMING" : "IN_STOCK";
    const leadWeeks = p.availability?.leadWeeks ?? null;

    await db.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        subline: p.subline ?? null,
        tagline: p.tagline,
        category: p.category,
        heroImage: p.heroImage,
        alt: p.alt,
        shortDescription: p.shortDescription,
        features: p.features,
        specs: p.specs,
        // priceFrom in catalog is in MAD whole units (e.g. 4500). Our
        // schema stores integer minor units (centimes) — multiply by 100.
        priceFromMinor: Math.round(p.priceFrom * 100),
        currency: "MAD",
        status,
        leadWeeks,
        complementaryWithSlugs: p.complementaryWith,
      },
    });
    inserted++;
  }

  bustCatalogCache();
  return { ok: true, inserted, skipped };
}
