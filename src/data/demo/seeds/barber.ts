// Barber shop seed bundle — service-led with small retail.
//
// Owner + 3 barbers. No front-of-house cashier — barbers handle
// payment themselves between cuts. Tight retail shelf (oil, pomade,
// shampoo, aftershave).

import { ACTIVITIES } from "../activities";
import {
  defaultThresholds,
  generateCustomers,
  generateStaff,
  makeSupplier,
} from "./_helpers";
import type { SeedBundle } from "./index";

const KEY = "barber" as const;

function defaultStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const p of ACTIVITIES[KEY].products) {
    if (p.durationMin != null) continue;
    stock[p.id] = 10;
  }
  return stock;
}

export const BARBER_BUNDLE: SeedBundle = {
  customers: generateCustomers(KEY, 20),
  suppliers: [
    makeSupplier(KEY, 0, "Beauté Atlas", ["retail"], 4),
    makeSupplier(KEY, 1, "Barber Supply Casa", ["retail", "treatments"], 5),
    makeSupplier(KEY, 2, "Hair Pro Maroc", ["retail"], 5),
  ],
  staff: generateStaff(KEY, ["owner", "barber", "barber", "barber"]),
  stock: defaultStock(),
  // Retail-only shelf; the barbershop doesn't reorder often.
  stockThresholds: defaultThresholds(defaultStock(), { min: 2, max: 5 }),
};
