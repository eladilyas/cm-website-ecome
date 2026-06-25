import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth-helpers";
import {
  PageHeader,
  StatusPill,
} from "@/components/admin/AdminPrimitives";
import { EditCategoryWrapper } from "./EditCategoryWrapper";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/categories/${id}`);

  const c = await db.category.findUnique({ where: { id } });
  if (!c) notFound();

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
        title={c.label}
        description={`/${c.slug}`}
        actions={
          c.isActive ? (
            <StatusPill label="Active" tone="good" />
          ) : (
            <StatusPill label="Inactive" tone="neutral" />
          )
        }
      />

      <EditCategoryWrapper
        id={c.id}
        initial={{
          slug: c.slug,
          label: c.label,
          description: c.description ?? "",
          heroImage: c.heroImage ?? "",
          isActive: c.isActive,
          displayOrder: c.displayOrder,
        }}
      />
    </div>
  );
}
