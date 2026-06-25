// Single source of truth for cart-line math.
//
// V1 had `productPrice` / `productName` closures duplicated across
// selectOrderTotals, completePayment, sendToKitchen, and
// beginPayment. V2 adds variants + modifiers + combo deltas + per-
// line discount on top — duplicating all four computations is a
// recipe for them to drift. This module exports `lineUnitPrice` and
// `lineDisplayName` so every call site computes the same number and
// renders the same label.
//
// Both helpers take the product and the OrderLine; the line carries
// its own variantId / modifiers / comboSelections / discountPct.

import type { DemoProduct, OrderLine } from "@/data/demo/types";

/** Base price + variant delta + modifier deltas + combo option
 *  deltas, then apply per-line discount. */
export function lineUnitPrice(product: DemoProduct, line: OrderLine): number {
  let unit = product.price;

  if (line.variantId && product.variants) {
    const v = product.variants.find((v) => v.id === line.variantId);
    if (v) unit += v.priceDelta;
  }

  if (line.modifiers) {
    for (const m of line.modifiers) unit += m.priceDelta;
  }

  if (line.comboSelections && product.comboSteps) {
    for (const step of product.comboSteps) {
      const picks = line.comboSelections[step.id] ?? [];
      for (const pickId of picks) {
        const opt = step.options.find((o) => o.id === pickId);
        if (opt?.priceDelta) unit += opt.priceDelta;
      }
    }
  }

  if (line.discountPct) {
    unit = unit * (1 - line.discountPct / 100);
  }

  return unit;
}

/** "Espresso · Large · oat milk, extra shot" — receipt + kitchen-
 *  ticket presentation. Modifier prices are NOT included here; the
 *  cart UI shows them inline in a separate muted line. */
export function lineDisplayName(
  product: DemoProduct,
  line: OrderLine,
): string {
  const parts: string[] = [product.name];

  if (line.variantId && product.variants) {
    const v = product.variants.find((v) => v.id === line.variantId);
    if (v) parts.push(v.name);
  }

  // Combo option labels — combos don't typically have variants, but
  // both shapes can coexist on a product if a recipe really needs
  // it (the wizard surfaces combo first then modifiers).
  if (line.comboSelections && product.comboSteps) {
    const labels: string[] = [];
    for (const step of product.comboSteps) {
      const picks = line.comboSelections[step.id] ?? [];
      for (const pickId of picks) {
        const opt = step.options.find((o) => o.id === pickId);
        if (opt) labels.push(opt.name);
      }
    }
    if (labels.length > 0) parts.push(labels.join(", "));
  }

  if (line.modifiers && line.modifiers.length > 0) {
    parts.push(line.modifiers.map((m) => m.name).join(", "));
  }

  return parts.join(" · ");
}

/** Short label shown under the product name in the cart line —
 *  variant + modifier names with their priceDeltas in muted text.
 *  Returns an empty string when there's nothing to show. */
export function lineSelectionSummary(
  product: DemoProduct,
  line: OrderLine,
): string {
  const parts: string[] = [];

  if (line.variantId && product.variants) {
    const v = product.variants.find((v) => v.id === line.variantId);
    if (v) parts.push(v.priceDelta ? `${v.name} +${v.priceDelta}` : v.name);
  }

  if (line.comboSelections && product.comboSteps) {
    const labels: string[] = [];
    for (const step of product.comboSteps) {
      const picks = line.comboSelections[step.id] ?? [];
      for (const pickId of picks) {
        const opt = step.options.find((o) => o.id === pickId);
        if (opt) {
          labels.push(
            opt.priceDelta ? `${opt.name} +${opt.priceDelta}` : opt.name,
          );
        }
      }
    }
    if (labels.length > 0) parts.push(labels.join(", "));
  }

  if (line.modifiers && line.modifiers.length > 0) {
    parts.push(
      line.modifiers
        .map((m) => (m.priceDelta ? `${m.name} +${m.priceDelta}` : m.name))
        .join(", "),
    );
  }

  return parts.join(" · ");
}
