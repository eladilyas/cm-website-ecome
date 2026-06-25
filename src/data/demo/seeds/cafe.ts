// Café seed bundle — counter-served coffee + pastries operation.
//
// Two front-of-house cashiers + one barista (kitchen role). Mid-size
// supplier list focused on coffee, pastry delivery, and dairy.

import { ACTIVITIES } from "../activities";
import {
  defaultThresholds,
  generateCustomers,
  generateStaff,
  makeSupplier,
} from "./_helpers";
import type { SeedBundle } from "./index";

const KEY = "cafe" as const;

function defaultStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const p of ACTIVITIES[KEY].products) {
    if (p.categoryId === "coffee") stock[p.id] = 60;       // cups equivalent
    else if (p.categoryId === "pastries") stock[p.id] = 24;
    else if (p.categoryId === "sandwiches") stock[p.id] = 10;
    else if (p.categoryId === "cold") stock[p.id] = 30;
    else stock[p.id] = 20;
  }
  return stock;
}

export const CAFE_BUNDLE: SeedBundle = {
  customers: generateCustomers(KEY, 22),
  suppliers: [
    makeSupplier(KEY, 0, "Café del Atlas SARL", ["coffee"], 5),
    makeSupplier(KEY, 1, "Boulangerie Royale Co.", ["pastries"], 1),
    makeSupplier(KEY, 2, "Lait du Maroc", ["coffee", "cold"], 2),
    makeSupplier(KEY, 3, "Fruits Frais Casa", ["cold", "sandwiches"], 1),
    makeSupplier(KEY, 4, "Atlas Distribution SARL", ["sandwiches"], 3),
  ],
  staff: generateStaff(KEY, ["owner", "cashier", "cashier", "kitchen"]),
  stock: defaultStock(),
  stockThresholds: defaultThresholds(defaultStock()),
  // Phase B — milk-based drinks are built from an espresso shot.
  // Realistic + the components already exist in the catalog so the
  // BOM demo reads as plausible without needing raw-material SKUs
  // that don't belong in a café-facing catalog.
  recipes: {
    cappuccino: [{ componentId: "espresso", qty: 1 }],
    "flat-white": [{ componentId: "espresso", qty: 1 }],
    "iced-latte": [{ componentId: "espresso", qty: 1 }],
    "double-espresso": [{ componentId: "espresso", qty: 2 }],
  },
};
