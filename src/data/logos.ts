// Brand logo library — clients, partners, and the trade shows we exhibit at.
//
// ── The variant suffix names the SURFACE, not the artwork colour ──────────
//   -on-light  →  colour artwork.  Place on LIGHT surfaces (paper, canvas).
//   -on-dark   →  white artwork.   Place on DARK surfaces (ink, night, photo).
// A light background asks for variants.onLight. Getting it backwards ships
// an invisible logo. A null means that variant does not exist for the brand.
//
// ── Every file is a FIXED 320x140 canvas ─────────────────────────────────
// Render each one in one identical box — w-40 h-[70px] (or any 320:140
// box) — and nothing else. Do NOT use object-contain sizing tricks, do NOT
// set width and height independently, and do NOT try to normalise sizes in
// CSS. The optical balancing is already baked into the pixels: each logo is
// scaled so its INK AREA (not its bounding-box height) is comparable to its
// neighbours, then centred with padding inside the shared canvas.
//
// Why ink area: a 6:1 wordmark and a 1:1 roundel set to the same CSS height
// do not look the same size — the wordmark carries several times the ink and
// dominates the row. Matching covered area is what makes a logo wall read as
// one deliberate set. Sizing these in CSS would undo that work.
//
// Assets are 2x (320x140 for a 160x70 CSS slot), so they stay crisp on
// retina. Do not render them larger than 160 CSS px wide.
//
// Regenerate with scratchpad/optical_logos.py when brands are added.

export type LogoVariant = {
  /** Colour artwork for light surfaces, or null if none exists. */
  onLight: string | null;
  /** White artwork for dark surfaces, or null if none exists. */
  onDark: string | null;
};

export type Logo = {
  slug: string;
  name: string;
  variants: LogoVariant;
  /** Cleared for the monochrome hero band: has white art AND survives the
   *  all-white treatment without losing brand identity or introducing
   *  colour that would break the band's uniformity. */
  inBand?: boolean;
  /** MEASURED: is the colour artwork legible on a white surface?
   *
   *  False for brands whose "colour" lockup is itself light-inked — white
   *  knockout text inside a coloured ring, pale gold hairlines, and so on.
   *  Placed on white those read as an empty frame no matter how well they are
   *  scaled. Callers must render these as the WHITE variant on a dark chip
   *  instead; BrandLogo does this automatically. Computed from the ink's
   *  luminance-weighted mean and its near-white share, not by eye. */
  onLightSafe?: boolean;
};


