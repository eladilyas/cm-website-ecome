"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { useHeroLayout } from "@/hooks/useHeroLayout";

const APPLE_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

type Props = {
  title: string;
  icon: ReactNode;
  /** Tailwind position classes (must be absolutely positioned within the scene wrapper). */
  position: string;
  /** Vertical float amplitude in px. Default 12. */
  floatAmplitude?: number;
  /** Float period in seconds. Default 7. */
  floatPeriod?: number;
  /** Initial entrance delay in seconds. Default 0. */
  staggerDelay?: number;
  /** Mouse parallax intensity in px. Default 5. Disabled on touch devices. */
  parallaxFactor?: number;
  /** When true and viewport is mobile, gates float animation entirely (the
   *  card is also hidden via CSS in the position prop, but this stops
   *  framer-motion ticking the keyframes on a display:none element). */
  hideOnMobile?: boolean;
  className?: string;
};

/**
 * A glassmorphic feature pill that floats around the hero 3D centerpiece.
 *
 * Motion stack (4 nested layers so each transform property has its own host
 * and they never overwrite each other):
 *   1. Entrance — opacity fade-in, Apple-eased, staggered per card
 *   2. Float    — slow vertical drift via Y keyframes, non-harmonic per card
 *   3. Parallax — spring-damped X/Y offset following the cursor
 *   4. Hover    — CSS-only translateY lift on the innermost pill
 *
 * On touch devices (no fine pointer), parallax is disabled. On reduced-motion,
 * float and parallax both drop to zero — only the static fade-in survives.
 * On mobile with hideOnMobile=true, all motion is gated off (the card is
 * also display:none via the position prop's `hidden md:flex`).
 */
export function FloatingFeatureCard({
  title,
  icon,
  position,
  floatAmplitude = 12,
  floatPeriod = 7,
  staggerDelay = 0,
  parallaxFactor = 5,
  hideOnMobile = false,
  className = "",
}: Props) {
  const reduce = useReducedMotion();
  const { viewport, hasFinePointer } = useHeroLayout();
  const isHiddenForViewport = hideOnMobile && viewport === "mobile";
  const motionActive = !reduce && !isHiddenForViewport;
  const parallaxActive = motionActive && hasFinePointer && parallaxFactor > 0;

  // Mouse parallax — spring-damped to feel weighted
  const px = useSpring(0, { stiffness: 50, damping: 22, mass: 0.6 });
  const py = useSpring(0, { stiffness: 50, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (!parallaxActive) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const nx = (e.clientX - cx) / cx;
      const ny = (e.clientY - cy) / cy;
      px.set(nx * parallaxFactor);
      py.set(ny * parallaxFactor * 0.6);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [parallaxActive, parallaxFactor, px, py]);

  return (
    <motion.div
      // Layer 1 — position + entrance (opacity only, no transform)
      className={`${position} ${className}`}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.9,
        ease: APPLE_EASE,
        delay: 0.4 + staggerDelay,
      }}
    >
      <motion.div
        // Layer 2 — float (Y keyframes). Gated off when motionActive is false
        // so framer doesn't tick keyframes on a display:none element.
        animate={motionActive ? { y: [0, -floatAmplitude, 0] } : undefined}
        transition={
          motionActive
            ? {
                duration: floatPeriod,
                ease: "easeInOut",
                repeat: Infinity,
                delay: staggerDelay * 0.5,
              }
            : undefined
        }
        className="will-change-transform"
      >
        <motion.div
          // Layer 3 — parallax (X/Y spring values)
          style={parallaxActive ? { x: px, y: py } : undefined}
          className="will-change-transform"
        >
          <div
            // Layer 4 — visual pill + CSS hover lift
            className={[
              "group inline-flex items-center gap-2.5 rounded-full",
              "px-3.5 py-2",
              "bg-white/[0.04] backdrop-blur-xl",
              "ring-1 ring-white/10",
              "hover:bg-white/[0.07]",
              "hover:-translate-y-[3px]",
              "transition-[background-color,transform]",
              "duration-300",
              "cursor-default select-none",
            ].join(" ")}
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/5 text-paper/85">
              {icon}
            </span>
            <span className="text-[13px] font-medium text-paper/90 whitespace-nowrap">
              {title}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
