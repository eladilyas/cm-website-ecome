// Shop catalog — STATIC FALLBACK / MIGRATION ARTIFACT + SEED SOURCE.
//
// As of 2026-06: the public catalog is sourced from Postgres via
// `src/server/catalog/service.ts`. Server components read directly
// (`listPublicProducts`, `getPublicProductBySlug`); client components
// read via `<CatalogProvider />` (`useCatalog`, `useProduct`).
//
// This file is retained for two reasons only:
//   1. The import script (`scripts/import-catalog.ts`) seeds / re-seeds
//      Postgres from CATALOG.
//   2. Anything that still imports `CatalogProduct` / `CatalogCategory`
//      types — those now re-export from `@/server/catalog/types`.
//
// NEW CODE MUST NOT import CATALOG / CATALOG_BY_SLUG / CATEGORY_LABEL.
// Use the service (server) or the provider (client) instead.
//
// ── Source of truth (2026-08) ─────────────────────────────────────────
// Every product below comes from the founder's stock spreadsheet
// ("tableau_produits_categorise.xlsx", sheet 1: Category | Product Name
// | Original Name | Qty | Unit/Note), plus the six pre-existing entries
// that predate it (Swan 1, WD15M, Epson printer, compact drawer, generic
// 2D scanner). Rows repeated across the sheet are different stock
// batches of the same SKU and are collapsed into one product here.
//
// STOCK QUANTITIES ARE DELIBERATELY NOT MODELLED. The backend does not
// manage inventory yet, so the sheet's Qty column was used ONLY to
// derive a binary state and then discarded:
//   • row carries a Qty  → availability: { status: "in-stock" }
//   • row carries no Qty → availability: { status: "incoming" } ("en
//     arrivage"), leadWeeks 3 by default
// Never surface a count, a "last N left", or a batch note anywhere.
//
// ── Categories ────────────────────────────────────────────────────────
// `CatalogCategory` is the legacy taxonomy this file has always used.
// The LIVE storefront taxonomy in Postgres is the flat eight-slug set
// created by `scripts/restructure-shop-categories.ts` (pos, handheld,
// kiosk, peripherals, syscall, accessories, consumables,
// access-presence) and the legacy slugs are soft-disabled there. The
// legacy → live mapping lives in `scripts/import-catalog.ts`
// (CATEGORY_REMAP) — update it whenever the union below changes.
//
// ── Pricing ───────────────────────────────────────────────────────────
// Starting prices show publicly as "From X MAD HT" on cards + detail
// pages via src/lib/formatPrice.ts. The spreadsheet carries NO pricing,
// so every `priceFrom` on the products added in 2026-08 is a positional
// PLACEHOLDER, ordered sensibly within its category but not commercially
// approved. Confirm with the founder before launch.
//
// ── Imagery ───────────────────────────────────────────────────────────
// Images are served locally from /public/hardware/ — no external CDN.
// Eight products have no photograph in the founder's shoot yet; they
// reference PHOTO_PENDING so the grid stays whole. Replace the path (and
// the alt text) as soon as a real shot exists.

export type CatalogCategory =
  | "pos-terminals"
  | "mobile-pos"
  | "kiosks"
  | "kds"
  | "cash-drawers"
  | "printers"
  | "scanners"
  | "paging"
  // Added 2026-08 — the spreadsheet carries three families with no home
  // in the original union.
  | "rfid"
  | "time-attendance"
  | "accessories";

export const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  "pos-terminals": "POS Terminals",
  "mobile-pos": "Mobile POS",
  "kiosks": "Self-Order Kiosks",
  "kds": "Kitchen Display",
  "cash-drawers": "Cash Management",
  "printers": "Printing",
  "scanners": "Scanning",
  "paging": "Customer Paging",
  "rfid": "RFID Readers & Tokens",
  "time-attendance": "Time & Attendance",
  "accessories": "Accessories & Spare Parts",
};

export type ProductSpec = {
  /** Label shown in the detail-page spec table. */
  label: string;
  /** Plain-text value. Pre-formatted (units already included). */
  value: string;
};

/** Stock + delivery signal shown on cards + detail page. "in-stock"
 *  ships immediately; "incoming" surfaces a lead-time hint (default
 *  3 weeks) so buyers can self-assess delivery before checkout. */
export type ProductAvailability = {
  status: "in-stock" | "incoming";
  /** Lead time in weeks when status is "incoming". Defaults to 3. */
  leadWeeks?: number;
};

export type CatalogProduct = {
  /** URL slug used on /shop/[slug]. */
  slug: string;
  /** Display name. */
  name: string;
  /** Optional sub-line shown under the name. */
  subline?: string;
  /** Short marketing tagline. */
  tagline: string;
  /** Category — drives shop filters. */
  category: CatalogCategory;
  /** Local hero image path under /public/hardware/. PHOTO_PENDING when
   *  no photograph of the product exists yet. */
  heroImage: string;
  /** Used as the aria/alt text on the image. */
  alt: string;
  /** Short prose for the product-card body (2-3 lines). */
  shortDescription: string;
  /** Bullets shown on the detail page. */
  features: string[];
  /** Spec table on the detail page. Only rows the source material
   *  genuinely supports — never invented. */
  specs: ProductSpec[];
  /** Starting unit price in MAD, used by the Cart + checkout. Values on
   *  products added 2026-08 are placeholders pending commercial
   *  sign-off. */
  priceFrom: number;
  /** Stock + delivery signal shown on cards + detail page. Optional
   *  so seed-time products without a value default to "in-stock" at
   *  render time. */
  availability?: ProductAvailability;
  /** Slugs of products that pair well with this one. Drives the
   *  Cart drawer's upsell grid. */
  complementaryWith: string[];
};

/** Neutral placeholder tile for products the founder's shoot hasn't
 *  covered yet. Grep this constant to find every product still waiting
 *  on a photograph. */
export const PHOTO_PENDING = "/hardware/photo-pending.webp";

/** Alt text for a PHOTO_PENDING hero — states plainly that the image is
 *  a placeholder rather than describing a product we can't see. */
function pendingAlt(name: string): string {
  return `${name} — product photograph pending.`;
}

const INCOMING: ProductAvailability = { status: "incoming", leadWeeks: 3 };
const IN_STOCK: ProductAvailability = { status: "in-stock" };

// ── POS TERMINALS ──────────────────────────────────────────────────────

