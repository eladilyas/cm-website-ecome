// Smart comment library — activity-aware preset chips for both order-
// level and line-level notes. The cashier types the rest if no chip
// matches; presets cover the 80% case so most orders never touch the
// keyboard.
//
// Two tiers:
//   • ORDER_PRESETS   — apply to the whole order (VIP, allergy, delivery
//                       instructions, etc.). Filtered per activity since
//                       a barber doesn't need "allergy warning" presets.
//   • LINE_PRESETS    — apply to a single product. Bucketed by the
//                       product's `categoryId` keyword so a coffee gets
//                       drink presets, a burger gets cooking presets,
//                       and a pizza gets done-ness presets.

import type { ActivityKey } from "./types";

export type CommentPreset = {
  id: string;
  /** Display label — the chip text. */
  label: string;
  /** Optional warning tone — surfaces as amber on the kitchen ticket
   *  for allergy / customer-anxiety items. */
  tone?: "default" | "warning";
};

// ── Order-level presets ─────────────────────────────────────────────────

const COMMON_ORDER: CommentPreset[] = [
  { id: "vip", label: "VIP customer" },
  { id: "fast", label: "Customer waiting" },
  { id: "allergy", label: "Allergy warning", tone: "warning" },
];

const KITCHEN_ORDER: CommentPreset[] = [
  ...COMMON_ORDER,
  { id: "no-cutlery", label: "No cutlery" },
  { id: "deliver-asap", label: "Deliver immediately" },
  { id: "call-on-arrival", label: "Call customer on arrival" },
  { id: "special-prep", label: "Special preparation" },
];

const SERVICE_ORDER: CommentPreset[] = [
  ...COMMON_ORDER,
  { id: "regular", label: "Regular client" },
  { id: "kid-friendly", label: "Has children" },
];

export const ORDER_PRESETS: Record<ActivityKey, CommentPreset[]> = {
  cafe: KITCHEN_ORDER,
  "fast-food": KITCHEN_ORDER,
  "dine-in": KITCHEN_ORDER,
  bakery: [
    ...COMMON_ORDER,
    { id: "pre-order", label: "Pre-order — pickup" },
    { id: "gift-wrap", label: "Gift packaging" },
  ],
  market: [
    ...COMMON_ORDER,
    { id: "bag", label: "Carry bags" },
    { id: "no-bag", label: "No bag" },
  ],
  beauty: SERVICE_ORDER,
  barber: SERVICE_ORDER,
};

// ── Line-level presets — bucketed by category keyword ───────────────────
// Activities don't map 1:1 to categories (a café has espresso/pastry; a
// restaurant has tagine/dessert/drink). We bucket by keyword in the
// category id/name so the right chips surface contextually.

const DRINK_LINE: CommentPreset[] = [
  { id: "no-sugar", label: "No sugar" },
  { id: "extra-hot", label: "Extra hot" },
  { id: "iced", label: "Iced" },
  { id: "oat-milk", label: "Oat milk" },
  { id: "almond-milk", label: "Almond milk" },
  { id: "decaf", label: "Decaf" },
];

const BURGER_LINE: CommentPreset[] = [
  { id: "no-onions", label: "No onions" },
  { id: "no-pickles", label: "No pickles" },
  { id: "extra-cheese", label: "Extra cheese" },
  { id: "no-sauce", label: "No sauce" },
];

const PIZZA_LINE: CommentPreset[] = [
  { id: "well-done", label: "Well done" },
  { id: "light-cheese", label: "Light cheese" },
  { id: "extra-crispy", label: "Extra crispy" },
];

const PROTEIN_LINE: CommentPreset[] = [
  { id: "rare", label: "Rare" },
  { id: "medium-rare", label: "Medium rare" },
  { id: "medium", label: "Medium" },
  { id: "medium-well", label: "Medium well" },
  { id: "well-done", label: "Well done" },
];

const PASTRY_LINE: CommentPreset[] = [
  { id: "to-go", label: "To go" },
  { id: "warmed", label: "Warmed" },
  { id: "sliced", label: "Sliced" },
];

const BREAD_LINE: CommentPreset[] = [
  { id: "sliced", label: "Sliced" },
  { id: "extra-pack", label: "Extra packaging" },
  { id: "unsliced", label: "Keep whole" },
];

const SERVICE_LINE: CommentPreset[] = [
  { id: "kid-friendly", label: "Kids — gentle" },
  { id: "sensitive-scalp", label: "Sensitive scalp" },
  { id: "no-product", label: "No product" },
];

const GENERIC_LINE: CommentPreset[] = [
  { id: "no-cutlery", label: "No cutlery" },
  { id: "to-go", label: "To go" },
  { id: "gift", label: "Gift" },
];

/** Map a category id / name keyword to the right preset bucket. Returns
 *  a sensible default when no bucket matches. The matcher is loose
 *  (substring) so "hot-drinks", "drinks", "espresso", "cafe-drinks"
 *  all hit the drink bucket. */
export function presetsForCategory(
  activity: ActivityKey,
  categoryId: string | undefined,
  categoryName: string | undefined,
): CommentPreset[] {
  const tag = `${categoryId ?? ""} ${categoryName ?? ""}`.toLowerCase();

  if (/drink|beverage|coffee|tea|juice|soda/.test(tag)) return DRINK_LINE;
  if (/burger|sandwich|wrap/.test(tag)) return BURGER_LINE;
  if (/pizza|flatbread/.test(tag)) return PIZZA_LINE;
  if (/steak|protein|grill|meat|chicken|tagine|fish/.test(tag))
    return PROTEIN_LINE;
  if (/pastry|viennoiserie|dessert|cake/.test(tag)) return PASTRY_LINE;
  if (/bread|baguette|loaf|boule/.test(tag)) return BREAD_LINE;
  if (activity === "beauty" || activity === "barber") return SERVICE_LINE;

  return GENERIC_LINE;
}
