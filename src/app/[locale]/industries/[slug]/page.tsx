// Dynamic industry detail page. Content lives in the next-intl
// catalogs under `industryPages.<slug>` so FR + EN render side by
// side from a single source of truth.
//
// Slugs follow the demo simulator's ActivityKey union (cafe, dine-in,
// fast-food, bakery, beauty, barber, market) so the "Try the simulator"
// CTA can prime the matching activity. Legacy aliases (cafes,
// restaurants, retail) used by older links redirect to the canonical
// slug at render time.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { TrySimulatorCTA } from "@/components/industries/TrySimulatorCTA";
import type { ActivityKey } from "@/data/demo/types";

const CANONICAL_SLUGS = [
  "cafe",
  "fast-food",
  "dine-in",
  "bakery",
  "beauty",
  "barber",
  "market",
] as const;

type CanonicalSlug = (typeof CANONICAL_SLUGS)[number];

const SLUG_ALIAS: Record<string, CanonicalSlug> = {
  cafes: "cafe",
  restaurants: "dine-in",
  retail: "market",
  // Add additional aliases here if older URLs surface in production.
};

const ACTIVITY_FOR_SLUG: Record<CanonicalSlug, ActivityKey> = {
  cafe: "cafe",
  "fast-food": "fast-food",
  "dine-in": "dine-in",
  bakery: "bakery",
  beauty: "beauty",
  barber: "barber",
  market: "market",
};

type Params = Promise<{ slug: string }>;

export default async function IndustryPage({ params }: { params: Params }) {
  const { slug: rawSlug } = await params;
  const slug = (SLUG_ALIAS[rawSlug] ??
    (CANONICAL_SLUGS as readonly string[]).includes(rawSlug)
      ? (SLUG_ALIAS[rawSlug] ?? (rawSlug as CanonicalSlug))
      : null) as CanonicalSlug | null;
  if (!slug) return notFound();

  const t = await getTranslations(`industryPages.${slug}`);
  const tLabels = await getTranslations("industryPages.labels");

  const eyebrow = t("eyebrow");
  const title = t("title");
  const standfirst = t("standfirst");
  const workflow = t.raw("workflow") as string[];
  const ecosystem = t.raw("ecosystem") as string[];
  const scaling = t("scaling");
  const activity = ACTIVITY_FOR_SLUG[slug];

  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 md:pt-40 pb-16 md:pb-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-mute mb-4">
          {eyebrow}
        </p>
        <h1
          className="text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-[-0.022em] leading-[1.02] text-ink max-w-[18ch]"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h1>
        <p className="mt-7 text-[18px] md:text-[21px] leading-[1.5] text-ink-soft max-w-[40rem]">
          {standfirst}
        </p>
      </section>

      {/* Try-the-simulator CTA — prominently placed under the hero so
          visitors convert from marketing into a hands-on POS preview
          before scrolling through workflow + ecosystem detail. */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-16 md:pb-20">
        <TrySimulatorCTA
          activity={activity}
          label={tLabels("ctaTrySim", { activity: title })}
          description={tLabels("ctaTrySimDesc", { activity: title })}
        />
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-16 md:pb-24">
        <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink mb-8">
          {tLabels("workflowTitle")}
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflow.map((step, i) => (
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
            {tLabels("ecosystemTitle")}
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 max-w-[60rem]">
            {ecosystem.map((item, i) => (
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
          {tLabels("scalingTitle")}
        </h2>
        <p className="text-[16px] md:text-[18px] leading-[1.55] text-ink-soft max-w-[40rem]">
          {scaling}
        </p>
      </section>

      {/* CTAs + back link */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-28 md:pb-40">
        <div className="flex flex-wrap items-center gap-3">
          <Button href="/start-free-trial" variant="primary" size="lg">
            {tLabels("ctaTrial")}
          </Button>
          <Button href="/support#contact" variant="ghost" size="lg">
            {tLabels("ctaTalk")}
          </Button>
        </div>
        <p className="mt-8 text-[13.5px] text-ink-mute">
          <Link href="/#industries" className="hover:text-ink transition-colors">
            {tLabels("backToIndustries")}
          </Link>
        </p>
      </section>
    </main>
  );
}

export function generateStaticParams() {
  return [
    ...CANONICAL_SLUGS.map((slug) => ({ slug })),
    ...Object.keys(SLUG_ALIAS).map((slug) => ({ slug })),
  ];
}