const POS_TERMINALS: CatalogProduct[] = [
  {
    slug: "swan-1-gen-2",
    name: "Swan 1",
    subline: "Gen 2",
    tagline: "Elegance meets exceptional performance.",
    category: "pos-terminals",
    heroImage: "/hardware/swan-1-gen-2.webp",
    alt: "Swan 1 Gen 2 desktop POS terminal with optional customer-facing display.",
    shortDescription:
      "The flagship desktop POS — 15.6″ full-HD touch, optional dual-screen customer display, and a modular spine that takes printers, scanners, and NFC without breaking line of sight.",
    features: [
      "15.6″ 1920×1080 multi-point touch",
      "Optional 10.1″ or 5″ secondary customer display",
      "Modular spine for NFC, scanner, camera, peripherals",
      "Wi-Fi 6, Bluetooth 5.4, Gigabit Ethernet",
      "USB-A 2.0/3.0, USB-C, RJ45/RJ11/RJ12, HDMI, TF slot",
      "Detachable display option for hand-held use",
    ],
    specs: [
      { label: "Processor", value: "Octa-core ARM A55, 2.0 GHz" },
      { label: "Memory", value: "2 GB / 4 GB RAM" },
      { label: "Storage", value: "16 GB / 64 GB ROM" },
      { label: "Display", value: "15.6″ 1920×1080 capacitive touch" },
      { label: "Secondary display", value: "10.1″ 1280×800 (optional)" },
      { label: "Operating system", value: "Android 13, 64-bit" },
      { label: "Connectivity", value: "Wi-Fi 6 · BT 5.4 · Ethernet 1000M · HDMI" },
      { label: "Dimensions", value: "363.8 × 185 × 300 mm" },
      { label: "Weight", value: "2.75 kg single / 3.3 kg dual display" },
    ],
    priceFrom: 4500,
    availability: IN_STOCK,
    complementaryWith: ["swift-1-pro", "heron-1-mini", "swan-1k-gen-2"],
  },
  {
    slug: "wdlink-wd15m",
    name: "WDLink WD15M",
    subline: '15.6" POS touch monitor',
    tagline: "A screen built for the front line. Designed for the long shift.",
    category: "pos-terminals",
    heroImage: "/hardware/wdlink-wd15m-v2.png",
    alt: "WDLink WD15M 15.6-inch capacitive POS touch monitor with foldable VESA-compatible stand, front three-quarter view in matte black.",
    shortDescription:
      "A 15.6-inch true-flat capacitive touch monitor engineered for 24/7 counter use. Pairs with any Windows POS host over VGA + USB, folds flat for kiosk mode, and mounts to any VESA arm for tight-counter installs. Grade-A panel, metal chassis, fanless thermal design — built to survive a year of double shifts.",
    features: [
      "15.6-inch true-flat TFT LCD — Grade-A factory-controlled panel for colour and viewing-angle consistency",
      "5-wire resistive-capacitive touch (Higgstec) — accurate finger or fingernail input, tolerant of high temperatures and gloves",
      "Rated for 24-hour continuous operation — designed for venues that don't close",
      "Fanless thermal design — no moving parts, no dust intake, near-silent on the floor",
      "Foldable stand — collapses flat for kiosk / customer-facing orientation",
      "Multiple installation modes — upright, folded flat, or detached for VESA arm mounting",
      "All-metal housing with high-gloss black bezel — premium presentation at the counter",
      "Windows-compatible USB touch driver — plug into any Windows POS host, zero driver dance",
    ],
    specs: [
      { label: "Model", value: "WD15M" },
      { label: "Display", value: '15.6" true-flat TFT LCD' },
      { label: "Resolution", value: "1366 × 768" },
      { label: "Touch", value: "5-wire capacitive (Higgstec, high-temperature tolerant)" },
      { label: "Video input", value: "VGA × 1" },
      { label: "Data interface", value: "USB × 1 (touch)" },
      { label: "Mounting", value: "Foldable stand · VESA-compatible · upright + flat orientations" },
      { label: "Housing", value: "Metal chassis · high-gloss black bezel" },
      { label: "OS support", value: "Windows" },
      { label: "Power", value: "DC 12 V / 3 A adapter (Taiwan-sourced)" },
      { label: "Packaging", value: "430 × 210 × 440 mm carton" },
      { label: "Duty cycle", value: "24-hour continuous operation rated" },
    ],
    priceFrom: 2600,
    availability: IN_STOCK,
    complementaryWith: ["aures-odp-333", "wdlink-wd0408", "wdlink-wd9100"],
  },
  {
    slug: "wdlink-pos-all-in-one-i5",
    name: "WDLink WD950 POS Terminal i5",
    subline: "Core i5 · 8 GB / 128 GB",
    tagline: "Counter power that never asks you to wait.",
    category: "pos-terminals",
    heroImage: "/hardware/wdlink-pos-all-in-one-i5.webp",
    alt: "WDLink WD950 all-in-one POS terminal with Core i5 processor, black chassis on an integrated stand.",
    shortDescription:
      "The all-in-one till for the busiest counter in the room. A Core i5 with 8 GB of memory takes orders, fires kitchen tickets and pulls a day's reporting at the same time without making the cashier wait on the screen.",
    features: [
      "All-in-one build — touchscreen, computer and stand in a single chassis",
      "Intel Core i5 with 8 GB of RAM: headroom for service, tickets and reporting at once",
      "128 GB solid-state storage — quick start-up, no spinning disk to fail",
      "Drives your receipt printer, cash drawer and scanner from the one unit",
      "One power lead and one surface to wipe down at close",
      "Held in local stock, so a replacement unit is a delivery, not an import",
    ],
    specs: [
      { label: "Model", value: "WD950" },
      { label: "Brand", value: "WDLink" },
      { label: "Processor", value: "Intel Core i5" },
      { label: "Memory", value: "8 GB RAM" },
      { label: "Storage", value: "128 GB" },
      { label: "Form factor", value: "All-in-one countertop terminal" },
    ],
    priceFrom: 9500,
    availability: IN_STOCK,
    complementaryWith: ["aures-odp-333", "wdlink-wd0408", "wdlink-wd9300"],
  },
  {
    slug: "wdlink-pos-all-in-one-i3",
    name: "WDLink WD950 POS Terminal i3",
    subline: "Core i3 · 4 GB / 128 GB",
    tagline: "The everyday till, stocked in depth.",
    category: "pos-terminals",
    heroImage: "/hardware/wdlink-pos-all-in-one-i3.webp",
    alt: "WDLink WD950 all-in-one POS terminal with Core i3 processor, black chassis, front three-quarter view.",
    shortDescription:
      "Our most-installed counter terminal. A Core i3 all-in-one with a 128 GB SSD handles a full service comfortably, which makes it the sensible choice for a single-till café, bakery or snack.",
    features: [
      "All-in-one build — screen, computer and stand in one chassis",
      "Intel Core i3 with 4 GB of RAM: comfortable for a full day of ordering and payment",
      "128 GB solid-state storage — quick start-up, nothing mechanical to fail",
      "Runs your receipt printer, cash drawer and scanner off the same terminal",
      "The unit we install most, so spares and know-how are already on the shelf",
    ],
    specs: [
      { label: "Model", value: "WD950" },
      { label: "Brand", value: "WDLink" },
      { label: "Processor", value: "Intel Core i3" },
      { label: "Memory", value: "4 GB RAM" },
      { label: "Storage", value: "128 GB" },
      { label: "Form factor", value: "All-in-one countertop terminal" },
    ],
    priceFrom: 7500,
    availability: IN_STOCK,
    complementaryWith: ["aures-odp-333", "wdlink-wd0408", "wdlink-wd9100"],
  },
  {
    slug: "wdlink-pos-all-in-one-j1900",
    name: "WDLink WD950 POS System",
    subline: "Intel J1900 · 4 GB / 64 GB",
    tagline: "A dependable first till.",
    category: "pos-terminals",
    heroImage: "/hardware/wdlink-pos-all-in-one-j1900.webp",
    alt: "WDLink WD950 all-in-one POS system on the Intel J1900 platform, black chassis with integrated stand.",
    shortDescription:
      "The entry point into an all-in-one counter terminal. Built on Intel's low-power J1900 platform, it rings orders, prints receipts and opens the drawer all day without heat, noise or fuss.",
    features: [
      "All-in-one build — one chassis, one power lead, one thing to clean",
      "Intel J1900 platform with 4 GB of RAM — low power draw, quiet operation",
      "64 GB storage, enough for the till software and a long local history",
      "Handles the core loop: order, print, open drawer, close shift",
      "The affordable way to put a real terminal on a second counter",
    ],
    specs: [
      { label: "Model", value: "WD950" },
      { label: "Brand", value: "WDLink" },
      { label: "Processor", value: "Intel J1900" },
      { label: "Memory", value: "4 GB RAM" },
      { label: "Storage", value: "64 GB" },
      { label: "Form factor", value: "All-in-one countertop terminal" },
    ],
    priceFrom: 5500,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-wd8260", "wdlink-wd0408", "wdlink-wd9100"],
  },
  {
    slug: "zkteco-zkb10910",
    name: "ZKTeco ZKB10910 Smart POS Terminal",
    subline: "Intel J1900 · 4 GB / 32 GB",
    tagline: "One supplier for the till and the staff door.",
    category: "pos-terminals",
    heroImage: "/hardware/zkteco-zkb10910.webp",
    alt: "ZKTeco ZKB10910 all-in-one smart POS terminal in black, front three-quarter view.",
    shortDescription:
      "ZKTeco's all-in-one counter terminal on the Intel J1900 platform. It comes from the same house as the access-control and clock-in hardware many of our clients already run, so the till and the staff entrance share one supplier and one service line.",
    features: [
      "All-in-one counter terminal — screen, computer and stand together",
      "Intel J1900 at 2.0 GHz with 4 GB of RAM for steady daily service",
      "32 GB storage for the till software and its local records",
      "Same manufacturer as the ZKTeco time-and-attendance terminal we stock",
      "Compact footprint for counters where every centimetre is already spoken for",
    ],
    specs: [
      { label: "Model", value: "ZKB10910" },
      { label: "Brand", value: "ZKTeco" },
      { label: "Processor", value: "Intel J1900, 2.0 GHz" },
      { label: "Memory", value: "4 GB RAM" },
      { label: "Storage", value: "32 GB" },
      { label: "Form factor", value: "All-in-one countertop terminal" },
    ],
    priceFrom: 5200,
    availability: IN_STOCK,
    complementaryWith: ["zkteco-attendance-terminal", "wdlink-wd0408", "aures-odp-333"],
  },
  {
    slug: "imin-swan-2",
    name: "iMin Swan 2",
    subline: "I24D02",
    tagline: "The next Swan, on the water.",
    category: "pos-terminals",
    heroImage: "/hardware/imin-swan-2.webp",
    alt: "iMin Swan 2 Android desktop POS terminal, front three-quarter view.",
    shortDescription:
      "iMin's second-generation desktop terminal, ordered for our next shipment. It runs the same Android platform as the Swan already installed across our client base, so staff habits, peripherals and your Caisse Manager licence carry straight over.",
    features: [
      "Android desktop terminal from iMin's Swan range",
      "Same platform and software as the Swan units already in service — no retraining",
      "Reference I24D02 · en arrivage on our next container",
      "We confirm the final configuration with you before the shipment lands",
    ],
    specs: [
      { label: "Model reference", value: "I24D02" },
      { label: "Brand", value: "iMin" },
      { label: "Range", value: "Swan desktop series" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 5200,
    availability: INCOMING,
    complementaryWith: ["swan-1k-gen-2", "aures-odp-333", "wdlink-wd0408"],
  },
  {
    slug: "imin-swan-2-pro",
    name: "iMin Swan 2 Pro",
    subline: "I25D01",
    tagline: "The Pro trim of the Swan 2.",
    category: "pos-terminals",
    heroImage: "/hardware/imin-swan-2-pro.webp",
    alt: "iMin Swan 2 Pro Android desktop POS terminal, front three-quarter view.",
    shortDescription:
      "The Pro trim of the Swan 2, sitting above the standard model in iMin's desktop range and on order for our next shipment. For venues that want the fuller counter presence and more room to grow into.",
    features: [
      "Android desktop terminal — Pro trim of iMin's Swan 2",
      "Positioned above the standard Swan 2 in the range",
      "Reference I25D01 · en arrivage on our next container",
      "Configuration confirmed with you before delivery",
    ],
    specs: [
      { label: "Model reference", value: "I25D01" },
      { label: "Brand", value: "iMin" },
      { label: "Range", value: "Swan desktop series (Pro)" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 6900,
    availability: INCOMING,
    complementaryWith: ["imin-swan-2", "swan-1k-gen-2", "aures-odp-333"],
  },
  {
    slug: "imin-swan-3",
    name: "iMin Swan 3",
    subline: "I25D03",
    tagline: "The newest Swan on the counter.",
    category: "pos-terminals",
    heroImage: "/hardware/imin-swan-3.webp",
    alt: "iMin Swan 3 Android desktop POS terminal, front three-quarter view.",
    shortDescription:
      "The newest generation of iMin's desktop terminal, ordered for our next shipment. The one to specify if you're fitting out now and want the longest runway before the hardware feels dated.",
    features: [
      "Latest generation of iMin's Swan desktop range",
      "Android platform, consistent with the Swan terminals already in service",
      "Reference I25D03 · en arrivage on our next container",
      "Reserve now to hold a unit from the incoming shipment",
    ],
    specs: [
      { label: "Model reference", value: "I25D03" },
      { label: "Brand", value: "iMin" },
      { label: "Range", value: "Swan desktop series" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 7500,
    availability: INCOMING,
    complementaryWith: ["imin-swan-3-pro", "swan-1k-gen-2", "aures-odp-333"],
  },
  {
    slug: "imin-swan-3-pro",
    name: "iMin Swan 3 Pro",
    subline: "I25D04",
    tagline: "Top of the Swan range.",
    category: "pos-terminals",
    heroImage: "/hardware/imin-swan-3-pro.webp",
    alt: "iMin Swan 3 Pro Android desktop POS terminal, front three-quarter view.",
    shortDescription:
      "The top reference in iMin's desktop line-up, on order for our next shipment. Specified for flagship counters where the terminal is part of the room's design as much as its workflow.",
    features: [
      "Flagship trim of iMin's newest Swan desktop generation",
      "Android platform, same software and peripherals as the rest of the range",
      "Reference I25D04 · en arrivage on our next container",
      "Configuration and delivery window confirmed before you commit",
    ],
    specs: [
      { label: "Model reference", value: "I25D04" },
      { label: "Brand", value: "iMin" },
      { label: "Range", value: "Swan desktop series (Pro)" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 9200,
    availability: INCOMING,
    complementaryWith: ["imin-swan-3", "swan-1k-gen-2", "heron-1-mini"],
  },
  {
    slug: "imin-falcon-2-wifi",
    name: "iMin Falcon 2 Tablet POS",
    subline: "Wi-Fi · I24T01",
    tagline: "A till that weighs nothing.",
    category: "pos-terminals",
    heroImage: "/hardware/imin-falcon-2-wifi.webp",
    alt: "iMin Falcon 2 Android tablet POS terminal on its stand, Wi-Fi model.",
    shortDescription:
      "A tablet-format till for counters where a full terminal is too much furniture. Dock it to take payment, lift it off to take orders at the table, and put the space it saves back into the room.",
    features: [
      "Android tablet POS — docked at the counter or carried in the hand",
      "Wi-Fi model, for venues with reliable coverage on the floor",
      "Light enough to hand to a runner when a queue forms at the door",
      "Reference I24T01 · en arrivage on our next container",
    ],
    specs: [
      { label: "Model reference", value: "I24T01" },
      { label: "Brand", value: "iMin" },
      { label: "Range", value: "Falcon 2 tablet series" },
      { label: "Connectivity", value: "Wi-Fi" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 3400,
    availability: INCOMING,
    complementaryWith: ["imin-falcon-2-wifi-lte", "aures-odp-333", "wdlink-wd0408"],
  },
  {
    slug: "imin-falcon-2-wifi-lte",
    name: "iMin Falcon 2 Tablet POS",
    subline: "Wi-Fi + LTE · I24T02",
    tagline: "Keeps ringing when the Wi-Fi doesn't.",
    category: "pos-terminals",
    heroImage: "/hardware/imin-falcon-2-wifi-lte.webp",
    alt: "iMin Falcon 2 Android tablet POS terminal, Wi-Fi and LTE model, on its counter stand.",
    shortDescription:
      "The Falcon 2 tablet with mobile data as well as Wi-Fi. The version to order for a terrace far from the router, a market stall or a festival stand — anywhere the till has to work before the network does.",
    features: [
      "Android tablet POS with both Wi-Fi and LTE mobile data",
      "Service continues through a router reboot or a dead spot on the terrace",
      "Suits pop-ups, markets and outdoor trading as much as the counter",
      "Reference I24T02 · en arrivage on our next container",
    ],
    specs: [
      { label: "Model reference", value: "I24T02" },
      { label: "Brand", value: "iMin" },
      { label: "Range", value: "Falcon 2 tablet series" },
      { label: "Connectivity", value: "Wi-Fi + LTE" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 3900,
    availability: INCOMING,
    complementaryWith: ["imin-falcon-2-wifi", "swift-2-pro", "aures-odp-333"],
  },
  {
    slug: "imin-falcon-2-max",
    name: "iMin Falcon 2 Max Tablet POS",
    subline: "I24T03",
    tagline: "The big tablet till.",
    category: "pos-terminals",
    heroImage: "/hardware/imin-falcon-2-max.webp",
    alt: "iMin Falcon 2 Max Android tablet POS terminal on its stand, front view.",
    shortDescription:
      "The top of the Falcon 2 tablet range, on order for our next shipment. The choice when you want a tablet's flexibility but a terminal's presence facing the guest.",
    features: [
      "Flagship model of iMin's Falcon 2 tablet range",
      "Tablet flexibility with a larger face toward the counter and the guest",
      "Reference I24T03 · en arrivage on our next container",
      "Configuration confirmed with you before the shipment lands",
    ],
    specs: [
      { label: "Model reference", value: "I24T03" },
      { label: "Brand", value: "iMin" },
      { label: "Range", value: "Falcon 2 tablet series (Max)" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 4600,
    availability: INCOMING,
    complementaryWith: ["imin-falcon-2-wifi-lte", "aures-odp-333", "wdlink-wd0408"],
  },
];

// ── MOBILE POS ─────────────────────────────────────────────────────────

const MOBILE_POS: CatalogProduct[] = [
  {
    slug: "sunmi-l3",
    name: "Sunmi L3 Smart Mobile Terminal",
    tagline: "The till goes to the table.",
    category: "mobile-pos",
    heroImage: "/hardware/sunmi-l3.webp",
    alt: "Sunmi L3 Android handheld smart mobile terminal, front view.",
    shortDescription:
      "A rugged Android handheld for taking orders on the floor and doing stock work in the back. Orders leave the table for the kitchen directly, instead of queueing behind a waiter walking back to the counter.",
    features: [
      "Android handheld running your Caisse Manager menu and prices",
      "Order at the table — the kitchen sees the ticket before the waiter turns around",
      "Doubles as the stock device for receiving, counting and price checks",
      "Built for a hand that's also carrying plates",
    ],
    specs: [
      { label: "Model", value: "L3" },
      { label: "Brand", value: "Sunmi" },
      { label: "Type", value: "Handheld Android terminal" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 4200,
    availability: IN_STOCK,
    complementaryWith: ["sunmi-m3", "aures-odp-333", "wdlink-wd9100"],
  },
  {
    slug: "sunmi-m3",
    name: "Sunmi M3 Smart Mobile Terminal",
    tagline: "Pocket-format ordering.",
    category: "mobile-pos",
    heroImage: "/hardware/sunmi-m3.webp",
    alt: "Sunmi M3 Android handheld smart mobile terminal, front view.",
    shortDescription:
      "A pocket-sized Android terminal for table-side ordering, terrace service and delivery runs. Small enough to live in an apron, capable enough to be the till when the counter is three metres of queue away.",
    features: [
      "Compact Android handheld — fits an apron pocket",
      "Takes orders and payment away from the counter",
      "Useful on the terrace, at the door, and on delivery handovers",
      "Runs the same menu and prices as your main terminal",
    ],
    specs: [
      { label: "Model", value: "M3" },
      { label: "Brand", value: "Sunmi" },
      { label: "Type", value: "Handheld Android terminal" },
      { label: "Platform", value: "Android" },
    ],
    priceFrom: 3200,
    availability: IN_STOCK,
    complementaryWith: ["sunmi-l3", "aures-odp-333", "syscall-st-600"],
  },
  {
    slug: "swift-1-pro",
    name: "Swift 1 Pro",
    tagline: "A full till that fits in your hand.",
    category: "mobile-pos",
    heroImage: "/hardware/swift-1-pro.webp",
    alt: "Swift 1 Pro handheld mobile POS terminal.",
    shortDescription:
      "Pocketable mobile POS for table-side and floor-side service. 6.5″ display, NFC, IP54, drop-tested to 1m. Add the dock and it doubles as a counter unit.",
    features: [
      "6.5″ 720×1600 multi-touch, thin bezel",
      "NFC for contactless payments",
      "IP54 + 1.0 m drop resistance",
      "4G LTE, Wi-Fi 5, BT 5.0, GPS",
      "Includes charging dock and wrist strap",
      "Modular scanner and payment modules available",
    ],
    specs: [
      { label: "Processor", value: "Octa-core Cortex-A73 + A53, 2.0 GHz" },
      { label: "Memory", value: "4 GB RAM" },
      { label: "Storage", value: "32 GB ROM" },
      { label: "Display", value: "6.5″ 720×1600 multi-touch" },
      { label: "Operating system", value: "Android 13, 64-bit" },
      { label: "Battery", value: "2,500 mAh, 7.6 V (19 Wh)" },
      { label: "Connectivity", value: "Wi-Fi 5 · BT 5.0 · 4G LTE · GPS · NFC" },
      { label: "Durability", value: "IP54 · 1 m drop" },
      { label: "Dimensions", value: "168.3 × 79.3 × 17.2 mm" },
      { label: "Weight", value: "245 g" },
    ],
    priceFrom: 2200,
    availability: INCOMING,
    complementaryWith: ["swan-1-gen-2", "swift-2-pro"],
  },
  {
    slug: "swift-2-pro",
    name: "Swift 2 Pro",
    tagline: "Print receipts in your guest's hand.",
    category: "mobile-pos",
    heroImage: "/hardware/swift-2-pro.webp",
    alt: "Swift 2 Pro handheld mobile POS with integrated thermal printer.",
    shortDescription:
      "The mobile POS with the printer built in. 58mm thermal, removable battery, and customizable printer-cover colors so it can wear your brand.",
    features: [
      "Integrated 58 mm thermal printer, 100 mm/s",
      "Customizable printer cover colors",
      "Removable 3,350 mAh battery",
      "5 MP rear camera with 1D/2D barcode scanning",
      "Optional NFC, eSIM, PSAM",
      "Wi-Fi 5, BT 5.0, 4G LTE, GPS",
    ],
    specs: [
      { label: "Processor", value: "Octa-core Cortex-A73 + A53, 2.0 GHz" },
      { label: "Memory", value: "4 GB RAM" },
      { label: "Storage", value: "32 GB ROM" },
      { label: "Display", value: "6.5″ 720×1600 multi-touch" },
      { label: "Operating system", value: "Android 13, 64-bit" },
      { label: "Printer", value: "58 mm thermal, 100 mm/s, 50 mm diameter" },
      { label: "Battery", value: "3,350 mAh, 7.7 V (25.8 Wh) removable" },
      { label: "Connectivity", value: "Wi-Fi 5 · BT 5.0 · 4G LTE · GPS · NFC*" },
      { label: "Dimensions", value: "84.3 × 240.6 × 59.6 mm" },
      { label: "Weight", value: "450 g" },
    ],
    priceFrom: 3200,
    availability: INCOMING,
    complementaryWith: ["swan-1-gen-2", "swift-2-ultra"],
  },
  {
    slug: "swift-2-ultra",
    name: "Swift 2 Ultra",
    tagline: "Built to serve, built to move, built for more.",
    category: "mobile-pos",
    heroImage: "/hardware/swift-2-ultra.webp",
    alt: "Swift 2 Ultra rugged mobile POS with thermal printer and biometric unlock.",
    shortDescription:
      "Top of the handheld range. Dual-mode printer (receipt + label), 1D/2D scanner, fingerprint unlock, eSIM, NFC — the device that goes everywhere the floor goes.",
    features: [
      "58 mm thermal printer — receipt + label modes",
      "Built-in 1D/2D barcode/QR scanning",
      "Fingerprint unlock",
      "eSIM support for carrier flexibility",
      "PD 20W fast charging",
      "1 m drop-test certified",
      "Wi-Fi 5, BT 5.2, 4G LTE, GPS, NFC",
    ],
    specs: [
      { label: "Processor", value: "Octa-core (A76 ×2, A55 ×6)" },
      { label: "Memory", value: "4 GB RAM" },
      { label: "Storage", value: "64 GB ROM" },
      { label: "Display", value: "6.5″ 720×1600 capacitive touch" },
      { label: "Operating system", value: "Android 13, 64-bit" },
      { label: "Printer", value: "58 mm thermal, 100 mm/s, receipt + label" },
      { label: "Battery", value: "3,350 mAh, 7.7 V, removable, PD 20W" },
      { label: "Cameras", value: "2 MP front (optional) · 5 MP rear" },
      { label: "Connectivity", value: "Wi-Fi 5 · BT 5.2 · 4G LTE · GPS · NFC · eSIM" },
      { label: "Durability", value: "1 m drop test" },
      { label: "Dimensions", value: "84.3 × 240.6 × 63.5 mm" },
      { label: "Weight", value: "474 g" },
    ],
    priceFrom: 3900,
    availability: INCOMING,
    complementaryWith: ["swan-1-gen-2", "heron-1"],
  },
];

// ── SELF-ORDER KIOSKS ──────────────────────────────────────────────────

const KIOSKS: CatalogProduct[] = [
  {
    slug: "sunmi-k2-kiosk",
    name: "Sunmi K2 Smart Kiosk Terminal",
    tagline: "Take the queue off your counter.",
    category: "kiosks",
    heroImage: "/hardware/sunmi-k2-kiosk.webp",
    alt: "Sunmi K2 smart self-order kiosk terminal, front view of the touchscreen head unit.",
    shortDescription:
      "A self-order screen that lets guests browse, choose and pay themselves while your team stays on production. Same menu, same prices, same back office as your till — no second system to keep in step.",
    features: [
      "Self-order front end for counter-service venues",
      "Runs your Caisse Manager menu, prices and promotions — one source of truth",
      "Guests take their time; your staff stay on production instead of order entry",
      "Mount it on the K2 floor stand, a counter, or the wall",
      "Held in local stock — practical for a phased, site-by-site rollout",
    ],
    specs: [
      { label: "Model", value: "K2" },
      { label: "Brand", value: "Sunmi" },
      { label: "Type", value: "Self-order kiosk terminal" },
      { label: "Mounting", value: "Floor stand, counter, or wall mount" },
    ],
    priceFrom: 14000,
    availability: IN_STOCK,
    complementaryWith: ["sunmi-k2-standing", "sunmi-k2-wall-mount", "aures-odp-333"],
  },
  {
    slug: "sunmi-k2-standing",
    name: "Sunmi K2 Floor Stand",
    subline: "Free-standing — no table needed",
    tagline: "Put the kiosk where the queue forms.",
    category: "kiosks",
    heroImage: "/hardware/sunmi-k2-standing.webp",
    alt: "Sunmi K2 kiosk floor stand pedestal, free-standing configuration without a table.",
    shortDescription:
      "The floor pedestal for the K2 kiosk. It puts the screen at standing height exactly where you want guests to stop, without sacrificing a table or drilling into a wall.",
    features: [
      "Free-standing pedestal — no counter or table required",
      "Positions the kiosk screen at comfortable standing height",
      "Move it as the room's flow changes; nothing is fixed to the building",
      "Pairs with the Sunmi K-series base plate for a stable footing",
    ],
    specs: [
      { label: "Compatibility", value: "Sunmi K2 kiosk terminal" },
      { label: "Brand", value: "Sunmi" },
      { label: "Type", value: "Kiosk floor stand" },
      { label: "Installation", value: "Free-standing, no table required" },
    ],
    priceFrom: 2600,
    availability: IN_STOCK,
    complementaryWith: ["sunmi-k2-kiosk", "sunmi-k-series-base-plate", "sunmi-stand-bracket"],
  },
  {
    slug: "heron-1-mini",
    name: "Heron 1 Mini",
    subline: "15.6″ Self-service Kiosk",
    tagline: "Self-order where space is tight.",
    category: "kiosks",
    heroImage: "/hardware/heron-1-mini.webp",
    alt: "Heron 1 Mini 15.6-inch table-top self-order kiosk.",
    shortDescription:
      "Same brain as Heron 1, smaller body. 15.6″ FHD touch, integrated 80mm printer, NFC + SoftPOS, dust- and water-resistant front. Fits a café counter or a fast-casual table-line.",
    features: [
      "15.6″ 1920×1080 capacitive touch with anti-fingerprint G+G glass",
      "AI-accelerated octa-core processor",
      "Integrated 80 mm thermal printer with auto-cutter, 250 mm/s",
      "Barcode/QR scanner (standard or retail)",
      "NFC + SoftPOS + EMV + magnetic stripe support",
      "Dust- and water-resistant front face",
      "Wall, table, or floor-stand mounting",
      "Removable front cover for maintenance",
    ],
    specs: [
      { label: "Processor", value: "Octa-core A76 + A55, NPU 3 TOPS" },
      { label: "Memory", value: "4 / 8 / 16 GB RAM" },
      { label: "Storage", value: "64 / 128 / 256 GB ROM" },
      { label: "Display", value: "15.6″ 1920×1080 capacitive touch, 250 nits" },
      { label: "Operating system", value: "Android 15, 64-bit" },
      { label: "Printer", value: "80 mm thermal, 250 mm/s, auto-cutter" },
      { label: "Camera", value: "2 MP front, 75° VFOV" },
      { label: "Connectivity", value: "Wi-Fi 6 · BT 5.4 · Ethernet 1000M · NFC" },
      { label: "Dimensions (table)", value: "287 × 256 × 561 mm" },
      { label: "Model reference", value: "I25S01" },
    ],
    priceFrom: 12000,
    availability: INCOMING,
    complementaryWith: ["swan-1-gen-2", "swift-1-pro"],
  },
  {
    slug: "heron-1",
    name: "Heron 1",
    subline: "23.8″ Self-service Kiosk",
    tagline: "Self-service that feels like service.",
    category: "kiosks",
    heroImage: "/hardware/heron-1.webp",
    alt: "Heron 1 floor-standing 23.8-inch self-order kiosk.",
    shortDescription:
      "The flagship self-order kiosk. 23.8″ FHD touch, integrated 80mm thermal printer with auto-cutter, NFC + SoftPOS + EMV, optional facial recognition. Floor-mount, wall-mount, or counter.",
    features: [
      "23.8″ 1920×1080 IPS, 10-point multi-touch, anti-fingerprint",
      "AI-accelerated octa-core processor (NPU 3 TOPS)",
      "Integrated 80 mm thermal printer with auto-cutter, 250 mm/s",
      "Multiple payment paths — NFC/SoftPOS, EMV, QR",
      "Standard or retail (MRZ-capable) scanner",
      "2 MP front camera with facial recognition support",
      "100 dB stereo speaker, dual mic",
      "Floor, table, or VESA mounting",
    ],
    specs: [
      { label: "Processor", value: "Octa-core A76 + A55, NPU 3 TOPS" },
      { label: "Memory", value: "4 / 8 / 16 GB RAM" },
      { label: "Storage", value: "64 / 128 / 256 GB ROM" },
      { label: "Display", value: "23.8″ 1920×1080 IPS, 250 nits" },
      { label: "Operating system", value: "Android 15, 64-bit" },
      { label: "Printer", value: "80 mm thermal, 250 mm/s, auto-cutter" },
      { label: "Connectivity", value: "Wi-Fi 6 · BT 5.4 · Ethernet 1000M · NFC" },
      { label: "Operating temp", value: "0–50°C" },
      { label: "Dimensions (floor)", value: "410 × 460 × 1700 mm" },
      { label: "Model reference", value: "I25S02" },
    ],
    priceFrom: 18000,
    availability: INCOMING,
    complementaryWith: ["swan-1-gen-2", "swift-2-pro"],
  },
];

// ── KITCHEN DISPLAY ────────────────────────────────────────────────────

const KDS: CatalogProduct[] = [
  {
    slug: "swan-1k-gen-2",
    name: "Swan 1k",
    subline: "Gen 2",
    tagline: "Kitchen display, built to stay on.",
    category: "kds",
    heroImage: "/hardware/swan-1k-gen-2.webp",
    alt: "Swan 1k Gen 2 all-metal commercial-grade kitchen display system.",
    shortDescription:
      "Purpose-built kitchen display — slim all-metal body, VESA wall-mountable, and tuned for steamy, busy kitchens where the screen has to stay on all day, every day.",
    features: [
      "Slim full-metal body, premium finish",
      "VESA wall-mount compatible",
      "15.6″ 1920×1080 capacitive touch",
      "Wi-Fi 6, Bluetooth 5.4, Gigabit Ethernet",
      "USB-A 2.0/3.0, USB-C, RJ45/RJ11/RJ12, HDMI, 3.5mm jack",
      "Operating temperature 0–40°C",
    ],
    specs: [
      { label: "Processor", value: "Octa-core ARM A55, 2.0 GHz" },
      { label: "Memory", value: "4 GB RAM" },
      { label: "Storage", value: "64 GB ROM" },
      { label: "Display", value: "15.6″ 1920×1080 capacitive touch" },
      { label: "Operating system", value: "Android 13, 64-bit" },
      { label: "Connectivity", value: "Wi-Fi 6 · BT 5.4 · Ethernet 1000M · HDMI" },
      { label: "Mount", value: "VESA-compatible" },
      { label: "Dimensions", value: "363.8 × 230.1 × 50.4 mm" },
      { label: "Weight", value: "1.56 kg" },
    ],
    priceFrom: 3800,
    availability: IN_STOCK,
    complementaryWith: ["swan-1-gen-2", "heron-1-mini"],
  },
];

// ── PRINTING ───────────────────────────────────────────────────────────

const PRINTERS: CatalogProduct[] = [
  {
    slug: "aures-odp-333",
    name: "Aures ODP 333 Receipt Printer",
    subline: "Ver 01A · Black",
    tagline: "The receipt is out before the guest looks up.",
    category: "printers",
    heroImage: "/hardware/aures-odp-333.webp",
    alt: "Aures ODP 333 thermal receipt printer in black, front three-quarter view.",
    shortDescription:
      "The receipt printer we install most. Aures' ODP 333 is quiet at the counter, quick enough that nobody waits on the paper, and takes a fresh roll in seconds when it runs out mid-rush.",
    features: [
      "Direct thermal printing — no ribbons, no cartridges, no consumable surprises",
      "Fast enough that the receipt never becomes part of the queue",
      "New roll loads in seconds during service",
      "Works at the counter or on the pass as a kitchen ticket printer",
      "Drives the cash drawer's open signal, so till and paper stay in step",
    ],
    specs: [
      { label: "Model", value: "ODP 333" },
      { label: "Brand", value: "Aures" },
      { label: "Version", value: "01A" },
      { label: "Finish", value: "Black" },
      { label: "Print method", value: "Direct thermal" },
      { label: "Use case", value: "Receipts at the counter · tickets on the pass" },
    ],
    priceFrom: 2200,
    availability: IN_STOCK,
    complementaryWith: ["aures-3s333", "wdlink-wd0408", "wdlink-pos-all-in-one-i3"],
  },
  {
    slug: "wdlink-wd8260",
    name: "WDLink WD8260 Thermal Printer",
    subline: "Receipt printing",
    tagline: "Paper out, guest gone, next order.",
    category: "printers",
    heroImage: "/hardware/wdlink-wd8260.webp",
    alt: "WDLink WD8260 thermal receipt printer in black, front three-quarter view.",
    shortDescription:
      "A thermal receipt printer sized for the everyday counter. It pairs naturally with the WDLink terminals we stock, so the till, the printer and the drawer all come from one shelf and one support line.",
    features: [
      "Direct thermal printing — nothing to replace but the paper",
      "Matched to the WDLink terminals in our range",
      "Handles receipts at the counter and tickets on the pass",
      "Triggers the cash drawer on print, so the till opens itself",
    ],
    specs: [
      { label: "Model", value: "WD8260" },
      { label: "Brand", value: "WDLink" },
      { label: "Print method", value: "Direct thermal" },
      { label: "Use case", value: "Receipt printing" },
    ],
    priceFrom: 1500,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-pos-all-in-one-j1900", "wdlink-wd0408", "wdlink-wd9100"],
  },
  {
    slug: "wdlink-wd8220",
    name: "WDLink WD8220 Thermal Label Printer",
    tagline: "Labels for everything that leaves the kitchen.",
    category: "printers",
    heroImage: "/hardware/wdlink-wd8220.webp",
    alt: "WDLink WD8220 thermal label printer in black, front three-quarter view.",
    shortDescription:
      "The label printer behind a tidy operation: shelf tickets, weighed-item labels, prep dates, allergen notes, takeaway seals. Print a barcode once and every till in the business reads the same price.",
    features: [
      "Thermal label printing — barcodes, prices, prep and date labels",
      "Print the barcode you scan: one label, one price, every till",
      "Date and allergen labels for prep, without a marker pen",
      "Seals takeaway bags so a delivery leaves closed and identified",
    ],
    specs: [
      { label: "Model", value: "WD8220" },
      { label: "Brand", value: "WDLink" },
      { label: "Print method", value: "Direct thermal" },
      { label: "Use case", value: "Label and barcode printing" },
    ],
    priceFrom: 1900,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-wd9100", "wdlink-pos-all-in-one-i3", "wdlink-wd9300"],
  },
  {
    slug: "epson-printer",
    name: "Epson Printer",
    subline: "3-inch · Kitchen & Retail",
    tagline: "Built for the line. Engineered for the long shift.",
    category: "printers",
    heroImage: "/hardware/epson-printer.png",
    alt: "Epson 3-inch (80 mm) thermal kitchen and retail printer.",
    shortDescription:
      "An Epson-grade workhorse for the kitchen pass and the retail counter. 80 mm thermal, auto-cutter, multi-interface, with the reliability ratings that justify daily abuse.",
    features: [
      "80 mm (3-inch) thermal print",
      "Auto-cutter rated for high-volume kitchens",
      "Drop-in paper loading — no wrong-way mistakes",
      "USB + Serial + Ethernet (model-dependent)",
      "Industrial MTBF rating for heavy daily use",
      "ESC/POS standard for plug-and-play with major POS systems",
    ],
    specs: [
      { label: "Print method", value: "Direct thermal" },
      { label: "Paper width", value: "80 mm (3-inch)" },
      { label: "Print speed", value: "Up to 250 mm/s" },
      { label: "Interfaces", value: "USB · Serial · Ethernet" },
      { label: "Cutter", value: "Auto, high-cycle rated" },
      { label: "Use case", value: "Kitchen pass · retail counter" },
      { label: "Standards", value: "ESC/POS compatible" },
    ],
    priceFrom: 2400,
    availability: INCOMING,
    complementaryWith: ["swan-1k-gen-2", "swan-1-gen-2"],
  },
];

// ── CASH MANAGEMENT ────────────────────────────────────────────────────

const CASH_DRAWERS: CatalogProduct[] = [
  {
    slug: "drawer",
    name: "Drawer",
    subline: "Compact 335 mm",
    tagline: "Compact footprint, full-till discipline.",
    category: "cash-drawers",
    heroImage: "/hardware/drawer.png",
    alt: "Compact 335 mm POS cash drawer with 4 bill and 5 coin compartments.",
    shortDescription:
      "A short-counter cash drawer that earns its place. 4 bill / 5 coin compartments, manual key release, and an RJ-11 trigger that fires open on receipt print.",
    features: [
      "335 mm footprint — fits behind tight counters",
      "4 bill compartments, 5 coin compartments",
      "Electronic open via RJ-11 (printer-triggered)",
      "Manual key release for after-hours access",
      "Steel chassis with smooth-action ball-bearing slide",
      "Removable insert tray for end-of-day cash-up",
    ],
    specs: [
      { label: "Width", value: "335 mm" },
      { label: "Compartments", value: "4 bill · 5 coin" },
      { label: "Interface", value: "RJ-11 (12 V trigger)" },
      { label: "Lock", value: "3-position cylinder, manual key" },
      { label: "Chassis", value: "Powder-coated steel" },
      { label: "Slide", value: "Ball-bearing rails, silent close" },
    ],
    priceFrom: 1100,
    availability: IN_STOCK,
    complementaryWith: ["swan-1-gen-2", "epson-printer"],
  },
  {
    slug: "drawer-flip-top",
    name: "Drawer Flip-Top",
    subline: "FT-460 · Slim · Top-opening",
    tagline: "Slim profile, full till. Opens upward — saves the counter.",
    category: "cash-drawers",
    heroImage: "/hardware/drawer-flip-top.png",
    alt: "Slim FT-460 flip-top POS cash drawer with steel chassis and removable till insert.",
    shortDescription:
      "A low-profile flip-top cash drawer. The lid lifts up instead of sliding out, so it works under tight shelves and along narrow counters. Removable insert tray, key release, RJ-11 trigger.",
    features: [
      "Flip-top lid — lifts up, no slide-out clearance needed",
      "Slim 460 mm body fits under shallow counters",
      "4 bill compartments, 5 coin compartments (removable insert)",
      "Electronic open via RJ-11 (printer-triggered)",
      "Manual key release with 3-position lock",
      "Powder-coated steel chassis, satin black",
    ],
    specs: [
      { label: "Model", value: "FT-460" },
      { label: "Width", value: "460 mm" },
      { label: "Opening", value: "Flip-top (vertical)" },
      { label: "Compartments", value: "4 bill · 5 coin" },
      { label: "Interface", value: "RJ-11 (12 V trigger)" },
      { label: "Lock", value: "3-position cylinder, manual key" },
      { label: "Chassis", value: "Powder-coated steel" },
    ],
    priceFrom: 1400,
    availability: IN_STOCK,
    complementaryWith: ["swan-1-gen-2", "epson-printer"],
  },
  {
    slug: "aures-3s333",
    name: "Aures 3S-333-N-24V Cash Drawer",
    subline: "ART-02970 · Black · 24 V",
    tagline: "Opens on the cut. Locks on the key.",
    category: "cash-drawers",
    heroImage: "/hardware/aures-3s333.webp",
    alt: "Aures 3S-333 cash drawer in black steel, drawer half open showing the removable note and coin insert.",
    shortDescription:
      "Aures' full-size steel till drawer in black, driven by a 24 V trigger that fires the moment your receipt printer cuts. The insert tray lifts straight out, so the end-of-day count happens away from the counter.",
    features: [
      "Full-size steel drawer with a brushed black finish",
      "24 V printer-driven trigger — opens as the receipt is cut",
      "Manual key lock for after-hours and cash-drop discipline",
      "Removable insert tray with separate note and coin compartments",
      "Lifts out for cash-up in the office instead of in front of the queue",
    ],
    specs: [
      { label: "Model", value: "3S-333-N-24V" },
      { label: "Reference", value: "ART-02970" },
      { label: "Brand", value: "Aures" },
      { label: "Finish", value: "Black" },
      { label: "Trigger", value: "24 V solenoid, printer-driven" },
      { label: "Chassis", value: "Steel" },
      { label: "Insert", value: "Removable note + coin tray" },
    ],
    priceFrom: 1600,
    availability: IN_STOCK,
    complementaryWith: ["aures-odp-333", "wdlink-pos-all-in-one-i5", "wdlink-wd9300"],
  },
  {
    slug: "wdlink-wd0408",
    name: "WDLink WD0408 Cash Drawer",
    tagline: "The drawer that just opens.",
    category: "cash-drawers",
    heroImage: "/hardware/wdlink-wd0408.webp",
    alt: "WDLink WD0408 steel POS cash drawer, front three-quarter view with the till insert visible.",
    shortDescription:
      "The workhorse drawer we pair with most WDLink tills. Steel body, key lock, printer-triggered open — nothing to configure at install and nothing to go wrong on a Saturday night.",
    features: [
      "Steel chassis built for years of slam-shut service",
      "Opens on the printer's cash-drawer signal — no extra wiring to the till",
      "Manual key release for opening and closing the day",
      "Removable insert tray for notes and coin",
      "Matched to the WDLink terminals and printers in our range",
    ],
    specs: [
      { label: "Model", value: "WD0408" },
      { label: "Brand", value: "WDLink" },
      { label: "Chassis", value: "Steel" },
      { label: "Trigger", value: "Printer-driven cash-drawer port" },
      { label: "Lock", value: "Manual key" },
      { label: "Insert", value: "Removable note + coin tray" },
    ],
    priceFrom: 900,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-wd8260", "wdlink-pos-all-in-one-i3", "wdlink-wd9100"],
  },
  {
    slug: "ci-10x-cash-recycler",
    name: "Glory CI-10X Coin Recycler",
    subline: "Monnayeur · automated coin handling",
    tagline: "Nobody touches the coin. Nobody argues about the count.",
    category: "cash-drawers",
    heroImage: "/hardware/ci-10x-cash-recycler.webp",
    alt: "Glory CI-10X automated coin recycler unit, front view.",
    shortDescription:
      "An automated coin unit for high-volume counters: guests pay in, the machine counts, secures and returns change on its own. Cash-up stops being a nightly negotiation and shortfalls stop being a guess.",
    features: [
      "Accepts coin and dispenses change automatically",
      "Cash stays inside a locked unit — less handling, fewer disputes",
      "Counts continuously, so the till is reconciled as you trade",
      "Frees cashiers from change-making at the busiest moment of the day",
      "En arrivage — we confirm configuration and till integration before delivery",
    ],
    specs: [
      { label: "Model", value: "CI-10X" },
      { label: "Brand", value: "Glory" },
      { label: "Type", value: "Coin recycler / automated change unit" },
    ],
    priceFrom: 42000,
    availability: INCOMING,
    complementaryWith: ["wdlink-pos-all-in-one-i5", "aures-odp-333", "aures-3s333"],
  },
];

// ── SCANNING ───────────────────────────────────────────────────────────

const SCANNERS: CatalogProduct[] = [
  {
    slug: "wdlink-wd9300",
    name: "WDLink WD9300 Barcode Scanner",
    subline: "Counter-top · Black",
    tagline: "Present the item. Hear the beep. Move on.",
    category: "scanners",
    heroImage: "/hardware/wdlink-wd9300.webp",
    alt: "WDLink WD9300 counter-top barcode scanner in black, standing on its base.",
    shortDescription:
      "A counter-top scanner that sits and waits while your hands stay busy. The right shape for a bakery, grocery or takeaway counter where one hand is always holding something already.",
    features: [
      "Counter-top presentation scanner — no trigger to pull",
      "Keeps a hand free at a counter where hands are always full",
      "Scans straight into the open ticket on your till",
      "Speeds price checks as much as checkout",
    ],
    specs: [
      { label: "Model", value: "WD9300" },
      { label: "Brand", value: "WDLink" },
      { label: "Form factor", value: "Counter-top / presentation" },
      { label: "Finish", value: "Black" },
    ],
    priceFrom: 1100,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-pos-all-in-one-i5", "wdlink-wd8220", "wdlink-wd0408"],
  },
  {
    slug: "wdlink-wd9100",
    name: "WDLink WD9100 Barcode Scanner",
    subline: "Handheld · Black",
    tagline: "The default scanner on our shelf.",
    category: "scanners",
    heroImage: "/hardware/wdlink-wd9100.webp",
    alt: "WDLink WD9100 handheld barcode scanner in black, side view with cable.",
    shortDescription:
      "The everyday handheld: point, pull, and the code lands in the open ticket. Priced so a second till or a stock-room station is an easy decision rather than a budget conversation.",
    features: [
      "Handheld trigger scanner for counter and stock work",
      "Scans into the open ticket — no typing, no mis-keyed prices",
      "Also the fastest way to receive deliveries and count stock",
      "Our default scanner, so spares are already on the shelf",
    ],
    specs: [
      { label: "Model", value: "WD9100" },
      { label: "Brand", value: "WDLink" },
      { label: "Form factor", value: "Handheld" },
      { label: "Finish", value: "Black" },
    ],
    priceFrom: 650,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-pos-all-in-one-i3", "wdlink-wd8220", "wdlink-wd0408"],
  },
  {
    slug: "wdlink-wd9100s",
    name: "WDLink WD9100S Barcode Scanner",
    subline: "Handheld · Black",
    tagline: "The S revision of our everyday handheld.",
    category: "scanners",
    heroImage: PHOTO_PENDING,
    alt: pendingAlt("WDLink WD9100S handheld barcode scanner"),
    shortDescription:
      "The S variant of the WD9100 handheld, stocked alongside it. Same counter workflow — scan to add a line, scan to check a price, scan to receive stock. Tell us what you scan and we'll confirm which of the two suits your counter.",
    features: [
      "Handheld trigger scanner from the WDLink 9100 family",
      "Same workflow as the WD9100: scan to sell, scan to receive, scan to count",
      "Stocked alongside the WD9100, so either revision ships immediately",
      "We'll confirm the right revision for your labels before you order",
    ],
    specs: [
      { label: "Model", value: "WD9100S" },
      { label: "Brand", value: "WDLink" },
      { label: "Form factor", value: "Handheld" },
      { label: "Finish", value: "Black" },
    ],
    priceFrom: 750,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-wd9100", "wdlink-wd8220", "wdlink-pos-all-in-one-i3"],
  },
  {
    slug: "wdlink-wd9800p",
    name: "WDLink WD9800P Barcode Scanner",
    subline: "Black",
    tagline: "A step up the scanner range.",
    category: "scanners",
    heroImage: "/hardware/wdlink-wd9800p.webp",
    alt: "WDLink WD9800P barcode scanner in black, three-quarter view.",
    shortDescription:
      "WDLink's 9800-series reader, sitting above the 9100 in the range. Tell us what you actually scan — crisp printed labels, phone screens, or worn barcodes on returnable crates — and we'll confirm this is the right head for it.",
    features: [
      "WDLink 9800-series reader, above the 9100 handhelds in the range",
      "Specified for counters where the everyday scanner keeps missing codes",
      "Scans into the open ticket like the rest of our readers",
      "We match the reader to your labels before you buy",
    ],
    specs: [
      { label: "Model", value: "WD9800P" },
      { label: "Brand", value: "WDLink" },
      { label: "Finish", value: "Black" },
    ],
    priceFrom: 1600,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-pos-all-in-one-i5", "wdlink-wd8220", "wdlink-wd9300"],
  },
  {
    slug: "2d-scanner",
    name: "2D Scanner",
    subline: "1D + 2D · Wired",
    tagline: "Every code, every angle, instantly.",
    category: "scanners",
    heroImage: "/hardware/2d-scanner.png",
    alt: "Wired handheld 1D + 2D QR and barcode scanner with USB interface.",
    shortDescription:
      "A wired counter-grade scanner that reads everything you throw at it — printed barcodes, mobile QR codes, loyalty tokens — at speed. Plug-and-play USB; no driver dance.",
    features: [
      "1D + 2D + QR + PDF417 + DataMatrix",
      "Reads codes off phone screens (loyalty, tickets, online order pickup)",
      "Auto-trigger + manual trigger modes",
      "USB HID — plug into any POS, zero drivers",
      "1.5 m wired tether, durable strain relief",
      "IP54 rated against dust + counter spills",
    ],
    specs: [
      { label: "Symbology", value: "1D · 2D · QR · PDF417 · DataMatrix" },
      { label: "Sensor", value: "CMOS area imager" },
      { label: "Interface", value: "USB HID (also serial/RS232 variant)" },
      { label: "Modes", value: "Auto-sense, hand-trigger, continuous" },
      { label: "Reads from", value: "Print + LCD / phone screens" },
      { label: "Durability", value: "IP54 · 1.5 m drop" },
      { label: "Cable", value: "1.5 m coiled USB" },
    ],
    priceFrom: 850,
    availability: IN_STOCK,
    complementaryWith: ["swan-1-gen-2", "epson-printer"],
  },
];

// ── CUSTOMER PAGING (Syscall) ──────────────────────────────────────────
//
// Specs and features on the Syscall products below are transcribed from
// the Syscall reseller catalogue (see scratchpad syscall-specs.json).
// Where the catalogue is silent — the -PC references, the SR-A330 — the
// spec table stays short rather than inventing figures.

const PAGING: CatalogProduct[] = [
  {
    slug: "syscall-gp-2000t",
    name: "Syscall GP-2000T Transmitter",
    subline: "Multi-transmitter · counter keypad",
    tagline: "Type the number. Press call. Done.",
    category: "paging",
    heroImage: "/hardware/syscall-gp-2000t.webp",
    alt: "Syscall GP-2000T multi-transmitter keypad in black with OLED display.",
    shortDescription:
      "The keypad your team actually touches. Enter the pager number, press CALL, and the guest's coaster buzzes wherever they've chosen to sit. The OLED line confirms what went out, so nobody wonders whether the call was sent.",
    features: [
      "Smart touch keypad for easy touch control",
      "OLED display",
      "Beep and haptic feedback: audio and vibration alerts",
      "Fixed antenna for a stable wireless signal",
      "Function keys F1-F4, channel (CH) and CALL keys on the keypad",
    ],
    specs: [
      { label: "Model", value: "GP-2000T" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "W100 × L177 × H33 mm" },
      { label: "Weight", value: "200 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "Polymer battery" },
      { label: "Antenna", value: "Helical" },
      { label: "Compatibility", value: "Syscall guest pagers and the SRT-8200 repeater" },
    ],
    priceFrom: 2400,
    availability: IN_STOCK,
    complementaryWith: ["syscall-gp-101r-10c", "syscall-srt-8200", "signature-guest-pager"],
  },
  {
    slug: "syscall-gp-2000t-pc",
    name: "Syscall GP-2000T-PC Transmitter",
    subline: "Black",
    tagline: "The -PC reference of the counter keypad.",
    category: "paging",
    heroImage: "/hardware/syscall-gp-2000t-pc.webp",
    alt: "Syscall GP-2000T-PC multi-transmitter in black, front view of the keypad.",
    shortDescription:
      "The GP-2000T multi-transmitter in the -PC configuration we hold in stock. Same job at the counter — call a specific pager and confirm it went — and the same compatibility across the Syscall pagers we sell.",
    features: [
      "Counter keypad for calling Syscall guest pagers",
      "Held in stock alongside the standard GP-2000T reference",
      "Works with the Syscall coaster pagers and the SRT-8200 repeater",
      "We confirm which reference fits your installation before shipping",
    ],
    specs: [
      { label: "Model", value: "GP-2000T-PC" },
      { label: "Brand", value: "Syscall" },
      { label: "Family", value: "GP-2000T multi-transmitter" },
      { label: "Colour", value: "Black" },
    ],
    priceFrom: 2400,
    availability: IN_STOCK,
    complementaryWith: ["syscall-gp-2000t", "syscall-gp-101r-10c", "syscall-srt-8200"],
  },
  {
    slug: "syscall-sr-300f",
    name: "Syscall SR-300F Receiver",
    subline: "Mini call display",
    tagline: "See the table. Hear the call.",
    category: "paging",
    heroImage: "/hardware/syscall-sr-300f.webp",
    alt: "Syscall SR-300F mini LED call display in white, wall or stand mounted.",
    shortDescription:
      "A small display for the pass or the wall behind the bar. It shows the number of the table that just called and announces it with a melody or a spoken message, so staff hear it without having to watch a screen.",
    features: [
      "Mini and compact, space-saving design",
      "2-in-1 type: wall-mounted or stand type",
      "7 melodies and 20 voice messages, customisable audio notifications",
      "Supports up to 400 call buttons / transmitters",
      "LED display shows the customer call number",
    ],
    specs: [
      { label: "Model", value: "SR-300F" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "107 × 107 × 32 mm" },
      { label: "Weight", value: "135 g" },
      { label: "Colour", value: "White" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Audio", value: "Built-in speaker · 7 melodies, 20 voice messages" },
      { label: "Power", value: "DC 12 V / 1 A" },
      { label: "Capacity", value: "Up to 400 call buttons" },
      { label: "Compatibility", value: "All Syscall call buttons and ST-5020" },
    ],
    priceFrom: 1600,
    availability: IN_STOCK,
    complementaryWith: ["syscall-st-600", "syscall-st-300-2b", "syscall-srt-8200"],
  },
  {
    slug: "syscall-sr-a330",
    name: "Syscall SR-A330 Receiver",
    subline: "White",
    tagline: "The wall monitor for table calls.",
    category: "paging",
    heroImage: "/hardware/syscall-sr-a330.webp",
    alt: "Syscall SR-A330 receiver monitor in white, wall-mounted orientation.",
    shortDescription:
      "A receiver from Syscall's SR-A range that collects the calls coming off your table buttons and shows the team which table is waiting. Mounts where the staff already look — behind the bar, at the pass, by the service door.",
    features: [
      "Collects calls from the Syscall buttons on your tables",
      "Shows waiting tables where your team already looks",
      "Works with the Syscall call buttons we stock",
      "Coverage extends with the SRT-8200 repeater for larger rooms",
    ],
    specs: [
      { label: "Model", value: "SR-A330" },
      { label: "Brand", value: "Syscall" },
      { label: "Family", value: "SR-A series receiver" },
      { label: "Colour", value: "White" },
      { label: "Compatibility", value: "Syscall call buttons · SRT-8200 repeater" },
    ],
    priceFrom: 1900,
    availability: IN_STOCK,
    complementaryWith: ["syscall-st-600", "syscall-srt-8200", "syscall-st-900"],
  },
  {
    slug: "syscall-srt-8200",
    name: "Syscall SRT-8200 Repeater",
    subline: "Black",
    tagline: "For the corner of the room where calls don't land.",
    category: "paging",
    heroImage: "/hardware/syscall-srt-8200.webp",
    alt: "Syscall SRT-8200 wireless signal repeater in black with rod antenna.",
    shortDescription:
      "The fix for the far end of a long room, the mezzanine, or the terrace behind a thick wall. Put the repeater between your counter and the dead zone and the calls carry — no rewiring, no second system.",
    features: [
      "Easy setup with simple touch switch operation",
      "Wide coverage: extends signal range between devices",
      "Runs in either registration or non-registration mode",
      "High compatibility: works with all Syscall devices",
      "Stable, reliable wireless communication",
      "LED display and S1 / S2 / S3 touch switches",
    ],
    specs: [
      { label: "Model", value: "SRT-8200" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "W159 × L99 × H23 mm" },
      { label: "Weight", value: "150 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "433.42 MHz" },
      { label: "Battery", value: "Polymer battery" },
      { label: "Antenna", value: "Rod antenna" },
      { label: "Compatibility", value: "All Syscall call bells, pagers and SR-A series monitors" },
    ],
    priceFrom: 1800,
    availability: IN_STOCK,
    complementaryWith: ["syscall-gp-2000t", "syscall-sr-a330", "syscall-st-600"],
  },
  {
    slug: "syscall-srt-8200t-pc",
    name: "Syscall SRT-8200T-PC",
    subline: "SRT-8200 family",
    tagline: "The -PC reference of the repeater family.",
    category: "paging",
    heroImage: "/hardware/syscall-srt-8200t-pc.webp",
    alt: "Syscall SRT-8200T-PC unit from the SRT-8200 repeater family, front view.",
    shortDescription:
      "The -PC reference from the SRT-8200 family, held in stock beside the standard repeater. It extends the reach of the same Syscall calling network; we confirm which reference your floor plan needs when we survey the site.",
    features: [
      "Extends the coverage of your Syscall calling network",
      "Held in stock alongside the standard SRT-8200 repeater",
      "Works within the same 433 MHz Syscall installation",
      "Reference confirmed against your floor plan before it ships",
    ],
    specs: [
      { label: "Model", value: "SRT-8200T-PC" },
      { label: "Brand", value: "Syscall" },
      { label: "Family", value: "SRT-8200 repeater series" },
    ],
    priceFrom: 1800,
    availability: IN_STOCK,
    complementaryWith: ["syscall-srt-8200", "syscall-gp-2000t", "syscall-sr-a330"],
  },
  {
    slug: "syscall-s-watch",
    name: "Syscall S-Watch",
    subline: "Wrist receiver",
    tagline: "Your team wears the calls.",
    category: "paging",
    heroImage: "/hardware/syscall-s-watch.webp",
    alt: "Syscall S-Watch wrist pager receiver in black with full touch screen.",
    shortDescription:
      "A wrist receiver for the floor team. When a table presses its button the watch vibrates and shows which one, so whoever is already out there answers it — instead of walking back to the pass to check a screen.",
    features: [
      "Alerts by sound, vibration, or both",
      "Supports 450 call buttons",
      "Long battery life: up to 20 hours of continuous use",
      "IP68 waterproof, water and dust resistant",
      "Full touch screen showing the calling zone / station",
    ],
    specs: [
      { label: "Model", value: "S-Watch" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "W39 × L46 × 11 mm" },
      { label: "Weight", value: "29 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "Polymer · up to 20 hours continuous use" },
      { label: "Capacity", value: "Supports 450 call buttons" },
      { label: "Water resistance", value: "IP68 — water and dust resistant" },
      { label: "Compatibility", value: "All Syscall transmitters and call buttons" },
    ],
    priceFrom: 1600,
    availability: IN_STOCK,
    complementaryWith: ["syscall-st-600", "syscall-st-900", "syscall-srt-8200"],
  },
  {
    slug: "syscall-sb-700n",
    name: "Syscall SB-700N Watch Pager",
    subline: "Black · with clip",
    tagline: "Called without shouting.",
    category: "paging",
    heroImage: "/hardware/syscall-sb-700n.webp",
    alt: "Syscall SB-700N watch pager in black with belt clip.",
    shortDescription:
      "A pocket or belt-clip pager for staff. It receives calls straight from the Syscall buttons on your tables and from the counter transmitter, so the kitchen can call a runner and a guest can call a waiter without anyone raising their voice.",
    features: [
      "Touch controls",
      "Supports up to 450 registered callers",
      "Approx. 1.5-hour charge gives up to 1 day of use",
      "Water-resistant design",
      "Receives calls directly from Syscall transmitters",
    ],
    specs: [
      { label: "Model", value: "SB-700N" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "W45 × L56 × H11 mm" },
      { label: "Weight", value: "42 g" },
      { label: "Colour", value: "Black (range: black, steel blue, silver)" },
      { label: "Frequency", value: "FM 433 MHz" },
      { label: "Battery", value: "3.7 V / 320 mA Li-Polymer · ~1.5 h charge for up to 1 day" },
      { label: "Capacity", value: "Up to 450 caller IDs" },
      { label: "Water resistance", value: "Water-resistant design" },
      { label: "Compatibility", value: "All Syscall call-button transmitters and the multi-transmitter" },
    ],
    priceFrom: 1200,
    availability: IN_STOCK,
    complementaryWith: ["syscall-st-600", "syscall-gp-2000t", "syscall-srt-8200"],
  },
  {
    slug: "syscall-st-600",
    name: "Syscall ST-600 Call Button",
    subline: "Black · Call / Bill / Clear",
    tagline: "Three buttons instead of a raised hand.",
    category: "paging",
    heroImage: "/hardware/syscall-st-600.webp",
    alt: "Syscall ST-600 round table call button in black with call, bill and clear keys.",
    shortDescription:
      "The table button we install by the hundred: call a waiter, ask for the bill, clear the call. Guests stop hunting for eye contact, and your team stops walking laps to check whether a table needs anything.",
    features: [
      "Three service functions: Call / Bill / Clear",
      "Reliable FSK / 433.42 MHz wireless signal",
      "Long battery life: approx. 40,000 calls",
      "Easy to use: simple 3-button operation",
      "Compact round design suited to restaurants, cafes and hotels",
    ],
    specs: [
      { label: "Model", value: "ST-600" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "Diameter 59 × H9 mm" },
      { label: "Weight", value: "20 g" },
      { label: "Colour", value: "Black (range: black, wine)" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "DC 3 V coin cell (CR2025) · approx. 40,000 calls" },
      { label: "Antenna", value: "PCB pattern antenna" },
      { label: "Compatibility", value: "All Syscall receivers and the repeater" },
    ],
    priceFrom: 280,
    availability: IN_STOCK,
    complementaryWith: ["syscall-sr-300f", "syscall-s-watch", "syscall-srt-8200"],
  },
  {
    slug: "syscall-st-900",
    name: "Syscall ST-900 Call Button",
    subline: "Black · IP67",
    tagline: "The button that survives the terrace.",
    category: "paging",
    heroImage: "/hardware/syscall-st-900.webp",
    alt: "Syscall ST-900 pebble-shaped waterproof call button in black with illuminated call ring.",
    shortDescription:
      "A sealed, pebble-shaped call button for outside tables. IP67 against rain and spilled drinks, so the terrace gets exactly the same one-press service as the room inside.",
    features: [
      "IP67 waterproof, ideal for indoor and outdoor use",
      "Stable 433.42 MHz wireless communication",
      "Long battery life: approx. 40,000 calls",
      "One-touch call for fast customer assistance",
      "Pebble-shaped design with soft-touch texture",
      "Illuminated call ring on the top face",
    ],
    specs: [
      { label: "Model", value: "ST-900" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "W58 × L67 × H14 mm" },
      { label: "Weight", value: "25 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "DC 3 V coin cell (CR2032) · approx. 40,000 calls" },
      { label: "Antenna", value: "PCB pattern antenna" },
      { label: "Water resistance", value: "IP67" },
      { label: "Compatibility", value: "All Syscall receivers and the repeater" },
    ],
    priceFrom: 320,
    availability: IN_STOCK,
    complementaryWith: ["syscall-s-watch", "syscall-sr-300f", "syscall-srt-8200"],
  },
  {
    slug: "syscall-st-300-2b",
    name: "Syscall ST-300-2B Call Button",
    subline: "Black / White · Call + Clear",
    tagline: "Flat on the table, out of the way.",
    category: "paging",
    heroImage: "/hardware/syscall-st-300-2b.webp",
    alt: "Syscall ST-300-2B slim round table call button with call and clear keys.",
    shortDescription:
      "The slimmest button in the range: press to call, press again to clear. At 9 mm tall it sits flat on a small café table without becoming another object to work around.",
    features: [
      "Water resistant, reliable in busy environments",
      "433 MHz stable FSK wireless communication",
      "Long battery life: approx. 40,000 presses (CR2025)",
      "One-touch call for instant staff assistance",
      "CALL and CLEAR buttons on the face",
      "Slim, modern design built for daily commercial use",
    ],
    specs: [
      { label: "Model", value: "ST-300-2B" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "Diameter 59 × H9 mm" },
      { label: "Weight", value: "20 g" },
      { label: "Colour", value: "Black (range: black, navy)" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "CR2025 coin cell · approx. 40,000 presses" },
      { label: "Antenna", value: "PCB pattern antenna" },
      { label: "Water resistance", value: "Water resistant" },
      { label: "Compatibility", value: "All Syscall receivers and the repeater" },
    ],
    priceFrom: 260,
    availability: IN_STOCK,
    complementaryWith: ["syscall-sr-300f", "syscall-s-watch", "syscall-sr-a330"],
  },
  {
    slug: "syscall-st-800-3b",
    name: "Syscall ST-800-3B Transmitter",
    subline: "Call / Bill / Clear",
    tagline: "One button standard across the whole floor.",
    category: "paging",
    heroImage: "/hardware/syscall-st-800-3b.webp",
    alt: "Syscall ST-800-3B square table transmitter in black with three service buttons.",
    shortDescription:
      "A three-button table transmitter in a rounded-square case: call, bill, clear. Ordered for the next shipment for venues that want one identical button on every table, inside and out.",
    features: [
      "Three buttons: Call / Bill / Clear",
      "Reliable 433 MHz wireless signal",
      "Long battery life: approx. 40,000 presses",
      "Compact and easy to use: hand / touch operation",
      "Premium matte finish, rounded-square design",
      'Face reads "Press button for service"',
    ],
    specs: [
      { label: "Model", value: "ST-800-3B" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "W54 × L54 × H11 mm" },
      { label: "Weight", value: "20 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FM 433 MHz" },
      { label: "Battery", value: "DC 3 V coin cell (CR2025) · approx. 40,000 presses" },
      { label: "Compatibility", value: "All Syscall receivers, Direct Pager (SB-600), repeater" },
    ],
    priceFrom: 300,
    availability: INCOMING,
    complementaryWith: ["syscall-sr-300f", "syscall-s-watch", "syscall-srt-8200"],
  },
  {
    slug: "syscall-gp-101r-10c",
    name: "Syscall GP-101R Coaster Pager Set",
    subline: "10 pagers + charger · Black",
    tagline: "Let guests sit anywhere.",
    category: "paging",
    heroImage: "/hardware/syscall-gp-101r-10c.webp",
    alt: "Syscall GP-101R coaster pager set — ten black round pagers stacked on their charging base.",
    shortDescription:
      "Ten coaster pagers and their charging base: the complete kit for a counter-service venue. Hand one over with the order, and the guest can sit wherever they like — when the food is up, the coaster buzzes, lights and vibrates.",
    features: [
      "Complete set: 10 coaster pagers with charging base",
      "Three alert modes: buzzer, vibration and LED",
      "Large branding area for a custom logo",
      "Shock-absorbing design with silicone protection ring",
      "Stackable design: compact and space-saving",
      'Guest instruction printed on the pager face: "When the beeper is vibrating" / "Please come to the pick-up desk"',
    ],
    specs: [
      { label: "Model", value: "GP-101R (10C set)" },
      { label: "Brand", value: "Syscall" },
      { label: "Set contents", value: "10 pagers + charging base" },
      { label: "Pager size", value: "W95 × L95 × H17 mm" },
      { label: "Pager weight", value: "75 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FM 433 MHz" },
      { label: "Battery", value: "Li-Polymer, rechargeable" },
      { label: "Antenna", value: "Helical antenna" },
      { label: "Compatibility", value: "Multi-transmitter GP-1000T / GP-2000T" },
    ],
    priceFrom: 6500,
    availability: IN_STOCK,
    complementaryWith: ["syscall-gp-2000t", "syscall-gp-101r", "syscall-srt-8200"],
  },
  {
    slug: "syscall-gp-101r",
    name: "Syscall GP-101R Pager",
    subline: "Single pager · Black · no charger",
    tagline: "The spare that keeps the set at ten.",
    category: "paging",
    heroImage: "/hardware/syscall-gp-101r.webp",
    alt: "Syscall GP-101R single round coaster pager in black.",
    shortDescription:
      "One GP-101R coaster pager, supplied without a charging base. The replacement when a pager walks out of the door in a coat pocket, or the top-up when your floor gets busier than the original set.",
    features: [
      "Three alert modes: buzzer, vibration and LED",
      "Large branding area for a custom logo",
      "Shock-absorbing design with silicone protection ring",
      "Stackable design: compact and space-saving",
      "Charges on an existing GP-101C base — no second charger needed",
    ],
    specs: [
      { label: "Model", value: "GP-101R" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "W95 × L95 × H17 mm" },
      { label: "Weight", value: "75 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FM 433 MHz" },
      { label: "Power source", value: "DC 8 V / 3 A · Li-Polymer" },
      { label: "Antenna", value: "Helical antenna" },
      { label: "Compatibility", value: "Multi-transmitter GP-1000T / GP-2000T" },
    ],
    priceFrom: 550,
    availability: INCOMING,
    complementaryWith: ["syscall-gp-101r-10c", "syscall-gp-101c", "syscall-gp-2000t"],
  },
  {
    slug: "syscall-gp-100r",
    name: "Syscall GP-100R Pager",
    subline: "Single pager · Red or Green · no charger",
    tagline: "A spare pager, in your colour.",
    category: "paging",
    heroImage: "/hardware/syscall-gp-100r.webp",
    alt: "Syscall GP-100R round coaster pager, red and green colourways.",
    shortDescription:
      "The round GP-100R pager on its own, in red or green. A spare for an existing set, or simply a colour that sits better with your branding than black does.",
    features: [
      "Three alert modes: buzzer, vibration and LED",
      "Large branding area for a custom logo",
      "Shock-absorbing design with silicone protection ring",
      "Stackable design: compact, space-saving, stackable charging",
      'Guest instruction printed on the pager face: "When the beeper is vibrating" / "Please come to the pick-up desk"',
    ],
    specs: [
      { label: "Model", value: "GP-100R" },
      { label: "Brand", value: "Syscall" },
      { label: "Size", value: "Diameter 95 × H18 mm" },
      { label: "Weight", value: "78 g" },
      { label: "Colour", value: "Red, green" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Power source", value: "DC 8 V / 3 A · Li-Polymer" },
      { label: "Antenna", value: "Helical antenna" },
      { label: "Compatibility", value: "GP-2000T / GP-1000T transmitters · SRT-8200 repeater" },
    ],
    priceFrom: 550,
    availability: INCOMING,
    complementaryWith: ["syscall-gp-100r-10c", "syscall-gp-100c", "syscall-gp-2000t"],
  },
  {
    slug: "syscall-gp-100r-10c",
    name: "Syscall GP-100R Pager Pack",
    subline: "10 pagers + charger",
    tagline: "The counter queue, gone.",
    category: "paging",
    heroImage: "/hardware/syscall-gp-100r-10c.webp",
    alt: "Syscall GP-100R pager pack — ten round pagers on their stackable charging base.",
    shortDescription:
      "The full GP-100R kit: ten stackable pagers and the charger they live on. Guests take a pager, take a seat, and come back when it buzzes — so your counter stays clear for the next order instead of the last one.",
    features: [
      "Complete set: 10 pagers with charging base",
      "Three alert modes: buzzer, vibration and LED",
      "Large branding area for a custom logo",
      "Shock-absorbing design with silicone protection ring",
      "Stackable charging keeps the station tidy between services",
    ],
    specs: [
      { label: "Model", value: "GP-100R (10C pack)" },
      { label: "Brand", value: "Syscall" },
      { label: "Set contents", value: "10 pagers + charging base" },
      { label: "Pager size", value: "Diameter 95 × H18 mm" },
      { label: "Pager weight", value: "78 g" },
      { label: "Colour", value: "Red, green" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "Li-Polymer, rechargeable" },
      { label: "Compatibility", value: "GP-2000T / GP-1000T transmitters · SRT-8200 repeater" },
    ],
    priceFrom: 6500,
    availability: INCOMING,
    complementaryWith: ["syscall-gp-2000t", "syscall-gp-100r", "syscall-srt-8200"],
  },
  {
    slug: "signature-guest-pager",
    name: "Signature Guest Pager",
    subline: "SGP-100R · 10-pager set",
    tagline: "Let guests sit anywhere. Call them when their order's ready.",
    category: "paging",
    heroImage: "/hardware/signature-guest-pager.png",
    alt: "Syscall Signature Guest Pager (SGP-100R) — aluminium charging tower with a stack of compact black guest pagers.",
    shortDescription:
      "Syscall's SGP-100R — a hospitality-grade guest paging system built around an aluminium charging tower and ten compact, palm-sized pagers. Hand a pager to a guest, call them silently when their order is ready, and recover staff time previously lost to floor walks and shouting across the room.",
    features: [
      "Compact pager (47 × 102 × 12 mm, 45 g) — fits comfortably in one hand",
      "Aluminium charging unit with a luxurious, premium finish suited to fine-dining floors",
      "Dual-colour status LED on the charger — red while charging, blue when complete",
      "Bidirectional charging — pagers seat either way around, no orientation dance",
      "Detachable rear case with magnet for easy socket cleaning",
      "Non-slip pad base keeps the charging unit stable on the host stand",
      "Scales with the venue — pairs with the GP-2000T multi-transmitter and SRT-8200 repeater for larger floor plans",
    ],
    specs: [
      { label: "Model", value: "SGP-100R" },
      { label: "Set contents", value: "10 pagers · 1 charging unit (SGP-110C) · DC 9 V / 5 A adapter" },
      { label: "Pager dimensions", value: "47 × 102 × 12 mm · 45 g" },
      { label: "Charger dimensions", value: "138 × 142 × 175 mm · 610 g (10-bay)" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "Rechargeable LiPolymer" },
      { label: "Power adapter", value: "100–240 V AC, 50/60 Hz · DC 9 V / 5 A output" },
      { label: "Compatibility", value: "GP-2000T multi-transmitter · SRT-8200 repeater" },
      { label: "Expansion", value: "20-pager variant available (SGP-120C charger, 138 × 142 × 332 mm · 920 g)" },
    ],
    priceFrom: 3200,
    availability: INCOMING,
    complementaryWith: ["syscall-gp-2000t", "syscall-sgp-100r", "syscall-srt-8200"],
  },
  {
    slug: "syscall-sgp-100r",
    name: "Syscall SGP-100R Pager",
    subline: "Single pager · no charging base",
    tagline: "Keeps a ten-pager set at ten.",
    category: "paging",
    heroImage: "/hardware/syscall-sgp-100r.webp",
    alt: "Syscall SGP-100R slim individual guest pager in black.",
    shortDescription:
      "One slim SGP-100R guest pager, supplied without the charging tower. The spare that keeps a Signature set complete when a pager leaves with a guest — and the way to grow a set one unit at a time.",
    features: [
      "Slim, palm-sized pager: 47 × 102 × 12 mm, 45 g",
      "Charges in any bay of an existing SGP-110C or SGP-120C tower",
      "Magnetic detachable rear case for easy cleaning",
      "Called from the GP-2000T counter transmitter like the rest of the set",
    ],
    specs: [
      { label: "Model", value: "SGP-100R" },
      { label: "Brand", value: "Syscall" },
      { label: "Dimensions", value: "47 × 102 × 12 mm" },
      { label: "Weight", value: "45 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "Rechargeable Li-Polymer" },
      { label: "Compatibility", value: "SGP-110C / SGP-120C charging bases · GP-2000T multi-transmitter" },
    ],
    priceFrom: 650,
    availability: INCOMING,
    complementaryWith: ["signature-guest-pager", "syscall-sgp-110c", "syscall-gp-2000t"],
  },
  {
    slug: "syscall-sgp-100r-20c",
    name: "Syscall SGP-100R Pager Set",
    subline: "20 pagers + charging base",
    tagline: "Twenty pagers, one tower.",
    category: "paging",
    heroImage: "/hardware/syscall-sgp-100r-20c.webp",
    alt: "Syscall SGP-100R 20-pager set on its two-tier aluminium charging tower.",
    shortDescription:
      "The twenty-pager Signature set on a two-tier aluminium tower. Sized for a food hall, a busy bakery, or any counter where a ten-pager rack comes back empty at peak.",
    features: [
      "Long battery life with LED charging indicator",
      "Easy charging: multi-direction charging",
      "Magnetic rear case for easy cleaning and handling",
      "Compact and easy to carry: lightweight / ergonomic",
      "Premium aluminium finish, lightweight ergonomic design, fast charging",
      "Charging tower holds 20 pagers in two stacked tiers",
    ],
    specs: [
      { label: "Model", value: "SGP-100R_20C" },
      { label: "Brand", value: "Syscall" },
      { label: "Set contents", value: "20 pagers + SGP-120C charging base" },
      { label: "Charger size", value: "W138 × L142 × H332 mm" },
      { label: "Charger weight", value: "920 g" },
      { label: "Colour", value: "Black" },
      { label: "Frequency", value: "FSK · 433.42 MHz" },
      { label: "Battery", value: "Rechargeable Li-Polymer" },
      { label: "Power", value: "DC 8 V / 3 A" },
      { label: "Compatibility", value: "Multi-transmitter GP-2000T" },
    ],
    priceFrom: 6400,
    availability: INCOMING,
    complementaryWith: ["signature-guest-pager", "syscall-gp-2000t", "syscall-srt-8200"],
  },
  {
    slug: "syscall-sgp-110c",
    name: "Syscall SGP-110C Charging Base",
    subline: "10-bay",
    tagline: "The tower on its own.",
    category: "paging",
    heroImage: PHOTO_PENDING,
    alt: pendingAlt("Syscall SGP-110C 10-bay charging base"),
    shortDescription:
      "The ten-bay aluminium charging tower supplied on its own. Order it when the pagers are fine and the charger isn't, or when a second station keeps a spare set topped up at the other end of the counter.",
    features: [
      "Ten-bay aluminium charging tower for SGP-100R pagers",
      "LED charging indicator per bay",
      "Multi-direction charging — pagers seat either way around",
      "Non-slip base keeps the tower steady on a host stand",
    ],
    specs: [
      { label: "Model", value: "SGP-110C" },
      { label: "Brand", value: "Syscall" },
      { label: "Capacity", value: "10 pagers" },
      { label: "Size", value: "W138 × L142 × H175 mm" },
      { label: "Weight", value: "610 g" },
      { label: "Colour", value: "Black" },
      { label: "Power", value: "DC 8 V / 3 A" },
      { label: "Compatibility", value: "SGP-100R guest pagers" },
    ],
    priceFrom: 2600,
    availability: INCOMING,
    complementaryWith: ["syscall-sgp-100r", "signature-guest-pager", "syscall-gp-2000t"],
  },
  {
    slug: "syscall-sgp-120c",
    name: "Syscall SGP-120C Charging Base",
    subline: "20-bay",
    tagline: "Two tiers, twenty bays.",
    category: "paging",
    heroImage: PHOTO_PENDING,
    alt: pendingAlt("Syscall SGP-120C 20-bay charging base"),
    shortDescription:
      "The twenty-bay version of the Signature charging tower, supplied without pagers. The base to order when a ten-pager station has outgrown itself and you'd rather add capacity than a second tower.",
    features: [
      "Twenty-bay aluminium tower in two stacked tiers",
      "LED charging indicator per bay",
      "Multi-direction charging — no orientation to get wrong at peak",
      "Consolidates two ten-pager stations into one",
    ],
    specs: [
      { label: "Model", value: "SGP-120C" },
      { label: "Brand", value: "Syscall" },
      { label: "Capacity", value: "20 pagers" },
      { label: "Size", value: "W138 × L142 × H332 mm" },
      { label: "Weight", value: "920 g" },
      { label: "Colour", value: "Black" },
      { label: "Power", value: "DC 8 V / 3 A" },
      { label: "Compatibility", value: "SGP-100R guest pagers" },
    ],
    priceFrom: 3800,
    availability: INCOMING,
    complementaryWith: ["syscall-sgp-100r-20c", "syscall-sgp-100r", "syscall-gp-2000t"],
  },
];

// ── RFID READERS & TOKENS ──────────────────────────────────────────────

const RFID: CatalogProduct[] = [
  {
    slug: "rfid-reader",
    name: "RFID Reader",
    tagline: "A tap instead of a PIN.",
    category: "rfid",
    heroImage: "/hardware/rfid-reader.webp",
    alt: "Compact RFID desk reader for staff tokens and cards.",
    shortDescription:
      "A tap-to-identify reader for RFID tokens and cards. Put it beside the till and cashiers sign in with a fob instead of a shared code — so every sale, discount and refund carries a name that can't be borrowed.",
    features: [
      "Reads standard RFID tokens and cards on a tap",
      "Sign-in by fob: faster than a code, and much harder to share",
      "Every transaction, discount and refund gets attributed to a person",
      "Pairs with the coloured RFID tokens we stock, one per person or role",
    ],
    specs: [
      { label: "Type", value: "RFID reader" },
      { label: "Use case", value: "Staff identification at the till and the back office" },
      { label: "Pairs with", value: "RFID tokens (six colours in stock)" },
    ],
    priceFrom: 450,
    availability: IN_STOCK,
    complementaryWith: ["rfid-token-black", "rfid-token-blue", "zkteco-attendance-terminal"],
  },
  {
    slug: "rfid-token-black",
    name: "RFID Token (Black)",
    tagline: "One fob, one name on every sale.",
    category: "rfid",
    heroImage: "/hardware/rfid-token-black.webp",
    alt: "Black RFID key fob token for staff identification.",
    shortDescription:
      "A pocket-sized RFID fob in black. Give one to each cashier, shift lead or manager: a tap on the reader says who is on the till, and the day's report stops being anonymous.",
    features: [
      "Keyring-sized fob — lives on the same ring as the keys",
      "Identifies the person behind each sale, discount and refund",
      "Nothing to type, so nothing to share or forget",
      "Works with the RFID reader we stock",
    ],
    specs: [
      { label: "Type", value: "RFID token / key fob" },
      { label: "Colour", value: "Black" },
      { label: "Pairs with", value: "RFID reader" },
    ],
    priceFrom: 45,
    availability: IN_STOCK,
    complementaryWith: ["rfid-reader", "rfid-token-red", "rfid-token-green"],
  },
  {
    slug: "rfid-token-blue",
    name: "RFID Token (Blue)",
    tagline: "Colour-code your floor.",
    category: "rfid",
    heroImage: "/hardware/rfid-token-blue.webp",
    alt: "Blue RFID key fob token for staff identification.",
    shortDescription:
      "The blue fob in our RFID range. Colour-coding is the cheapest access policy there is — one colour per role, per shift or per site, sorted at a glance from across the counter.",
    features: [
      "Keyring-sized fob in blue",
      "Colour-code by role, shift or site — no labels to peel off",
      "Taps in on the same reader as every other token",
      "Stocked in six colours so a rota is easy to read",
    ],
    specs: [
      { label: "Type", value: "RFID token / key fob" },
      { label: "Colour", value: "Blue" },
      { label: "Pairs with", value: "RFID reader" },
    ],
    priceFrom: 45,
    availability: IN_STOCK,
    complementaryWith: ["rfid-reader", "rfid-token-black", "rfid-token-gray"],
  },
  {
    slug: "rfid-token-green",
    name: "RFID Token (Green)",
    tagline: "Colour-code your floor.",
    category: "rfid",
    heroImage: "/hardware/rfid-token-green.webp",
    alt: "Green RFID key fob token for staff identification.",
    shortDescription:
      "The green fob in our RFID range. Hand a colour to a team — kitchen, floor, management — and a glance at the fob tells you which permissions the person tapping it carries.",
    features: [
      "Keyring-sized fob in green",
      "Assign a colour per team so roles read at a glance",
      "Same reader, same tap, no extra configuration",
      "Kept in stock alongside the other five colours",
    ],
    specs: [
      { label: "Type", value: "RFID token / key fob" },
      { label: "Colour", value: "Green" },
      { label: "Pairs with", value: "RFID reader" },
    ],
    priceFrom: 45,
    availability: IN_STOCK,
    complementaryWith: ["rfid-reader", "rfid-token-black", "rfid-token-red"],
  },
  {
    slug: "rfid-token-red",
    name: "RFID Token (Red)",
    tagline: "Colour-code your floor.",
    category: "rfid",
    heroImage: "/hardware/rfid-token-red.webp",
    alt: "Red RFID key fob token for staff identification.",
    shortDescription:
      "The red fob in our RFID range. Most operators keep red for managers — the people who can void a line, approve a discount or reopen a closed ticket.",
    features: [
      "Keyring-sized fob in red",
      "Commonly reserved for supervisor and manager rights",
      "Makes an override traceable to a person, not a shared code",
      "Works with the same RFID reader as every other token",
    ],
    specs: [
      { label: "Type", value: "RFID token / key fob" },
      { label: "Colour", value: "Red" },
      { label: "Pairs with", value: "RFID reader" },
    ],
    priceFrom: 45,
    availability: IN_STOCK,
    complementaryWith: ["rfid-reader", "rfid-token-black", "rfid-token-blue"],
  },
  {
    slug: "rfid-token-gray",
    name: "RFID Token (Gray)",
    tagline: "Colour-code your floor.",
    category: "rfid",
    heroImage: "/hardware/rfid-token-gray.webp",
    alt: "Gray RFID key fob token for staff identification.",
    shortDescription:
      "The grey fob in our RFID range. A neutral colour for trainees, temporary staff or a spare kept in the safe for the shift that turns up a person short.",
    features: [
      "Keyring-sized fob in grey",
      "Useful for trainees, extras and spare fobs",
      "Issue and revoke without touching anyone else's access",
      "Same reader, same one-tap sign-in",
    ],
    specs: [
      { label: "Type", value: "RFID token / key fob" },
      { label: "Colour", value: "Gray" },
      { label: "Pairs with", value: "RFID reader" },
    ],
    priceFrom: 45,
    availability: IN_STOCK,
    complementaryWith: ["rfid-reader", "rfid-token-black", "rfid-token-green"],
  },
  {
    slug: "rfid-token-purple",
    name: "RFID Token (Purple)",
    tagline: "Colour-code your floor.",
    category: "rfid",
    heroImage: PHOTO_PENDING,
    alt: pendingAlt("Purple RFID key fob token"),
    shortDescription:
      "The purple fob in our RFID range — the sixth colour, for the team or the site that has already used the other five. Same fob, same tap, one more line on the rota that reads itself.",
    features: [
      "Keyring-sized fob in purple",
      "The sixth colour when five roles aren't enough",
      "Identifies its holder on every sale and every override",
      "Works with the RFID reader we stock",
    ],
    specs: [
      { label: "Type", value: "RFID token / key fob" },
      { label: "Colour", value: "Purple" },
      { label: "Pairs with", value: "RFID reader" },
    ],
    priceFrom: 45,
    availability: IN_STOCK,
    complementaryWith: ["rfid-reader", "rfid-token-black", "rfid-token-blue"],
  },
];

// ── TIME & ATTENDANCE ──────────────────────────────────────────────────

const TIME_ATTENDANCE: CatalogProduct[] = [
  {
    slug: "zkteco-attendance-terminal",
    name: "ZKTeco Time & Attendance Terminal",
    subline: "Clock-in + access control",
    tagline: "The end of the paper timesheet.",
    category: "time-attendance",
    heroImage: "/hardware/zkteco-attendance-terminal.webp",
    alt: "ZKTeco time and attendance terminal with access control, wall-mounted unit with keypad and screen.",
    shortDescription:
      "Staff identify themselves at the start and the end of a shift, and the same unit can hold the staff door. Hours worked stop being a memory exercise and the back entrance stops being an open question.",
    features: [
      "Clock-in and clock-out at the staff entrance",
      "Doubles as an access-control point for the same door",
      "Replaces the paper timesheet with a record nobody can back-date",
      "Gives the payroll conversation facts instead of recollections",
      "ZKTeco hardware — widely deployed and easy to service locally",
    ],
    specs: [
      { label: "Brand", value: "ZKTeco" },
      { label: "Type", value: "Time & attendance terminal with access control" },
      { label: "Installation", value: "Staff entrance — wall-mounted" },
    ],
    priceFrom: 2400,
    availability: IN_STOCK,
    complementaryWith: ["rfid-reader", "rfid-token-black", "zkteco-zkb10910"],
  },
];

// ── ACCESSORIES & SPARE PARTS ──────────────────────────────────────────

const ACCESSORIES: CatalogProduct[] = [
  {
    slug: "sunmi-stand-bracket",
    name: "Sunmi Stand Bracket",
    subline: "C14000158",
    tagline: "Fixes the screen where you put it.",
    category: "accessories",
    heroImage: "/hardware/sunmi-stand-bracket.webp",
    alt: "Sunmi mounting bracket for kiosk and terminal stands, reference C14000158.",
    shortDescription:
      "The bracket that turns a Sunmi kiosk or terminal into a proper installation: mounted, aligned, and no longer drifting across the counter by the end of service.",
    features: [
      "Mounting bracket for Sunmi kiosks and terminals",
      "Holds the screen at a fixed angle, service after service",
      "Removes the daily re-aligning of a free-standing device",
      "Kept in stock for both new installs and retrofits",
    ],
    specs: [
      { label: "Reference", value: "C14000158" },
      { label: "Brand", value: "Sunmi" },
      { label: "Type", value: "Mounting bracket" },
    ],
    priceFrom: 850,
    availability: IN_STOCK,
    complementaryWith: ["sunmi-k2-kiosk", "sunmi-k2-standing", "sunmi-k-series-base-plate"],
  },
  {
    slug: "sunmi-k-series-base-plate",
    name: "Sunmi K-Series Base Plate",
    tagline: "A steady footing for a free-standing screen.",
    category: "accessories",
    heroImage: "/hardware/sunmi-k-series-base-plate.webp",
    alt: "Sunmi K-series kiosk base plate, top-down view.",
    shortDescription:
      "The base plate for Sunmi's K-series kiosks — the footing a free-standing screen sits on, so the unit stays square and stable on a tiled floor with a queue leaning against it.",
    features: [
      "Base plate for Sunmi K-series kiosk stands",
      "Keeps a free-standing kiosk stable and square",
      "Pairs with the K2 floor stand for a complete pedestal",
      "Stocked as both a component and a replacement part",
    ],
    specs: [
      { label: "Brand", value: "Sunmi" },
      { label: "Type", value: "Kiosk base plate" },
      { label: "Compatibility", value: "Sunmi K-series kiosks" },
    ],
    priceFrom: 650,
    availability: IN_STOCK,
    complementaryWith: ["sunmi-k2-standing", "sunmi-k2-kiosk", "sunmi-stand-bracket"],
  },
  {
    slug: "sunmi-k2-cable",
    name: "Sunmi K2 Cable",
    tagline: "The spare that keeps a kiosk selling.",
    category: "accessories",
    heroImage: PHOTO_PENDING,
    alt: pendingAlt("Sunmi K2 kiosk cable"),
    shortDescription:
      "The replacement cable for the Sunmi K2 kiosk. Worth keeping on the shelf: a kiosk with a damaged lead is a kiosk that isn't taking orders, and a cable is the cheapest part of the installation.",
    features: [
      "Replacement cable for the Sunmi K2 kiosk",
      "Keeps a self-order point live instead of waiting on a part",
      "Stocked locally — a delivery, not an import order",
      "Send us your K2 configuration and we'll confirm the right lead",
    ],
    specs: [
      { label: "Brand", value: "Sunmi" },
      { label: "Type", value: "Kiosk cable" },
      { label: "Compatibility", value: "Sunmi K2 kiosk" },
    ],
    priceFrom: 180,
    availability: IN_STOCK,
    complementaryWith: ["sunmi-k2-kiosk", "sunmi-k2-wall-mount", "sunmi-k2-standing"],
  },
  {
    slug: "sunmi-k2-wall-mount",
    name: "Sunmi K2 Wall Mount",
    tagline: "A self-order point that costs no floor.",
    category: "accessories",
    heroImage: PHOTO_PENDING,
    alt: pendingAlt("Sunmi K2 kiosk wall mount kit"),
    shortDescription:
      "The wall-mount kit for the K2 kiosk. The install for narrow rooms: guests get a self-order screen at a comfortable height and you give up no floor space at all.",
    features: [
      "Wall-mount kit for the Sunmi K2 kiosk",
      "No pedestal, no floor space, nothing to walk around",
      "Sets the screen at a fixed, comfortable ordering height",
      "The alternative to the K2 floor stand in tight rooms",
    ],
    specs: [
      { label: "Brand", value: "Sunmi" },
      { label: "Type", value: "Kiosk wall mount" },
      { label: "Compatibility", value: "Sunmi K2 kiosk" },
    ],
    priceFrom: 450,
    availability: IN_STOCK,
    complementaryWith: ["sunmi-k2-kiosk", "sunmi-k2-cable", "sunmi-stand-bracket"],
  },
  {
    slug: "wdlink-wd12v5a",
    name: "WDLink WD12V5A Power Adapter",
    subline: "12 V / 5 A",
    tagline: "The spare worth having in the drawer.",
    category: "accessories",
    heroImage: "/hardware/wdlink-wd12v5a.webp",
    alt: "WDLink WD12V5A 12 volt 5 amp power adapter with cable.",
    shortDescription:
      "The 12 V / 5 A adapter used across our WDLink terminals and peripherals. Keep one in the drawer: a dead power brick should never be the reason a till is out of service.",
    features: [
      "12 V / 5 A output — the standard brick for our WDLink hardware",
      "The cheapest insurance against a dead till on a busy day",
      "Stocked locally, so a replacement arrives by delivery",
      "Confirm the fit with us if your device came from another supplier",
    ],
    specs: [
      { label: "Model", value: "WD12V5A" },
      { label: "Brand", value: "WDLink" },
      { label: "Output", value: "12 V / 5 A" },
      { label: "Type", value: "Power adapter" },
    ],
    priceFrom: 220,
    availability: IN_STOCK,
    complementaryWith: ["wdlink-pos-all-in-one-i3", "wdlink-wd8260", "wdlink-wd0408"],
  },
  {
    slug: "part-04ct20p",
    name: "Part 04CT20P",
    subline: "Service part",
    tagline: "A part we keep so you don't wait for it.",
    category: "accessories",
    heroImage: PHOTO_PENDING,
    alt: pendingAlt("Service part 04CT20P"),
    shortDescription:
      "A service part carried in our workshop stock under reference 04CT20P. Send us your device model and the symptom, and we'll confirm this is the right part before anything ships.",
    features: [
      "Service part held under reference 04CT20P",
      "Stocked locally for repairs, not ordered per job",
      "We confirm the fit against your device before shipping",
      "Ask us if you're unsure which reference your fault points to",
    ],
    specs: [
      { label: "Reference", value: "04CT20P" },
      { label: "Type", value: "Service / spare part" },
    ],
    priceFrom: 150,
    availability: IN_STOCK,
    complementaryWith: ["part-26ct20p", "wdlink-wd12v5a", "sunmi-stand-bracket"],
  },
  {
    slug: "part-26ct20p",
    name: "Part 26CT20P",
    subline: "Service part",
    tagline: "A part we keep so you don't wait for it.",
    category: "accessories",
    heroImage: PHOTO_PENDING,
    alt: pendingAlt("Service part 26CT20P"),
    shortDescription:
      "A service part carried in our workshop stock under reference 26CT20P. Tell us the device and the fault and we'll confirm the reference — a wrong part costs more time than a phone call.",
    features: [
      "Service part held under reference 26CT20P",
      "Kept on the shelf for repair work",
      "Fit confirmed against your device before dispatch",
      "Sold alongside part 04CT20P from the same family",
    ],
    specs: [
      { label: "Reference", value: "26CT20P" },
      { label: "Type", value: "Service / spare part" },
    ],
    priceFrom: 150,
    availability: IN_STOCK,
    complementaryWith: ["part-04ct20p", "wdlink-wd12v5a", "sunmi-stand-bracket"],
  },
  {
    slug: "syscall-jump-cable",
    name: "Syscall Jump Cable",
    tagline: "The link between the counter and the system.",
    category: "accessories",
    heroImage: "/hardware/syscall-jump-cable.webp",
    alt: "Syscall jump cable accessory for paging equipment.",
    shortDescription:
      "A Syscall paging accessory ordered with our next shipment, used to interconnect Syscall calling equipment on site. We confirm the exact fit against your installation before it ships.",
    features: [
      "Interconnection cable for Syscall paging equipment",
      "Ordered with the next Syscall shipment",
      "Fit confirmed against your existing installation first",
      "Supplied alongside the Syscall transmitters and repeaters we stock",
    ],
    specs: [
      { label: "Brand", value: "Syscall" },
      { label: "Type", value: "Paging system cable" },
    ],
    priceFrom: 150,
    availability: INCOMING,
    complementaryWith: ["syscall-gp-2000t", "syscall-srt-8200", "syscall-sr-300f"],
  },
  {
    slug: "syscall-gp-101c",
    name: "Syscall GP-101C Charger",
    subline: "For GP-101R pagers",
    tagline: "A second charging station for a busier floor.",
    category: "accessories",
    heroImage: "/hardware/syscall-gp-101c.webp",
    alt: "Syscall GP-101C charging base for GP-101R coaster pagers.",
    shortDescription:
      "The charging base for GP-101R coaster pagers, supplied on its own. Order it to run a second pick-up station, or to replace a base that has taken one spilled drink too many.",
    features: [
      "Charging base for Syscall GP-101R coaster pagers",
      "Runs a second pager station at the other end of the counter",
      "The replacement part when the base fails, not the pagers",
      "En arrivage with the next Syscall shipment",
    ],
    specs: [
      { label: "Model", value: "GP-101C" },
      { label: "Brand", value: "Syscall" },
      { label: "Type", value: "Pager charging base" },
      { label: "Compatibility", value: "GP-101R coaster pagers" },
    ],
    priceFrom: 2600,
    availability: INCOMING,
    complementaryWith: ["syscall-gp-101r", "syscall-gp-101r-10c", "syscall-gp-2000t"],
  },
  {
    slug: "syscall-gp-100c",
    name: "Syscall GP-100C Charger",
    subline: "For GP-100R pagers",
    tagline: "The base the round pagers live on.",
    category: "accessories",
    heroImage: "/hardware/syscall-gp-100c.webp",
    alt: "Syscall GP-100C charging base for GP-100R coaster pagers.",
    shortDescription:
      "The stackable charging base for GP-100R pagers, supplied without pagers. The part to order when you're adding a station or replacing a base that has stopped charging reliably.",
    features: [
      "Charging base for Syscall GP-100R coaster pagers",
      "Stackable charging keeps the pick-up station tidy",
      "Order as a second station or as a replacement base",
      "En arrivage with the next Syscall shipment",
    ],
    specs: [
      { label: "Model", value: "GP-100C" },
      { label: "Brand", value: "Syscall" },
      { label: "Type", value: "Pager charging base" },
      { label: "Compatibility", value: "GP-100R coaster pagers" },
    ],
    priceFrom: 2600,
    availability: INCOMING,
    complementaryWith: ["syscall-gp-100r", "syscall-gp-100r-10c", "syscall-gp-2000t"],
  },
];

// ── Catalog ─────────────────────────────────────────────────────────────
// Order = default Shop grid order. POS Terminals first (highest-margin
// and most-aspirational), then Mobile POS, Kiosks, Kitchen Display, and
// the peripheral families (printing → cash → scanning → paging → RFID →
// time & attendance → accessories). Within each family, in-stock items
// lead and "en arrivage" items follow.

export const CATALOG: CatalogProduct[] = [
  ...POS_TERMINALS,
  ...MOBILE_POS,
  ...KIOSKS,
  ...KDS,
  ...PRINTERS,
  ...CASH_DRAWERS,
  ...SCANNERS,
  ...PAGING,
  ...RFID,
  ...TIME_ATTENDANCE,
  ...ACCESSORIES,
];

/** Quick lookup by slug for product-detail routes (/shop/[slug]). */
export const CATALOG_BY_SLUG: Record<string, CatalogProduct> = Object.fromEntries(
  CATALOG.map((p) => [p.slug, p])
);

/** Quick lookup by category for shop filtering. */
export function productsByCategory(category: CatalogCategory): CatalogProduct[] {
  return CATALOG.filter((p) => p.category === category);
}
