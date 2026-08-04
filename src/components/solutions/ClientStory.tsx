// ClientStory — the named customer that opens every sector page, placed
// immediately after the hero and BEFORE any product explanation.
//
// The ordering is the point. A visitor arriving on /solutions/cafe has one
// question: "do you understand a café like mine?" Naming Room 21, saying what
// kind of room it is, and describing the actual pressure of their service
// answers that before a single feature is claimed. Product explanation lands
// very differently once the reader has already accepted that we know the
// trade. Show the customer first, explain the software second.
//
// Layout is a two-column editorial band: the client's identity (logo, name,
// sector, city, the two or three facts that make them concrete) on the left,
// and their operating story plus the specific pressure it creates on the
// right. On mobile it stacks with the identity card first, so the brand is
// still the first thing read.

import { BrandLogo } from "@/components/ui/BrandLogo";
import { Reveal } from "@/components/ui/Reveal";
import type { Logo } from "@/data/logos";

export type ClientStoryContent = {
  /** Small label above the client name, e.g. "The client". */
  eyebrow: string;
  /** Sector descriptor under the name, e.g. "Café · Pâtisserie". */
  tag: string;
  /** Where they operate. */
  city: string;
  /** 2–4 concrete facts — covers, counters, service hours. Each is a short
   *  label/value pair so the card reads as a spec, not prose. */
  facts: { label: string; value: string }[];
  /** Section heading for the narrative column. */
  storyTitle: string;
  /** The operating reality, 2–3 sentences. What their day is actually like. */
  story: string;
  /** The specific pressure that reality creates — the thing the software has
   *  to solve. Rendered as the emphasised pull-quote. */
  pressure: string;
};

export function ClientStory({
  logo,
  name,
  content,
}: {
  /** null when the brand has no colour artwork — the block then falls back to
   *  a typographic lockup rather than rendering an empty logo frame. */
  logo: Logo | null;
  name: string;
  content: ClientStoryContent;
}) {
  return (
    <section className="bg-paper border-y border-hairline">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-8 lg:gap-16 items-start">
          {/* ── Identity card ───────────────────────────────────────── */}
          <Reveal>
            <div className="rounded-2xl bg-canvas ring-1 ring-hairline p-6 md:p-8">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-6">
                {content.eyebrow}
              </p>

              {/* The logo carries the brand when we have artwork; otherwise
                  the name does the work at display size. Never both — a
                  wordmark logo beside the same name set in type reads as a
                  duplication. */}
              {logo ? (
                <BrandLogo logo={logo} surface="light" size="lg" className="mb-5" />
              ) : (
                <p className="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] leading-[1.05] text-ink mb-5">
                  {name}
                </p>
              )}

              {logo && (
                <h2 className="text-[19px] md:text-[20px] font-semibold tracking-[-0.012em] text-ink">
                  {name}
                </h2>
              )}
              <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
                {content.tag}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-mute">{content.city}</p>

              <dl className="mt-6 pt-6 border-t border-hairline grid grid-cols-2 gap-x-4 gap-y-4">
                {content.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-mute">
                      {f.label}
                    </dt>
                    <dd className="mt-1 text-[14.5px] font-semibold text-ink tabular-nums">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          {/* ── Narrative ───────────────────────────────────────────── */}
          <div className="lg:pt-2">
            <Reveal delay={0.06}>
              <h3
                className="text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink max-w-[26ch]"
                style={{ textWrap: "balance" }}
              >
                {content.storyTitle}
              </h3>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 text-[15.5px] md:text-[16.5px] leading-[1.6] text-ink-soft max-w-[44rem]">
                {content.story}
              </p>
            </Reveal>
            <Reveal delay={0.14}>
              {/* The pressure line is the hinge between the client's reality
                  and the solution that follows, so it gets the one accent on
                  the page — a red rule, matching the brand's single-accent
                  discipline. */}
              <blockquote className="mt-7 pl-5 border-l-2 border-[#E11D2A]">
                <p
                  className="text-[17px] md:text-[19px] font-medium leading-[1.45] tracking-[-0.01em] text-ink max-w-[38rem]"
                  style={{ textWrap: "balance" }}
                >
                  {content.pressure}
                </p>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
