"use client";

// Choose Your Business Type — the post-hero discovery engine.
//
// Four cards (Café · Fast food · Dine-in · Quick-service). Tapping a card
// opens the POSSimulatorModal pre-set to that business type. The modal
// has tabs at the top so users can switch business types without closing.
//
// This is the EXPLORATION layer — no lead capture required. The Free
// Trial form is the conversion layer, kept deliberately separate.

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { ACTIVITY_LIST } from "@/data/demo/activities";
import { POSSimulatorModal } from "@/components/demo/POSSimulatorModal";
import { Arrow } from "@/components/ui/Arrow";
import type { ActivityKey } from "@/data/demo/types";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function BusinessTypeSection() {
  const [openWith, setOpenWith] = useState<ActivityKey | null>(null);
  const tAct = useTranslations("demo.activities");

  return (
    // Hidden below lg — the simulator modal it opens is a desktop
    // workspace. Mobile visitors don't see a CTA they can't fulfil.
    <section
      data-scheme="light"
      className="relative overflow-hidden bg-canvas hidden lg:block"
    >
      <SectionDivider scheme="light" />
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
        <div className="text-center max-w-[44rem] mx-auto">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-5">
              Try it live
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-[clamp(2rem,4.6vw,3.25rem)] font-semibold tracking-[-0.022em] leading-[1.02] text-ink"
              style={{ textWrap: "balance" }}
            >
              Pick the counter you run.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-[17px] md:text-[19px] leading-[1.5] text-ink-soft max-w-[36rem] mx-auto">
              The same Caisse Manager flows, tuned to how you actually serve.
              Tap a counter to drop into a live simulator — no signup, no
              limits, switch businesses any time.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {ACTIVITY_LIST.map((a, i) => (
            <Reveal key={a.key} delay={0.14 + i * 0.04}>
              <BusinessTypeCard
                name={tAct(a.key)}
                tagline={a.tagline}
                index={i}
                onSelect={() => setOpenWith(a.key)}
              />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.36}>
          <p className="mt-10 text-center text-[13px] text-ink-mute">
            No signup needed — this is exploration, not the trial.
          </p>
        </Reveal>
      </div>

      <POSSimulatorModal
        open={openWith !== null}
        initialActivity={openWith}
        onClose={() => setOpenWith(null)}
      />
    </section>
  );
}

function BusinessTypeCard({
  name,
  tagline,
  index,
  onSelect,
}: {
  name: string;
  tagline: string;
  index: number;
  onSelect: () => void;
}) {
  const num = String(index + 1).padStart(2, "0");
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.3, ease: APPLE_EASE }}
      className="group relative w-full text-left rounded-2xl border border-hairline bg-paper hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas overflow-hidden"
    >
      {/* Soft brand-red wash on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(225,29,42,0.06) 0%, rgba(225,29,42,0) 70%)",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />

      <div className="relative p-6 md:p-7 min-h-[200px] flex flex-col">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-mute">
            {num}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-mute group-hover:text-[#E11D2A] transition-colors duration-300">
            Open
            <Arrow
              size={12}
              strokeWidth={1.4}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          </span>
        </div>

        <h3 className="mt-5 text-[20px] md:text-[22px] font-semibold tracking-[-0.022em] leading-[1.1] text-ink">
          {name}
        </h3>
        <p className="mt-2 text-[14px] leading-[1.45] text-ink-soft">
          {tagline}
        </p>
      </div>
    </motion.button>
  );
}

