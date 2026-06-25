// Admin / Orders — production order queue. Reads from Postgres
// through the orderService; visibility is scoped via the policy
// layer (canSeeOrder + classifyOrderStatus + dispatcherScopeFor).

import Link from "next/link";

import { requireRole } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import { loadActor } from "@/server/policy";
import { listOrdersForActor } from "@/server/orders/service";
import {
  classifyOrderStatus,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
} from "@/server/orders/status";
import {
  PageHeader,
  SectionCard,
  StatsStrip,
  StatusPill,
  EmptyState,
} from "@/components/admin/AdminPrimitives";
import { formatPrice } from "@/lib/formatPrice";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireRole(
    "/admin/orders",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
    ROLE_SLUGS.dispatcher,
  );
  const actor = await loadActor();
  const orders = await listOrdersForActor(actor);

  const buckets = {
    unpaid: orders.filter((o) => classifyOrderStatus(o.status) === "unpaid")
      .length,
    fulfilment: orders.filter(
      (o) => classifyOrderStatus(o.status) === "fulfilment",
    ).length,
    terminal: orders.filter(
      (o) => classifyOrderStatus(o.status) === "terminal",
    ).length,
  };

  const scopeBlurb = actor?.isAdmin
    ? "Every order across the platform — every status, every customer."
    : actor?.isPresales
      ? "Unpaid orders from customers assigned to you."
      : actor?.isDispatcher
        ? "Your fulfilment queue: paid + in-progress orders you own."
        : "No orders in scope.";

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        description={scopeBlurb}
      />

      <StatsStrip
        items={[
          { label: "In scope", value: orders.length },
          { label: "Unpaid", value: buckets.unpaid, tone: "warn" },
          { label: "Fulfilment", value: buckets.fulfilment, tone: "info" },
          { label: "Terminal", value: buckets.terminal, tone: "neutral" },
        ]}
      />

      <SectionCard title={`Orders (${orders.length})`}>
        {orders.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No orders in your scope"
              description={
                actor?.isAdmin
                  ? "Customers haven't placed any orders yet. They'll appear here as soon as the first checkout completes."
                  : "Your queue is empty. Orders will surface here as customers progress through checkout + fulfilment."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="admin-thead text-ink-mute text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Order</th>
                  <th className="text-left font-medium px-5 py-3">Customer</th>
                  <th className="text-right font-medium px-5 py-3">Total</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Placed</th>
                  <th className="w-12 px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-canvas/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${o.ref}`}
                        className="block"
                      >
                        <p className="font-medium text-ink tabular-nums">
                          {o.ref}
                        </p>
                        <p className="text-[11.5px] text-ink-mute tabular-nums">
                          {o.totals.itemCount} item
                          {o.totals.itemCount === 1 ? "" : "s"}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-ink">{o.contact.fullName}</p>
                      <p className="text-[11.5px] text-ink-mute truncate">
                        {o.contact.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-ink">
                      {formatPrice(o.totals.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill
                        label={ORDER_STATUS_LABEL[o.status]}
                        tone={ORDER_STATUS_TONE[o.status]}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft tabular-nums">
                      {new Date(o.createdAt).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${o.ref}`}
                        className="text-ink-mute hover:text-ink"
                        aria-label="Open order"
                      >
                        →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
