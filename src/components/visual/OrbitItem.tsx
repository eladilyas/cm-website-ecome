"use client";

// OrbitItem — places its child on a circular orbit around its container's
// center, with the payload kept visually upright while orbiting.
//
// Implementation:
//   • The wrapper rotates via the global `orbit-cw` / `orbit-ccw` keyframe.
//   • A payload wrapper inside it counter-rotates at the SAME duration +
//     SAME animation-delay, so its rotation effectively cancels back to 0
//     for the payload's orientation.
//   • Initial angle (the position where the orbit "starts") is achieved by
//     applying a negative animation-delay equal to that angle's fraction
//     of one cycle. Both wrappers share the same delay so they stay
//     locked together regardless of starting angle.
//   • Everything is CSS keyframes → GPU-accelerated, no JS thread cost,
//     smoothly interruptible by browsers under load.
//
// Reduced motion: when prefers-reduced-motion is set, the orbit doesn't
// animate — the payload renders at its initial angle as a static placement.
//
// Usage:
//   <OrbitItem angle={45} radius="10rem" duration={90} direction="ccw">
//     <Pill ... />
//   </OrbitItem>
//
// angle: 0–360 degrees, 0 = 12 o'clock, clockwise.

import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  /** Initial position on the orbit in degrees (0 = top, clockwise). */
  angle: number;
  /** Orbit radius — any CSS length, e.g. "10rem", "180px", "var(--outer-r)". */
  radius: string;
  /** Seconds per full revolution. Slower = more premium. 60-100s typical. */
  duration: number;
  /** Direction of orbital motion. */
  direction: "cw" | "ccw";
  /** When true, hide the item below the md breakpoint (use this to keep
   *  mobile composition uncluttered). */
  hideOnMobile?: boolean;
  children: ReactNode;
};

export function OrbitItem({
  angle,
  radius,
  duration,
  direction,
  hideOnMobile = false,
  children,
}: Props) {
  const reduce = useReducedMotion();
  const visibility = hideOnMobile ? "hidden md:grid" : "grid";

  // Negative animation-delay = fast-forward into the cycle, which sets the
  // visible starting position of the payload on the orbit.
  //
  // For CW (rotation 0 → 360 over duration): rotation at time 0 with
  //   delay = -X is X/duration * 360. We want this to equal `angle`, so
  //   X = (angle/360) * duration  →  delay = -(angle/360) * duration
  //
  // For CCW (rotation 0 → -360 over duration): rotation at time 0 with
  //   delay = -X is -X/duration * 360. We want this to equal `angle`
  //   (interpreted as the visible position, same axis as CW), which means
  //   the wrapper must be rotated to angle. -X/duration * 360 = angle - 360
  //   (we use the equivalent negative rotation for a positive angle)
  //   →  X = ((360 - angle)/360) * duration  →  delay = -((360-angle)/360) * duration
  const delaySec =
    direction === "cw"
      ? -(angle / 360) * duration
      : -((360 - (angle % 360)) / 360) * duration;

  const counterDir = direction === "cw" ? "ccw" : "cw";

  // Reduced motion: just place the payload at its initial angle, no spin.
  if (reduce) {
    return (
      <div className={`pointer-events-none absolute inset-0 ${visibility} place-items-center`}>
        <div
          className="relative"
          style={{
            width: 0,
            height: 0,
            transform: `rotate(${angle}deg)`,
          }}
        >
          <div
            className="absolute pointer-events-auto"
            style={{
              top: `calc(-1 * ${radius})`,
              left: 0,
              transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div
        className="relative will-change-transform"
        style={{
          width: 0,
          height: 0,
          animation: `orbit-${direction} ${duration}s linear infinite`,
          animationDelay: `${delaySec}s`,
        }}
      >
        <div
          className="absolute pointer-events-auto will-change-transform"
          style={{
            top: `calc(-1 * ${radius})`,
            left: 0,
            transform: "translate(-50%, -50%)",
            animation: `orbit-${counterDir} ${duration}s linear infinite`,
            animationDelay: `${delaySec}s`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
