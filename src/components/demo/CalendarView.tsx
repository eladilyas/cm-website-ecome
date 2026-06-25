"use client";

// Calendar view — appointment book for service-based activities.
//
// Surface model: editorial day header + week strip context + vertical
// timeline (08:00 → 20:00) with positioned appointment blocks +
// right-rail day summary. Today gets a live now-indicator. Status
// legend communicates the three states a booking can be in.
//
// Light theme throughout. Schedule modal stays as a portaled centered
// card (different from the absolute-inset Sheet primitive).

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ACTIVITIES } from "@/data/demo/activities";
import {
  useDemoStore,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/demoStore";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const HOURS_VISIBLE = DAY_END_HOUR - DAY_START_HOUR; // 12 hours
const PX_PER_HOUR = 60; // controls timeline density

// Light-theme status tints — soft fills on a white timeline.
const STATUS_TINT: Record<
  AppointmentStatus,
  { bg: string; border: string; text: string; stripe: string; dot: string }
> = {
  scheduled: {
    bg: "bg-paper",
    border: "border-hairline-strong",
    text: "text-ink",
    stripe: "bg-ink-mute/50",
    dot: "bg-ink-mute",
  },
  "in-progress": {
    bg: "bg-[#E11D2A]/[0.05]",
    border: "border-[#E11D2A]/25",
    text: "text-ink",
    stripe: "bg-[#E11D2A]",
    dot: "bg-[#E11D2A]",
  },
  done: {
    bg: "bg-emerald-50/70",
    border: "border-emerald-100",
    text: "text-ink-soft",
    stripe: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  "in-progress": "In progress",
  done: "Done",
};

export function CalendarView() {
  const activity = useDemoStore((s) => s.activity);
  const appointments = useDemoStore((s) => s.appointments);
  const setStatus = useDemoStore((s) => s.setAppointmentStatus);
  const cancel = useDemoStore((s) => s.cancelAppointment);

  const [dayOffset, setDayOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const tCal = useTranslations("demo.calendar");
  const tActName = useTranslations("demo.activities");

  const [todayStart, setTodayStart] = useState<number>(0);
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayStart(startOfDay(Date.now()));
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayStart = todayStart + dayOffset * 86_400_000;
  const dayEnd = dayStart + 86_400_000;

  const dayAppts = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.activity === activity &&
            a.start >= dayStart &&
            a.start < dayEnd,
        )
        .sort((a, b) => a.start - b.start),
    [appointments, activity, dayStart, dayEnd],
  );

  // Week strip — 7 days centered around current dayOffset, with
  // booking density per day so navigation has spatial context.
  const weekDays = useMemo(() => {
    if (!todayStart) return [];
    const out: { dayStart: number; offset: number; count: number }[] = [];
    // Anchor the strip on the current Monday-of-week relative to the
    // viewed day, so the week always reads Mon→Sun.
    const viewedDate = new Date(dayStart);
    const weekday = (viewedDate.getDay() + 6) % 7; // Mon=0..Sun=6
    const mondayMs = dayStart - weekday * 86_400_000;
    for (let i = 0; i < 7; i++) {
      const ds = mondayMs + i * 86_400_000;
      const offset = Math.round((ds - todayStart) / 86_400_000);
      const count = appointments.filter(
        (a) =>
          a.activity === activity &&
          a.start >= ds &&
          a.start < ds + 86_400_000,
      ).length;
      out.push({ dayStart: ds, offset, count });
    }
    return out;
  }, [appointments, activity, dayStart, todayStart]);

  const counts = useMemo(() => {
    let scheduled = 0;
    let inProgress = 0;
    let done = 0;
    for (const a of dayAppts) {
      if (a.status === "scheduled") scheduled++;
      else if (a.status === "in-progress") inProgress++;
      else if (a.status === "done") done++;
    }
    return { scheduled, inProgress, done };
  }, [dayAppts]);

  const nextUp = useMemo(() => {
    if (dayOffset !== 0 || !now) return null;
    return (
      dayAppts.find((a) => a.status !== "done" && a.start >= now - 30 * 60_000) ??
      null
    );
  }, [dayAppts, dayOffset, now]);

  if (!activity) return null;
  const a = ACTIVITIES[activity];
  const activityName = tActName(activity);

  const selected = selectedId
    ? dayAppts.find((appt) => appt.id === selectedId) ?? null
    : null;

  const isToday = dayOffset === 0;
  const nowOffsetPx = (() => {
    if (!isToday || !now) return null;
    const d = new Date(now);
    const h = d.getHours() + d.getMinutes() / 60;
    if (h < DAY_START_HOUR || h >= DAY_END_HOUR) return null;
    return (h - DAY_START_HOUR) * PX_PER_HOUR;
  })();

  return (
    <div className="h-full w-full overflow-y-auto bg-canvas text-ink">
      {/* Editorial header — compact day title, status legend, schedule CTA.
          Top region net height reduced from ~220px to ~140px by:
          - collapsing the stacked eyebrow / H2 / subtitle into a single
            inline row (date is the dominant element, supporting facts
            sit beside it rather than below);
          - tightening pt-5/pb-4 → pt-3/pb-3;
          - inlining the status legend with the week strip on one row. */}
      <header className="sticky top-0 z-10 bg-canvas/95 backdrop-blur-md border-b border-hairline px-6 md:px-8 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex items-baseline gap-3 flex-wrap">
            <h2 className="text-[19px] md:text-[22px] font-semibold tracking-[-0.018em] text-ink shrink-0">
              {formatEditorialDay(dayStart)}
            </h2>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute font-medium shrink-0">
              {isToday ? (
                <span className="text-[#E11D2A]">{tCal("today")}</span>
              ) : dayOffset === -1 ? (
                tCal("yesterday")
              ) : dayOffset === 1 ? (
                tCal("tomorrow")
              ) : (
                formatRelativeOffset(dayOffset)
              )}
              <span className="text-ink-mute/60"> · {activityName}</span>
            </p>
            <p className="text-[11.5px] text-ink-mute tabular-nums">
              {dayAppts.length === 0
                ? tCal("noBookings")
                : `${tCal("bookings", { count: dayAppts.length })} · ${tCal("minutes", { count: minutesBooked(dayAppts) })}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DayNav
              dayStart={dayStart}
              onPrev={() => setDayOffset((n) => n - 1)}
              onToday={() => setDayOffset(0)}
              onNext={() => setDayOffset((n) => n + 1)}
            />
            <button
              type="button"
              onClick={() => setScheduleOpen(true)}
              className="h-9 px-3.5 text-[12.5px] font-semibold rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors inline-flex items-center gap-1.5"
              style={{
                transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              <PlusIcon />
              {tCal("schedule")}
            </button>
          </div>
        </div>

        {/* Week strip — Mon→Sun with booking density */}
        <div className="mt-2.5 grid grid-cols-7 gap-1.5">
          {weekDays.map((d) => (
            <WeekPill
              key={d.dayStart}
              dayStart={d.dayStart}
              count={d.count}
              isToday={d.offset === 0}
              isViewed={d.offset === dayOffset}
              onClick={() => setDayOffset(d.offset)}
            />
          ))}
        </div>

        {/* Status legend — inlined into the bottom of the header strip */}
        <div className="mt-2 flex items-center gap-3 flex-wrap text-[10.5px] text-ink-mute">
          <LegendDot tone="scheduled" label={`${tCal("scheduledLabel")} · ${counts.scheduled}`} />
          <LegendDot tone="in-progress" label={`${tCal("inProgressLabel")} · ${counts.inProgress}`} />
          <LegendDot tone="done" label={`${tCal("doneLabel")} · ${counts.done}`} />
        </div>
      </header>

      {/* Body — two-column: timeline + day sidebar (sidebar collapses on small) */}
      <div className="px-6 md:px-8 py-4 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        {/* Timeline */}
        <div
          className="relative bg-paper rounded-[12px] border border-hairline overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.02)]"
          style={{ height: `${HOURS_VISIBLE * PX_PER_HOUR + 24}px` }}
        >
          {/* Hour rails */}
          {Array.from({ length: HOURS_VISIBLE + 1 }).map((_, i) => {
            const hour = DAY_START_HOUR + i;
            const isLunch = hour === 12;
            return (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${i * PX_PER_HOUR + 12}px` }}
              >
                <span
                  className={
                    "w-14 shrink-0 text-[10.5px] tabular-nums -translate-y-1.5 pl-4 font-medium " +
                    (isLunch ? "text-ink-soft" : "text-ink-mute")
                  }
                >
                  {String(hour).padStart(2, "0")}
                  <span className="text-ink-mute/60">:00</span>
                </span>
                <div className="flex-1 h-px bg-hairline" />
              </div>
            );
          })}

          {/* Half-hour faint rails between full hours */}
          {Array.from({ length: HOURS_VISIBLE }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-14 right-0 h-px bg-hairline/40"
              style={{ top: `${i * PX_PER_HOUR + 12 + PX_PER_HOUR / 2}px` }}
            />
          ))}

          {/* Now indicator (today only, within business hours) */}
          {nowOffsetPx != null && (
            <div
              className="absolute left-14 right-3 z-30 pointer-events-none"
              style={{ top: `${nowOffsetPx + 12}px` }}
            >
              <div className="relative h-px bg-[#E11D2A]/85">
                <span className="absolute -left-1.5 -top-[3.5px] h-1.5 w-1.5 rounded-full bg-[#E11D2A]" />
                <span className="absolute -right-1 -top-2 text-[9.5px] font-semibold tracking-[0.05em] text-[#E11D2A] tabular-nums">
                  {formatTime(now)}
                </span>
              </div>
            </div>
          )}

          {/* Appointment blocks */}
          <div className="absolute inset-0 pt-3">
            {dayAppts.map((appt) => (
              <AppointmentBlock
                key={appt.id}
                appt={appt}
                activityName={
                  a.products.find((p) => p.id === appt.serviceId)?.name ??
                  appt.serviceId
                }
                selected={selectedId === appt.id}
                onSelect={() =>
                  setSelectedId((cur) => (cur === appt.id ? null : appt.id))
                }
              />
            ))}
          </div>

          {/* Empty state overlay */}
          {dayAppts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-14">
              <div className="text-center max-w-xs px-6 pointer-events-auto">
                <div className="mx-auto h-12 w-12 rounded-[12px] border border-hairline-strong bg-fog flex items-center justify-center">
                  <CalendarGlyph />
                </div>
                <p className="mt-3 text-[13px] font-medium text-ink">
                  {tCal("noBookingsYetTitle")}
                </p>
                <p className="mt-1 text-[11.5px] text-ink-mute leading-snug">
                  {tCal("noBookingsYetBody")}
                </p>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="mt-3 h-8 px-3 inline-flex items-center gap-1 rounded-lg bg-ink text-paper text-[11.5px] font-semibold hover:bg-ink-soft transition-colors"
                >
                  <PlusIcon />
                  {tCal("schedule")}
                </button>
              </div>
            </div>
          )}

          {/* Click-outside catcher when popover open */}
          {selected && (
            <button
              type="button"
              aria-label={tCal("closePopover")}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 z-10"
              tabIndex={-1}
            />
          )}
        </div>

        {/* Right sidebar — day summary */}
        <aside className="space-y-2.5">
          <div className="rounded-[12px] border border-hairline bg-paper p-3.5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute font-medium">
              {tCal("dayAtAGlance")}
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              <SummaryStat label={tCal("scheduledLabel")} value={counts.scheduled} tone="ink" />
              <SummaryStat
                label={tCal("inProgressLabel")}
                value={counts.inProgress}
                tone="red"
              />
              <SummaryStat label={tCal("doneLabel")} value={counts.done} tone="emerald" />
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-hairline">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ink-mute">{tCal("capacityUsed")}</span>
                <span className="font-semibold text-ink tabular-nums">
                  {capacityPct(dayAppts)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-fog overflow-hidden">
                <div
                  className="h-full bg-ink"
                  style={{
                    width: `${Math.min(100, capacityPct(dayAppts))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {nextUp && (
            <div className="rounded-[12px] border border-hairline bg-paper p-4">
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink-mute font-medium">
                {tCal("nextUp")}
              </p>
              <p className="mt-2 text-[14px] font-semibold text-ink tracking-[-0.005em]">
                {a.products.find((p) => p.id === nextUp.serviceId)?.name ??
                  nextUp.serviceId}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-mute">
                {nextUp.customerName} · {nextUp.durationMin} min
              </p>
              <p className="mt-2.5 text-[12.5px] font-semibold text-[#E11D2A] tabular-nums">
                {formatTime(nextUp.start)} · {tCal("inMinutes", { count: minutesUntil(nextUp.start, now) })}
              </p>
            </div>
          )}

          <div className="rounded-[12px] border border-hairline bg-paper p-4">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink-mute font-medium">
              {tCal("operatingHours")}
            </p>
            <p className="mt-2 text-[13px] font-semibold text-ink tabular-nums">
              {String(DAY_START_HOUR).padStart(2, "0")}:00 — {String(DAY_END_HOUR).padStart(2, "0")}:00
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-mute">
              {tCal("bookableHours", { count: HOURS_VISIBLE })}
            </p>
          </div>
        </aside>
      </div>

      {/* Action popover for the selected appointment */}
      <AnimatePresence>
        {selected && (
          <ActionPopover
            appt={selected}
            activityName={
              a.products.find((p) => p.id === selected.serviceId)?.name ??
              selected.serviceId
            }
            onClose={() => setSelectedId(null)}
            onStart={() => setStatus(selected.id, "in-progress")}
            onDone={() => setStatus(selected.id, "done")}
            onCancel={() => {
              cancel(selected.id);
              setSelectedId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Schedule modal */}
      <ScheduleModal
        open={scheduleOpen}
        dayStart={dayStart}
        onClose={() => setScheduleOpen(false)}
      />
    </div>
  );
}

// ─── Day navigation pill ────────────────────────────────────────────

function DayNav({
  dayStart,
  onPrev,
  onToday,
  onNext,
}: {
  dayStart: number;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("demo.calendar");
  void dayStart;
  return (
    <div className="flex items-center rounded-lg border border-hairline-strong overflow-hidden bg-paper">
      <button
        type="button"
        onClick={onPrev}
        aria-label={t("prevDay")}
        className="h-9 w-9 flex items-center justify-center text-ink-soft hover:text-ink hover:bg-fog transition-colors"
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        onClick={onToday}
        className="h-9 px-3 text-[12px] font-semibold text-ink hover:bg-fog border-x border-hairline tabular-nums whitespace-nowrap transition-colors"
      >
        {t("todayBtn")}
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label={t("nextDay")}
        className="h-9 w-9 flex items-center justify-center text-ink-soft hover:text-ink hover:bg-fog transition-colors"
      >
        <ChevronRight />
      </button>
      <span className="sr-only">
        Viewing {new Date(dayStart).toDateString()}
      </span>
    </div>
  );
}

// ─── Week strip pill ────────────────────────────────────────────────

function WeekPill({
  dayStart,
  count,
  isToday,
  isViewed,
  onClick,
}: {
  dayStart: number;
  count: number;
  isToday: boolean;
  isViewed: boolean;
  onClick: () => void;
}) {
  const d = new Date(dayStart);
  const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" });
  const dayNum = d.getDate();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isViewed ? "date" : undefined}
      className={
        "group relative inline-flex items-center justify-center gap-1.5 rounded-[10px] h-9 px-2 border transition-all " +
        (isViewed
          ? "bg-ink text-paper border-ink shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          : "bg-paper text-ink border-hairline hover:border-hairline-strong hover:bg-fog")
      }
      style={{
        transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        transitionDuration: "180ms",
      }}
    >
      <span
        className={
          "text-[9.5px] uppercase tracking-[0.1em] font-medium " +
          (isViewed ? "text-paper/70" : "text-ink-mute")
        }
      >
        {dayLabel.slice(0, 3)}
      </span>
      <span
        className={
          "text-[13.5px] font-semibold tabular-nums leading-none " +
          (isToday && !isViewed ? "text-[#E11D2A]" : "")
        }
      >
        {dayNum}
      </span>
      {count > 0 && (
        <span
          className={
            "inline-flex items-center justify-center min-w-[16px] h-[14px] px-1 rounded-full text-[9.5px] font-semibold tabular-nums " +
            (isViewed
              ? "bg-paper/15 text-paper"
              : "bg-fog text-ink-soft border border-hairline")
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Legend dot ─────────────────────────────────────────────────────

function LegendDot({
  tone,
  label,
}: {
  tone: AppointmentStatus;
  label: string;
}) {
  const t = STATUS_TINT[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={"h-2 w-2 rounded-full " + t.dot} aria-hidden />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

// ─── Summary stat ───────────────────────────────────────────────────

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "red" | "emerald";
}) {
  const valueCls =
    tone === "red"
      ? "text-[#E11D2A]"
      : tone === "emerald"
        ? "text-emerald-600"
        : "text-ink";
  return (
    <div className="rounded-[8px] bg-canvas border border-hairline px-2 py-1.5">
      <p className={"text-[16px] font-semibold tabular-nums leading-none " + valueCls}>
        {value}
      </p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-ink-mute font-medium leading-tight">
        {label}
      </p>
    </div>
  );
}

// ─── Appointment block ──────────────────────────────────────────────

function AppointmentBlock({
  appt,
  activityName,
  selected,
  onSelect,
}: {
  appt: Appointment;
  activityName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const startDate = new Date(appt.start);
  const startHour = startDate.getHours() + startDate.getMinutes() / 60;
  const top = (startHour - DAY_START_HOUR) * PX_PER_HOUR;
  const height = (appt.durationMin / 60) * PX_PER_HOUR;
  const tint = STATUS_TINT[appt.status];

  if (startHour < DAY_START_HOUR || startHour >= DAY_END_HOUR) return null;

  const initials = (appt.customerName || "Walk-in")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "absolute left-16 right-4 rounded-[10px] border text-left transition-all overflow-hidden " +
        tint.bg +
        " " +
        tint.border +
        " " +
        tint.text +
        " " +
        (selected
          ? "ring-2 ring-ink/15 z-20 shadow-[0_6px_20px_rgba(0,0,0,0.10)]"
          : "hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] z-10")
      }
      style={{
        top: `${top}px`,
        height: `${Math.max(32, height - 4)}px`,
        transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        transitionDuration: "180ms",
      }}
    >
      {/* Left stripe — status indicator */}
      <div className={"absolute left-0 top-0 bottom-0 w-[3px] " + tint.stripe} />
      <div className="pl-3 pr-3 py-2 h-full flex items-start gap-2.5">
        {height >= 56 && (
          <span className="shrink-0 mt-[2px] inline-flex items-center justify-center h-6 w-6 rounded-full bg-fog border border-hairline text-[10px] font-semibold text-ink-soft tabular-nums">
            {initials || "·"}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 text-[13px] font-semibold tracking-[-0.005em]">
            <span className="truncate">{activityName}</span>
            <span className="shrink-0 tabular-nums text-ink-mute text-[11.5px] font-medium">
              {formatTime(appt.start)}
            </span>
          </div>
          {height >= 44 && (
            <p className="mt-0.5 text-[11.5px] text-ink-mute truncate tabular-nums">
              {appt.customerName || "Walk-in"} · {appt.durationMin} min
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Action popover ─────────────────────────────────────────────────

function ActionPopover({
  appt,
  activityName,
  onClose,
  onStart,
  onDone,
  onCancel,
}: {
  appt: Appointment;
  activityName: string;
  onClose: () => void;
  onStart: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: APPLE_EASE }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-[10px] border border-hairline-strong bg-paper backdrop-blur-md shadow-[0_18px_48px_rgba(0,0,0,0.18)] p-2 flex items-center gap-2"
    >
      <div className="px-2.5 py-1 flex flex-col">
        <span className="text-[12px] font-semibold text-ink truncate max-w-[200px]">
          {activityName}
        </span>
        <span className="text-[10.5px] text-ink-mute">
          {STATUS_LABEL[appt.status]} · {appt.customerName || "Walk-in"}
        </span>
      </div>
      <div className="h-6 w-px bg-hairline" />
      <div className="flex items-center gap-1">
        {appt.status === "scheduled" && (
          <ActionBtn label="Start" tone="primary" onClick={onStart} />
        )}
        {appt.status !== "done" && (
          <ActionBtn
            label={appt.status === "in-progress" ? "Mark done" : "Complete"}
            tone="primary"
            onClick={onDone}
          />
        )}
        <ActionBtn label="Cancel" tone="danger" onClick={onCancel} />
        <ActionBtn label="Close" tone="ghost" onClick={onClose} />
      </div>
    </motion.div>
  );
}

function ActionBtn({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "primary" | "ghost" | "danger";
  onClick: () => void;
}) {
  const cls =
    tone === "primary"
      ? "bg-ink text-paper hover:bg-ink-soft"
      : tone === "danger"
        ? "border border-hairline text-red-600 hover:text-red-700 hover:bg-red-50"
        : "text-ink-mute hover:text-ink hover:bg-fog";
  return (
    <button
      type="button"
      onClick={onClick}
      className={"h-8 px-3 text-[12px] font-medium rounded-md transition-colors " + cls}
    >
      {label}
    </button>
  );
}

// ─── Schedule modal ─────────────────────────────────────────────────

function ScheduleModal({
  open,
  dayStart,
  onClose,
}: {
  open: boolean;
  dayStart: number;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: APPLE_EASE }}
        className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-label="Schedule appointment"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-ink/30 backdrop-blur-md"
        />
        <ScheduleForm dayStart={dayStart} onClose={onClose} />
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function ScheduleForm({
  dayStart,
  onClose,
}: {
  dayStart: number;
  onClose: () => void;
}) {
  const activity = useDemoStore((s) => s.activity);
  const schedule = useDemoStore((s) => s.scheduleAppointment);

  const services = useMemo(() => {
    if (!activity) return [];
    return ACTIVITIES[activity].products.filter(
      (p) => p.durationMin != null,
    );
  }, [activity]);

  const slots = useMemo(() => {
    const out: { label: string; offsetMin: number }[] = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
      for (const m of [0, 30]) {
        out.push({
          label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
          offsetMin: h * 60 + m,
        });
      }
    }
    return out;
  }, []);

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [customer, setCustomer] = useState("");
  const [slotMin, setSlotMin] = useState(slots[2]?.offsetMin ?? 540);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;
    const start = dayStart + slotMin * 60 * 1000;
    schedule({ serviceId, customerName: customer, start });
    onClose();
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.22, ease: APPLE_EASE }}
      className="relative w-full max-w-[420px] rounded-[12px] bg-paper border border-hairline p-6 text-ink shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
    >
      <header className="mb-5">
        <h3 className="text-[17px] font-semibold tracking-[-0.005em] text-ink">
          Schedule appointment
        </h3>
        <p className="mt-1 text-[12px] text-ink-mute">
          Book a slot — service, customer, time.
        </p>
      </header>

      <Field label="Service">
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className={INPUT_CLS}
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.durationMin} min
            </option>
          ))}
        </select>
      </Field>

      <Field label="Customer">
        <input
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Walk-in"
          className={INPUT_CLS}
        />
      </Field>

      <Field label="Time">
        <select
          value={slotMin}
          onChange={(e) => setSlotMin(parseInt(e.target.value, 10))}
          className={INPUT_CLS}
        >
          {slots.map((s) => (
            <option key={s.offsetMin} value={s.offsetMin}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="h-10 text-[13px] font-medium rounded-lg border border-hairline-strong text-ink hover:bg-fog transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="h-10 text-[13px] font-medium rounded-lg bg-ink text-paper hover:bg-ink-soft transition-colors"
        >
          Schedule
        </button>
      </div>
    </motion.form>
  );
}

const INPUT_CLS =
  "w-full h-10 rounded-lg bg-paper border border-hairline px-3 text-[13px] text-ink placeholder:text-ink-mute outline-none focus:border-ink/40 transition-colors";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M7.5 2.5L3.5 6l4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M4.5 2.5L8.5 6l-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" className="text-ink-mute" />
      <path d="M8 3v5M16 3v5M3.5 10h17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-ink-mute" />
      <circle cx="8" cy="14" r="1.2" fill="currentColor" className="text-ink-mute/70" />
      <circle cx="12" cy="14" r="1.2" fill="currentColor" className="text-ink-mute/70" />
      <circle cx="16" cy="14" r="1.2" fill="currentColor" className="text-ink-mute/70" />
    </svg>
  );
}

// ─── Formatters ─────────────────────────────────────────────────────

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatTime(ms: number) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatEditorialDay(dayStart: number) {
  const d = new Date(dayStart);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatRelativeOffset(offset: number) {
  if (offset < -1) return `${Math.abs(offset)} days ago`;
  if (offset > 1) return `In ${offset} days`;
  return "";
}

function minutesBooked(appts: Appointment[]) {
  return appts.reduce((s, a) => s + a.durationMin, 0);
}

function capacityPct(appts: Appointment[]) {
  const total = HOURS_VISIBLE * 60;
  const booked = minutesBooked(appts);
  return Math.round((booked / total) * 100);
}

function minutesUntil(start: number, now: number) {
  if (!now) return 0;
  const m = Math.round((start - now) / 60_000);
  return Math.max(0, m);
}
