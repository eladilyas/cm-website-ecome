"use client";

// Wafasalaf financing panel — Phase C3.
//
// Replaces the "Order summary" right pane on /checkout when the
// shopper picks Wafasalaf financing. Designed as a stand-alone
// breakdown card: brand strip + hero monthly + breakdown table +
// eligibility notice. 24-month Classique only (per brief), under-60
// only (eligibility-bound).
//
// All math via lib/wafasalaf.ts. No state of its own — pure render
// based on the `amount` prop (the cart's TTC total) so the parent
// /checkout page owns the form state and submission flow.

import Image from "next/image";
import { useMemo } from "react";
import {
  computeClassique,
  fmtMAD,
  type AgeBracket,
} from "@/lib/wafasalaf";

const MONTHS = 24 as const;

export function CheckoutFinancingPanel({
  amount,
  ageBracket,
  onAgeChange,
}: {
  amount: number;
  ageBracket: AgeBracket;
  onAgeChange: (next: AgeBracket) => void;
}) {
  const quote = useMemo(() => {
    if (amount <= 0) return null;
    try {
      return computeClassique(amount, MONTHS, ageBracket);
    } catch {
      return null;
    }
  }, [amount, ageBracket]);

  return (
    <section
      aria-labelledby="financing-title"
      className="rounded-2xl border border-hairline bg-paper overflow-hidden"
    >
      {/* Partner strip — trust anchor */}
      <header className="px-5 md:px-6 pt-5 pb-4 border-b border-hairline flex items-center gap-4">
        <div className="shrink-0 inline-flex items-center justify-center h-12 w-[88px] rounded-lg bg-canvas border border-hairline px-3">
          <Image
            src="/logos/wafasalaf.svg"
            alt="Wafasalaf"
            width={353}
            height={298}
            unoptimized
            className="w-full h-auto max-h-9 object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1">
            Financing partner
          </p>
          <h3
            id="financing-title"
            className="text-[14px] font-semibold tracking-[-0.005em] text-ink leading-tight"
          >
            Pay monthly. Backed by Wafasalaf.
          </h3>
        </div>
      </header>

      {!quote ? (
        <div className="px-5 md:px-6 py-6 text-[13px] text-ink-mute">
          Add items to the cart to see monthly financing options.
        </div>
      ) : (
        <>
          {/* Age bracket — drives insurance rate. Two options because
              Wafasalaf publishes a separate insurance tariff for over-60
              applicants; surfacing both lets the buyer see their real
              monthly rather than the optimistic under-60 default. */}
          <div className="px-5 md:px-6 py-4 border-b border-hairline">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                Applicant age
              </p>
              <p className="text-[11px] text-ink-mute tabular-nums">
                Insurance {ageBracket === "under60" ? "0.094%" : "0.2%"} TTC / mo
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AgePill
                active={ageBracket === "under60"}
                onClick={() => onAgeChange("under60")}
              >
                ≤ 60 years
              </AgePill>
              <AgePill
                active={ageBracket === "over60"}
                onClick={() => onAgeChange("over60")}
              >
                &gt; 60 years
              </AgePill>
            </div>
          </div>

          {/* Hero monthly */}
          <div className="px-5 md:px-6 py-5 bg-canvas/50">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1">
                  From
                </p>
                <p className="text-[clamp(2rem,4vw,2.5rem)] font-semibold tracking-[-0.022em] leading-none tabular-nums text-ink">
                  {fmtMAD(quote.monthly)}{" "}
                  <span className="text-[13px] uppercase tracking-[0.12em] text-ink-mute">
                    MAD / mo
                  </span>
                </p>
              </div>
              <p className="text-[11px] text-ink-mute text-right">
                Over {MONTHS} months
                <br />
                <span className="text-ink-soft">Classique credit</span>
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="px-5 md:px-6 py-5 border-t border-hairline">
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-3">
              Breakdown
            </p>
            <dl className="grid grid-cols-2 gap-y-2 text-[12.5px]">
              <dt className="text-ink-mute">Amount financed</dt>
              <dd className="text-right tabular-nums text-ink">
                {fmtMAD(amount)} MAD
              </dd>

              <dt className="text-ink-mute">Principal / month</dt>
              <dd className="text-right tabular-nums text-ink-soft">
                {fmtMAD(quote.baseMonthly)} MAD
              </dd>

              <dt className="text-ink-mute">Insurance / month</dt>
              <dd className="text-right tabular-nums text-ink-soft">
                {fmtMAD(quote.insurance)} MAD
              </dd>

              <dt className="text-ink-mute">First installment</dt>
              <dd className="text-right tabular-nums text-ink">
                {fmtMAD(quote.firstMonthly)} MAD
                <span className="block text-[10px] text-ink-mute">
                  incl. {fmtMAD(quote.fileFee)} MAD file fee
                </span>
              </dd>
            </dl>

            <div className="mt-4 pt-3 border-t border-hairline flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                Total over {MONTHS} months
              </span>
              <span className="text-[16px] font-semibold tabular-nums tracking-[-0.005em] text-ink">
                {fmtMAD(quote.totalCost)} MAD
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-mute text-right">
              + {fmtMAD(quote.totalInterestPlusFees)} MAD over cash price
            </p>
          </div>

          {/* Eligibility notice — no hard age limit; Wafasalaf accepts
              over-60 applicants with a different insurance rate, which
              the age toggle above reflects in the monthly. */}
          <div className="px-5 md:px-6 py-4 bg-amber-50/60 border-t border-amber-100">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700"
              >
                <InfoIcon />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold tracking-[-0.005em] text-amber-900 leading-tight">
                  Conditions — please review
                </p>
                <ul className="mt-1.5 space-y-0.5 text-[12px] text-amber-900/85 leading-[1.5]">
                  <li>
                    <span className="text-amber-700">·</span> Subject to credit
                    approval by Wafasalaf.
                  </li>
                  <li>
                    <span className="text-amber-700">·</span> Insurance rate
                    adjusts to applicant age (toggle above).
                  </li>
                  <li>
                    <span className="text-amber-700">·</span> Decision within
                    24 hours of submission.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p className="px-5 md:px-6 py-3 text-[10.5px] leading-[1.5] text-ink-mute border-t border-hairline">
            Estimate based on Wafasalaf&rsquo;s public tariff (rev. 31/12/2019).
            Insurance covers death + total/partial disability. File fee withheld
            with the first installment.
          </p>
        </>
      )}
    </section>
  );
}

function AgePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "h-9 text-[12.5px] font-medium rounded-lg border transition-colors " +
        (active
          ? "border-ink bg-ink text-paper"
          : "border-hairline bg-paper text-ink-soft hover:text-ink hover:bg-canvas")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      {children}
    </button>
  );
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7 6v3.5M7 4.25v.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
