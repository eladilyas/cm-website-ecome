// Plan price ladder — MAD HT, per counter, per month.
//
// This lives in its OWN module, with no "use client" directive, on purpose.
//
// `src/data/pricing.tsx` is a client module (it resolves localised copy
// through hooks). When a SERVER component imports a value from a client
// module, Next hands it a client-reference proxy rather than the actual
// export — so `PLAN_PRICES.pro` was `undefined` on the server and the
// pricing page 500'd with "Cannot read properties of undefined (reading
// 'yearly')". Pure data therefore cannot live in that file if both sides
// need it.
//
// Both the client pricing cards and the server-rendered pricing hero read
// these same numbers, so the hero can never contradict the cards below it.

export type BillingCycle = "monthly" | "yearly" | "biennial";

export const PLAN_PRICES: Record<
  "pro" | "enterprise",
  Record<BillingCycle, number>
> = {
  pro: { monthly: 260, yearly: 195, biennial: 130 },
  enterprise: { monthly: 350, yearly: 260, biennial: 170 },
};
