"use client";

// Client island that renders the three pricing cards.
//
// Extracted from /pricing/page.tsx so the page can be a server
// component. The page handles its own headings + Reveal wrappers
// server-side; this island owns only the data fetch (`usePlans()`)
// and the per-card render. Hydration cost is bounded by the three
// cards + the trailing reassure paragraph.

import { Reveal } from "@/components/ui/Reveal";
import { PricingCard } from "@/components/pricing/PricingCard";
import { usePlans } from "@/data/pricing";

export function PricingPlansSection({ reassureText }: { reassureText: string }) {
  const plans = usePlans();
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-stretch">
        {plans.map((p, i) => (
          <Reveal key={p.slug} delay={0.06 + i * 0.04} className="h-full">
            <PricingCard plan={p} />
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.22}>
        <p className="mt-10 text-center text-[12.5px] text-ink-mute max-w-[44rem] mx-auto">
          {reassureText}
        </p>
      </Reveal>
    </>
  );
}
