// Shop catalog — STATIC FALLBACK / MIGRATION ARTIFACT.
//
// As of 2026-06: the public catalog is sourced from Postgres via
// `src/server/catalog/service.ts`. Server components read directly
// (`listPublicProducts`, `getPublicProductBySlug`); client components
// read via `<CatalogProvider />` (`useCatalog`, `useProduct`).
//
// This file is retained for two reasons only:
//   1. The one-shot import script (`scripts/import-catalog.ts`) seeds
//      Postgres from CATALOG on a fresh database.
//   2. Anything that still imports `CatalogProduct` / `CatalogCategory`
//      types — those now re-export from `@/server/catalog/types`.
//
// NEW CODE MUST NOT import CATALOG / CATALOG_BY_SLUG / CATEGORY_LABEL.
// Use the service (server) or the provider (client) instead.
//
// Pricing convention (updated 2026-06): starting prices are shown
// publicly as "From X MAD HT" on cards + detail pages via
// src/lib/formatPrice.ts. The quote drawer produces the formal total
// (TTC + accessories + optional services). Update `priceFrom` per
// product as commercial pricing finalizes.
//
// Images are downloaded and served locally from /public/hardware/ —
// no external CDN dependencies. To refresh, re-download via the same
// filenames; the catalog references won't change.
//
// Categories used by the Shop filter rail:
//   • POS Terminals     — desktop / countertop devices
//   • Mobile POS        — handhelds with optional printer
//   • Self-Order Kiosks — customer-facing kiosks
//   • KDS               — kitchen / bar display systems
//   • Cash Management   — cash drawers, lockboxes, change tools
//   • Printing          — receipt + kitchen + label printers
//   • Scanning          — handheld + countertop barcode/QR readers
//   • Customer Paging   — coaster pagers + guest queue calling

export type CatalogCategory =
  | "pos-terminals"
  | "mobile-pos"
  | "kiosks"
  | "kds"
  | "cash-drawers"
  | "printers"
  | "scanners"
  | "paging";

export const CATEGORY_LABEL: Record<CatalogCategory, string> = {
  "pos-terminals": "POS Terminals",
  "mobile-pos": "Mobile POS",
  "kiosks": "Self-Order Kiosks",
  "kds": "Kitchen Display",
  "cash-drawers": "Cash Management",
  "printers": "Printing",
  "scanners": "Scanning",
  "paging": "Customer Paging",
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
  /** Local hero image path under /public/hardware/. */
  heroImage: string;
  /** Used as the aria/alt text on the image. */
  alt: string;
  /** Short prose for the product-card body (2-3 lines). */
  shortDescription: string;
  /** Bullets shown on the detail page. */
  features: string[];
  /** Spec table on the detail page. Keep ~8-10 rows. */
  specs: ProductSpec[];
  /** Starting unit price in MAD, used by the Cart + checkout. Placeholder
   *  values — swap with final commercial pricing before launch. */
  priceFrom: number;
  /** Stock + delivery signal shown on cards + detail page. Optional
   *  so seed-time products without a value default to "in-stock" at
   *  render time. */
  availability?: ProductAvailability;
  /** Slugs of products that pair well with this one. Drives the
   *  Cart drawer's upsell grid. */
  complementaryWith: string[];
};

// ── POS TERMINALS ──────────────────────────────────────────────────────

const SWAN_1_GEN_2: CatalogProduct = {
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
  availability: { status: "in-stock" },
  complementaryWith: ["swift-1-pro", "heron-1-mini", "swan-1k-gen-2"],
};

const SWAN_1K_GEN_2: CatalogProduct = {
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
  availability: { status: "incoming", leadWeeks: 3 },
  complementaryWith: ["swan-1-gen-2", "heron-1-mini"],
};

