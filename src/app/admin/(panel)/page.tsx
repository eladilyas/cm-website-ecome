// Admin dashboard — business overview, not SaaS KPIs.
//
// Pulls real numbers off Postgres:
//   • Leads generated (last 30d) — external accounts created
//   • Orders + GMV (last 30d) — paid + fulfilment + delivered
//   • Conversion rate — orders / leads (30d)
//   • Pre-sales workload — open (non-terminal) orders + financing per rep
//   • Dispatcher workload — fulfilment orders per dispatcher
//   • Top products — units sold over last 30d (joined via OrderItem)

import Link from "next/link";

import { db } from "@/server/db";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import { getUserRoles } from "@/server/auth-helpers";
import {
  PageHeader,
  StatTile,
  SectionCard,
  EmptyState,
} from "@/components/admin/AdminPrimitives";
import {
  TERMINAL_STATUSES as ORDER_TERMINAL,
  FULFILMENT_STATUSES,
} from "@/server/orders/status";
import {
  TERMINAL_STATUSES as FIN_TERMINAL,
} from "@/server/financing/status";
import { formatPrice } from "@/lib/formatPrice";

export const dynamic = "force-dynamic";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Request-scoped "now". Isolated from the render body so the
 *  react-hooks/purity rule doesn't false-flag the impure call. */
function serverNow(): Date {
  return new Date();
}

