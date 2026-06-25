// Order timeline — Alibaba / Amazon-style milestone strip.
//
// Five stages: Order placed → Payment confirmed → Dispatched →
// In transit → Delivered. Each milestone shows a relative date
// hint when reached, an ETA when upcoming, or a hyphen when
// undetermined.
//
// Layout is horizontal on md+ (Alibaba-style 5-step), stacks
// vertically on mobile so each milestone gets full width. The
// current step lights up in ink; past steps in emerald; future
// steps in muted ink.
//
// The component is purely presentational — it consumes an
// `OrderStage` index + dates dictionary and renders. Mapping from
// `Order.status` → stage index is done by the caller, since some
// orders (e.g. with "incoming" items) may have a back-ordered
// fulfillment path that mutates the stage labels later.

export type OrderStageId =
  | "placed"
  | "paid"
  | "dispatched"
  | "in-transit"
  | "delivered";

export type OrderStage = {
  id: OrderStageId;
  label: string;
  /** ISO date (or null if not reached yet). When set, shown
   *  beneath the step label. */
  date: string | null;
  /** ETA shown when date is null. Optional. */
  eta?: string | null;
};

export function OrderTimeline({
  stages,
  currentIndex,
}: {
  stages: OrderStage[];
  /** 0-based index of the active stage. */
  currentIndex: number;
}) {
  return (
    <ol className="relative">
      {/* Desktop layout — horizontal */}
      <div className="hidden md:grid md:grid-cols-5 md:gap-0 md:relative">
        {/* Connector lines */}
        <div className="absolute top-[14px] left-0 right-0 h-px bg-hairline-strong pointer-events-none" />
        <div
          aria-hidden
          className="absolute top-[14px] left-0 h-px bg-emerald-400 pointer-events-none transition-all duration-500"
          style={{
            width:
              currentIndex <= 0
                ? "0%"
                : currentIndex >= stages.length - 1
                  ? "100%"
                  : `${(currentIndex / (stages.length - 1)) * 100}%`,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {stages.map((stage, i) => {
          const status =
            i < currentIndex
              ? "done"
              : i === currentIndex
                ? "current"
                : "upcoming";
          return (
            <StageNode
              key={stage.id}
              stage={stage}
              status={status}
              align="center"
            />
          );
        })}
      </div>

      {/* Mobile layout — vertical, single column */}
      <div className="md:hidden space-y-3.5 relative pl-7">
        <div
          aria-hidden
          className="absolute left-[12px] top-2 bottom-2 w-px bg-hairline-strong pointer-events-none"
        />
        {stages.map((stage, i) => {
          const status =
            i < currentIndex
              ? "done"
              : i === currentIndex
                ? "current"
                : "upcoming";
          return (
            <StageNode
              key={stage.id}
              stage={stage}
              status={status}
              align="left"
            />
          );
        })}
      </div>
    </ol>
  );
}

function StageNode({
  stage,
  status,
  align,
}: {
  stage: OrderStage;
  status: "done" | "current" | "upcoming";
  align: "center" | "left";
}) {
  const dotClass =
    status === "done"
      ? "bg-emerald-500 border-emerald-500 text-paper"
      : status === "current"
        ? "bg-ink border-ink text-paper ring-4 ring-ink/10"
        : "bg-paper border-hairline-strong text-ink-mute";

  const labelClass =
    status === "upcoming" ? "text-ink-mute" : "text-ink";

  if (align === "left") {
    return (
      <li className="relative">
        <span
          className={
            "absolute -left-7 top-0 inline-flex items-center justify-center h-[26px] w-[26px] rounded-full border text-[11px] font-semibold " +
            dotClass
          }
        >
          {status === "done" ? <CheckIcon /> : ""}
        </span>
        <p className={"text-[13px] font-medium " + labelClass}>
          {stage.label}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-mute">
          {stage.date
            ? formatDate(stage.date)
            : stage.eta
              ? `Prévu ${stage.eta}`
              : "—"}
        </p>
      </li>
    );
  }

  return (
    <li className="relative flex flex-col items-center text-center px-2">
      <span
        className={
          "relative z-[1] inline-flex items-center justify-center h-7 w-7 rounded-full border text-[11px] font-semibold " +
          dotClass
        }
      >
        {status === "done" ? <CheckIcon /> : ""}
      </span>
      <p className={"mt-3 text-[12px] font-medium leading-tight " + labelClass}>
        {stage.label}
      </p>
      <p className="mt-1 text-[11px] text-ink-mute leading-tight tabular-nums">
        {stage.date
          ? formatDate(stage.date)
          : stage.eta
            ? `Prévu ${stage.eta}`
            : "—"}
      </p>
    </li>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.5l2.5 2.5L9.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
