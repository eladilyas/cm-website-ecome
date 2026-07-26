// Legacy route — the Solutions overview moved to /solutions so the URL
// matches the "Solutions" nav label visitors actually click. Permanent
// redirect keeps old links, bookmarks, and indexed URLs alive.

import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function LegacyIndustriesPage() {
  const locale = await getLocale();
  redirect({ href: "/solutions", locale });
}
