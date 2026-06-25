// Market / grocery seed bundle — high-volume retail counter.
//
// Owner + 3 cashiers, no kitchen. Wide supplier base across produce,
// dairy, packaged, household. Stock volumes vary heavily — produce
// turns daily, household goods sit for weeks.

import { ACTIVITIES } from "../activities";
import {
  defaultThresholds,
  generateCustomers,
  generateStaff,
  makeSupplier,
} from "./_helpers";
import type { SeedBundle } from "./index";

const KEY = "market" as const;

function defaultStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const p of ACTIVITIES[KEY].products) {
    switch (p.categoryId) {
      case "produce":   stock[p.id] = 25; break;   // kg / units
      case "bread":     stock[p.id] = 40; break;
      case "dairy":     stock[p.id] = 30; break;
      case "beverages": stock[p.id] = 60; break;
      case "snacks":    stock[p.id] = 45; break;
      case "pantry":    stock[p.id] = 50; break;
      case "household": stock[p.id] = 20; break;
      case "personal":  stock[p.id] = 18; break;
      default:          stock[p.id] = 25;
    }
  }
  return stock;
}

export const MARKET_BUNDLE: SeedBundle = {
  customers: generateCustomers(KEY, 18), // walk-in heavy → fewer named regulars
  suppliers: [
    makeSupplier(KEY, 0, "Souk Wholesale Casa", ["produce"], 1),
    makeSupplier(KEY, 1, "Boulangerie Royale Co.", ["bread"], 1),
    makeSupplier(KEY, 2, "Lait du Maroc", ["dairy"], 2),
    makeSupplier(KEY, 3, "Sahel Beverages", ["beverages"], 4),
    makeSupplier(KEY, 4, "Atlas Distribution SARL", ["snacks", "pantry"], 5),
    makeSupplier(KEY, 5, "Maison Propre", ["household", "personal"], 7),
    makeSupplier(KEY, 6, "Marrakech Wholesale", ["pantry", "snacks"], 6),
  ],
  staff: generateStaff(KEY, ["owner", "cashier", "cashier", "cashier"]),
  stock: defaultStock(),
  // Market has a wider variety; raise the floor so produce alerts
  // fire at 8 not 3 (a market manager wants room to reorder).
  stockThresholds: defaultThresholds(defaultStock(), { min: 6, fraction: 0.35 }),
};
