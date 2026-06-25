import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";

// Dynamic industry detail page — minimal scaffolding that the
// Industries carousel tiles link into. Each industry slug maps to a
// curated narrative (intro, workflow, ecosystem fit, scaling). Real
// content + illustrations are filled in below per slug; new entries
// can be added without changing the route handler.

type IndustryContent = {
  eyebrow: string;
  title: string;
  standfirst: string;
  workflow: string[];
  ecosystem: string[];
  scaling: string;
};

const INDUSTRIES: Record<string, IndustryContent> = {
  restaurants: {
    eyebrow: "Hospitality",
    title: "Restaurants",
    standfirst:
      "Fast service, full house. Ring orders, fire to kitchen, take payment — without ever leaving the floor.",
    workflow: [
      "Open orders by table, modify on the fly, split or merge tabs in one tap.",
      "Send to kitchen instantly — no shouting across the line, no lost tickets.",
      "Take payment at the table, cash drawer, or terminal — same workflow.",
    ],
    ecosystem: [
      "Kitchen Display routes by station with color-coded urgency.",
      "Customer Display shows the order live as your team rings it.",
      "Payment Terminal docks at the till for tap-and-go.",
      "Online Ordering and QR Menu drop straight into the same kitchen queue.",
    ],
    scaling:
      "One restaurant or forty — Back Office consolidates every till's revenue, stock, and staff hours into one console.",
  },
  cafes: {
    eyebrow: "Coffee & counter",
    title: "Cafés",
    standfirst:
      "Counter to cup, in seconds. Built for the morning rush, the casual lunch, and the regulars who already know what they want.",
    workflow: [
      "One-tap modifiers — size, milk, extra shot — without slowing the line.",
      "Loyalty redeems at the till; baristas don't manage two systems.",
      "Recipe-aware stock deducts beans, milk, and cups on every sale.",
    ],
    ecosystem: [
      "QR Menu for table-service flips dine-in into a kiosk ordering experience.",
      "Mobile Application lets the manager check sales from anywhere.",
      "Customer Display turns the counter into a brand surface.",
    ],
    scaling:
      "Single café? Run it lean. Chain of locations? See every counter's flow from one dashboard.",
  },
  retail: {
    eyebrow: "Shop floor",
    title: "Retail",
    standfirst:
      "Inventory you can trust. Sell, restock, transfer between stores — all in one rhythm.",
    workflow: [
      "Barcode scan or product search — both routes lead to the same till.",
      "Live stock counts so the screen never shows what the shelf doesn't have.",
      "Returns, exchanges, and refunds with a one-tap audit trail.",
    ],
    ecosystem: [
      "Stock Management with multi-location transfers and low-stock alerts.",
      "Payment Terminal accepts every Moroccan card flavor — CMI included.",
      "Back Office reporting drills from sale to product to supplier.",
    ],
    scaling:
      "One store, ten stores, a hundred SKUs or ten thousand — the system grows with the inventory.",
  },
  "fast-food": {
    eyebrow: "Quick service",
    title: "Fast food",
    standfirst:
      "Volume without chaos. Combos, modifiers, kitchen tickets — all tuned for peak hour.",
    workflow: [
      "Combo wizard walks customers through main + side + drink in seconds.",
      "Tickets fire to kitchen the moment payment hits.",
      "Receipt printer + cash drawer integration on every counter.",
    ],
    ecosystem: [
      "Self-Order Kiosk pulls orders out of the cashier queue.",
      "Online Ordering routes to the same KDS as the counter line.",
      "Mobile Application lets management track speed-of-service.",
    ],
    scaling:
      "Multi-store quick service runs on the same till logic — every location reports into one Back Office.",
  },
  bakery: {
    eyebrow: "Daily bake",
    title: "Bakery",
    standfirst:
      "Stock that matches the oven. Track every loaf, croissant, and cake from production to till.",
    workflow: [
      "Production runs deduct raw materials; sales deduct finished goods.",
      "Daily prep counts visible at every counter — no over-baking, no shortages.",
      "Batch and expiry tracking for perishable items.",
    ],
    ecosystem: [
      "Stock Management knows the recipe behind every product.",
      "Customer Display shows daily specials to the queue.",
      "QR Menu for catering pre-orders.",
    ],
    scaling:
      "Central kitchen + multiple retail counters? Back Office orchestrates production and distribution.",
  },
  "multi-store": {
    eyebrow: "Group operations",
    title: "Multi-store",
    standfirst:
      "Every location, one console. Real-time sales, stock, and staffing across every till you operate.",
    workflow: [
      "Centralized menu and pricing — push changes to every store at once.",
      "Inter-store transfers tracked end-to-end with audit trail.",
      "Consolidated reporting with location-level drill-down.",
    ],
    ecosystem: [
      "Back Office is the command center — every till reports here.",
      "Mobile Application gives owners a real-time pulse from anywhere.",
      "Integration Layer connects with your existing accounting + ERP.",
    ],
    scaling:
      "Two locations or two hundred — the architecture is the same. Add stores when you're ready.",
  },
  bar: {
    eyebrow: "Evening trade",
    title: "Bar & lounge",
    standfirst:
      "Tabs, rounds, and tickets — built for the late-night pace.",
    workflow: [
      "Open tabs by name, table, or seat. Add rounds in one tap.",
      "Bartender + server roles with separate till permissions.",
      "End-of-night close-out with cash, card, and tip reconciliation.",
    ],
    ecosystem: [
      "Mobile Application for floor staff to ring at the table.",
      "Kitchen Display routes food tickets to the kitchen, drink tickets to the bar.",
      "Customer Display optional — turn it off for ambient venues.",
    ],
    scaling:
      "Single bar? Run it tight. Hotel + restaurant + bar group? Roll all venues into one Back Office view.",
  },
  beauty: {
    eyebrow: "Appointments",
    title: "Beauty & services",
    standfirst:
      "Bookings, staff, and till — one app. From walk-ins to standing appointments.",
    workflow: [
      "Calendar view per staff member with drag-and-drop rebooking.",
      "Add services to active appointments; ring through the till at checkout.",
      "Customer history attached to every visit.",
    ],
    ecosystem: [
      "Mobile Application turns any phone into a booking terminal.",
      "Customer Display shows the customer's selected services + total.",
      "Stock Management for retail products sold alongside services.",
    ],
    scaling:
      "Single salon to franchise group — staff schedules, commissions, and inventory all centralized.",
  },
};

