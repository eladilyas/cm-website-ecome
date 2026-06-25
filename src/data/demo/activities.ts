// Seed catalogs for the 4 demo business activities.
//
// Phase 1 size: ~6-10 items per activity — enough to validate the catalog
// shape end-to-end through the entire POS flow (categories, browsing,
// combos, payment). Later phases can grow these to the full counts
// targeted in WORKFLOW_DIFF.md §F (Café 20, Fast food 40, Dine-in 50,
// Quick-service 25). Prices are illustrative MAD values.

import type { DemoActivity } from "./types";

// ── Café ──────────────────────────────────────────────────────────────
export const CAFE: DemoActivity = {
  key: "cafe",
  name: "Café",
  tagline: "Coffee, pastries, and the quiet morning rush.",
  description:
    "Counter-served espresso, fresh pastries, and seasonal cold drinks. Designed for fast pickup and dine-in by the window.",
  enabledOrderTypes: ["take-away", "dine-in"],
  // Zero-friction entry: every activity now drops the user straight into
  // the workspace with an open take-away order. The order-type picker
  // remains in the codebase but is no longer surfaced during normal
  // selectActivity() calls — the cashier rings as soon as a tab is tapped.
  skipOrderTypePicker: true,
  categories: [
    { id: "coffee",    name: "Coffee" },
    { id: "pastries",  name: "Pastries" },
    { id: "sandwiches", name: "Sandwiches" },
    { id: "cold",      name: "Cold Drinks" },
  ],
  products: [
    {
      id: "espresso", name: "Espresso", price: 15, categoryId: "coffee",
      variants: [
        { id: "size-s", name: "Small", priceDelta: 0 },
        { id: "size-m", name: "Medium", priceDelta: 3 },
        { id: "size-l", name: "Large", priceDelta: 6 },
      ],
      modifierGroups: [
        {
          id: "milk", name: "Milk", rule: "exactly-1",
          modifiers: [
            { id: "milk-none", name: "No milk", priceDelta: 0 },
            { id: "milk-whole", name: "Whole milk", priceDelta: 0 },
            { id: "milk-oat", name: "Oat milk", priceDelta: 5 },
            { id: "milk-almond", name: "Almond milk", priceDelta: 5 },
          ],
        },
        {
          id: "extras", name: "Extras", rule: "up-to-n", max: 3,
          modifiers: [
            { id: "shot", name: "Extra shot", priceDelta: 6 },
            { id: "vanilla", name: "Vanilla syrup", priceDelta: 3 },
            { id: "hazelnut", name: "Hazelnut syrup", priceDelta: 3 },
          ],
        },
      ],
    },
    { id: "double-espresso", name: "Double Espresso", price: 22, categoryId: "coffee" },
    {
      id: "cappuccino", name: "Cappuccino", price: 25, categoryId: "coffee",
      variants: [
        { id: "size-s", name: "Small", priceDelta: 0 },
        { id: "size-m", name: "Medium", priceDelta: 4 },
        { id: "size-l", name: "Large", priceDelta: 8 },
      ],
      modifierGroups: [
        {
          id: "milk", name: "Milk", rule: "exactly-1",
          modifiers: [
            { id: "milk-whole", name: "Whole milk", priceDelta: 0 },
            { id: "milk-oat", name: "Oat milk", priceDelta: 5 },
            { id: "milk-almond", name: "Almond milk", priceDelta: 5 },
          ],
        },
        {
          id: "extras", name: "Extras", rule: "up-to-n", max: 2,
          modifiers: [
            { id: "shot", name: "Extra shot", priceDelta: 6 },
            { id: "cocoa", name: "Cocoa dust", priceDelta: 2 },
          ],
        },
      ],
    },
    { id: "flat-white", name: "Flat White", price: 28, categoryId: "coffee" },
    { id: "croissant", name: "Butter Croissant", price: 12, categoryId: "pastries" },
    { id: "pain-au-chocolat", name: "Pain au Chocolat", price: 14, categoryId: "pastries" },
    { id: "club-sandwich", name: "Club Sandwich", price: 45, categoryId: "sandwiches" },
    {
      id: "iced-latte", name: "Iced Latte", price: 30, categoryId: "cold",
      modifierGroups: [
        {
          id: "milk", name: "Milk", rule: "exactly-1",
          modifiers: [
            { id: "milk-whole", name: "Whole milk", priceDelta: 0 },
            { id: "milk-oat", name: "Oat milk", priceDelta: 5 },
            { id: "milk-almond", name: "Almond milk", priceDelta: 5 },
          ],
        },
        {
          id: "syrup", name: "Syrup", rule: "up-to-n", max: 2,
          modifiers: [
            { id: "vanilla", name: "Vanilla", priceDelta: 3 },
            { id: "caramel", name: "Caramel", priceDelta: 3 },
          ],
        },
      ],
    },
    { id: "fresh-orange", name: "Fresh Orange Juice", price: 25, categoryId: "cold" },
  ],
};