/** Businesses running Caisse Manager. Alphabetical by name. */
export const CLIENT_LOGOS: Logo[] = [
  {
    slug: "75-flavours",
    name: "75 Flavours",
    variants: {
      onLight: "/media/logos/clients/75-flavours-on-light.webp",
      onDark: "/media/logos/clients/75-flavours-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "alhayba",
    name: "Alhayba",
    variants: {
      onLight: "/media/logos/clients/alhayba-on-light.webp",
      onDark: null,
    },
    onLightSafe: false,
    inBand: false,
  },
  {
    slug: "amazon-juices",
    name: "Amazon Juices",
    variants: {
      onLight: "/media/logos/clients/amazon-juices-on-light.webp",
      onDark: "/media/logos/clients/amazon-juices-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "barber-plus",
    name: "Barber Plus",
    variants: {
      onLight: "/media/logos/clients/barber-plus-on-light.webp",
      onDark: "/media/logos/clients/barber-plus-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "barbers-star",
    name: "Barber's Star",
    variants: {
      onLight: "/media/logos/clients/barbers-star-on-light.webp",
      onDark: "/media/logos/clients/barbers-star-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "bunnies",
    name: "Bunnie's",
    variants: {
      onLight: "/media/logos/clients/bunnies-on-light.webp",
      onDark: "/media/logos/clients/bunnies-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "burgern-shake-iberia",
    name: "Burger'n Shake Iberia",
    variants: {
      onLight: "/media/logos/clients/burgern-shake-iberia-on-light.webp",
      onDark: "/media/logos/clients/burgern-shake-iberia-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "crusty",
    name: "Crusty",
    variants: {
      onLight: "/media/logos/clients/crusty-on-light.webp",
      onDark: "/media/logos/clients/crusty-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "ctr-chicken",
    name: "CTR Chicken",
    variants: {
      onLight: "/media/logos/clients/ctr-chicken-on-light.webp",
      onDark: "/media/logos/clients/ctr-chicken-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "elbayt-eldimashki",
    name: "Elbayt Eldimashki",
    variants: {
      onLight: "/media/logos/clients/elbayt-eldimashki-on-light.webp",
      onDark: null,
    },
    onLightSafe: false,
    inBand: false,
  },
  {
    slug: "food-yard",
    name: "Food Yard",
    variants: {
      onLight: "/media/logos/clients/food-yard-on-light.webp",
      onDark: "/media/logos/clients/food-yard-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "fried",
    name: "Fried",
    variants: {
      onLight: "/media/logos/clients/fried-on-light.webp",
      onDark: "/media/logos/clients/fried-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "golden-coffee",
    name: "Golden Coffee",
    variants: {
      onLight: "/media/logos/clients/golden-coffee-on-light.webp",
      onDark: null,
    },
    inBand: false,
  },
  {
    slug: "hammam-almaz",
    name: "Hammam Almaz",
    variants: {
      onLight: "/media/logos/clients/hammam-almaz-on-light.webp",
      onDark: "/media/logos/clients/hammam-almaz-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "hy-sushi",
    name: "HY Sushi",
    variants: {
      onLight: "/media/logos/clients/hy-sushi-on-light.webp",
      onDark: "/media/logos/clients/hy-sushi-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "ikbal-gourmandise",
    name: "Ikbal Gourmandise",
    variants: {
      onLight: "/media/logos/clients/ikbal-gourmandise-on-light.webp",
      onDark: "/media/logos/clients/ikbal-gourmandise-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "kleat",
    name: "Kleat",
    variants: {
      onLight: "/media/logos/clients/kleat-on-light.webp",
      onDark: "/media/logos/clients/kleat-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "la-grande-tente",
    name: "La Grande Tente",
    variants: {
      onLight: "/media/logos/clients/la-grande-tente-on-light.webp",
      onDark: "/media/logos/clients/la-grande-tente-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "la-tasse-joyeuse",
    name: "La Tasse Joyeuse",
    variants: {
      onLight: "/media/logos/clients/la-tasse-joyeuse-on-light.webp",
      onDark: "/media/logos/clients/la-tasse-joyeuse-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "lartisan",
    name: "L’Artisan",
    variants: {
      onLight: "/media/logos/clients/lartisan-on-light.webp",
      onDark: "/media/logos/clients/lartisan-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "le-beldi",
    name: "Le Beldi",
    variants: {
      onLight: "/media/logos/clients/le-beldi-on-light.webp",
      onDark: "/media/logos/clients/le-beldi-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "le-roissant",
    name: "Le roissant",
    variants: {
      onLight: "/media/logos/clients/le-roissant-on-light.webp",
      onDark: "/media/logos/clients/le-roissant-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "leamido",
    name: "Leamido",
    variants: {
      onLight: "/media/logos/clients/leamido-on-light.webp",
      onDark: null,
    },
    onLightSafe: false,
    inBand: false,
  },
  {
    slug: "maison-adena",
    name: "Maison Adena",
    variants: {
      onLight: "/media/logos/clients/maison-adena-on-light.webp",
      onDark: "/media/logos/clients/maison-adena-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "mr-bnin",
    name: "Mr Bnin",
    variants: {
      onLight: "/media/logos/clients/mr-bnin-on-light.webp",
      onDark: "/media/logos/clients/mr-bnin-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "mr-daddy",
    name: "Mr Daddy",
    variants: {
      onLight: "/media/logos/clients/mr-daddy-on-light.webp",
      onDark: "/media/logos/clients/mr-daddy-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "only-chicken",
    name: "Only Chicken",
    variants: {
      onLight: "/media/logos/clients/only-chicken-on-light.webp",
      onDark: "/media/logos/clients/only-chicken-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "panda",
    name: "Panda",
    variants: {
      onLight: null,
      onDark: "/media/logos/clients/panda-on-dark.webp",
    },
    inBand: false,
  },
  {
    slug: "panini-grill",
    name: "Panini Grill",
    variants: {
      onLight: "/media/logos/clients/panini-grill-on-light.webp",
      onDark: null,
    },
    onLightSafe: false,
    inBand: false,
  },
  {
    slug: "parigini",
    name: "Parigini",
    variants: {
      onLight: "/media/logos/clients/parigini-on-light.webp",
      onDark: "/media/logos/clients/parigini-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "patisserie-rhouni",
    name: "Patisserie Rhouni",
    variants: {
      onLight: "/media/logos/clients/patisserie-rhouni-on-light.webp",
      onDark: "/media/logos/clients/patisserie-rhouni-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "pizza-philestini",
    name: "Pizza Philestini",
    variants: {
      onLight: "/media/logos/clients/pizza-philestini-on-light.webp",
      onDark: "/media/logos/clients/pizza-philestini-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "primos",
    name: "Primos",
    variants: {
      onLight: "/media/logos/clients/primos-on-light.webp",
      onDark: null,
    },
    onLightSafe: false,
    inBand: false,
  },
  {
    slug: "restaurant-abwab-elmansour",
    name: "Restaurant Abwab Elmansour",
    variants: {
      onLight: "/media/logos/clients/restaurant-abwab-elmansour-on-light.webp",
      onDark: "/media/logos/clients/restaurant-abwab-elmansour-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "restaurant-seafood",
    name: "Restaurant Seafood",
    variants: {
      onLight: "/media/logos/clients/restaurant-seafood-on-light.webp",
      onDark: "/media/logos/clients/restaurant-seafood-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "room-21",
    name: "Room 21",
    variants: {
      onLight: "/media/logos/clients/room-21-on-light.webp",
      onDark: null,
    },
    onLightSafe: false,
    inBand: false,
  },
  {
    slug: "saloon-33",
    name: "Saloon 33",
    variants: {
      onLight: "/media/logos/clients/saloon-33-on-light.webp",
      onDark: "/media/logos/clients/saloon-33-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "sea-view-360",
    name: "Sea View 360",
    variants: {
      onLight: "/media/logos/clients/sea-view-360-on-light.webp",
      onDark: null,
    },
    onLightSafe: false,
    inBand: false,
  },
  {
    slug: "social-coffee",
    name: "Social Coffee",
    variants: {
      onLight: "/media/logos/clients/social-coffee-on-light.webp",
      onDark: "/media/logos/clients/social-coffee-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "texas-chicken",
    name: "Texas Chicken",
    variants: {
      onLight: "/media/logos/clients/texas-chicken-on-light.webp",
      onDark: "/media/logos/clients/texas-chicken-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "the-hunger",
    name: "The Hunger",
    variants: {
      onLight: "/media/logos/clients/the-hunger-on-light.webp",
      onDark: "/media/logos/clients/the-hunger-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "the-mara",
    name: "Thé-Mara",
    variants: {
      onLight: "/media/logos/clients/the-mara-on-light.webp",
      onDark: "/media/logos/clients/the-mara-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "turkish-steak-house",
    name: "Turkish Steak House",
    variants: {
      onLight: "/media/logos/clients/turkish-steak-house-on-light.webp",
      onDark: "/media/logos/clients/turkish-steak-house-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "uncle-crespy",
    name: "Uncle Crespy",
    variants: {
      onLight: "/media/logos/clients/uncle-crespy-on-light.webp",
      onDark: "/media/logos/clients/uncle-crespy-on-dark.webp",
    },
    inBand: true,
  },
  {
    slug: "wake-up",
    name: "Wake Up",
    variants: {
      onLight: "/media/logos/clients/wake-up-on-light.webp",
      onDark: "/media/logos/clients/wake-up-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "wok-4-you",
    name: "Wok 4 You",
    variants: {
      onLight: "/media/logos/clients/wok-4-you-on-light.webp",
      onDark: "/media/logos/clients/wok-4-you-on-dark.webp",
    },
    onLightSafe: false,
    inBand: true,
  },
  {
    slug: "zanmai",
    name: "Zanmai",
    variants: {
      onLight: "/media/logos/clients/zanmai-on-light.webp",
      onDark: "/media/logos/clients/zanmai-on-dark.webp",
    },
    inBand: true,
  },
];

/** Technology, payment, financing and delivery partners. */
export const PARTNER_LOGOS: Logo[] = [
  {
    slug: "brehm",
    name: "Brehm",
    variants: {
      onLight: "/media/logos/partners/brehm-on-light.webp",
      onDark: "/media/logos/partners/brehm-on-dark.webp",
    },
  },
  {
    slug: "cmi",
    name: "CMI",
    variants: {
      onLight: "/media/logos/partners/cmi-on-light.webp",
      onDark: "/media/logos/partners/cmi-on-dark.webp",
    },
  },
  {
    slug: "done",
    name: "Done",
    variants: {
      onLight: "/media/logos/partners/done-on-light.webp",
      onDark: "/media/logos/partners/done-on-dark.webp",
    },
  },
  {
    slug: "fantastic",
    name: "Fantastic",
    variants: {
      onLight: "/media/logos/partners/fantastic-on-light.webp",
      onDark: "/media/logos/partners/fantastic-on-dark.webp",
    },
  },
  {
    slug: "glory",
    name: "Glory",
    variants: {
      onLight: "/media/logos/partners/glory-on-light.webp",
      onDark: "/media/logos/partners/glory-on-dark.webp",
    },
  },
  {
    slug: "glovo",
    name: "Glovo",
    variants: {
      onLight: "/media/logos/partners/glovo-on-light.webp",
      onDark: "/media/logos/partners/glovo-on-dark.webp",
    },
  },
  {
    slug: "imin",
    name: "iMin",
    variants: {
      onLight: "/media/logos/partners/imin-on-light.webp",
      onDark: "/media/logos/partners/imin-on-dark.webp",
    },
  },
  {
    slug: "kooul",
    name: "Kooul",
    variants: {
      onLight: "/media/logos/partners/kooul-on-light.webp",
      onDark: "/media/logos/partners/kooul-on-dark.webp",
    },
  },
  {
    slug: "odoo",
    name: "Odoo",
    variants: {
      onLight: "/media/logos/partners/odoo-on-light.webp",
      onDark: "/media/logos/partners/odoo-on-dark.webp",
    },
  },
  {
    slug: "syscall",
    name: "Syscall",
    variants: {
      onLight: "/media/logos/partners/syscall-on-light.webp",
      onDark: "/media/logos/partners/syscall-on-dark.webp",
    },
  },
  {
    slug: "wafasalaf",
    name: "Wafasalaf",
    variants: {
      onLight: "/media/logos/partners/wafasalaf-on-light.webp",
      onDark: "/media/logos/partners/wafasalaf-on-dark.webp",
    },
  },
  {
    slug: "yassir",
    name: "Yassir",
    variants: {
      onLight: "/media/logos/partners/yassir-on-light.webp",
      onDark: "/media/logos/partners/yassir-on-dark.webp",
    },
  },
];

/** Trade shows and exhibitions Caisse Manager has exhibited at. */
export const EVENT_LOGOS: Logo[] = [
  {
    slug: "franchise-exhibition-morocco-2026",
    name: "Franchise Exhibition Morocco 2026",
    variants: {
      onLight: "/media/logos/events/franchise-exhibition-morocco-2026-on-light.webp",
      onDark: "/media/logos/events/franchise-exhibition-morocco-2026-on-dark.webp",
    },
  },
  {
    slug: "marocotel",
    name: "Marocotel",
    variants: {
      onLight: "/media/logos/events/marocotel-on-light.webp",
      onDark: "/media/logos/events/marocotel-on-dark.webp",
    },
    onLightSafe: false,
  },
  {
    slug: "salon-cremai",
    name: "Salon Cremaï",
    variants: {
      onLight: "/media/logos/events/salon-cremai-on-light.webp",
      onDark: "/media/logos/events/salon-cremai-on-dark.webp",
    },
  },
];

/** The hero band roster — clients cleared for the all-white monochrome
 *  treatment, in library order. */
export const BAND_LOGOS: Logo[] = CLIENT_LOGOS.filter((l) => l.inBand);