type Params = Promise<{ slug: string }>;

export default async function IndustryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const content = INDUSTRIES[slug];
  if (!content) return notFound();

  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 md:pt-40 pb-16 md:pb-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-mute mb-4">
          {content.eyebrow}
        </p>
        <h1
          className="text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-[-0.022em] leading-[1.02] text-ink max-w-[18ch]"
          style={{ textWrap: "balance" }}
        >
          {content.title}
        </h1>
        <p className="mt-7 text-[18px] md:text-[21px] leading-[1.5] text-ink-soft max-w-[40rem]">
          {content.standfirst}
        </p>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-16 md:pb-24">
        <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink mb-8">
          How the workflow runs.
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.workflow.map((step, i) => (
            <li key={i} className="relative">
              <span className="block text-[11px] uppercase tracking-[0.2em] text-ink-mute font-semibold mb-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-[15px] md:text-[16px] leading-[1.55] text-ink-soft">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Ecosystem fit */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink mb-8">
            What plugs in.
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 max-w-[60rem]">
            {content.ecosystem.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[15px] md:text-[16px] leading-[1.55] text-ink-soft"
              >
                <span
                  aria-hidden
                  className="mt-[9px] h-1.5 w-1.5 rounded-full bg-[#E11D2A] shrink-0"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Scaling */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink mb-6">
          Scales with you.
        </h2>
        <p className="text-[16px] md:text-[18px] leading-[1.55] text-ink-soft max-w-[40rem]">
          {content.scaling}
        </p>
      </section>

      {/* CTAs + back link */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-28 md:pb-40">
        <div className="flex flex-wrap items-center gap-3">
          <Button href="/start-free-trial" variant="primary" size="lg">
            Start a free trial
          </Button>
          <Button href="/support#contact" variant="ghost" size="lg">
            Talk to sales
          </Button>
        </div>
        <p className="mt-8 text-[13.5px] text-ink-mute">
          <Link href="/#industries" className="hover:text-ink transition-colors">
            ← Back to industries
          </Link>
        </p>
      </section>
    </main>
  );
}

// Static generation hints — Next.js will pre-render these slugs.
export function generateStaticParams() {
  return Object.keys(INDUSTRIES).map((slug) => ({ slug }));
}
