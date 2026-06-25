"use client";

import { useEffect, useState } from "react";

type HeroViewport = "mobile" | "tablet" | "desktop";

export type HeroLayout = {
  viewport: HeroViewport;
  /** True on devices with a precise pointer (mouse). False on touch — used to
   *  disable mouse parallax on phones/tablets where it would be jittery. */
  hasFinePointer: boolean;
};

/**
 * Centralises hero layout responsiveness. Returns the active viewport bucket
 * plus a fine-pointer flag so motion components can opt out of cursor-based
 * parallax on touch devices.
 *
 * SSR-safe: returns desktop + fine-pointer defaults on the server, then
 * updates after hydration. Matches the Tailwind responsive breakpoints so
 * the `useHeroLayout` value and the `md:`/`sm:` classes stay in sync.
 */
export function useHeroLayout(): HeroLayout {
  const [layout, setLayout] = useState<HeroLayout>({
    viewport: "desktop",
    hasFinePointer: true,
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
      const viewport: HeroViewport =
        w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
      setLayout({ viewport, hasFinePointer });
    };

    update();
    window.addEventListener("resize", update, { passive: true });
    const mql = window.matchMedia("(pointer: fine)");
    mql.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      mql.removeEventListener("change", update);
    };
  }, []);

  return layout;
}
