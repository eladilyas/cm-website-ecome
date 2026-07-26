// Legacy route — sector detail pages moved to /solutions/[slug].
// Permanent redirect preserves indexed URLs and inbound links.

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function LegacyIndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  redirect({ href: `/solutions/${slug}`, locale });
}