const WDLINK_WD15M: CatalogProduct = {
  slug: "wdlink-wd15m",
  name: "WDLink WD15M",
  subline: '15.6" POS touch monitor',
  tagline: "A screen built for the front line. Designed for the long shift.",
  category: "pos-terminals",
  heroImage: "/hardware/wdlink-wd15m.png",
  alt: "WDLink WD15M — 15.6-inch true-flat capacitive POS touch monitor on a foldable VESA-compatible aluminium stand, shown from the rear.",
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
  availability: { status: "in-stock" },
  complementaryWith: ["epson-printer", "drawer", "2d-scanner"],
};

// ── MOBILE POS ─────────────────────────────────────────────────────────

const SWIFT_1_PRO: CatalogProduct = {
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
  availability: { status: "in-stock" },
  complementaryWith: ["swan-1-gen-2", "swift-2-pro"],
};

const SWIFT_2_PRO: CatalogProduct = {
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
  availability: { status: "in-stock" },
  complementaryWith: ["swan-1-gen-2", "swift-2-ultra"],
};

const SWIFT_2_ULTRA: CatalogProduct = {
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
  availability: { status: "incoming", leadWeeks: 3 },
  complementaryWith: ["swan-1-gen-2", "heron-1"],
};

// ── SELF-ORDER KIOSKS ──────────────────────────────────────────────────

const HERON_1: CatalogProduct = {
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
  ],
  priceFrom: 18000,
  availability: { status: "incoming", leadWeeks: 3 },
  complementaryWith: ["swan-1-gen-2", "swift-2-pro"],
};

const HERON_1_MINI: CatalogProduct = {
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
  ],
  priceFrom: 12000,
  availability: { status: "in-stock" },
  complementaryWith: ["swan-1-gen-2", "swift-1-pro"],
};

// ── CASH MANAGEMENT ────────────────────────────────────────────────────
//
// IMAGES: clean catalog photos of the new peripherals (cash drawer,
// printers, scanner, coaster pagers) must be placed at the paths
// referenced below in /public/hardware/. The catalog references local
// paths only — no marketplace CDN imagery — so the site never
// inherits supplier branding, watermarks, or licensing surfaces.

const DRAWER: CatalogProduct = {
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
  availability: { status: "in-stock" },
  complementaryWith: ["swan-1-gen-2", "epson-printer"],
};

// ── PRINTING ───────────────────────────────────────────────────────────

const EPSON_PRINTER: CatalogProduct = {
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
  availability: { status: "incoming", leadWeeks: 3 },
  complementaryWith: ["swan-1k-gen-2", "swan-1-gen-2"],
};

// ── SCANNING ───────────────────────────────────────────────────────────

const SCANNER_2D: CatalogProduct = {
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
  availability: { status: "in-stock" },
  complementaryWith: ["swan-1-gen-2", "epson-printer"],
};

// ── CUSTOMER PAGING ────────────────────────────────────────────────────

const SIGNATURE_PAGER: CatalogProduct = {
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
  availability: { status: "incoming", leadWeeks: 3 },
  complementaryWith: ["swan-1k-gen-2", "swan-1-gen-2"],
};

// ── Catalog ─────────────────────────────────────────────────────────────
// Order = default Shop grid order. POS Terminals first (highest-margin
// and most-aspirational), then Mobile POS, then Kiosks, then peripherals
// grouped by function (printing → cash → scanning → paging).

export const CATALOG: CatalogProduct[] = [
  SWAN_1_GEN_2,
  SWAN_1K_GEN_2,
  WDLINK_WD15M,
  SWIFT_1_PRO,
  SWIFT_2_PRO,
  SWIFT_2_ULTRA,
  HERON_1,
  HERON_1_MINI,
  EPSON_PRINTER,
  DRAWER,
  SCANNER_2D,
  SIGNATURE_PAGER,
];

/** Quick lookup by slug for product-detail routes (/shop/[slug]). */
export const CATALOG_BY_SLUG: Record<string, CatalogProduct> = Object.fromEntries(
  CATALOG.map((p) => [p.slug, p])
);

/** Quick lookup by category for shop filtering. */
export function productsByCategory(category: CatalogCategory): CatalogProduct[] {
  return CATALOG.filter((p) => p.category === category);
}