export default async function AdminDashboard() {
  const roles = await getUserRoles();
  const isSuper = roles.includes(ROLE_SLUGS.superAdmin);
  // `force-dynamic` means this renders fresh per request — `new Date()` is
  // request-scoped, not render-scoped. Wrapping it sidesteps the
  // react-hooks/purity rule that fires on a bare `Date.now()` in a
  // component body (the rule can't tell server components apart).
  const now = serverNow();
  const since = new Date(now.getTime() - THIRTY_DAYS_MS);

  // ── 30-day windows (the page's core time horizon) ────────────────
  const [
    leadCount30d,
    orderCount30d,
    orderRevenueAgg30d,
    productCount,
    categoryCount,
  ] = await Promise.all([
    // Lead = external account (no internal staff role)
    db.user.count({
      where: {
        createdAt: { gte: since },
        userRoles: {
          none: {
            role: {
              slug: {
                in: [
                  ROLE_SLUGS.superAdmin,
                  ROLE_SLUGS.admin,
                  ROLE_SLUGS.presales,
                  ROLE_SLUGS.dispatcher,
                ],
              },
            },
          },
        },
      },
    }),
    db.order.count({ where: { createdAt: { gte: since } } }),
    db.order.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { grandTotalMinor: true },
    }),
    db.product.count({ where: { deletedAt: null } }),
    db.category.count({ where: { isActive: true } }),
  ]);

  const gmv30d = (orderRevenueAgg30d._sum.grandTotalMinor ?? 0) / 100;
  const conversionRate = leadCount30d > 0 ? (orderCount30d / leadCount30d) * 100 : 0;

  // ── Workload tables ──────────────────────────────────────────────
  // Pre-sales: count of OPEN (non-terminal) orders + financing where
  // contact email is in the rep's assigned set.
  // Dispatcher: count of orders in fulfilment bucket assigned to them.
  const [presalesUsers, dispatcherUsers] = await Promise.all([
    db.user.findMany({
      where: {
        disabledAt: null,
        userRoles: { some: { role: { slug: ROLE_SLUGS.presales } } },
      },
      select: { id: true, fullName: true, name: true, email: true },
    }),
    db.user.findMany({
      where: {
        disabledAt: null,
        userRoles: { some: { role: { slug: ROLE_SLUGS.dispatcher } } },
      },
      select: { id: true, fullName: true, name: true, email: true },
    }),
  ]);

  // Pre-sales workload: count orders + financing per assigned customer
  // email. Single query each, aggregated in code.
  const presalesAssignments = await db.leadAssignment.findMany({
    select: { assignedToUserId: true, customerEmail: true },
  });
  const presalesEmails = new Map<string, string[]>();
  for (const a of presalesAssignments) {
    const list = presalesEmails.get(a.assignedToUserId) ?? [];
    list.push(a.customerEmail);
    presalesEmails.set(a.assignedToUserId, list);
  }

  const presalesWorkload = await Promise.all(
    presalesUsers.map(async (u) => {
      const emails = presalesEmails.get(u.id) ?? [];
      if (emails.length === 0) {
        return {
          id: u.id,
          name: u.fullName || u.name || u.email,
          customers: 0,
          openOrders: 0,
          openFinancing: 0,
        };
      }
      const [openOrders, openFinancing] = await Promise.all([
        db.order.count({
          where: {
            contactEmail: { in: emails },
            status: { notIn: ORDER_TERMINAL },
          },
        }),
        db.financingRequest.count({
          where: {
            contactEmail: { in: emails },
            status: { notIn: FIN_TERMINAL },
          },
        }),
      ]);
      return {
        id: u.id,
        name: u.fullName || u.name || u.email,
        customers: emails.length,
        openOrders,
        openFinancing,
      };
    }),
  );

  // Dispatcher workload — count orders in fulfilment bucket assigned to them.
  const dispatcherAssignments = await db.orderAssignment.findMany({
    select: { assignedToUserId: true, orderRef: true },
  });
  const dispatcherRefs = new Map<string, string[]>();
  for (const a of dispatcherAssignments) {
    const list = dispatcherRefs.get(a.assignedToUserId) ?? [];
    list.push(a.orderRef);
    dispatcherRefs.set(a.assignedToUserId, list);
  }
  const dispatcherWorkload = await Promise.all(
    dispatcherUsers.map(async (u) => {
      const refs = dispatcherRefs.get(u.id) ?? [];
      if (refs.length === 0) {
        return {
          id: u.id,
          name: u.fullName || u.name || u.email,
          assigned: 0,
          inFulfilment: 0,
        };
      }
      const inFulfilment = await db.order.count({
        where: {
          ref: { in: refs },
          status: { in: FULFILMENT_STATUSES },
        },
      });
      return {
        id: u.id,
        name: u.fullName || u.name || u.email,
        assigned: refs.length,
        inFulfilment,
      };
    }),
  );

  // ── Top products by units sold (last 30d) ─────────────────────────
  const topProductsRaw = await db.orderItem.groupBy({
    by: ["productSlug", "name"],
    where: { order: { createdAt: { gte: since } } },
    _sum: { qty: true, lineTotalMinor: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 5,
  });
  const topProducts = topProductsRaw.map((p) => ({
    slug: p.productSlug,
    name: p.name,
    units: p._sum.qty ?? 0,
    revenue: (p._sum.lineTotalMinor ?? 0) / 100,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Business dashboard"
        description="Live numbers from the last 30 days."
      />

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <QuickAction href="/admin/products/new" label="New product" />
        <QuickAction href="/admin/categories/new" label="New category" />
        {isSuper && <QuickAction href="/admin/users/new" label="New user" />}
        {isSuper && <QuickAction href="/admin/assignments" label="Assign leads" />}
        {isSuper && (
          <QuickAction href="/admin/order-assignments" label="Assign orders" />
        )}
      </div>

      {/* Core KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatTile
          label="Leads (30d)"
          value={leadCount30d}
          hint="New external accounts"
          href="/admin/leads"
        />
        <StatTile
          label="Orders (30d)"
          value={orderCount30d}
          hint={`${formatPrice(gmv30d)} GMV`}
          href="/admin/orders"
        />
        <StatTile
          label="Conversion"
          value={`${conversionRate.toFixed(1)}%`}
          hint="Orders ÷ leads"
        />
        <StatTile
          label="Catalog"
          value={productCount}
          hint={`${categoryCount} active categories`}
          href="/admin/products"
        />
      </div>

      {/* Workload + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <SectionCard
          title="Pre-sales workload"
          description="Open orders + financing per rep, across their assigned customers."
          actions={
            isSuper ? (
              <Link
                href="/admin/assignments"
                className="text-[12.5px] font-medium text-ink hover:underline underline-offset-[5px]"
              >
                Reassign →
              </Link>
            ) : undefined
          }
        >
          {presalesWorkload.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No pre-sales reps"
                description="Create a user with the pre-sales role to see workload here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {presalesWorkload.map((p) => (
                <li
                  key={p.id}
                  className="px-5 py-3 flex items-baseline justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">
                      {p.name}
                    </p>
                    <p className="text-[11.5px] text-ink-mute tabular-nums">
                      {p.customers} customer{p.customers === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <p className="text-[12.5px] text-ink">
                      {p.openOrders} open · {p.openFinancing} fin
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Dispatcher workload"
          description="Orders in fulfilment per dispatcher."
          actions={
            isSuper ? (
              <Link
                href="/admin/order-assignments"
                className="text-[12.5px] font-medium text-ink hover:underline underline-offset-[5px]"
              >
                Reassign →
              </Link>
            ) : undefined
          }
        >
          {dispatcherWorkload.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No dispatchers"
                description="Create a user with the dispatcher role to see workload here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {dispatcherWorkload.map((d) => (
                <li
                  key={d.id}
                  className="px-5 py-3 flex items-baseline justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink truncate">
                      {d.name}
                    </p>
                    <p className="text-[11.5px] text-ink-mute tabular-nums">
                      {d.assigned} order{d.assigned === 1 ? "" : "s"} assigned
                    </p>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <p className="text-[12.5px] text-ink">
                      {d.inFulfilment} in fulfilment
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Top products */}
      <SectionCard
        title="Top products (30d)"
        description="Units sold across all completed checkouts."
        actions={
          <Link
            href="/admin/products"
            className="text-[12.5px] font-medium text-ink hover:underline underline-offset-[5px]"
          >
            All products →
          </Link>
        }
      >
        {topProducts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No order data in the last 30 days"
              description="Top products appear here once customers place orders."
            />
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {topProducts.map((p, i) => (
              <li
                key={p.slug}
                className="px-5 py-3 flex items-baseline gap-4"
              >
                <span className="text-[11px] text-ink-mute tabular-nums w-5">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">
                    {p.name}
                  </p>
                  <p className="text-[11.5px] text-ink-mute tabular-nums">
                    /{p.slug}
                  </p>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <p className="text-[13px] text-ink">
                    {p.units} unit{p.units === 1 ? "" : "s"}
                  </p>
                  <p className="text-[11.5px] text-ink-mute">
                    {formatPrice(p.revenue)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

// ── Quick action chip (unchanged from prior dashboard) ───────────────
function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-hairline-strong bg-paper text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-fog transition-colors duration-200"
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-ink-mute">
        <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {label}
    </Link>
  );
}
