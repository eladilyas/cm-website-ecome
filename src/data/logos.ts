// Brand logo library — clients, technology/commercial partners, and the trade
// shows Caisse Manager exhibits at.
//
// Every brand ships two artwork variants, and the suffix says which SURFACE the
// file is for — not what colour the art is:
//
//   -on-light  →  the colour / dark original artwork. Place it on LIGHT
//                 surfaces (paper, white cards, light section backgrounds).
//   -on-dark   →  the all-white artwork. Place it on DARK surfaces (ink
//                 sections, photo overlays, the dark footer).
//
// So a light background asks for `variants.onLight`, a dark background asks
// for `variants.onDark`. Getting it backwards renders an invisible logo.
//
// Every file is a lossy WebP (quality 90) with alpha, tight-cropped to the art
// and normalised to an 80px OPTICAL height. Widths are intentionally NOT
// uniform: roundels come out near-square and wordmarks come out very wide, so
// lay them out on a shared height (`h-10`, `h-12`, …) with `w-auto` and let
// flexbox handle the rest. Never set both dimensions.
//
// Generated from the brand kits in "Website CM/Clients" and
// "Website CM/Partenariats". To add a brand, drop both variants in the source
// folder and re-run the logo build.

export type LogoVariant = { onLight: string; onDark: string };

export type Logo = { slug: string; name: string; variants: LogoVariant };

/** Businesses running Caisse Manager — the client wall / social-proof marquee.
 *  Sorted alphabetically by name. */
