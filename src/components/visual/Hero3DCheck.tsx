"use client";

import { HeroBrandObject } from "@/components/visual/HeroBrandObject";

type Props = {
  className?: string;
};

/**
 * Hero3DCheck wraps the existing HeroBrandObject (the 3D-rendered red
 * checkmark with orbital capability icons) with a radial mask that fades the
 * image's dark edges to transparent. Without this mask the PNG would show a
 * hard rectangular seam where its dark background meets the hero's black tile.
 *
 * The mask preserves the central artwork fully (checkmark + orbital icons +
 * inner ambient red lighting) and gradually feathers the outer edges so the
 * 3D appears to float inside the hero's lit volume rather than sit pasted on
 * top of a rectangular plate.
 *
 * The wrapped component carries its own motion (entrance fade + breathing +
 * cursor parallax + scroll parallax) — this wrapper adds presentation only.
 */
export function Hero3DCheck({ className = "" }: Props) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        maskImage:
          "radial-gradient(ellipse closest-side, #000 60%, rgba(0,0,0,0.5) 88%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse closest-side, #000 60%, rgba(0,0,0,0.5) 88%, transparent 100%)",
      }}
    >
      <HeroBrandObject />
    </div>
  );
}
