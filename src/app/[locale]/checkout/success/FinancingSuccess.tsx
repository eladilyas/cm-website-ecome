// Financing success — server component. Mirrors OrderSuccess.tsx.
// Reads from Postgres; ownership/policy gated in the parent page.

import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { fmtMAD } from "@/lib/wafasalaf";
import type { DisplayFinancingRequest } from "@/server/financing/service";
import {
  FINANCING_STATUS_LABEL,
  AGE_BRACKET_LABEL,
} from "@/server/financing/status";

export async function FinancingSuccess({
  request,
}: {
  request: DisplayFinancingRequest;
}) {
  const t = await getTranslations("checkoutSuccess");
  const locale = await getLocale();
  const dateLocale = locale === "fr" ? "fr-MA" : "en-GB";
  const submittedAt = new Date(request.createdAt).toLocaleString(dateLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const firstName = request.contact.fullName.split(" ")[0];
  const [titleLine1, titleLine2] = t("financingTitle", { firstName }).split("\n");

  return (
    <section className="min-h-[80vh] bg-canvas pt-12 md:pt-16 pb-16">
      <div className="mx-auto max-w-[720px] px-6 lg:px-10">
        <div className="text-center mb-10">
          <div
            aria-hidden
            className="mx-auto w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-5"
          >
            <ClockIcon />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700 mb-3">
            {FINANCING_STATUS_LABEL[request.status]}
          </p>
          <h1 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
            {titleLine1}
            <br />
            {titleLine2}
          </h1>
          <p className="mt-4 text-[14px] md:text-[15px] text-ink-soft max-w-[30rem] mx-auto leading-[1.5]">
            {t("financingBody", { email: request.contact.email })}
          </p>
        </div>

        <div className="rounded-2xl border border-hairline bg-paper p-5 md:p-6 mb-5">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-1">
                {t("financingRef")}
              </p>
              <p className="text-[22px] md:text-[26px] font-semibold tabular-nums tracking-[-0.018em] text-ink">
                {request.ref}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-1">
                {t("financingSubmitted")}
              </p>
              <p className="text-[12.5px] text-ink-soft tabular-nums">
                {submittedAt}
              </p>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-hairline space-y-3 text-[13px]">
            <Row
              label={t("financingMonthlyLabel", { months: request.financing.months })}
              value={fmtMAD(request.financing.monthly)}
            />
            <Row
              label={t("financingFirstInstallment")}
              value={fmtMAD(request.financing.firstMonthly)}
            />
            <Row
              label={t("financingTotalCost")}
              value={fmtMAD(request.financing.totalCost)}
            />
            <Row
              label={t("financingOrderTotal")}
              value={fmtMAD(request.totals.total)}
            />
            <Row
              label={t("financingAgeBracket")}
              value={AGE_BRACKET_LABEL[request.ageBracket]}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href={`/account/financing/${request.ref}`}
            className="h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
          >
            {t("financingTrack")}
          </Link>
          <Link
            href="/shop"
            className="h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full border border-hairline-strong text-ink-soft hover:text-ink hover:bg-paper transition-colors"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
        {label}
      </span>
      <span className="text-ink tabular-nums">{value}</span>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
