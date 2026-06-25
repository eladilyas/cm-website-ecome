// Price formatter helpers.
//
// One source of truth for "how a price reads on the marketing site".
// Every product card, rail card, and detail-page price line goes
// through here so the format never drifts as we add surfaces.
//
// Format follows Moroccan B2B convention:
//   • Thousands separator: space-narrow ("4 500" not "4,500") — the
//     French / fr-FR locale convention used across Casa retail
//   • Currency suffix: "MAD" (not "DH" or "MAD ") — uppercase, three
//     letters, space-separated from the number
//   • "HT" suffix when explicitly indicating tax-excluded (B2B
//     hardware default; Moroccan VAT is 20% on most hardware)
//
// The "From" prefix is reserved for `formatPriceFrom*` — used when a
// product has variants / configuration tiers and the displayed
// price is the lowest. Today the catalog has a single price per
// product (`priceFrom`), but the "From" framing keeps room for
// configuration-based variants without re-skinning every surface.

const FORMATTER = new Intl.NumberFormat("fr-FR", {
  useGrouping: true,
  maximumFractionDigits: 0,
});

/** "4 500 MAD" */
export function formatPrice(mad: number): string {
  return `${FORMATTER.format(mad)} MAD`;
}

/** "From 4 500 MAD" */
export function formatPriceFrom(mad: number): string {
  return `From ${formatPrice(mad)}`;
}

/** "From 4 500 MAD HT" — Moroccan B2B convention; HT = hors taxes
 *  (price excludes the 20% VAT). The quote drawer produces the
 *  formal TTC total at checkout. */
export function formatPriceFromHT(mad: number): string {
  return `From ${FORMATTER.format(mad)} MAD HT`;
}
