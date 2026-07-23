// Dynamic industry detail page. Content lives in the next-intl
// catalogs under `industryPages.<slug>` so FR + EN render side by side
// from a single source of truth.
//
// Slugs follow the demo simulator's ActivityKey union (cafe, dine-in,
// fast-food, bakery, beauty, barber, market) so the "Try the simulator"
// CTA can prime the matching activity. Legacy aliases (cafes,
// restaurants, retail) redirect to the canonical slug at render time.
//
// Schema (backward-compatible for slugs not yet upgraded):
//   • eyebrow / title / standfirst — hero
//   • intro? — optional lead paragraph under the standfirst
//   • workflow: Array<string | { pain, solutionTitle, solutionBody }>
//       - string  → legacy numbered card (01/02/03 …)
//       - object  → pain/solution pair rendered as a two-column band
//   • ecosystem: Array<string | { name, tag?, body? }>
//       - string  → plain chip in the "also using" grid
//       - object with body  → featured proof card
//       - object without body → chip with tag underneath
//   • goDeeper? — optional "Pour aller plus loin" callout at the bottom
//     of the workflow section (e.g. Cafés' Kiosque libre-service)
//   • scaling — CTA paragraph closing the page

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

type WorkflowStep =
  | string
  | { pain: string; solutionTitle: string; solutionBody: string };

type EcosystemItem =
  | string
  | { name: string; tag?: string; body?: string };

type GoDeeper = { title: string; body: string; ctaLabel?: string; ctaHref?: string };

type Params = Promise<{ slug: string }>;

function isRichWorkflow(
  step: WorkflowStep,
): step is { pain: string; solutionTitle: string; solutionBody: string } {
  return typeof step === "object" && step !== null && "pain" in step;
}

function isRichEcosystem(
  item: EcosystemItem,
): item is { name: string; tag?: string; body?: string } {
  return typeof item === "object" && item !== null && "name" in item;
}