// ── Fast food ─────────────────────────────────────────────────────────
export const FAST_FOOD: DemoActivity = {
  key: "fast-food",
  name: "Fast food",
  tagline: "Built for the lunch rush — burgers, combos, delivery.",
  description:
    "Burgers, wraps, and combos with delivery handoff to Glovo and other partners. Heavy combo wizard usage; tight kitchen sync.",
  enabledOrderTypes: ["take-away", "glovo", "done", "dine-in"],
  skipOrderTypePicker: true,
  categories: [
    { id: "burgers", name: "Burgers" },
    { id: "wraps",   name: "Wraps" },
    { id: "sides",   name: "Sides" },
    { id: "drinks",  name: "Drinks" },
    { id: "combos",  name: "Combos" },
  ],
  products: [
    { id: "classic-burger", name: "Classic Burger", price: 45, categoryId: "burgers" },
    {
      id: "cheese-burger", name: "Cheese Burger", price: 50, categoryId: "burgers",
      variants: [
        { id: "cheese-cheddar", name: "Cheddar", priceDelta: 0 },
        { id: "cheese-blue", name: "Blue Cheese", priceDelta: 4 },
        { id: "cheese-vegan", name: "Vegan Cheese", priceDelta: 6 },
      ],
      modifierGroups: [
        {
          id: "doneness", name: "Doneness", rule: "exactly-1",
          modifiers: [
            { id: "med", name: "Medium", priceDelta: 0 },
            { id: "well", name: "Well done", priceDelta: 0 },
          ],
        },
        {
          id: "toppings", name: "Extra toppings", rule: "up-to-n", max: 4,
          modifiers: [
            { id: "bacon", name: "Bacon", priceDelta: 8 },
            { id: "egg", name: "Fried egg", priceDelta: 5 },
            { id: "jalapenos", name: "Jalapeños", priceDelta: 2 },
            { id: "extra-pickles", name: "Extra pickles", priceDelta: 2 },
          ],
        },
        {
          id: "remove", name: "No…", rule: "up-to-n", max: 3,
          modifiers: [
            { id: "no-onions", name: "No onions", priceDelta: 0 },
            { id: "no-tomato", name: "No tomato", priceDelta: 0 },
            { id: "no-sauce", name: "No sauce", priceDelta: 0 },
          ],
        },
      ],
    },
    { id: "double-burger",  name: "Double Burger",  price: 70, categoryId: "burgers" },
    { id: "chicken-wrap",   name: "Chicken Wrap",   price: 40, categoryId: "wraps" },
    { id: "tenders-wrap",   name: "Tenders Wrap",   price: 42, categoryId: "wraps" },
    { id: "fries",          name: "Fries",          price: 18, categoryId: "sides" },
    { id: "onion-rings",    name: "Onion Rings",    price: 20, categoryId: "sides" },
    { id: "coke",           name: "Coca-Cola 33cl", price: 12, categoryId: "drinks" },
    { id: "sprite",         name: "Sprite 33cl",    price: 12, categoryId: "drinks" },
    {
      id: "combo-classic",
      name: "Classic Combo",
      price: 75,
      categoryId: "combos",
      comboSteps: [
        {
          id: "drink",
          name: "Choose a drink",
          rule: "exactly-1",
          options: [
            { id: "coke", name: "Coca-Cola 33cl" },
            { id: "sprite", name: "Sprite 33cl" },
            { id: "water", name: "Still Water 50cl" },
          ],
        },
        {
          id: "side",
          name: "Choose a side",
          rule: "exactly-1",
          options: [
            { id: "fries", name: "Fries" },
            { id: "onion-rings", name: "Onion Rings", priceDelta: 2 },
          ],
        },
      ],
    },
  ],
};

