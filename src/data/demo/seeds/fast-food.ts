// Fast food seed bundle — burgers, wraps, combos, delivery integration.
//
// Bigger crew (manager + 3 cashiers + 2 kitchen) to match real chain-
// QSR staffing. Suppliers split between meat / bun / produce / beverage.

import { ACTIVITIES } from "../activities";
import {
  defaultThresholds,
  generateCustomers,
  generateStaff,
  makeSupplier,
} from "./_helpers";
import type { SeedBundle } from "./index";

const KEY = "fast-food" as const;

function defaultStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const p of ACTIVITIES[KEY].products) {
    if (p.categoryId === "burgers") stock[p.id] = 50;
    else if (p.categoryId === "wraps") stock[p.id] = 30;
    else if (p.categoryId === "sides") stock[p.id] = 120;   // portions
    else if (p.categoryId === "drinks") stock[p.id] = 80;
    else if (p.categoryId === "combos") stock[p.id] = 0;    // bundle, no stock
    else stock[p.id] = 25;
  }
  return stock;
}

export const FAST_FOOD_BUNDLE: SeedBundle = {
  customers: generateCustomers(KEY, 28),
  suppliers: [
    makeSupplier(KEY, 0, "Boucherie Atlas", ["burgers", "wraps"], 2),
    makeSupplier(KEY, 1, "Boulangerie Royale Co.", ["burgers", "wraps"], 1),
    makeSupplier(KEY, 2, "Fruits Frais Casa", ["burgers", "wraps"], 1),
    makeSupplier(KEY, 3, "Casa Distribution", ["sides"], 3),
    makeSupplier(KEY, 4, "Sahel Wholesale", ["drinks"], 5),
    makeSupplier(KEY, 5, "Lait du Maroc", ["burgers"], 2),
  ],
  staff: generateStaff(KEY, [
    "manager",
    "cashier",
    "cashier",
    "cashier",
    "kitchen",
    "kitchen",
  ]),
  stock: defaultStock(),
  stockThresholds: defaultThresholds(defaultStock()),
  // Phase B — composite menu items built from existing SKUs. The
  // Cheese Burger upgrades a Classic Burger; the Double Burger is
  // literally two patties. Realistic + lets the production view
  // demo a real conversion chain.
  recipes: {
    "cheese-burger": [{ componentId: "classic-burger", qty: 1 }],
    "double-burger": [{ componentId: "classic-burger", qty: 2 }],
  },
};
