// Shared layout for legal pages (Privacy, Terms, future cookies / sales).
// Editorial typography on bg-canvas — quiet, scannable, no chrome.

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

type Props = {
  title: string;
  /** Plain string like "March 2026" — kept human-readable, not ISO. */
  lastUpdated: string;
  /** One-line intro under the title. */
  intro: string;
  children: React.ReactNode;
};

export function LegalLayout({ title, lastUpdated, intro, children }: Props) {
  return (
    <>
      <section data-scheme="light" className="bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-4">
              Legal
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h1
              className="text-[clamp(1.875rem,3.8vw,2.875rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[20ch]"
              style={{ textWrap: "balance" }}
            >
              {title}
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-[12px] uppercase tracking-[0.14em] text-ink-mute">
              Last updated · {lastUpdated}
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 text-[17px] md:text-[19px] leading-[1.5] text-ink-soft max-w-[42rem]">
              {intro}
            </p>
          </Reveal>
        </div>
      </section>

      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24">
          <article className="max-w-[760px] mx-auto prose-legal">{children}</article>

          <div className="max-w-[760px] mx-auto mt-12 pt-8 border-t border-hairline">
            <p className="text-[13px] text-ink-mute leading-[1.6]">
              Questions? Reach out via{" "}
              <Link href="/support" className="underline-offset-4 hover:underline text-ink-soft">
                support
              </Link>{" "}
              or read the companion{" "}
              <Link href="/legal/privacy" className="underline-offset-4 hover:underline text-ink-soft">
                Privacy
              </Link>{" "}
              /{" "}
              <Link href="/legal/terms" className="underline-offset-4 hover:underline text-ink-soft">
                Terms
              </Link>{" "}
              pages.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

// Helper subcomponents for consistent rhythm inside legal copy.
export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 first:mt-0 text-[18px] md:text-[20px] font-semibold tracking-[-0.012em] text-ink leading-[1.3]">
      {children}
    </h2>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-[15px] md:text-[16px] leading-[1.65] text-ink-soft">
      {children}
    </p>
  );
}
