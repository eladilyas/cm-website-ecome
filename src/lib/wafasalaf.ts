// Wafasalaf financing calculator — pure TypeScript port of the
// "Calculette crédit classique ET Credit gratuit" Excel reference (rev.
// 31/12/2019).
//
// The Excel file is NOT a runtime dependency. We extracted the per-duration
// factors and the formulas, encoded them here, and verified each formula
// against sample rows from the spreadsheet:
//
//   Classique  · 15,496 MAD · 6 months  →  2,672.32 MAD/mo  (sheet match ✓)
//   Classique  · 15,496 MAD · 12 months →  1,376.19 MAD/mo  (sheet match ✓)
//   Gratuit    · 33,181 MAD · 4 months  →  8,326.44 MAD/mo  (sheet match ✓)
//
// Update the factor table or fee constants below if Wafasalaf publishes a
// new tarif sheet. Nothing else changes.

// ─── Constants ────────────────────────────────────────────────────────

/** Insurance rate (per-month, applied to outstanding purchase amount). */
export const INSURANCE_RATE = {
  /** Age ≤ 60: 0.094% TTC */
  under60: 0.00094,
  /** Age > 60: 0.2% TTC */
  over60: 0.002,
} as const;

/** One-time file fee, withheld with the first installment. */
export const FILE_FEE_MAD = {
  classique: 165,
  gratuit: 220,
} as const;

export type AgeBracket = "under60" | "over60";

// ─── Classique (with interest) ────────────────────────────────────────
// `factor[n]` is the per-MAD monthly amortization factor for an n-month
// term. Derived from a TAEG of ~9% with file-fee proration baked in.
// Values copied verbatim from the spreadsheet's column C; do NOT round.

export const CLASSIQUE_FACTORS: Record<number, number> = {
  6:  0.17151211549911907,
  7:  0.14761015969374908,
  8:  0.12968510452272286,
  9:  0.1157446496475472,
  10: 0.10459341484989752,
  11: 0.09547070361336489,
  12: 0.08786938491433043,
  13: 0.08143836803243658,
  14: 0.07592687387085695,
  15: 0.07115099774845868,
  16: 0.0669728111449044,
  17: 0.06328683930042461,
  18: 0.06001104628233279,
  19: 0.05708066687264152,
  20: 0.05444388888939419,
  21: 0.05205876913047357,
  22: 0.04989099042364478,
  23: 0.04791220379397874,
  24: 0.04609878508941994,
  25: 0.04443089001621836,
  26: 0.042891727243108,
  27: 0.04146699303789057,
  28: 0.04014442705332291,
  29: 0.03891346001937272,
  30: 0.0377649318970234,
  31: 0.03669086458295562,
  32: 0.035684277232101325,
  33: 0.0347390351579154,
  34: 0.03384972539730542,
  35: 0.03301155360728806,
  36: 0.03222025814553616,
  37: 0.03147203808381032,
  38: 0.030763492587690927,
  39: 0.03009156962250545,
  40: 0.029453522353366762,
  42: 0.028269375562801402,
  44: 0.02719389335193135,
  48: 0.025314586023076888,
};

export const CLASSIQUE_DURATIONS: number[] = Object.keys(CLASSIQUE_FACTORS)
  .map(Number)
  .sort((a, b) => a - b);

// ─── Gratuit (0% interest, promo) ─────────────────────────────────────
// Wafasalaf only offers these specific durations for credit gratuit.
// Monthly principal = amount / duration. Insurance + file fee added on
// top via the same rules as Classique.

export const GRATUIT_DURATIONS: number[] = [4, 6, 9, 10, 12, 15, 18, 24];

// ─── Calculation ──────────────────────────────────────────────────────

export type FinancingOffer = "classique" | "gratuit";

export type FinancingQuote = {
  offer: FinancingOffer;
  amount: number;
  months: number;
  ageBracket: AgeBracket;
  /** Base monthly (principal + interest for classique; pure principal for gratuit). */
  baseMonthly: number;
  /** Per-month insurance contribution (applied to gross amount). */
  insurance: number;
  /** Monthly installment after month one — base + insurance. */
  monthly: number;
  /** First installment — base + insurance + one-time file fee. */
  firstMonthly: number;
  /** Total of all installments (= monthly × months + file fee). */
  totalCost: number;
  /** Effective surcharge over the cash price = totalCost - amount. */
  totalInterestPlusFees: number;
  /** One-time file fee (constant). */
  fileFee: number;
};

const insuranceRate = (ageBracket: AgeBracket): number =>
  INSURANCE_RATE[ageBracket];

/** Compute a Classique (interest-bearing) monthly payment. */
export function computeClassique(
  amount: number,
  months: number,
  ageBracket: AgeBracket
): FinancingQuote {
  const factor = CLASSIQUE_FACTORS[months];
  if (factor === undefined) {
    throw new Error(`Classique: duration ${months}mo not in Wafasalaf tariff.`);
  }
  const baseMonthly = factor * amount;
  const insurance = amount * insuranceRate(ageBracket);
  const monthly = baseMonthly + insurance;
  const fileFee = FILE_FEE_MAD.classique;
  const firstMonthly = monthly + fileFee;
  const totalCost = monthly * months + fileFee;
  return {
    offer: "classique",
    amount,
    months,
    ageBracket,
    baseMonthly,
    insurance,
    monthly,
    firstMonthly,
    totalCost,
    totalInterestPlusFees: totalCost - amount,
    fileFee,
  };
}

/** Compute a Crédit Gratuit (0% interest) monthly payment. */
export function computeGratuit(
  amount: number,
  months: number,
  ageBracket: AgeBracket
): FinancingQuote {
  if (!GRATUIT_DURATIONS.includes(months)) {
    throw new Error(`Gratuit: duration ${months}mo not in Wafasalaf tariff.`);
  }
  const baseMonthly = amount / months;
  const insurance = amount * insuranceRate(ageBracket);
  const monthly = baseMonthly + insurance;
  const fileFee = FILE_FEE_MAD.gratuit;
  const firstMonthly = monthly + fileFee;
  const totalCost = monthly * months + fileFee;
  return {
    offer: "gratuit",
    amount,
    months,
    ageBracket,
    baseMonthly,
    insurance,
    monthly,
    firstMonthly,
    totalCost,
    totalInterestPlusFees: totalCost - amount,
    fileFee,
  };
}

/** Convenience dispatcher. */
export function computeFinancing(
  offer: FinancingOffer,
  amount: number,
  months: number,
  ageBracket: AgeBracket
): FinancingQuote {
  return offer === "classique"
    ? computeClassique(amount, months, ageBracket)
    : computeGratuit(amount, months, ageBracket);
}

/** Format a MAD amount with 2 decimals + thousands separator. */
export function fmtMAD(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