export const CLIENT_LOGOS: Logo[] = [
  {
    slug: "75-flavours",
    name: "75 Flavours",
    variants: {
      onLight: "/media/logos/clients/75-flavours-on-light.webp",
      onDark: "/media/logos/clients/75-flavours-on-dark.webp",
    },
  },
  {
    slug: "amazon-juices",
    name: "Amazon Juices",
    variants: {
      onLight: "/media/logos/clients/amazon-juices-on-light.webp",
      onDark: "/media/logos/clients/amazon-juices-on-dark.webp",
    },
  },
  {
    slug: "barber-plus",
    name: "Barber Plus",
    variants: {
      onLight: "/media/logos/clients/barber-plus-on-light.webp",
      onDark: "/media/logos/clients/barber-plus-on-dark.webp",
    },
  },
  {
    slug: "barbers-star",
    name: "Barber's Star",
    variants: {
      onLight: "/media/logos/clients/barbers-star-on-light.webp",
      onDark: "/media/logos/clients/barbers-star-on-dark.webp",
    },
  },
  {
    slug: "bunnies",
    name: "Bunnie's",
    variants: {
      onLight: "/media/logos/clients/bunnies-on-light.webp",
      onDark: "/media/logos/clients/bunnies-on-dark.webp",
    },
  },
  {
    slug: "burgern-shake-iberia",
    name: "Burger'n Shake Iberia",
    variants: {
      onLight: "/media/logos/clients/burgern-shake-iberia-on-light.webp",
      onDark: "/media/logos/clients/burgern-shake-iberia-on-dark.webp",
    },
  },
  {
    slug: "crusty",
    name: "Crusty",
    variants: {
      onLight: "/media/logos/clients/crusty-on-light.webp",
      onDark: "/media/logos/clients/crusty-on-dark.webp",
    },
  },
  {
    slug: "ctr-chicken",
    name: "CTR Chicken",
    variants: {
      onLight: "/media/logos/clients/ctr-chicken-on-light.webp",
      onDark: "/media/logos/clients/ctr-chicken-on-dark.webp",
    },
  },
  {
    slug: "food-yard",
    name: "Food Yard",
    variants: {
      onLight: "/media/logos/clients/food-yard-on-light.webp",
      onDark: "/media/logos/clients/food-yard-on-dark.webp",
    },
  },
  {
    slug: "fried",
    name: "Fried",
    variants: {
      onLight: "/media/logos/clients/fried-on-light.webp",
      onDark: "/media/logos/clients/fried-on-dark.webp",
    },
  },
  {
    slug: "hammam-almaz",
    name: "Hammam Almaz",
    variants: {
      onLight: "/media/logos/clients/hammam-almaz-on-light.webp",
      onDark: "/media/logos/clients/hammam-almaz-on-dark.webp",
    },
  },
  {
    slug: "hy-sushi",
    name: "HY Sushi",
    variants: {
      onLight: "/media/logos/clients/hy-sushi-on-light.webp",
      onDark: "/media/logos/clients/hy-sushi-on-dark.webp",
    },
  },
  {
    slug: "ikbal-gourmandise",
    name: "Ikbal Gourmandise",
    variants: {
      onLight: "/media/logos/clients/ikbal-gourmandise-on-light.webp",
      onDark: "/media/logos/clients/ikbal-gourmandise-on-dark.webp",
    },
  },
  {
    slug: "kleat",
    name: "Kleat",
    variants: {
      onLight: "/media/logos/clients/kleat-on-light.webp",
      onDark: "/media/logos/clients/kleat-on-dark.webp",
    },
  },
  {
    slug: "la-grande-tente",
    name: "La Grande Tente",
    variants: {
      onLight: "/media/logos/clients/la-grande-tente-on-light.webp",
      onDark: "/media/logos/clients/la-grande-tente-on-dark.webp",
    },
  },
  {
    slug: "la-tasse-joyeuse",
    name: "La Tasse Joyeuse",
    variants: {
      onLight: "/media/logos/clients/la-tasse-joyeuse-on-light.webp",
      onDark: "/media/logos/clients/la-tasse-joyeuse-on-dark.webp",
    },
  },
  {
    slug: "lartisan",
    name: "L'Artisan",
    variants: {
      onLight: "/media/logos/clients/lartisan-on-light.webp",
      onDark: "/media/logos/clients/lartisan-on-dark.webp",
    },
  },
  {
    slug: "le-beldi",
    name: "Le Beldi",
    variants: {
      onLight: "/media/logos/clients/le-beldi-on-light.webp",
      onDark: "/media/logos/clients/le-beldi-on-dark.webp",
    },
  },
  {
    slug: "le-roissant",
    name: "Le Roissant",
    variants: {
      onLight: "/media/logos/clients/le-roissant-on-light.webp",
      onDark: "/media/logos/clients/le-roissant-on-dark.webp",
    },
  },
  {
    slug: "maison-adena",
    name: "Maison Adena",
    variants: {
      onLight: "/media/logos/clients/maison-adena-on-light.webp",
      onDark: "/media/logos/clients/maison-adena-on-dark.webp",
    },
  },
  {
    slug: "mr-bnin",
    name: "Mr Bnin",
    variants: {
      onLight: "/media/logos/clients/mr-bnin-on-light.webp",
      onDark: "/media/logos/clients/mr-bnin-on-dark.webp",
    },
  },
  {
    slug: "mr-daddy",
    name: "Mr Daddy",
    variants: {
      onLight: "/media/logos/clients/mr-daddy-on-light.webp",
      onDark: "/media/logos/clients/mr-daddy-on-dark.webp",
    },
  },
  {
    slug: "only-chicken",
    name: "Only Chicken",
    variants: {
      onLight: "/media/logos/clients/only-chicken-on-light.webp",
      onDark: "/media/logos/clients/only-chicken-on-dark.webp",
    },
  },
  {
    slug: "parigini",
    name: "Parigini",
    variants: {
      onLight: "/media/logos/clients/parigini-on-light.webp",
      onDark: "/media/logos/clients/parigini-on-dark.webp",
    },
  },
  {
    slug: "patisserie-rhouni",
    name: "Pâtisserie Rhouni",
    variants: {
      onLight: "/media/logos/clients/patisserie-rhouni-on-light.webp",
      onDark: "/media/logos/clients/patisserie-rhouni-on-dark.webp",
    },
  },
  {
    slug: "pizza-philestini",
    name: "Pizza Philestini",
    variants: {
      onLight: "/media/logos/clients/pizza-philestini-on-light.webp",
      onDark: "/media/logos/clients/pizza-philestini-on-dark.webp",
    },
  },
  {
    slug: "restaurant-abwab-elmansour",
    name: "Restaurant Abwab Elmansour",
    variants: {
      onLight: "/media/logos/clients/restaurant-abwab-elmansour-on-light.webp",
      onDark: "/media/logos/clients/restaurant-abwab-elmansour-on-dark.webp",
    },
  },
  {
    slug: "restaurant-seafood",
    name: "Restaurant Seafood",
    variants: {
      onLight: "/media/logos/clients/restaurant-seafood-on-light.webp",
      onDark: "/media/logos/clients/restaurant-seafood-on-dark.webp",
    },
  },
  {
    slug: "saloon-33",
    name: "Saloon 33",
    variants: {
      onLight: "/media/logos/clients/saloon-33-on-light.webp",
      onDark: "/media/logos/clients/saloon-33-on-dark.webp",
    },
  },
  {
    slug: "social-coffee",
    name: "Social Coffee",
    variants: {
      onLight: "/media/logos/clients/social-coffee-on-light.webp",
      onDark: "/media/logos/clients/social-coffee-on-dark.webp",
    },
  },
  {
    slug: "texas-chicken",
    name: "Texas Chicken",
    variants: {
      onLight: "/media/logos/clients/texas-chicken-on-light.webp",
      onDark: "/media/logos/clients/texas-chicken-on-dark.webp",
    },
  },
  {
    slug: "the-hunger",
    name: "The Hunger",
    variants: {
      onLight: "/media/logos/clients/the-hunger-on-light.webp",
      onDark: "/media/logos/clients/the-hunger-on-dark.webp",
    },
  },
  {
    slug: "the-mara",
    name: "Thé-Mara",
    variants: {
      onLight: "/media/logos/clients/the-mara-on-light.webp",
      onDark: "/media/logos/clients/the-mara-on-dark.webp",
    },
  },
  {
    slug: "turkish-steak-house",
    name: "Turkish Steak House",
    variants: {
      onLight: "/media/logos/clients/turkish-steak-house-on-light.webp",
      onDark: "/media/logos/clients/turkish-steak-house-on-dark.webp",
    },
  },
  {
    slug: "uncle-crespy",
    name: "Uncle Crespy",
    variants: {
      onLight: "/media/logos/clients/uncle-crespy-on-light.webp",
      onDark: "/media/logos/clients/uncle-crespy-on-dark.webp",
    },
  },
  {
    slug: "wake-up",
    name: "Wake Up",
    variants: {
      onLight: "/media/logos/clients/wake-up-on-light.webp",
      onDark: "/media/logos/clients/wake-up-on-dark.webp",
    },
  },
  {
    slug: "wok-4-you",
    name: "Wok 4 You",
    variants: {
      onLight: "/media/logos/clients/wok-4-you-on-light.webp",
      onDark: "/media/logos/clients/wok-4-you-on-dark.webp",
    },
  },
  {
    slug: "zanmai",
    name: "Zanmai",
    variants: {
      onLight: "/media/logos/clients/zanmai-on-light.webp",
      onDark: "/media/logos/clients/zanmai-on-dark.webp",
    },
  },
];
/** Technology, payment and delivery partners integrated with the platform.
 *  Sorted alphabetically by name. */
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
/** Trade shows and industry exhibitions Caisse Manager exhibits at.
 *  Sorted alphabetically by name. */
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
  },
  {
    slug: "salon-cremai",
    name: "Salon Cremaï",
    variants: {
      onLight: "/media/logos/events/salon-cremai-on-light.webp",
      onDark: "/media/logos/events/salon-cremai-on-dark.webp",
    },
  },
];
