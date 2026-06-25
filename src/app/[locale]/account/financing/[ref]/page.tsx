// Financing detail — server component reading from Postgres.

import Link from "next/link";
import Image from "next/image";

import { getServerSession, requireRole } from "@/server/auth-helpers";
import { loadActor } from "@/server/policy";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import {
  actorCanSeeFinancing,
  financingBelongsTo,
  getFinancingByRef,
} from "@/server/financing/service";
import {
  FINANCING_STATUS_LABEL,
  AGE_BRACKET_LABEL,
} from "@/server/financing/status";
import {
  FIN_STATUS_TONE,
  FIN_STATUS_LABEL,
  StatusBadge,
} from "@/components/account/StatusBadge";
import { listPublicProducts } from "@/server/catalog/service";
import { formatPrice } from "@/lib/formatPrice";

export const dynamic = "force-dynamic";

export default async function FinancingDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  await requireRole(
    "/account/financing",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
    ROLE_SLUGS.dispatcher,
    ROLE_SLUGS.customer,
  );
  const { ref } = await params;

  const request = await getFinancingByRef(ref);
  if (!request) return <NotFound />;
  const session = await getServerSession();
  const actor = await loadActor();
  const isOwner =
    Boolean(session?.user) && financingBelongsTo(request, session!.user.id);
  const allowed = isOwner || (await actorCanSeeFinancing(request, actor));
  if (!allowed) return <NotFound />;

  const catalog = await listPublicProducts();
  const productBySlug = new Map(catalog.map((p) => [p.slug, p]));

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <Link
          href="/account/financing"
          className="text-[12px] text-ink-mute hover:text-ink"
        >
          ← All financing requests
        </Link>
      </div>

      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-mute font-medium">
            Financing
          </p>
          <h1 className="mt-0.5 text-[clamp(1.5rem,3vw,1.875rem)] font-semibold tracking-[-0.018em] text-ink tabular-nums">
            {request.ref}
          </h1>
        </div>
        <StatusBadge
          tone={FIN_STATUS_TONE[request.status]}
          label={FIN_STATUS_LABEL[request.status]}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <section className="space-y-5">
          <div className="rounded-2xl border border-hairline bg-paper">
            <header className="px-5 pt-4 pb-3 border-b border-hairline">
              <h2 className="text-[14.5px] font-semibold tracking-[-0.005em] text-ink">
                Items ({request.totals.itemCount})
              </h2>
            </header>
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
          </div>

          <div className="rounded-2xl border border-hairline bg-paper">
            <header className="px-5 pt-4 pb-3 border-b border-hairline">
              <h2 className="text-[14.5px] font-semibold tracking-[-0.005em] text-ink">
                Financing terms
              </h2>
              <p className="text-[11.5px] text-ink-soft mt-0.5">
                {request.financing.months}-month Wafasalaf Classique ·{" "}
                {AGE_BRACKET_LABEL[request.ageBracket]}
              </p>
            </header>
            <div className="px-5 py-4 space-y-2.5">
              <Row
                label="Financing amount (TTC)"
                value={formatPrice(request.financing.financingAmount)}
              />
              <Row
                label="Monthly installment"
                value={formatPrice(request.financing.monthly)}
              />
              <Row
                label="First installment"
                value={formatPrice(request.financing.firstMonthly)}
              />
              <Row
                label="File fee"
                value={formatPrice(request.financing.fileFee)}
              />
              <div className="mt-2 pt-2 border-t border-hairline flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                  Total cost
                </span>
                <span className="text-[20px] font-semibold tabular-nums tracking-[-0.018em] text-ink">
                  {formatPrice(request.financing.totalCost)}
                </span>
              </div>
              {request.financing.offeredMonthly != null && (
                <p className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-[12.5px] text-emerald-800">
                  Wafasalaf approved offer: {" "}
                  <strong>{formatPrice(request.financing.offeredMonthly)}/mo</strong>
                  {request.financing.offeredMonths && (
                    <> over {request.financing.offeredMonths} months</>
                  )}
                </p>
              )}
              {request.decisionReason && (
                <p className="mt-2 text-[12.5px] text-ink-soft">
                  <span className="uppercase tracking-[0.14em] text-ink-mute">
                    Decision note ·{" "}
                  </span>
                  {request.decisionReason}
                </p>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <Card title="Status">
            <p className="text-[13px] text-ink">
              {FINANCING_STATUS_LABEL[request.status]}
            </p>
            <p className="text-[11.5px] text-ink-mute mt-0.5 tabular-nums">
              Submitted {new Date(request.createdAt).toLocaleDateString("en-GB")}
            </p>
          </Card>

          <Card title="Delivery">
            <p className="text-[13px] text-ink">
              {request.shipping.street}
              <br />
              {request.shipping.postalCode} {request.shipping.city}
              <br />
              {request.shipping.country}
            </p>
          </Card>

          <Card title="Contact">
            <p className="text-[13px] text-ink">{request.contact.fullName}</p>
            <p className="text-[12px] text-ink-mute mt-0.5">{request.contact.email}</p>
            <p className="text-[12px] text-ink-mute">{request.contact.phone}</p>
            {request.company.name && (
              <p className="text-[12px] text-ink-mute mt-2">{request.company.name}</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="rounded-2xl bg-paper border border-hairline p-10 text-center">
      <h2 className="text-[18px] font-semibold tracking-[-0.012em] text-ink">
        Request not found
      </h2>
      <p className="mt-2 text-[13px] text-ink-soft">
        We couldn&rsquo;t find that financing request.
      </p>
      <Link
        href="/account/financing"
        className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-soft transition-colors"
      >
        Back to my financing
      </Link>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-paper">
      <header className="px-5 pt-4 pb-3 border-b border-hairline">
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-ink-mute font-medium">
          {title}
        </h3>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
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
