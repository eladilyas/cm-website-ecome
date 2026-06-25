import Link from "next/link";

import { requireAdmin } from "@/server/auth-helpers";
import { PageHeader } from "@/components/admin/AdminPrimitives";
import { NewCategoryWrapper } from "./NewCategoryWrapper";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  await requireAdmin("/admin/categories/new");

  return (
    <div>
      <Link
        href="/admin/categories"
        className="text-[12px] text-ink-mute hover:text-ink mb-3 inline-block"
      >
        ← All categories
      </Link>
      <PageHeader
        eyebrow="Catalog"
        title="New category"
        description="Slug is the URL identifier shared with Product.category. Keep it short and lowercase."
      />
      <NewCategoryWrapper />
    </div>
  );
}