export default async function IndustryPage({ params }: { params: Params }) {
  const { slug: rawSlug } = await params;
  const slug: CanonicalSlug | null =
    SLUG_ALIAS[rawSlug] ??
    ((CANONICAL_SLUGS as readonly string[]).includes(rawSlug)
      ? (rawSlug as CanonicalSlug)
      : null);
  if (!slug) return notFound();

  const t = await getTranslations(`industryPages.${slug}`);
  const tLabels = await getTranslations("industryPages.labels");

  const eyebrow = t("eyebrow");
  const title = t("title");
  const standfirst = t("standfirst");
  const workflow = t.raw("workflow") as WorkflowStep[];
  const ecosystem = t.raw("ecosystem") as EcosystemItem[];
  const scaling = t("scaling");
  const activity = ACTIVITY_FOR_SLUG[slug];

  // Optional fields — read defensively so slugs not yet ported to the
  // richer schema still render.
  let intro: string | null = null;
  try {
    intro = t("intro");
  } catch {}
  let goDeeper: GoDeeper | null = null;
  try {
    goDeeper = t.raw("goDeeper") as GoDeeper;
  } catch {}
  let ecosystemIntro: string | null = null;
  try {
    ecosystemIntro = t("ecosystemIntro");
  } catch {}

  const richWorkflow = workflow.some(isRichWorkflow);
  const richEcosystem = ecosystem.some(isRichEcosystem);

  return (
    <main className="bg-canvas text-ink">
      <SectionDivider scheme="light" />

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 md:pt-36 pb-12 md:pb-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-mute mb-4">
          {eyebrow}
        </p>
        <h1
          className="text-[clamp(2.25rem,5vw,4rem)] font-semibold tracking-[-0.022em] leading-[1.04] text-ink max-w-[22ch]"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h1>
        <p className="mt-6 text-[17px] md:text-[20px] leading-[1.5] text-ink-soft max-w-[44rem]">
          {standfirst}
        </p>
        {intro && (
          <p className="mt-5 text-[15px] md:text-[16px] leading-[1.6] text-ink-soft max-w-[44rem]">
            {intro}
          </p>
        )}
      </section>

      {/* Try-the-simulator CTA — prominently placed under the hero so
          visitors convert from marketing into a hands-on POS preview
          before scrolling through workflow + ecosystem detail. */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-14 md:pb-20">
        <TrySimulatorCTA
          activity={activity}
          label={tLabels("ctaTrySim", { activity: title })}
          description={tLabels("ctaTrySimDesc", { activity: title })}
        />
      </section>

      {/* Workflow — either the legacy 01/02/03 numbered format OR the
          new pain/solution two-column bands, depending on the shape
          each slug's catalog carries. */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-16 md:pb-24">
        <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink mb-8 md:mb-10">
          {tLabels("workflowTitle")}
        </h2>
        {richWorkflow ? (
          <div className="rounded-[24px] bg-paper ring-1 ring-hairline overflow-hidden">
            {workflow.map((step, i) => (
              <div
                key={i}
                className={`grid grid-cols-1 md:grid-cols-[1fr_1.15fr] gap-x-8 gap-y-4 px-6 md:px-8 py-6 md:py-7 ${
                  i > 0 ? "border-t border-hairline" : ""
                }`}
              >
                {isRichWorkflow(step) ? (
                  <>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-mute mb-2">
                        {tLabels("painLabel")}
                      </p>
                      <p className="text-[16px] md:text-[17px] font-medium leading-[1.4] text-ink tracking-[-0.01em]">
                        {step.pain}
                      </p>
                    </div>
                    <div className="md:pl-6 md:border-l border-hairline">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#E11D2A] mb-2">
                        {tLabels("solutionLabel")}
                      </p>
                      <p className="text-[15px] md:text-[16px] font-medium leading-[1.4] text-ink tracking-[-0.005em]">
                        {step.solutionTitle}
                      </p>
                      <p className="mt-2.5 text-[14px] leading-[1.6] text-ink-soft">
                        {step.solutionBody}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="md:col-span-2 text-[15px] leading-[1.55] text-ink-soft">
                    {step}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflow.map((step, i) => (
              <li key={i} className="relative">
                <span className="block text-[11px] uppercase tracking-[0.2em] text-ink-mute font-semibold mb-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] md:text-[16px] leading-[1.55] text-ink-soft">
                  {typeof step === "string" ? step : step.pain}
                </p>
              </li>
            ))}
          </ol>
        )}

        {/* Optional "Pour aller plus loin" callout */}
        {goDeeper && (
          <div className="mt-8 md:mt-10 rounded-2xl bg-paper ring-1 ring-hairline p-6 md:p-7 max-w-[42rem]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-mute mb-2.5">
              {tLabels("goDeeperEyebrow")}
            </p>
            <p className="text-[17px] md:text-[18px] font-semibold text-ink leading-[1.3]">
              {goDeeper.title}
            </p>
            <p className="mt-2 text-[14.5px] leading-[1.6] text-ink-soft">
              {goDeeper.body}
            </p>
            {goDeeper.ctaLabel && (
              <Link
                href={goDeeper.ctaHref ?? "/pricing"}
                className="mt-4 inline-flex items-center text-[13.5px] font-medium text-ink hover:text-[#E11D2A] transition-colors"
              >
                {goDeeper.ctaLabel}
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Ecosystem fit — either the legacy bullet grid OR the featured
          proof cards + secondary chips. */}
      <section className="bg-paper border-y border-hairline">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <h2 className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink mb-3">
            {tLabels("ecosystemTitle")}
          </h2>
          {ecosystemIntro && (
            <p className="text-[14.5px] leading-[1.55] text-ink-soft max-w-[42rem] mb-8 md:mb-10">
              {ecosystemIntro}
            </p>
          )}
          {richEcosystem ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {ecosystem
                  .filter((e): e is { name: string; tag?: string; body?: string } =>
                    isRichEcosystem(e) && Boolean(e.body),
                  )
                  .map((e) => (
                    <article
                      key={e.name}
                      className="rounded-2xl bg-canvas ring-1 ring-hairline p-5 md:p-6"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-[16px] md:text-[17px] font-semibold text-ink tracking-[-0.01em]">
                          {e.name}
                        </h3>
                        {e.tag && (
                          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
                            {e.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-[14px] md:text-[14.5px] leading-[1.6] text-ink-soft">
                        {e.body}
                      </p>
                    </article>
                  ))}
              </div>
              {/* Secondary chips — names only */}
              {ecosystem.some(
                (e) =>
                  typeof e === "string" || (isRichEcosystem(e) && !e.body),
              ) && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {ecosystem
                    .filter(
                      (e) =>
                        typeof e === "string" ||
                        (isRichEcosystem(e) && !e.body),
                    )
                    .map((e, i) => {
                      const label = typeof e === "string" ? e : e.name;
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center h-8 px-3 rounded-full bg-canvas ring-1 ring-hairline text-[12.5px] font-medium text-ink"
                        >
                          {label}
                        </span>
                      );
                    })}
                </div>
              )}
            </>
          ) : (
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
                  <span>{typeof item === "string" ? item : item.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Scaling — closing CTA */}
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
          <Link href="/industries" className="hover:text-ink transition-colors">
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
