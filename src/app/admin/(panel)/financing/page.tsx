// Admin / Financing — production queue. Server component, reads
// through the financing service; visibility scoped via policy.

import Link from "next/link";

import { requireRole } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import { loadActor } from "@/server/policy";
import { listFinancingForActor } from "@/server/financing/service";
import {
  classifyFinancingStatus,
  FINANCING_STATUS_LABEL,
  FINANCING_STATUS_TONE,
} from "@/server/financing/status";
import {
  PageHeader,
  SectionCard,
  StatsStrip,
  StatusPill,
  EmptyState,
} from "@/components/admin/AdminPrimitives";
import { formatPrice } from "@/lib/formatPrice";

export const dynamic = "force-dynamic";

export default async function AdminFinancingPage() {
  await requireRole(
    "/admin/financing",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
  );
  const actor = await loadActor();
  const requests = await listFinancingForActor(actor);

  const buckets = {
    pending: requests.filter(
      (r) => classifyFinancingStatus(r.status) === "pending",
    ).length,
    active: requests.filter(
      (r) => classifyFinancingStatus(r.status) === "active",
    ).length,
    terminal: requests.filter(
      (r) => classifyFinancingStatus(r.status) === "terminal",
    ).length,
  };

  const scopeBlurb = actor?.isAdmin
    ? "Every financing request across the platform."
    : actor?.isPresales
      ? "Financing requests from customers assigned to you."
      : "No requests in scope.";

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Financing"
        description={scopeBlurb}
      />

      <StatsStrip
        items={[
          { label: "In scope", value: requests.length },
          { label: "Pending", value: buckets.pending, tone: "warn" },
          { label: "Active", value: buckets.active, tone: "good" },
          { label: "Terminal", value: buckets.terminal, tone: "neutral" },
        ]}
      />

      <SectionCard title={`Requests (${requests.length})`}>
        {requests.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No financing requests in scope"
              description={
                actor?.isAdmin
                  ? "Wafasalaf requests will appear here as customers submit them at checkout."
                  : "Requests for your assigned customers show up here."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="admin-thead text-ink-mute text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Request</th>
                  <th className="text-left font-medium px-5 py-3">Customer</th>
                  <th className="text-right font-medium px-5 py-3">Monthly</th>
                  <th className="text-right font-medium px-5 py-3">Total cost</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Submitted</th>
                  <th className="w-12 px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-canvas/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/financing/${r.ref}`}
                        className="block"
                      >
                        <p className="font-medium text-ink tabular-nums">
                          {r.ref}
                        </p>
                        <p className="text-[11.5px] text-ink-mute tabular-nums">
                          {r.financing.months}-month plan
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-ink">{r.contact.fullName}</p>
                      <p className="text-[11.5px] text-ink-mute truncate">
                        {r.contact.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-ink">
                      {formatPrice(r.financing.monthly)}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-ink-soft">
                      {formatPrice(r.financing.totalCost)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill
                        label={FINANCING_STATUS_LABEL[r.status]}
                        tone={FINANCING_STATUS_TONE[r.status]}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft tabular-nums">
                      {new Date(r.createdAt).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/financing/${r.ref}`}
                        className="text-ink-mute hover:text-ink"
                        aria-label="Open request"
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
