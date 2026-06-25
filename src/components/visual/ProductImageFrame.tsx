"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  VISUAL_SYSTEM,
  CINEMATIC_CROP,
  REVEAL,
  type VisualTone,
  type CinematicCrop,
} from "@/lib/visualSystem";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Tone of the surrounding section — drives backdrop / halo / shadow tokens. */
  tone: VisualTone;
  priority?: boolean;
  /** Slow parallax (translateY ±REVEAL.parallaxRange across visible scroll). */
  parallax?: boolean;
  /** Cinematic zoom-in. "subtle" by default; "none" for devices where chrome
   * cropping would look broken (phones with tight bezels, laptops with keyboards). */
  crop?: CinematicCrop;
  sizes?: string;
  className?: string;
};

// Universal product-image presenter. Layers (back → front):
//   1. Studio backdrop  — radial, top-biased gradient (tone-aware)
//   2. Subject halo     — radial, top-biased wash directly behind the silhouette
//   3. Drop-shadow      — silhouette-aware, follows transparent PNG edges
//   4. Cinematic zoom   — CSS scale on the image so it reads as a "shot product"
//
// We intentionally do NOT use overflow-hidden — the scaled image extends a few
// percent beyond its layout box into the surrounding tile, keeping the
// drop-shadow following the actual device silhouette rather than a clipped
// rectangle.

export function ProductImageFrame({
  src,
  alt,
  width,
  height,
  tone,
  priority = false,
  parallax = false,
  crop = "subtle",
  sizes = "(min-width: 1280px) 1000px, (min-width: 768px) 80vw, 100vw",
  className = "",
}: Props) {
  const tokens = VISUAL_SYSTEM[tone];
  const zoom = CINEMATIC_CROP[crop];
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [REVEAL.parallaxRange, -REVEAL.parallaxRange]
  );

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      {/* Studio backdrop — extends beyond image bounds for soft falloff */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-[8%] -inset-y-[12%] -z-10"
        style={{ background: tokens.backdrop }}
      />
      {/* Subject halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{ background: tokens.halo, filter: "blur(28px)" }}
      />

      {/* Parallax wrapper — Framer-controlled transforms only */}
      <motion.div
        style={parallax && !reduce ? { y } : undefined}
        className="relative will-change-transform"
      >
        {/* Cinematic zoom wrapper — static CSS transform, composes cleanly */}
        <div
          style={{
            transform: zoom > 1 ? `scale(${zoom})` : undefined,
            transformOrigin: "center",
          }}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            sizes={sizes}
            className="w-full h-auto select-none pointer-events-none"
            style={{ filter: tokens.shadow }}
            draggable={false}
          />
        </div>
      </motion.div>
    </div>
  );
}
