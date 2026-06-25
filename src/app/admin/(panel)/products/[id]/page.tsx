// Admin / Products / [id] — edit a product.

import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth-helpers";
import {
  PageHeader,
  SectionCard,
} from "@/components/admin/AdminPrimitives";
import { getCategoryOptionsForAdmin } from "@/server/products/labels";
import { ProductStatusControl } from "@/components/admin/ProductStatusControl";
import { EditProductFormWrapper } from "./EditProductFormWrapper";
import { SoftDeleteButton } from "./SoftDeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/products/${id}`);

  const [p, categoryOptions] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    getCategoryOptionsForAdmin(),
  ]);
  if (!p) notFound();

  // Map DB row → ProductForm initial shape.
  const features = (Array.isArray(p.features) ? p.features : []) as string[];
  const specs = (Array.isArray(p.specs)
    ? p.specs
    : []) as Array<{ label: string; value: string }>;
  const complementary = (Array.isArray(p.complementaryWithSlugs)
    ? p.complementaryWithSlugs
    : []) as string[];
  const badges = (Array.isArray(p.badges) ? p.badges : []) as string[];

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-[12px] text-ink-mute hover:text-ink mb-3 inline-block"
      >
        ← All products
      </Link>
      <PageHeader
        eyebrow="Catalog"
        title={p.name}
        description={`/shop/${p.slug}`}
        actions={
          <Link
            href={`/shop/${p.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-hairline-strong bg-paper text-[12.5px] font-medium text-ink-soft hover:text-ink hover:bg-fog transition-colors"
          >
            View on site
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M3 9l6-6M4 3h5v5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        }
      />

      {/* Hero status control — the primary call-to-action when an
          admin opens a product. One click flips status; no form submit,
          no scroll. */}
      <div className="rounded-xl border border-hairline bg-paper px-5 py-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
            Status
          </p>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            Changes propagate to /shop, the home rail, and product detail
            pages on save.
          </p>
        </div>
        <ProductStatusControl
          productId={p.id}
          current={p.status}
          variant="hero"
        />
      </div>

      <EditProductFormWrapper
        id={p.id}
        categoryOptions={categoryOptions}
        initial={{
          slug: p.slug,
          name: p.name,
          subline: p.subline ?? "",
          tagline: p.tagline,
          category: p.category,
          heroImage: p.heroImage,
          alt: p.alt,
          shortDescription: p.shortDescription,
          features,
          specs,
          priceFromMinor: p.priceFromMinor,
          currency: p.currency,
          status: p.status,
          leadWeeks: p.leadWeeks ?? null,
          complementaryWithSlugs: complementary,
          featured: p.featured,
          displayOrder: p.displayOrder,
          badges,
        }}
      />

      <div className="mt-10">
        <SectionCard title="Danger zone">
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink">
                Disable + soft-delete
              </p>
              <p className="text-[12px] text-ink-soft mt-0.5">
                The product is removed from /shop and marked désactivé. It can
                be restored from Postgres later if needed.
              </p>
            </div>
            <SoftDeleteButton id={p.id} productName={p.name} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
