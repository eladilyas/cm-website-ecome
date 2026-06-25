// Restaurant (dine-in) seed bundle — full-service with multi-course flow.
//
// Owner + manager + 2 servers/cashiers + 2 kitchen. Higher COGS so
// supplier ledger is denser. Stock is per-portion not per-shipment.

import { ACTIVITIES } from "../activities";
import {
  defaultThresholds,
  generateCustomers,
  generateStaff,
  makeSupplier,
} from "./_helpers";
import type { SeedBundle } from "./index";

const KEY = "dine-in" as const;

function defaultStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const p of ACTIVITIES[KEY].products) {
    if (p.categoryId === "starters") stock[p.id] = 25;
    else if (p.categoryId === "plats") stock[p.id] = 18;
    else if (p.categoryId === "pasta") stock[p.id] = 15;
    else if (p.categoryId === "desserts") stock[p.id] = 16;
    else if (p.categoryId === "drinks") stock[p.id] = 40;
    else stock[p.id] = 20;
  }
  return stock;
}

export const DINE_IN_BUNDLE: SeedBundle = {
  customers: generateCustomers(KEY, 30),
  suppliers: [
    makeSupplier(KEY, 0, "Boucherie Atlas", ["plats"], 2),
    makeSupplier(KEY, 1, "Marée du Jour Casa", ["plats", "starters"], 1),
    makeSupplier(KEY, 2, "Fruits Frais Casa", ["starters", "plats"], 1),
    makeSupplier(KEY, 3, "Pasta & Co.", ["pasta"], 4),
    makeSupplier(KEY, 4, "Cave Casa Wine", ["drinks"], 7),
    makeSupplier(KEY, 5, "Pâtisserie Royale", ["desserts"], 2),
    makeSupplier(KEY, 6, "Atlas Distribution SARL", ["drinks", "pasta"], 3),
  ],
  staff: generateStaff(KEY, [
    "owner",
    "manager",
    "cashier",
    "cashier",
    "kitchen",
    "kitchen",
  ]),
  stock: defaultStock(),
  stockThresholds: defaultThresholds(defaultStock()),
  // Phase B — Chef's Combo (formule du chef). Selling one combo
  // deducts one of each course from inventory, exactly how a real
  // restaurant tracks fixed-menu impact across the kitchen. The
  // Production view shows the operator a three-line BOM and a live
  // "how many combos can we still fire?" counter driven by whichever
  // course has the lowest remaining stock.
  recipes: {
    "chef-combo": [
      { componentId: "soup-of-day", qty: 1 },
      { componentId: "tagine-poulet", qty: 1 },
      { componentId: "creme-brulee", qty: 1 },
    ],
  },
};
