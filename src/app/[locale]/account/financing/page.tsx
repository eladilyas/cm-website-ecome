// Financing list — every Wafasalaf request belonging to the current
// account. Server component reading from Postgres via the financing
// service. Mirrors the Orders list shape so the UX feels consistent
// when the buyer toggles between the two sidebar sections.

import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getServerSession, requireRole } from "@/server/auth-helpers";
import { ROLE_SLUGS } from "@/server/rbac/catalog";
import { listMyFinancing } from "@/server/financing/service";
import { formatPrice } from "@/lib/formatPrice";
import {
  FIN_STATUS_LABEL,
  FIN_STATUS_TONE,
  StatusBadge,
} from "@/components/account/StatusBadge";

export const dynamic = "force-dynamic";

export default async function FinancingListPage() {
  await requireRole(
    "/account/financing",
    ROLE_SLUGS.superAdmin,
    ROLE_SLUGS.admin,
    ROLE_SLUGS.presales,
    ROLE_SLUGS.dispatcher,
    ROLE_SLUGS.customer,
  );

  const t = await getTranslations("account.financingPage");
  const tTrust = await getTranslations("account.financingPage.trust");
  const locale = await getLocale();
  const dateLocale = locale === "fr" ? "fr-MA" : "en-GB";

  const session = await getServerSession();
  const requests = session?.user
    ? await listMyFinancing(session.user.id)
    : [];

  if (requests.length === 0) {
    const trustRows = [
      { kpi: tTrust("kpi1"), label: tTrust("label1") },
      { kpi: tTrust("kpi2"), label: tTrust("label2") },
      { kpi: tTrust("kpi3"), label: tTrust("label3") },
    ];
    return (
      <div
        className="relative overflow-hidden rounded-2xl bg-paper border border-hairline px-6 md:px-12 py-10 md:py-14"
        style={{
          backgroundImage:
            "radial-gradient(110% 70% at 100% 0%, rgba(16,185,129,0.06), transparent 60%)",
        }}
      >
        <div className="relative max-w-[520px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 h-10 px-3 rounded-full bg-paper border border-emerald-100 shadow-[0_0_0_3px_rgba(16,185,129,0.06)]">
            <Image
              src="/logos/wafasalaf.svg"
              alt="Wafasalaf"
              width={80}
              height={18}
              className="opacity-90"
              style={{ height: 14, width: "auto" }}
              unoptimized
            />
            <span className="text-[10.5px] uppercase tracking-[0.16em] text-emerald-700 font-semibold">
              {t("partnerEyebrow")}
            </span>
          </div>

          <h2 className="mt-6 text-[clamp(1.5rem,2.8vw,2rem)] font-semibold tracking-[-0.018em] leading-[1.15] text-ink">
            {t("emptyHeading")}
          </h2>
          <p className="mt-3 text-[14.5px] md:text-[15px] text-ink-soft leading-[1.55] max-w-[420px] mx-auto">
            {t("emptyBody")}
          </p>

          <ul className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
            {trustRows.map((row) => (
              <li
                key={row.label}
                className="rounded-xl border border-hairline bg-canvas/50 px-3.5 py-3"
              >
                <p className="text-[18px] font-semibold tabular-nums tracking-[-0.012em] text-ink leading-none">
                  {row.kpi}
                </p>
                <p className="mt-1.5 text-[11.5px] text-ink-mute uppercase tracking-[0.1em]">
                  {row.label}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-paper text-[13.5px] font-medium hover:bg-ink-soft transition-colors duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
            >
              {t("pickHardware")}
            </Link>
            <Link
              href="/pricing#financing"
              className="inline-flex items-center gap-1.5 h-11 px-4 text-[13px] text-ink-soft hover:text-ink transition-colors"
            >
              {t("howItWorks")}
            </Link>
          </div>

          <p className="mt-5 text-[11px] text-ink-mute italic">
            {t("creditNote")}
          </p>
        </div>
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
            {t("countTitle", { count: requests.length })}
          </h2>
        </div>
      </header>

      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id}>
            <Link
              href={`/account/financing/${r.ref}`}
              className="block rounded-2xl bg-paper border border-hairline hover:border-hairline-strong transition-colors px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2.5">
                    <p className="text-[14px] font-semibold tabular-nums text-ink">
                      {r.ref}
                    </p>
                    <StatusBadge
                      tone={FIN_STATUS_TONE[r.status]}
                      label={FIN_STATUS_LABEL[r.status]}
                    />
                  </div>
                  <p className="mt-1 text-[12px] text-ink-soft tabular-nums">
                    {new Date(r.createdAt).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {t("itemsCount", { count: r.totals.itemCount })} ·{" "}
                    {t("monthPlan", { months: r.financing.months })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                    {t("monthly")}
                  </p>
                  <p className="text-[15px] font-semibold tabular-nums text-ink">
                    {formatPrice(r.financing.monthly)}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
