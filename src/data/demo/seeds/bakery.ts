// Bakery seed bundle — artisan production + counter pickup.
//
// Owner + 2 cashiers + 1 baker (kitchen role). Suppliers limited to
// raw ingredients — flour, butter, sugar, eggs. Stock turns daily;
// initial counts reflect a fresh morning batch.

import { ACTIVITIES } from "../activities";
import {
  defaultThresholds,
  generateCustomers,
  generateStaff,
  makeSupplier,
} from "./_helpers";
import type { SeedBundle } from "./index";

const KEY = "bakery" as const;

function defaultStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const p of ACTIVITIES[KEY].products) {
    switch (p.categoryId) {
      case "breads":         stock[p.id] = 22; break;
      case "viennoiseries":  stock[p.id] = 35; break;
      case "cakes":          stock[p.id] = 8;  break;
      case "cookies":        stock[p.id] = 50; break;
      case "drinks":         stock[p.id] = 25; break;
      default:               stock[p.id] = 20;
    }
  }
  return stock;
}

export const BAKERY_BUNDLE: SeedBundle = {
  customers: generateCustomers(KEY, 24),
  suppliers: [
    makeSupplier(KEY, 0, "Moulin de Casa", ["breads", "viennoiseries"], 3),
    makeSupplier(KEY, 1, "Lait du Maroc", ["viennoiseries", "cakes"], 2),
    makeSupplier(KEY, 2, "Sucre & Epices", ["cookies", "cakes"], 5),
    makeSupplier(KEY, 3, "Œufs du Pays", ["viennoiseries", "cakes"], 1),
    makeSupplier(KEY, 4, "Café del Atlas SARL", ["drinks"], 4),
  ],
  staff: generateStaff(KEY, ["owner", "cashier", "cashier", "kitchen"]),
  stock: defaultStock(),
  // Bakery items sell fast and shouldn't run out mid-morning; alert
  // higher so the baker has time to fire another tray.
  stockThresholds: defaultThresholds(defaultStock(), { fraction: 0.4, min: 5 }),
  // Phase B — viennoiseries share the same croissant dough base. The
  // Butter Croissant becomes the dough SKU: when a pain au chocolat,
  // pain aux raisins, or apple turnover is sold, one croissant-worth
  // of dough is deducted. The Production view then lets the baker
  // fire a batch of dough and watch finished goods become available.
  // Real-world authentic — Moroccan boulangeries laminate one dough
  // each morning and assemble multiple SKUs from it through the day.
  recipes: {
    "pain-chocolat":  [{ componentId: "croissant", qty: 1 }],
    "raisin-snail":   [{ componentId: "croissant", qty: 1 }],
    "apple-turnover": [{ componentId: "croissant", qty: 1 }],
  },
};