// ── Restaurant (full-service dine-in) ────────────────────────────────
// Stored key stays "dine-in" so existing persisted state remains valid;
// only the display name changes.
export const DINE_IN: DemoActivity = {
  key: "dine-in",
  name: "Restaurant",
  tagline: "Tables, courses, and a kitchen that listens.",
  description:
    "Full-service dining with a floor plan, multi-course orders, and table-side modifications. Built around the dine-in flow.",
  enabledOrderTypes: ["dine-in", "take-away"],
  skipOrderTypePicker: true,
  categories: [
    { id: "starters", name: "Starters" },
    { id: "plats",    name: "Main Courses" },
    { id: "pasta",    name: "Pasta & Rice" },
    { id: "desserts", name: "Desserts" },
    { id: "drinks",   name: "Drinks" },
  ],
  products: [
    { id: "caesar-salad",   name: "Caesar Salad",       price: 55, categoryId: "starters" },
    { id: "soup-of-day",    name: "Soup of the Day",    price: 38, categoryId: "starters" },
    // Fixed-menu (formule du chef) — composite product wired with a
    // multi-component recipe in dine-in.ts. Demonstrates how a single
    // sale deducts inventory across three other plates. Priced as a
    // bundle discount vs. ordering the courses à la carte (38 + 95
    // + 42 = 175 individually, 165 as the formule).
    { id: "chef-combo",     name: "Chef's Combo",       price: 165, categoryId: "plats" },
    {
      id: "tagine-poulet", name: "Tagine Poulet", price: 95, categoryId: "plats",
      variants: [
        { id: "spice-mild", name: "Mild", priceDelta: 0 },
        { id: "spice-med", name: "Medium", priceDelta: 0 },
        { id: "spice-hot", name: "Spicy", priceDelta: 0 },
      ],
      modifierGroups: [
        {
          id: "sides", name: "Side", rule: "exactly-1",
          modifiers: [
            { id: "rice", name: "Saffron rice", priceDelta: 0 },
            { id: "couscous", name: "Couscous", priceDelta: 0 },
            { id: "bread", name: "Khobz bread", priceDelta: 0 },
          ],
        },
      ],
    },
    { id: "couscous-royal", name: "Couscous Royal",     price: 120, categoryId: "plats" },
    { id: "filet-grille",   name: "Filet Grillé",       price: 145, categoryId: "plats" },
    { id: "pasta-arrabiata", name: "Pasta Arrabiata",   price: 70, categoryId: "pasta" },
    { id: "risotto",        name: "Mushroom Risotto",   price: 85, categoryId: "pasta" },
    { id: "creme-brulee",   name: "Crème Brûlée",       price: 42, categoryId: "desserts" },
    { id: "fondant",        name: "Fondant au Chocolat", price: 45, categoryId: "desserts" },
    { id: "still-water",    name: "Still Water 75cl",   price: 18, categoryId: "drinks" },
    { id: "house-red",      name: "House Red Glass",    price: 65, categoryId: "drinks" },
  ],
};

