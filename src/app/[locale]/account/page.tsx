// Account overview — server component. Orders + financing both read
// from Postgres now; the financing strip is itself an async server
// component composed inline. Locale-aware strings via getTranslations
// (server-side API) so the page renders in the active visitor's
// language without a client hydration step.

import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getServerSession, requireRole } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import { listMyOrders } from "@/server/orders/service";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  StatusBadge,
} from "@/components/account/StatusBadge";
import { formatPrice } from "@/lib/formatPrice";
import { AccountFinancingStrip } from "./AccountFinancingStrip";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const t = await getTranslations("account");
  const locale = await getLocale();
  // BCP-47 region tag drives the date formatter so months render in
  // the right language: fr → "12 juin 2026", en → "12 Jun 2026".
  const dateLocale = locale === "fr" ? "fr-MA" : "en-GB";
  await requireRole(
    "/account",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
    ROLE_SLUGS.dispatcher,
    ROLE_SLUGS.customer,
  );
  const session = await getServerSession();
  const orders = session?.user ? await listMyOrders(session.user.id) : [];

  const inTransit = orders.filter(
    (o) => o.status === "PROCESSING" || o.status === "SHIPPED",
  ).length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const lifetimeSpend = orders.reduce((s, o) => s + o.totals.total, 0);

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyOrdersCard
          title={t("emptyOverview.title")}
          body={t("emptyOverview.body")}
          cta={t("emptyOverview.cta")}
        />
        <AccountFinancingStrip />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatTile
          label={t("stats.totalOrders")}
          value={orders.length.toString()}
          hint={t("stats.totalOrdersHint", { count: delivered })}
        />
        <StatTile
          label={t("stats.inTransit")}
          value={inTransit.toString()}
          hint={
            inTransit > 0
              ? t("stats.inTransitYes")
              : t("stats.inTransitNo")
          }
          tone={inTransit > 0 ? "amber" : "neutral"}
        />
        <StatTile
          label={t("stats.awaitingPayment")}
          value={orders
            .filter((o) => o.status === "AWAITING_PAYMENT")
            .length.toString()}
          hint={t("stats.awaitingPaymentHint")}
          tone="amber"
        />
        <StatTile
          label={t("stats.lifetime")}
          value={formatPrice(lifetimeSpend)}
          hint={t("stats.lifetimeHint")}
        />
      </section>

      {/* Recent orders */}
      <section className="rounded-2xl bg-paper border border-hairline overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
              {t("recent.eyebrow")}
            </p>
            <h2 className="mt-0.5 text-[16px] font-semibold tracking-[-0.005em] text-ink">
              {t("recent.title")}
            </h2>
          </div>
          <Link
            href="/account/orders"
            className="text-[12px] font-medium text-ink-soft hover:text-ink"
          >
            {t("recent.viewAll")}
          </Link>
        </header>
        <ul>
          {orders.slice(0, 5).map((o, i) => (
            <li
              key={o.id}
              className={
                "px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-canvas transition-colors " +
                (i > 0 ? "border-t border-hairline" : "")
              }
            >
              <Link
                href={`/account/orders/${o.ref}`}
                className="flex-1 min-w-0 flex items-center gap-4"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium tabular-nums text-ink">
                    {o.ref}
                  </p>
                  <p className="text-[11.5px] text-ink-mute mt-0.5">
                    {t("recent.itemsCount", { count: o.totals.itemCount })} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[13.5px] font-medium tabular-nums text-ink">
                    {formatPrice(o.totals.total)}
                  </p>
                  <div className="mt-1 inline-flex">
                    <StatusBadge
                      tone={ORDER_STATUS_TONE[o.status]}
                      label={ORDER_STATUS_LABEL[o.status]}
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Financing — client child (localStorage-backed until migration) */}
      <AccountFinancingStrip />
    </div>
  );
}

function EmptyOrdersCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl bg-paper border border-hairline p-10 md:p-14 text-center">
      <h2 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.012em] text-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-md mx-auto text-[14px] text-ink-soft">{body}</p>
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 mt-6 h-11 px-5 rounded-full bg-ink text-paper text-[13.5px] font-medium hover:bg-ink-soft transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "amber" | "indigo";
}) {
  const accent =
    tone === "amber"
      ? "text-amber-700"
      : tone === "indigo"
        ? "text-indigo-700"
        : "text-ink";
  return (
    <div className="rounded-xl border border-hairline bg-paper px-4 py-3.5">
      <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
        {label}
      </p>
      <p
        className={`mt-1 text-[22px] font-semibold tracking-[-0.014em] tabular-nums ${accent}`}
      >
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-ink-mute mt-0.5 leading-tight">
          {hint}
        </p>
      )}
    </div>
  );
}
