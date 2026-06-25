// Admin / Financing / [ref] — full detail + decision actions.

import Link from "next/link";
import Image from "next/image";

import { db } from "@/server/db";
import { requireRole } from "@/server/auth-helpers";
import { loadActor } from "@/server/policy";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import {
  actorCanSeeFinancing,
  getFinancingByRef,
  listFollowupNotes,
} from "@/server/financing/service";
import { FollowupNoteForm } from "./FollowupNoteForm";
import {
  AGE_BRACKET_LABEL,
  FINANCING_STATUS_LABEL,
  FINANCING_STATUS_TONE,
  nextStatusesFrom,
} from "@/server/financing/status";
import {
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/admin/AdminPrimitives";
import { listPublicProducts } from "@/server/catalog/service";
import { formatPrice } from "@/lib/formatPrice";
import { FinancingTransitionControl } from "./FinancingTransitionControl";

export const dynamic = "force-dynamic";

export default async function AdminFinancingDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  await requireRole(
    "/admin/financing",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
  );
  const { ref: requestRef } = await params;
  const actor = await loadActor();
  const request = await getFinancingByRef(requestRef);
  if (!request) return <NotFound refStr={requestRef} />;
  const allowed = await actorCanSeeFinancing(request, actor);
  if (!allowed) return <NotFound refStr={requestRef} />;

  // History + notes now hang off the unified Order. Transition
  // entries land in OrderStatusTransition (financing decisions
  // included via the cascade); the follow-up log is OrderFollowupNote.
  const [transitions, notes, catalog] = await Promise.all([
    db.orderStatusTransition.findMany({
      where: { orderId: request.id },
      orderBy: { occurredAt: "desc" },
    }),
    listFollowupNotes(request.id),
    listPublicProducts(),
  ]);
  const productBySlug = new Map(catalog.map((p) => [p.slug, p]));
  const nextOptions = nextStatusesFrom(request.status);
  // Pre-sales is the validation layer for financing — they can
  // transition AND add follow-up notes. Admins inherit the same.
  const canTransition = Boolean(actor?.isAdmin || actor?.isPresales);

  return (
    <div>
      <Link
        href="/admin/financing"
        className="text-[12px] text-ink-mute hover:text-ink mb-3 inline-block"
      >
        ← All financing requests
      </Link>

      <PageHeader
        eyebrow="Operations"
        title={request.ref}
        description={`${request.contact.fullName} · ${request.contact.email} · ${AGE_BRACKET_LABEL[request.ageBracket]}`}
        actions={
          <StatusPill
            label={FINANCING_STATUS_LABEL[request.status]}
            tone={FINANCING_STATUS_TONE[request.status]}
          />
        }
      />

      {canTransition && nextOptions.length > 0 && (
        <div className="rounded-xl border border-hairline bg-paper px-5 py-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
                Next status
              </p>
              <p className="mt-1 text-[12.5px] text-ink-soft">
                Decisions are validated against the state machine + logged in
                FinancingStatusTransition.
              </p>
            </div>
            <FinancingTransitionControl
              requestRef={request.ref}
              options={nextOptions.map((s) => ({
                value: s,
                label: FINANCING_STATUS_LABEL[s],
                tone: FINANCING_STATUS_TONE[s],
              }))}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <section className="space-y-5">
          <SectionCard title={`Items (${request.totals.itemCount})`}>
            <ul className="divide-y divide-hairline">
              {request.items.map((it) => {
                const product = productBySlug.get(it.slug);
                return (
                  <li
                    key={it.slug}
                    className="px-5 py-3.5 flex items-center gap-4"
                  >
                    <div className="h-12 w-12 rounded-lg bg-canvas border border-hairline overflow-hidden relative shrink-0">
                      {product?.heroImage && (
                        <Image
                          src={product.heroImage}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-ink truncate">
                        {it.name}
                        {it.subline && (
                          <span className="ml-1.5 text-[12px] font-normal text-ink-mute">
                            {it.subline}
                          </span>
                        )}
                      </p>
                      <p className="text-[11.5px] text-ink-mute tabular-nums">
                        {formatPrice(it.unitPrice)} × {it.qty}
                      </p>
                    </div>
                    <p className="text-[13.5px] font-semibold tabular-nums text-ink shrink-0">
                      {formatPrice(it.lineTotal)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <SectionCard title="Financing terms">
            <div className="px-5 py-4 space-y-2.5">
              <Row
                label="Financing amount"
                value={formatPrice(request.financing.financingAmount)}
              />
              <Row
                label="Monthly"
                value={formatPrice(request.financing.monthly)}
              />
              <Row
                label="First installment"
                value={formatPrice(request.financing.firstMonthly)}
              />
              <Row label="File fee" value={formatPrice(request.financing.fileFee)} />
              <div className="mt-2 pt-2 border-t border-hairline flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                  Total cost
                </span>
                <span className="text-[20px] font-semibold tabular-nums tracking-[-0.018em] text-ink">
                  {formatPrice(request.financing.totalCost)}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Follow-up"
            description="Calls, emails, document chases — every touchpoint stays on the financing file."
          >
            <div className="px-5 py-4">
              {canTransition ? (
                <FollowupNoteForm requestRef={request.ref} />
              ) : (
                <p className="text-[12.5px] text-ink-mute italic">
                  Read-only access. Ask a pre-sales rep to add notes.
                </p>
              )}
            </div>
            {notes.length > 0 && (
              <ul className="divide-y divide-hairline border-t border-hairline">
                {notes.map((n) => (
                  <li key={n.id} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      {n.kind && (
                        <span className="text-[10.5px] uppercase tracking-[0.14em] text-ink-mute font-medium">
                          {n.kind}
                        </span>
                      )}
                      <p className="text-[11.5px] text-ink-mute tabular-nums ml-auto">
                        {new Date(n.createdAt).toLocaleString("en-CA")}
                      </p>
                    </div>
                    <p className="mt-1 text-[13px] text-ink-soft whitespace-pre-wrap leading-snug">
                      {n.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Status history">
            {transitions.length === 0 ? (
              <p className="p-5 text-[13px] text-ink-soft">
                No status changes yet.
              </p>
            ) : (
              <ul className="divide-y divide-hairline">
                {transitions.map((t) => (
                  <li key={t.id} className="px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] text-ink">
                        <span className="text-ink-mute">{t.fromStatus}</span>
                        {" → "}
                        <span className="font-medium">{t.toStatus}</span>
                      </p>
                      <p className="text-[11.5px] text-ink-mute tabular-nums">
                        {new Date(t.occurredAt).toLocaleString("en-CA")}
                      </p>
                    </div>
                    {t.reason && (
                      <p className="mt-0.5 text-[12px] text-ink-soft">
                        {t.reason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </section>

        <aside className="space-y-5">
          <SectionCard title="Customer">
            <div className="px-5 py-4 text-[13px]">
              <p className="text-ink">{request.contact.fullName}</p>
              <p className="text-ink-mute mt-0.5">{request.contact.email}</p>
              <p className="text-ink-mute">{request.contact.phone}</p>
              {request.company.name && (
                <p className="text-ink-mute mt-2">{request.company.name}</p>
              )}
              {request.company.ice && (
                <p className="text-ink-mute">ICE {request.company.ice}</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Delivery">
            <div className="px-5 py-4 text-[13px] text-ink">
              {request.shipping.street}
              <br />
              {request.shipping.postalCode} {request.shipping.city}
              <br />
              {request.shipping.country}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function NotFound({ refStr }: { refStr: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-paper p-10 text-center">
      <h2 className="text-[18px] font-semibold tracking-[-0.012em] text-ink">
        Request not found
      </h2>
      <p className="mt-2 text-[13px] text-ink-soft">
        No financing request matches{" "}
        <code className="tabular-nums">{refStr}</code> in your scope.
      </p>
      <Link
        href="/admin/financing"
        className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-soft transition-colors"
      >
        Back to financing
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
        {label}
      </span>
      <span className="text-ink tabular-nums">{value}</span>
    </div>
  );
}