// ── Market / grocery / convenience store ──────────────────────────────
// Counter-sale workflow tuned for high-volume retail checkout. No table,
// no beeper, no order-type ceremony — the cashier opens the workspace and
// rings items as fast as the customer puts them on the counter.
export const MARKET: DemoActivity = {
  key: "market",
  name: "Market",
  tagline: "Bread, milk, eggs — and 200 other things, fast.",
  description:
    "Grocery and convenience-store checkout. Per-item pricing, dense category browsing, no kitchen routing. Built for the line behind the counter to move.",
  enabledOrderTypes: ["take-away"],
  skipOrderTypePicker: true,
  categories: [
    { id: "produce",   name: "Fruits & Vegetables" },
    { id: "bread",     name: "Bread & Pastry" },
    { id: "dairy",     name: "Dairy & Eggs" },
    { id: "beverages", name: "Beverages" },
    { id: "snacks",    name: "Snacks" },
    { id: "pantry",    name: "Pantry" },
    { id: "household", name: "Household" },
    { id: "personal",  name: "Personal Care" },
  ],
  products: [
    // Fruits & Vegetables
    { id: "apple-kg",     name: "Apples (1 kg)",      price: 12,  categoryId: "produce" },
    { id: "banana-kg",    name: "Bananas (1 kg)",     price: 18,  categoryId: "produce" },
    { id: "tomato-kg",    name: "Tomatoes (1 kg)",    price: 8,   categoryId: "produce" },
    { id: "onion-kg",     name: "Onions (1 kg)",      price: 6,   categoryId: "produce" },
    { id: "lemon-kg",     name: "Lemons (1 kg)",      price: 15,  categoryId: "produce" },
    { id: "potato-kg",    name: "Potatoes (1 kg)",    price: 7,   categoryId: "produce" },
    { id: "cucumber",     name: "Cucumber (each)",    price: 3,   categoryId: "produce" },

    // Bread & Pastry
    { id: "baguette",     name: "Baguette",           price: 1.5, categoryId: "bread" },
    { id: "khobz",        name: "Khobz (round)",      price: 1,   categoryId: "bread" },
    { id: "mini-baguette", name: "Mini Baguette",     price: 1,   categoryId: "bread" },
    { id: "croissant",    name: "Croissant",          price: 5,   categoryId: "bread" },
    { id: "msemen",       name: "Msemen (3 pcs)",     price: 8,   categoryId: "bread" },

    // Dairy & Eggs
    { id: "milk-1l",      name: "Milk (1 L)",         price: 8,   categoryId: "dairy" },
    { id: "yoghurt",      name: "Yoghurt (single)",   price: 4,   categoryId: "dairy" },
    { id: "cheese-slice", name: "Cheese (200 g)",     price: 25,  categoryId: "dairy" },
    { id: "eggs-12",      name: "Eggs (12)",          price: 18,  categoryId: "dairy" },
    { id: "butter-250",   name: "Butter (250 g)",     price: 20,  categoryId: "dairy" },

    // Beverages
    { id: "water-1l5",    name: "Water (1.5 L)",      price: 5,   categoryId: "beverages" },
    { id: "water-50",     name: "Water (50 cl)",      price: 4,   categoryId: "beverages" },
    { id: "coke-1l",      name: "Coca-Cola (1 L)",    price: 10,  categoryId: "beverages" },
    { id: "orange-1l",    name: "Orange Juice (1 L)", price: 18,  categoryId: "beverages" },
    { id: "iced-tea",     name: "Iced Tea (33 cl)",   price: 8,   categoryId: "beverages" },

    // Snacks
    { id: "choc-bar",     name: "Chocolate Bar",      price: 7,   categoryId: "snacks" },
    { id: "chips-100",    name: "Chips (100 g)",      price: 6,   categoryId: "snacks" },
    { id: "cookies",      name: "Cookies Pack",       price: 12,  categoryId: "snacks" },
    { id: "crackers",     name: "Crackers",           price: 8,   categoryId: "snacks" },
    { id: "nuts-100",     name: "Mixed Nuts (100 g)", price: 25,  categoryId: "snacks" },

    // Pantry
    { id: "rice-1kg",     name: "Rice (1 kg)",        price: 15,  categoryId: "pantry" },
    { id: "pasta-500",    name: "Pasta (500 g)",      price: 8,   categoryId: "pantry" },
    { id: "sugar-1kg",    name: "Sugar (1 kg)",       price: 12,  categoryId: "pantry" },
    { id: "salt-1kg",     name: "Salt (1 kg)",        price: 3,   categoryId: "pantry" },
    { id: "olive-oil-1l", name: "Olive Oil (1 L)",    price: 65,  categoryId: "pantry" },
    { id: "tomato-paste", name: "Tomato Paste",       price: 5,   categoryId: "pantry" },

    // Household
    { id: "tp-4pk",       name: "Toilet Paper (4-pk)", price: 22, categoryId: "household" },
    { id: "dish-soap",    name: "Dish Soap",          price: 14,  categoryId: "household" },
    { id: "detergent",    name: "Laundry Detergent (1 kg)", price: 35, categoryId: "household" },
    { id: "sponge-pk",    name: "Sponges (3-pk)",     price: 9,   categoryId: "household" },

    // Personal Care
    { id: "toothpaste",   name: "Toothpaste",         price: 16,  categoryId: "personal" },
    { id: "shampoo",      name: "Shampoo (250 ml)",   price: 28,  categoryId: "personal" },
    { id: "soap-bar",     name: "Soap Bar",           price: 5,   categoryId: "personal" },
  ],
};

