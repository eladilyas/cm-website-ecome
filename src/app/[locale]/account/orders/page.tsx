// Orders list — server component, reads from Postgres.
//
// The AccountShell (client) wraps this via the route layout's
// `children` slot, so this server tree gets to run a full DB query
// per request and stream the result. Auth is enforced two ways:
//   • middleware blocks unauthenticated cookie-less visitors
//   • requireRole here demands a session

import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { getServerSession, requireRole } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import { listMyOrders } from "@/server/orders/service";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  StatusBadge,
} from "@/components/account/StatusBadge";
import { listPublicProducts } from "@/server/catalog/service";
import { formatPrice } from "@/lib/formatPrice";

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  await requireRole(
    "/account/orders",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
    ROLE_SLUGS.dispatcher,
    ROLE_SLUGS.customer,
  );

  const t = await getTranslations("account.ordersPage");
  const locale = await getLocale();
  const dateLocale = locale === "fr" ? "fr-MA" : "en-GB";

  const session = await getServerSession();
  const orders = session?.user
    ? await listMyOrders(session.user.id)
    : [];

  // Catalog thumbnails — only fetched when there are orders to show.
  const catalog =
    orders.length > 0 ? await listPublicProducts() : [];
  const productBySlug = new Map(catalog.map((p) => [p.slug, p]));

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-paper border border-hairline p-10 md:p-12 text-center">
        <h2 className="text-[20px] font-semibold tracking-[-0.012em] text-ink">
          {t("emptyTitle")}
        </h2>
        <p className="mt-2 text-[14px] text-ink-soft">{t("emptyBody")}</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-soft transition-colors"
        >
          {t("browseStore")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between pb-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            {t("eyebrow")}
          </p>
          <h2 className="mt-0.5 text-[20px] md:text-[22px] font-semibold tracking-[-0.012em] text-ink">
            {t("countTitle", { count: orders.length })}
          </h2>
        </div>
      </header>

      <ul className="space-y-3">
        {orders.map((order) => {
          const thumbs = order.items
            .slice(0, 4)
            .map((it) => productBySlug.get(it.slug))
            .filter((p): p is NonNullable<typeof p> => Boolean(p));

          return (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.ref}`}
                className="block rounded-2xl bg-paper border border-hairline hover:border-hairline-strong transition-colors overflow-hidden"
                style={{
                  transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
                <div className="px-5 py-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2.5">
                      <p className="text-[14px] font-semibold tabular-nums text-ink">
                        {order.ref}
                      </p>
                      <StatusBadge
                        tone={ORDER_STATUS_TONE[order.status]}
                        label={ORDER_STATUS_LABEL[order.status]}
                      />
                    </div>
                    <p className="mt-1 text-[12px] text-ink-soft tabular-nums">
                      {new Date(order.createdAt).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {t("itemsCount", { count: order.totals.itemCount })}
                    </p>
                  </div>

                  {/* Thumbnail strip — up to 4 product hero images */}
                  <div className="flex -space-x-2">
                    {thumbs.map((p) => (
                      <div
                        key={p.slug}
                        className="h-9 w-9 rounded-lg border border-hairline bg-canvas overflow-hidden relative"
                      >
                        <Image
                          src={p.heroImage}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-contain p-1"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-semibold tabular-nums text-ink">
                      {formatPrice(order.totals.total)}
                    </p>
                    <p className="text-[11px] text-ink-mute uppercase tracking-wide">
                      {t("ttc")}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
