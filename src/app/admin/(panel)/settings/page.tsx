// Admin / Settings — super-admin only.
//
// Stub for now: the page lists every settings surface the platform
// will carry as it grows (notifications, integrations, billing,
// branding). Each card has its own future home; this page is the
// directory.

import Link from "next/link";

import { requireSuperAdmin } from "@/server/auth-helpers";
import {
  PageHeader,
  SectionCard,
} from "@/components/admin/AdminPrimitives";

export const dynamic = "force-dynamic";

type SettingsTile = Readonly<{
  title: string;
  description: string;
  href: string | null; // null while the surface is unbuilt
}>;

const TILES: readonly SettingsTile[] = [
  {
    title: "Notifications",
    description:
      "Email + SMS templates, delivery channels, per-event preferences. " +
      "Resend wired; UI pending.",
    href: null,
  },
  {
    title: "Integrations",
    description:
      "Odoo, Wafasalaf, CMI, Axiom — connection state + sync history.",
    href: null,
  },
  {
    title: "Branding",
    description:
      "Logo upload, accent color, public site copy overrides.",
    href: null,
  },
  {
    title: "Roles & permissions",
    description:
      "View the RBAC catalog. To change role grants for a user, open the user's profile.",
    href: "/admin/users",
  },
  {
    title: "Audit log",
    description:
      "Every mutation across the platform (orders, financing, products, users). Schema ready; UI pending.",
    href: null,
  },
];

export default async function AdminSettingsPage() {
  await requireSuperAdmin("/admin/settings");

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Platform-wide configuration. Each surface is super-admin only."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TILES.map((t) => (
          <SectionCard
            key={t.title}
            title={t.title}
            actions={
              t.href ? (
                <Link
                  href={t.href}
                  className="text-[12.5px] font-medium text-ink hover:underline underline-offset-[5px]"
                >
                  Open →
                </Link>
              ) : (
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
                  Coming soon
                </span>
              )
            }
          >
            <div className="p-5">
              <p className="text-[13px] text-ink-soft leading-[1.55]">
                {t.description}
              </p>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
