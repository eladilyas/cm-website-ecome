"use client";

import Image from "next/image";
import { useEffect } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Cinematic brand object — 4-layer motion stack stamped over a fill-mode
// image. The image uses next/image's `fill` with `object-contain` so the
// asset always fits its parent's box at its native aspect (1:1), with the
// visual cube centered. The motion stack stacks ABSOLUTE INSET-0 children
// so each layer fills the parent and their transforms compose cleanly.
//
//   outer    → scroll parallax (recedes as user scrolls past hero)
//   entrance → mount fade + scale-up (1.4s, slow Apple ease)
//   breathing → infinite micro scale-pulse (sine, 8s)
//   pointer  → spring-damped cursor follow (±6px)
//   <Image>   → the asset
//
// Reduced-motion users get a static centered image only.

type Props = {
  /** Asset path. Defaults to the cube-and-check brand object. */
  src?: string;
  className?: string;
};

export function HeroBrandObject({
  src = "/3d/cm-brand-object-2.png",
  className = "",
}: Props) {
  const reduce = useReducedMotion();

  // Layer 1: scroll parallax
  const { scrollY } = useScroll();
  const scrollY_ = useTransform(scrollY, [0, 900], [0, -50]);

  // Layer 4: pointer parallax (spring-damped)
  const pxRaw = useSpring(0, { stiffness: 60, damping: 22, mass: 0.6 });
  const pyRaw = useSpring(0, { stiffness: 60, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const nx = (e.clientX - cx) / cx;
      const ny = (e.clientY - cy) / cy;
      pxRaw.set(nx * 6);
      pyRaw.set(ny * 4);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce, pxRaw, pyRaw]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Layer 1 — scroll parallax */}
      <motion.div
        style={{ y: reduce ? 0 : scrollY_ }}
        className="absolute inset-0 will-change-transform"
      >
        {/* Layer 2 — entrance */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: APPLE_EASE, delay: 0.15 }}
          className="absolute inset-0"
        >
          {/* Layer 3 — breathing */}
          <motion.div
            animate={reduce ? undefined : { scale: [1, 1.012, 1] }}
            transition={
              reduce
                ? undefined
                : { duration: 8, ease: "easeInOut", repeat: Infinity }
            }
            className="absolute inset-0"
          >
            {/* Layer 4 — pointer parallax */}
            <motion.div
              style={{ x: reduce ? 0 : pxRaw, y: reduce ? 0 : pyRaw }}
              className="absolute inset-0"
            >
              <Image
                src={src}
                alt="Caisse Manager — sales, payments, customers, inventory, and analytics in one platform."
                fill
                sizes="(min-width: 1280px) 560px, (min-width: 768px) 50vw, 80vw"
                priority
                className="object-contain select-none pointer-events-none"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
