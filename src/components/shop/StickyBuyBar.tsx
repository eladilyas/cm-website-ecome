"use client";

// StickyBuyBar — mobile-only pinned buy affordance on a product page.
//
// The single biggest conversion gap on our PDP versus the reference designs.
// Our product pages are long (hero, spec tiles, features, full table,
// cross-sell), so on a phone the buy button scrolls out of view within one
// swipe and never comes back. Every reference PDP keeps price + action
// permanently reachable.
//
// Behaviour:
//   • Hidden until the in-hero buy area has scrolled out of view, so it
//     never competes with the real one. An IntersectionObserver on a
//     sentinel the page renders next to the hero CTA drives this — cheaper
//     and less jittery than a scroll listener.
//   • md:hidden. The desktop layout keeps the CTA beside the photo where it
//     is already visible.
//   • Sits ABOVE the mobile tab bar, which is fixed at bottom-0 with h-14.
//     Two fixed bars at bottom-0 is the overlap bug that was already fixed
//     once on this site; this one is offset by that height plus the safe
//     area so both stay usable.

import { useEffect, useRef, useState } from "react";
import { CartButton } from "@/components/shop/CartButton";

export function StickyBuyBar({
  name,
  priceLabel,
  slug,
  /** Id of the element to watch — the hero's buy row. While it is on
   *  screen this bar stays hidden. */
  watchId,
}: {
  name: string;
  priceLabel: string;
  slug: string;
  watchId: string;
}) {
  const [shown, setShown] = useState(false);
  const seenRef = useRef(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        // Only reveal AFTER the hero CTA has been seen and left. Without the
        // `seen` latch the bar flashes on first paint, before the observer
        // has reported that the hero is visible.
        if (entry.isIntersecting) {
          seenRef.current = true;
          setShown(false);
        } else if (seenRef.current) {
          setShown(true);
        }
      },
      { threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [watchId]);

  return (
    <div
      // aria-hidden while off-screen so a screen reader does not announce a
      // duplicate of the hero's own buy button.
      aria-hidden={!shown}
      className={`md:hidden fixed inset-x-0 z-40 border-t border-hairline bg-paper/95 backdrop-blur-md transition-transform duration-300 ease-brand ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      style={{
        // Clear the mobile tab bar (h-14 = 56px) and the home-indicator inset.
        bottom: "calc(56px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-mini font-medium text-ink-mute">{name}</p>
          <p className="text-sm font-bold tabular-nums text-ink">{priceLabel}</p>
        </div>
        <div className="shrink-0">
          <CartButton slug={slug} size="sm" />
        </div>
      </div>
    </div>
  );
}
