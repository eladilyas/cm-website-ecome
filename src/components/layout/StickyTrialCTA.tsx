"use client";

// StickyTrialCTA — mobile-only bottom action strip.
//
// Hidden on first paint. Slides in once the user has scrolled past ~80% of
// the viewport height (clear of the hero), and slides away when scrolling
// down so it never blocks reading mid-flow. Returns on scroll-up.
//
// Hidden on routes where the marketing chrome doesn't apply (/demo, /shop
// product detail's own CTAs, /start-free-trial — the user is IN the funnel).

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Routes where the marketing site's bottom CTA strip should NOT appear:
//   • /demo and any demo sub-route — the user is in the product
//   • /start-free-trial — they're already in the form
//   • /legal/* — quiet legal pages, no marketing chrome
const SUPPRESS_PREFIXES = ["/demo", "/start-free-trial", "/legal"];

export function StickyTrialCTA() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const suppressed = SUPPRESS_PREFIXES.some((p) => pathname?.startsWith(p));

  const [visible, setVisible] = useState(false);
  const [hiddenForDirection, setHiddenForDirection] = useState(false);

  useEffect(() => {
    if (suppressed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      return;
    }

    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        // Past 80% of the first viewport — past the hero on most pages.
        const pastHero = y > vh * 0.8;
        const scrollingDown = y > lastY + 4;
        const scrollingUp = y < lastY - 4;

        setVisible(pastHero);
        if (scrollingDown) {
          setHiddenForDirection(true);
        } else if (scrollingUp) {
          setHiddenForDirection(false);
        }

        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [suppressed]);

  if (suppressed) return null;

  const show = visible && !hiddenForDirection;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.32, ease: APPLE_EASE }}
          className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none"
        >
          <div className="px-4 pb-4 pt-3 pointer-events-auto">
            <Link
              href="/start-free-trial"
              className="flex items-center justify-center h-12 rounded-full bg-ink text-paper text-[15px] font-medium shadow-[0_12px_28px_rgba(0,0,0,0.22)] active:scale-[0.98] transition-transform"
              style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
            >
              {t("startTrial")}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
