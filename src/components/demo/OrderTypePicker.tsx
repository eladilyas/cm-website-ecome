"use client";

// Order-type picker — reconstructs screen A4 from Workflow Screenshots.
//
// Only the order types enabled by the current activity are listed. Selecting
// one creates an order via the store, which auto-advances the stage:
//   • dine-in / take-away → identifier picker
//   • glovo / done        → straight to workspace

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { ACTIVITIES } from "@/data/demo/activities";
import { useDemoStore } from "@/lib/demoStore";
import type { OrderType } from "@/data/demo/types";

const TYPE_META: Record<OrderType, { label: string; sub: string; icon: React.ReactNode }> = {
  "take-away": {
    label: "Take Away",
    sub: "Pick up your order at the counter.",
    icon: <BagIcon />,
  },
  "dine-in": {
    label: "Dine In",
    sub: "Serve at a table.",
    icon: <ChairIcon />,
  },
  glovo: {
    label: "Glovo",
    sub: "Delivered by Glovo.",
    icon: <RiderIcon />,
  },
  done: {
    label: "Done",
    sub: "Delivered by Done.",
    icon: <RiderIcon />,
  },
};

export function OrderTypePicker() {
  const activity = useDemoStore((s) => s.activity);
  const startOrder = useDemoStore((s) => s.startOrder);

  const tAct = useTranslations("demo.activities");
  if (!activity) return null;
  const a = ACTIVITIES[activity];
  const activityName = tAct(activity);

  return (
    <section className="mx-auto max-w-[1100px] px-6 lg:px-10 py-12 md:py-16">
      <Reveal>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-paper/55 mb-3">
          {activityName} · Step 1
        </p>
      </Reveal>
      <Reveal delay={0.04}>
        <h1 className="text-[clamp(1.75rem,4.2vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-paper">
          What type of order would you like to process?
        </h1>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {a.enabledOrderTypes.map((t, i) => (
          <Reveal key={t} delay={0.08 + i * 0.04}>
            <TypeCard type={t} onSelect={() => startOrder(t)} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TypeCard({
  type,
  onSelect,
}: {
  type: OrderType;
  onSelect: () => void;
}) {
  const meta = TYPE_META[type];
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.08, ease: [0.32, 0.72, 0, 1] }}
      className="group relative w-full text-left rounded-[12px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/40 focus-visible:ring-offset-2 focus-visible:ring-offset-night transition-colors duration-300"
    >
      <div className="p-5 md:p-6 flex items-center gap-4">
        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-[10px] bg-white/[0.06] flex items-center justify-center text-paper/85 group-hover:text-paper transition-colors">
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] md:text-[19px] font-semibold tracking-[-0.012em] text-paper">
            {meta.label}
          </p>
          <p className="mt-1 text-[13px] md:text-[14px] leading-[1.45] text-paper/60">
            {meta.sub}
          </p>
        </div>
        <ArrowIcon />
      </div>
    </motion.button>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M5 8h12l-1 11H6L5 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ChairIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="5" y="9" width="12" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 12v6M16 12v6M5 6h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function RiderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="6" cy="16" r="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 16L12 8h4l1 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-paper/40 group-hover:text-paper/80 group-hover:translate-x-0.5 transition-all duration-300" style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}>
      <path d="M5 8h6m0 0L8 5m3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