// ── Bakery ────────────────────────────────────────────────────────────
// Counter-side artisan bakery. Five categories, 22 SKUs — wide enough to
// feel like a real shift catalog, not a thinned demo. Take-away only;
// every transaction rings as a fresh order.
export const BAKERY: DemoActivity = {
  key: "bakery",
  name: "Bakery",
  tagline: "Breads, viennoiseries, and the morning queue.",
  description:
    "Artisan production rotating through the day — loaves, pastries, signature cakes, and counter coffee. Built for fast pickup and a moving line.",
  enabledOrderTypes: ["take-away"],
  skipOrderTypePicker: true,
  categories: [
    { id: "breads",       name: "Breads" },
    { id: "viennoiseries", name: "Viennoiseries" },
    { id: "cakes",        name: "Cakes & Tarts" },
    { id: "cookies",      name: "Cookies" },
    { id: "drinks",       name: "Drinks" },
  ],
  products: [
    // Breads
    { id: "baguette",     name: "Baguette",            price: 5,  categoryId: "breads" },
    { id: "sourdough",    name: "Sourdough Loaf",      price: 28, categoryId: "breads" },
    { id: "wholewheat",   name: "Whole Wheat Loaf",    price: 24, categoryId: "breads" },
    { id: "ciabatta",     name: "Ciabatta",            price: 14, categoryId: "breads" },
    { id: "pain-de-mie",  name: "Pain de Mie",         price: 18, categoryId: "breads" },
    { id: "rye-bread",    name: "Rye Bread",           price: 22, categoryId: "breads" },

    // Viennoiseries
    { id: "croissant",       name: "Butter Croissant",   price: 12, categoryId: "viennoiseries" },
    { id: "pain-chocolat",   name: "Pain au Chocolat",   price: 14, categoryId: "viennoiseries" },
    { id: "brioche",         name: "Brioche",            price: 16, categoryId: "viennoiseries" },
    { id: "raisin-snail",    name: "Pain aux Raisins",   price: 14, categoryId: "viennoiseries" },
    { id: "apple-turnover",  name: "Apple Turnover",     price: 15, categoryId: "viennoiseries" },

    // Cakes & Tarts
    { id: "opera",         name: "Opera Cake",         price: 38, categoryId: "cakes" },
    { id: "fraisier",      name: "Fraisier",           price: 42, categoryId: "cakes" },
    { id: "eclair",        name: "Chocolate Éclair",   price: 22, categoryId: "cakes" },
    { id: "millefeuille",  name: "Mille-feuille",      price: 28, categoryId: "cakes" },
    { id: "lemon-tart",    name: "Lemon Tart",         price: 26, categoryId: "cakes" },

    // Cookies
    { id: "choc-chip",     name: "Chocolate Chip Cookie", price: 10, categoryId: "cookies" },
    { id: "shortbread",    name: "Shortbread",            price: 8,  categoryId: "cookies" },
    { id: "macaron",       name: "Macaron",               price: 8,  categoryId: "cookies" },
    { id: "almond-biscotti", name: "Almond Biscotti",     price: 9,  categoryId: "cookies" },

    // Drinks
    { id: "coffee",        name: "Filter Coffee",         price: 15, categoryId: "drinks" },
    { id: "tea",           name: "Tea",                   price: 12, categoryId: "drinks" },
    { id: "fresh-orange",  name: "Fresh Orange Juice",    price: 25, categoryId: "drinks" },
  ],
};

