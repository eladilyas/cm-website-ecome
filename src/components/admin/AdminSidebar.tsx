"use client";

// Admin sidebar — Linear-style grouped nav.
//
// Groups visible based on the visitor's role: pre-sales sees only the
// "Assigned" group; admins see Operations + Catalog; super-admins
// additionally see Identity (users + role management).
//
// Active state mirrors the current pathname. Sub-items receive the
// active treatment when the URL starts with their href.

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  hint?: string;
};

type NavGroup = {
  label: string;
  show: boolean;
  items: NavItem[];
};

export function AdminSidebar({
  isSuper,
  isAdmin,
  isPresales,
  isDispatcher,
}: {
  isSuper: boolean;
  isAdmin: boolean;
  isPresales: boolean;
  isDispatcher: boolean;
}) {
  const pathname = usePathname() ?? "/admin";

  // IA per role:
  //   • Admin tier sees every section.
  //   • Pre-sales sees Customers + Orders (unpaid) + Financing (no
  //     Catalog, no Identity, no order assignments).
  //   • Dispatcher sees Orders (fulfilment) only — no Customers, no
  //     Financing, no Catalog mgmt.
  const groups: NavGroup[] = [
    {
      label: "Overview",
      show: true,
      items: [{ href: "/admin", label: "Dashboard", hint: "At-a-glance" }],
    },
    {
      label: "Operations",
      show: isAdmin || isPresales || isDispatcher,
      items: [
        ...(isAdmin || isPresales
          ? [
              {
                href: "/admin/leads",
                label: "Leads",
                hint: isAdmin ? "External accounts · CRM" : "My assigned leads",
              },
            ]
          : []),
        {
          href: "/admin/orders",
          label: "Orders",
          hint: isDispatcher
            ? "My fulfilment queue"
            : isPresales
              ? "Unpaid · my leads"
              : "Customer purchases",
        },
        ...(isAdmin || isPresales
          ? [
              {
                href: "/admin/financing",
                label: "Financing",
                hint: isPresales ? "My leads" : "Wafasalaf requests",
              },
            ]
          : []),
      ],
    },
    {
      label: "Catalog",
      show: isAdmin,
      items: [
        { href: "/admin/products", label: "Products", hint: "Inventory + status" },
        {
          href: "/admin/categories",
          label: "Categories",
          hint: "Filter rail + chips",
        },
      ],
    },
    {
      label: "Identity",
      show: isSuper,
      items: [
        { href: "/admin/users", label: "Users", hint: "Accounts + roles" },
        {
          href: "/admin/assignments",
          label: "Lead assignments",
          hint: "Pre-sales · per customer",
        },
        {
          href: "/admin/order-assignments",
          label: "Order assignments",
          hint: "Dispatcher · per order",
        },
      ],
    },
    {
      label: "System",
      show: isSuper,
      items: [
        {
          href: "/admin/payment-methods",
          label: "Payment methods",
          hint: "CMI · Wafasalaf · Wire",
        },
        {
          href: "/admin/settings",
          label: "Settings",
          hint: "Platform configuration",
        },
      ],
    },
  ];

  return (
    // Layout (width, sticky positioning, scrolling) is owned by the
    // <aside> wrapper in AdminShell. This component emits a single
    // <nav> so the DOM stays semantic and there's no nested aside.
    <nav className="space-y-5">
        {groups
          .filter((g) => g.show)
          .map((g) => (
            <div key={g.label}>
              <p className="px-2.5 mb-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-mute font-medium">
                {g.label}
              </p>
              <div className="space-y-px">
                {g.items.map((it) => {
                  const active =
                    it.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === it.href || pathname.startsWith(it.href + "/");
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={
                        "relative block rounded-lg px-3 py-2 lg:py-1.5 transition-colors duration-200 " +
                        "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
                        (active
                          ? "bg-paper text-ink shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]"
                          : "text-ink-soft hover:text-ink hover:bg-paper/70")
                      }
                    >
                      {/* Active accent — left tick. Animates in on hover
                          via the parent's :hover even when not active. */}
                      <span
                        aria-hidden
                        className={
                          "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full bg-ink transition-all duration-200 " +
                          (active ? "h-4 opacity-100" : "h-0 opacity-0")
                        }
                      />
                      <div className="text-[13px] font-medium leading-[1.2]">
                        {it.label}
                      </div>
                      {it.hint && (
                        <div
                          className={
                            "text-[10.5px] leading-tight mt-0.5 " +
                            (active ? "text-ink-mute" : "text-ink-mute/70")
                          }
                        >
                          {it.hint}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
    </nav>
  );
}
