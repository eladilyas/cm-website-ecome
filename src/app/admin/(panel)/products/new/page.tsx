// Admin / Products / New — uses the shared ProductForm.

import Link from "next/link";

import { requireAdmin } from "@/server/auth-helpers";
import { PageHeader } from "@/components/admin/AdminPrimitives";
import { getCategoryOptionsForAdmin } from "@/server/products/labels";
import { NewProductFormWrapper } from "./NewProductFormWrapper";

export const dynamic = "force-dynamic";

export default async function AdminProductsNewPage() {
  await requireAdmin("/admin/products/new");
  const categoryOptions = await getCategoryOptionsForAdmin();

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
        title="New product"
        description="Fields mirror the public catalog 1:1 — the product lands on /shop the moment you save."
      />
      <NewProductFormWrapper categoryOptions={categoryOptions} />
    </div>
  );
}