// ── Beauty salon ──────────────────────────────────────────────────────
// Service-led vertical with a Retail category for take-home product sales
// — mirrors how real salons mix services and product retail at the till.
// Four categories, 20 SKUs covering hair, nails, spa, and retail.
export const BEAUTY: DemoActivity = {
  key: "beauty",
  name: "Beauty salon",
  tagline: "Services, treatments, and take-home retail at one till.",
  description:
    "Hair, nails, and spa services rung up alongside a real retail shelf — shampoo, masks, polish. The same till that books the chair sells the product.",
  enabledOrderTypes: ["take-away"],
  skipOrderTypePicker: true,
  categories: [
    { id: "hair",   name: "Hair" },
    { id: "nails",  name: "Nails" },
    { id: "spa",    name: "Spa" },
    { id: "retail", name: "Retail" },
  ],
  products: [
    // Hair
    {
      id: "haircut-w", name: "Haircut · Women", price: 120, categoryId: "hair", durationMin: 60,
      modifierGroups: [
        {
          id: "style", name: "Style", rule: "exactly-1",
          modifiers: [
            { id: "bob", name: "Bob", priceDelta: 0 },
            { id: "layers", name: "Layered", priceDelta: 0 },
            { id: "long-trim", name: "Long-trim", priceDelta: 0 },
            { id: "fringe", name: "With fringe", priceDelta: 0 },
          ],
        },
        {
          id: "addons", name: "Add-ons", rule: "up-to-n", max: 2,
          modifiers: [
            { id: "blowdry", name: "Blowdry", priceDelta: 60 },
            { id: "deep-cond", name: "Deep conditioner", priceDelta: 40 },
          ],
        },
      ],
    },
    {
      id: "haircut-m", name: "Haircut · Men", price: 80, categoryId: "hair", durationMin: 30,
      modifierGroups: [
        {
          id: "style", name: "Style", rule: "exactly-1",
          modifiers: [
            { id: "taper", name: "Taper", priceDelta: 0 },
            { id: "fade", name: "Fade", priceDelta: 0 },
            { id: "scissor", name: "Scissor", priceDelta: 0 },
          ],
        },
      ],
    },
    { id: "blowdry",         name: "Blowdry",             price: 60,  categoryId: "hair",   durationMin: 30 },
    { id: "color",           name: "Single Color",        price: 250, categoryId: "hair",   durationMin: 90 },
    { id: "highlights",      name: "Highlights",          price: 350, categoryId: "hair",   durationMin: 120 },
    { id: "hair-treatment",  name: "Hair Treatment",      price: 150, categoryId: "hair",   durationMin: 45 },

    // Nails
    { id: "manicure",        name: "Classic Manicure",    price: 80,  categoryId: "nails",  durationMin: 45 },
    { id: "gel-manicure",    name: "Gel Manicure",        price: 120, categoryId: "nails",  durationMin: 60 },
    { id: "pedicure",        name: "Pedicure",            price: 100, categoryId: "nails",  durationMin: 60 },
    { id: "nail-art",        name: "Nail Art (per nail)", price: 30,  categoryId: "nails",  durationMin: 15 },

    // Spa
    { id: "facial",          name: "Express Facial",      price: 180, categoryId: "spa",    durationMin: 60 },
    { id: "massage-30",      name: "Massage · 30 min",    price: 200, categoryId: "spa",    durationMin: 30 },
    { id: "massage-60",      name: "Massage · 60 min",    price: 350, categoryId: "spa",    durationMin: 60 },
    { id: "wax-brows",       name: "Eyebrow Waxing",      price: 40,  categoryId: "spa",    durationMin: 15 },
    { id: "wax-legs",        name: "Leg Waxing",          price: 120, categoryId: "spa",    durationMin: 45 },

    // Retail
    { id: "shampoo",         name: "Shampoo",             price: 150, categoryId: "retail" },
    { id: "conditioner",     name: "Conditioner",         price: 160, categoryId: "retail" },
    { id: "hair-mask",       name: "Hair Mask",           price: 180, categoryId: "retail" },
    { id: "styling-cream",   name: "Styling Cream",       price: 120, categoryId: "retail" },
    { id: "nail-polish",     name: "Nail Polish",         price: 45,  categoryId: "retail" },
  ],
};

