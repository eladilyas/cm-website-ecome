// PriceBlock — the catalogue's signature pricing lockup.
//
// Every one of the catalogue's 13 pages opens with this exact figure, and
// it is the most recognisable thing in the document:
//
//     200 DH │ Par mois              250 DH │ Par mois
//            │ paiement annuel (−20%)       │ paiement mensuel
//
//   • the amount set large and bold, tabular so digits align
//   • a HAIRLINE VERTICAL RULE, not a dash or a slash
//   • a two-line label: term on top, condition beneath
//   • the discount in brand red, in parentheses — the only colour here
//
// Two tiers sit side by side so the annual saving is legible as a
// comparison rather than a claim. Secondary fees (installation) sit
// underneath in grey, because in the catalogue they are deliberately
// quieter than the subscription figure.
//
// Why a component and not markup: the site previously expressed pricing
// four different ways across /pricing, the home preview, the plan cards
// and the shop. One lockup, used everywhere, is the point of the sprint.

import { Reveal } from "@/components/ui/Reveal";

export type PriceTier = {
  /** The figure, already formatted — "200 DH", "2 400 MAD". */
  amount: string;
  /** Term, e.g. "Par mois". Sits on the first label line. */
  term: string;
  /** Condition, e.g. "paiement annuel". Second label line. */
  condition: string;
  /** Optional saving, e.g. "−20%". Rendered in brand red, parenthesised.
   *  Pass WITHOUT parentheses; the component adds them. */
  saving?: string;
};

export function PriceBlock({
  tiers,
  notes = [],
  align = "start",
  className = "",
}: {
  /** One or two tiers. Two is the catalogue's default (annual vs monthly). */
  tiers: PriceTier[];
  /** Secondary lines beneath — installation fees and the like. Grey. */
  notes?: string[];
  align?: "start" | "center";
  className?: string;
}) {
  const alignCls = align === "center" ? "items-center text-center" : "items-start";

  return (
    <div className={`flex flex-col ${alignCls} ${className}`}>
      <Reveal>
        {/* flex-wrap so two tiers stack on a phone rather than shrinking the
            figure — the amount is the thing that must stay legible. */}
        <div
          className={`flex flex-wrap gap-x-10 gap-y-5 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          {tiers.map((tier) => (
            <div key={`${tier.amount}-${tier.condition}`} className="flex items-stretch gap-3.5">
              <p className="text-[clamp(1.75rem,3.4vw,2.25rem)] font-bold tracking-[-0.02em] leading-none self-center tabular-nums text-ink whitespace-nowrap">
                {tier.amount}
              </p>
              {/* The hairline rule. This is the catalogue's separator — a
                  1px vertical line, full label height, not a dash. */}
              <span
                aria-hidden
                className="w-px shrink-0 bg-hairline-strong"
              />
              <p className="text-[15px] font-semibold leading-[1.3] text-ink self-center">
                {tier.term}
                <span className="block text-[13.5px] font-normal text-ink-soft">
                  {tier.condition}
                  {tier.saving && (
                    <>
                      {" "}
                      <span className="font-semibold text-brand whitespace-nowrap">
                        ({tier.saving})
                      </span>
                    </>
                  )}
                </span>
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      {notes.length > 0 && (
        <Reveal delay={0.06}>
          <div
            className={`mt-4 space-y-0.5 ${
              align === "center" ? "text-center" : ""
            }`}
          >
            {notes.map((n) => (
              <p key={n} className="text-[14px] leading-[1.45] text-ink-mute">
                {n}
              </p>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
