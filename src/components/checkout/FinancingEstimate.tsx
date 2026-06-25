"use client";

// Wafasalaf financing estimate — main content of the financing step inside
// the QuoteBuilderModal. Reads the quote subtotal and lets the user choose
// a duration under Wafasalaf's "Crédit Gratuit" promotional offer (0%
// interest). The Classique (interest-bearing) variant is intentionally
// out of scope for now — we lead with Gratuit since it's the consumer-
// friendly offer.
//
// Brand trust integration:
//   • Partner strip at the top renders the official Wafasalaf SVG logo
//     (/public/logos/wafasalaf.svg) at a generous size — high-visibility
//     trust anchor.
//   • Hero monthly card carries a "Financed by [logo]" wordmark anchor
//     just under the big number — continuous reinforcement.
//
// All math runs through lib/wafasalaf.ts (no Excel dependency at runtime).

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  GRATUIT_DURATIONS,
  computeGratuit,
  fmtMAD,
  type AgeBracket,
} from "@/lib/wafasalaf";

type Props = {
  /** Quote total in MAD. The financing breakdown is computed off this. */
  amount: number;
};

const DEFAULT_AGE: AgeBracket = "under60";
const DEFAULT_MONTHS = 12;

export function FinancingEstimate({ amount }: Props) {
  const [age, setAge] = useState<AgeBracket>(DEFAULT_AGE);
  const [months, setMonths] = useState<number>(DEFAULT_MONTHS);

  // Nothing to estimate when the quote is empty.
  const hasAmount = amount > 0;

  const quote = useMemo(() => {
    if (!hasAmount) return null;
    try {
      return computeGratuit(amount, months, age);
    } catch {
      return null;
    }
  }, [amount, months, age, hasAmount]);

  return (
    <section aria-labelledby="financing-title">
      {/* Partner strip — high-visibility trust anchor. The official Wafasalaf
          logo sits in a generous chip at the top of the financing step.
          Labeled "Financing partner" + a one-liner that names the offer
          (Crédit Gratuit · 0% interest) so the user immediately understands
          both the relationship and the terms. */}
      <header className="rounded-2xl border border-hairline bg-paper p-5 mb-5 flex items-center gap-5">
        <div className="shrink-0 inline-flex items-center justify-center h-16 w-[120px] rounded-xl bg-canvas border border-hairline/60 px-3">
          <Image
            src="/logos/wafasalaf.svg"
            alt="Wafasalaf"
            width={353}
            height={298}
            unoptimized
            className="w-full h-auto max-h-12 object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-1">
            Financing partner
          </p>
          <h3
            id="financing-title"
            className="text-[15px] font-semibold tracking-[-0.005em] text-ink leading-tight"
          >
            Pay monthly. Backed by Wafasalaf.
          </h3>
        </div>
      </header>

      {!hasAmount ? (
        <p className="text-[13px] text-ink-mute leading-[1.5]">
          Add items to the quote to see monthly financing options.
        </p>
      ) : (
        <>
          {/* Offer badge — Crédit Gratuit is the only offer we expose today.
              A simple capsule replaces the previous toggle, communicating the
              offer name + the headline 0% claim without giving the user a
              decision to make. */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E11D2A]/8 border border-[#E11D2A]/20 px-3 h-7 mb-3">
            <span className="text-[11px] font-semibold tracking-[-0.005em] text-[#E11D2A]">
              Crédit Gratuit
            </span>
            <span aria-hidden className="h-3 w-px bg-[#E11D2A]/30" />
            <span className="text-[11px] font-medium text-[#E11D2A]">
              0% interest
            </span>
          </div>

          {/* Age bracket */}
          <div className="flex items-center gap-3 mb-3 text-[12px]">
            <span className="text-ink-mute">Age:</span>
            <AgeChip
              active={age === "under60"}
              onClick={() => setAge("under60")}
            >
              ≤ 60
            </AgeChip>
            <AgeChip
              active={age === "over60"}
              onClick={() => setAge("over60")}
            >
              &gt; 60
            </AgeChip>
            <span className="ml-auto text-[11px] text-ink-mute">
              Insurance{" "}
              {age === "under60" ? "0.094%" : "0.2%"} TTC / month
            </span>
          </div>

          {/* Duration picker */}
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-2">
              Term · {months} {months === 1 ? "month" : "months"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {GRATUIT_DURATIONS.map((d) => {
                const isActive = d === months;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setMonths(d)}
                    aria-pressed={isActive}
                    className={`h-7 px-2.5 text-[12px] font-medium rounded-full tabular-nums transition-colors duration-200 ${
                      isActive
                        ? "bg-ink text-paper"
                        : "border border-hairline bg-paper text-ink-soft hover:bg-canvas hover:text-ink"
                    }`}
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.32, 0.72, 0, 1)",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero monthly amount */}
          {quote && (
            <div className="rounded-2xl bg-canvas border border-hairline p-5">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-1">
                    From
                  </p>
                  <p className="text-[clamp(2rem,4vw,2.75rem)] font-semibold tracking-[-0.022em] leading-none tabular-nums text-ink">
                    {fmtMAD(quote.monthly)}{" "}
                    <span className="text-[14px] uppercase tracking-[0.12em] text-ink-mute">
                      MAD / mo
                    </span>
                  </p>
                  {/* Partnership anchor at the moment of decision — the
                      Wafasalaf logo is sized prominently (36px) so it
                      reads as a co-signature on the price rather than a
                      tiny footnote. */}
                  <div className="mt-4 inline-flex items-center gap-3">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                      Financed by
                    </span>
                    <Image
                      src="/logos/wafasalaf.svg"
                      alt="Wafasalaf"
                      width={353}
                      height={298}
                      unoptimized
                      className="h-9 md:h-10 w-auto object-contain"
                    />
                  </div>
                </div>
                <p className="text-[12px] text-ink-mute text-right">
                  Over {months} months
                </p>
              </div>

              {/* Breakdown */}
              <dl className="mt-5 grid grid-cols-2 gap-y-1.5 text-[12px]">
                <dt className="text-ink-mute">Principal</dt>
                <dd className="text-right tabular-nums text-ink-soft">
                  {fmtMAD(quote.baseMonthly)} MAD
                </dd>

                <dt className="text-ink-mute">Insurance / mo</dt>
                <dd className="text-right tabular-nums text-ink-soft">
                  {fmtMAD(quote.insurance)} MAD
                </dd>

                <dt className="text-ink-mute">First month</dt>
                <dd className="text-right tabular-nums text-ink">
                  {fmtMAD(quote.firstMonthly)} MAD
                  <span className="ml-1 text-ink-mute">
                    (incl. {fmtMAD(quote.fileFee)} file fee)
                  </span>
                </dd>

                <dt className="text-ink-mute">Total over {months} months</dt>
                <dd className="text-right tabular-nums text-ink font-medium">
                  {fmtMAD(quote.totalCost)} MAD
                </dd>

                <dt className="text-ink-mute">
                  Surcharge (insurance + file fee only)
                </dt>
                <dd className="text-right tabular-nums text-ink-soft">
                  + {fmtMAD(quote.totalInterestPlusFees)} MAD
                </dd>
              </dl>
            </div>
          )}

          <p className="mt-3 text-[11px] leading-[1.5] text-ink-mute">
            Estimate based on Wafasalaf&rsquo;s public tariff (rev. 31/12/2019). Final terms subject to credit approval. Insurance covers death and total/partial disability. File fee taken with the first installment.
          </p>
        </>
      )}
    </section>
  );
}

// (OfferTab helper removed when Classique was dropped — restore from
//  git history if multiple offers are reintroduced.)

function AgeChip({
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
      className={`h-7 px-3 text-[12px] font-medium rounded-full tabular-nums transition-colors duration-200 ${
        active
          ? "bg-ink text-paper"
          : "border border-hairline bg-paper text-ink-soft hover:bg-canvas hover:text-ink"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      {children}
    </button>
  );
}

// (The old text-mark placeholder lived here. Now replaced by the official
//  SVG logo from /public/logos/wafasalaf.svg, rendered via next/image at
//  the top of the section and again as a subtle anchor on the hero card.)