// ── Barber ────────────────────────────────────────────────────────────
// Sibling vertical to Beauty salon — same calendar / appointments
// surface, different service catalog. 16 SKUs across cuts, beard,
// treatments, and retail.
export const BARBER: DemoActivity = {
  key: "barber",
  name: "Barber",
  tagline: "Cuts, shaves, and chair-side regulars.",
  description:
    "Classic and modern men's grooming — cuts, fades, beard work, and the take-home shelf. Same appointment book as the salon, tuned for the barbershop chair.",
  enabledOrderTypes: ["take-away"],
  skipOrderTypePicker: true,
  categories: [
    { id: "cuts",        name: "Cuts" },
    { id: "beard",       name: "Beard" },
    { id: "treatments",  name: "Treatments" },
    { id: "retail",      name: "Retail" },
  ],
  products: [
    // Cuts
    {
      id: "classic-cut", name: "Classic Cut", price: 80, categoryId: "cuts", durationMin: 30,
      modifierGroups: [
        {
          id: "style", name: "Style", rule: "exactly-1",
          modifiers: [
            { id: "taper", name: "Taper", priceDelta: 0 },
            { id: "fade", name: "Fade", priceDelta: 0 },
            { id: "scissor", name: "Scissor", priceDelta: 0 },
          ],
        },
        {
          id: "addons", name: "Add-ons", rule: "up-to-n", max: 2,
          modifiers: [
            { id: "beard-trim", name: "Beard trim", priceDelta: 40 },
            { id: "wash", name: "Wash", priceDelta: 20 },
          ],
        },
      ],
    },
    {
      id: "skin-fade", name: "Skin Fade", price: 120, categoryId: "cuts", durationMin: 45,
      modifierGroups: [
        {
          id: "blend", name: "Blend", rule: "exactly-1",
          modifiers: [
            { id: "low", name: "Low fade", priceDelta: 0 },
            { id: "mid", name: "Mid fade", priceDelta: 0 },
            { id: "high", name: "High fade", priceDelta: 0 },
          ],
        },
      ],
    },
    { id: "scissor-cut",     name: "Scissor Cut",         price: 100, categoryId: "cuts",       durationMin: 45 },
    { id: "buzz-cut",        name: "Buzz Cut",            price: 60,  categoryId: "cuts",       durationMin: 15 },
    { id: "kids-cut",        name: "Kids Cut",            price: 50,  categoryId: "cuts",       durationMin: 20 },

    // Beard
    { id: "beard-trim",      name: "Beard Trim",          price: 50,  categoryId: "beard",      durationMin: 15 },
    { id: "beard-shave",     name: "Beard Shave",         price: 70,  categoryId: "beard",      durationMin: 25 },
    { id: "hot-towel",       name: "Hot Towel Shave",     price: 100, categoryId: "beard",      durationMin: 35 },
    { id: "mustache",        name: "Mustache Trim",       price: 30,  categoryId: "beard",      durationMin: 10 },

    // Treatments
    { id: "color-app",       name: "Color Application",   price: 180, categoryId: "treatments", durationMin: 60 },
    { id: "scalp",           name: "Scalp Treatment",     price: 120, categoryId: "treatments", durationMin: 30 },
    { id: "wash-style",      name: "Wash & Style",        price: 50,  categoryId: "treatments", durationMin: 20 },

    // Retail
    { id: "beard-oil",       name: "Beard Oil",           price: 140, categoryId: "retail" },
    { id: "pomade",          name: "Hair Pomade",         price: 120, categoryId: "retail" },
    { id: "shampoo-b",       name: "Shampoo",             price: 110, categoryId: "retail" },
    { id: "aftershave",      name: "Aftershave",          price: 95,  categoryId: "retail" },
  ],
};

export const ACTIVITIES: Record<DemoActivity["key"], DemoActivity> = {
  cafe: CAFE,
  "fast-food": FAST_FOOD,
  "dine-in": DINE_IN,
  market: MARKET,
  bakery: BAKERY,
  beauty: BEAUTY,
  barber: BARBER,
};

// Order: hospitality (Café → Bakery → Fast food → Restaurant) → service
// verticals (Beauty → Barber) → retail (Market). Logical workflow groups.
export const ACTIVITY_LIST: DemoActivity[] = [
  CAFE,
  BAKERY,
  FAST_FOOD,
  DINE_IN,
  BEAUTY,
  BARBER,
  MARKET,
];
