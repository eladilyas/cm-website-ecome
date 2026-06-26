"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { NavExpansion } from "@/components/layout/NavExpansion";
import { SearchExpansion } from "@/components/layout/SearchExpansion";
import { EcommerceCard } from "@/components/layout/EcommerceCard";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useNavMenu, type NavItem } from "@/lib/nav";
import { useHeaderScheme } from "@/hooks/useHeaderScheme";
import { useCartStore } from "@/lib/cartStore";
import { useAccountStore, getInitials } from "@/lib/accountStore";
import { useAuth } from "@/hooks/useAuth";
import { signOut as authSignOut } from "@/lib/auth-client";
import { HERO_GLASS_SURFACE, HERO_GLASS_HAIRLINE } from "@/lib/heroGlass";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Expansion =
  | { kind: "nav"; label: string; item: NavItem }
  | { kind: "search" }
  | { kind: "cart" }
  | null;

// Apple-style unified expansion system:
//
//   • The navbar IS the dropdown. One surface, one background. Expansion
//     animates height 0 ↔ auto inside the same <header>.
//   • No card, no shadow, no gap, no visible container. Border-bottom hairline
//     lives at the bottom of the expanded header.
//   • A backdrop-blurred scrim at z-30 sits below the header at z-50 — the
//     page beneath visibly recedes for any expansion (nav | search | cart).
//   • Switching between nav items keeps the outer container open and only the
//     inner content cross-fades; outer height re-animates to fit.
//   • Search and Cart are modal-like — hover doesn't disturb them; close via
//     ESC / × / scrim click.

export function Header({
  initialSessionHint = false,
}: {
  /** Server-detected hint that a Better-Auth session cookie is
   *  present. Drives the very first SSR/hydration paint of the
   *  account slot so logged-in visitors see the chip immediately —
   *  no flash of signed-out chrome before localStorage + useSession
   *  resolve on the client. */
  initialSessionHint?: boolean;
} = {}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const navMenu = useNavMenu();
  const isPOSWorkspace = pathname?.startsWith("/demo/order") ?? false;
  const [scrolled, setScrolled] = useState(false);
  const [expansion, setExpansion] = useState<Expansion>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overHero, setOverHero] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Route-level scheme — the default, decided ONCE per page in
  // useHeaderScheme. Per-section scroll switching is intentionally NOT
  // a thing; that's what caused the contrast flicker.
  const routeScheme = useHeaderScheme();

  // Hero-overlay exception (controlled, single-purpose).
  // A section can opt into immersive navbar treatment by tagging itself
  // `data-header-overlay="hero"`. While that section overlaps the header
  // zone, the navbar drops to fully transparent and forces dark scheme
  // (paper-tone text/icons) so it reads on the cinematic background.
  // Once that section scrolls past, the navbar transitions smoothly
  // back to the route's standard scheme — this is the ONLY exception to
  // the global rule.
  useEffect(() => {
    const target = document.querySelector<HTMLElement>(
      '[data-header-overlay="hero"]',
    );
    if (!target) {
      // No hero overlay marker on this page — reset to non-immersive.
      // This is a route-change reset, not a render-loop trigger.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOverHero(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      {
        // Crop the top of the viewport by the header height, so the hero
        // is considered "active" while ANY of it remains visible BELOW
        // the navbar — i.e. until its bottom edge clears the header.
        rootMargin: "-44px 0px 0px 0px",
        threshold: 0,
      },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  // Effective rendering scheme.
  //
  //   • Over hero, no dropdown open  → dark (paper text on transparent
  //     navbar — reads on the cinematic video).
  //   • Over hero, dropdown open     → LIGHT. Dropdowns/search/menus over
  //     a dark video need a bright, readable surface; dark glass on a
  //     dark frame collapses hierarchy and looks noisy. The Apple/Stripe
  //     idiom is to flip to a frosted-light panel for any interactive
  //     overlay, even when the resting navbar is dark. So the moment
  //     `open` flips true while over hero, the whole header (and the
  //     expansion that hangs off it) hands off to light.
  //   • Past hero                    → route scheme (default light).
  //
  // The hand-off uses the same 500ms cubic-bezier transition that drives
  // resting↔active glass — it reads as a single density+tone shift, not
  // a flicker.
  const scheme: "light" | "dark" =
    overHero && expansion === null ? "dark" : routeScheme;
  const onDark = scheme === "dark";

  // ── scroll → strengthen the glass slightly (no scheme change) ──────────
  // The header is always glass once past the hero. Past the top edge we
  // deepen the glass a touch and add a hairline border so the surface
  // gains a quiet sense of depth as the page scrolls behind it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── ESC closes anything open ───────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpansion(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close every overlay on route change. Catches both in-dropdown link
  // clicks AND top-level nav item navigation (e.g. clicking "Pricing"
  // while the Store dropdown is open). pathname is an external signal
  // (router) so the set-state-in-effect rule doesn't apply here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpansion(null);
    setMobileOpen(false);
  }, [pathname]);

  // ── body scroll lock while search is open ──────────────────────────────
  useEffect(() => {
    if (expansion?.kind !== "search") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expansion]);

  // ── hover timing ───────────────────────────────────────────────────────
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // Modal-like expansions (search, cart) are never auto-closed by mouseleave.
  const isModalLike = (e: Expansion) =>
    e?.kind === "search" || e?.kind === "cart";

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setExpansion((cur) => (isModalLike(cur) ? cur : null));
    }, 120);
  };

  const onNavItemEnter = (item: NavItem) => {
    if (isModalLike(expansion)) return; // don't disturb search/cart
    cancelClose();
    const hasDropdown = !!(item.groups?.length || item.items?.length);
    if (hasDropdown) {
      setExpansion({ kind: "nav", label: item.label, item });
    } else {
      setExpansion(null);
    }
  };

  const toggleSearch = () => {
    setExpansion((cur) =>
      cur?.kind === "search" ? null : { kind: "search" }
    );
  };

  // The bag icon routes to /cart, the dedicated full cart page. On
  // Add to Cart the user sees a small CartToast notification top-right
  // instead of a drawer auto-opening.

  // Total items in the cart — primitive number, safe Object.is subscription.
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.qty, 0),
  );

  // Account session — drives the header chip + dropdown. Reads from
  // useAuth (Better-Auth session, with the demo accountStore profile
  // bridged in by the global AuthBridge).
  //
  // Flash-free chrome — single rule:
  //   • Show signed-in chrome whenever EITHER the live client signal
  //     (accountStore profile from localStorage, OR useSession's
  //     isSignedIn flag) says so, OR the server-detected
  //     `initialSessionHint` says so.
  //   • Only flip to signed-out chrome when useSession has actually
  //     resolved AND it returned "no session" AND there's no local
  //     profile. That's `confirmedSignedOut`.
  //
  // The prior implementation had a transient hole: at the instant
  // `mounted` became true, we stopped trusting the server hint, but
  // useSession + Zustand may not have caught up yet — so the chrome
  // flickered to "Connexion" for one paint before settling. By keeping
  // the hint as a fallback until we have CONCRETE signed-out evidence,
  // there is no in-between state where every signal is false.
  //
  // Security: `initialSessionHint` only reflects cookie *presence*,
  // not validity. A forged cookie would fool only the visitor's own
  // chrome; middleware + API still reject unsigned/expired sessions.
  const { profile, isSignedIn, isPending } = useAuth();
  const liveSignedIn = Boolean(profile) || isSignedIn;
  // Concrete proof of signed-out: useSession finished resolving and
  // returned no user, AND there's no persisted local profile. Until
  // we hit that point, we render whatever optimistic signal exists.
  const confirmedSignedOut = !isPending && !isSignedIn && !profile;
  const visiblySignedIn = confirmedSignedOut
    ? false
    : liveSignedIn || initialSessionHint;
  // `showSignInChrome` MUST be derived symmetrically with
  // `visiblySignedIn` — never from `confirmedSignedOut` alone. On
  // SSR `isPending` is true (useSession only resolves on the
  // client), so `confirmedSignedOut` is always false server-side.
  // If we keyed the trial-CTA visibility on `confirmedSignedOut`,
  // signed-out visitors would see SSR render WITHOUT the CTA but
  // client re-render WITH it → React hydration mismatch on every
  // signed-out page load. Deriving from `!visiblySignedIn` keeps
  // SSR and client in lockstep (both read the same
  // `initialSessionHint` cookie-presence signal).
  const showSignInChrome = !visiblySignedIn;
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Local helper — clears both auth surfaces and routes home, used by
  // the account menu's "Sign out" item.
  const signOutEverywhere = async () => {
    await authSignOut();
    useAccountStore.getState().signOut();
  };

  const close = () => setExpansion(null);

  const open = expansion !== null;
  // Active = the navbar should show its full glass presence. Triggered by
  // any scroll past the top OR any expansion (dropdown/search/cart) being
  // open. Outside the hero exception, the header is always at least
  // resting-glass; no transparent state exists past the hero — that's
  // what previously caused contrast bugs.
  const isActive = scrolled || open;

  // Hero-immersive surface: shared "hero glass" — a subtle dark frost
  // (bg-night/15 + backdrop-blur-md + hairline) that the navbar shares
  // with the trusted-by strip pinned at the bottom of the hero. Same
  // transparency, same blur intensity, same hairline weight — the top
  // and bottom edges of the hero read as a single premium frosted
  // system rather than two unrelated UI bands. Applied only while
  // overHero AND no expansion is open; opening an expansion over the
  // hero pulls in light glass so dropdown content is readable.
  const isImmersive = overHero && !open;

  // ── visual variants ────────────────────────────────────────────────────
  // Resting glass — subtle frosted surface that still reveals the page
  // beneath. Active glass — slightly more opaque + hairline divider so
  // the navbar gains presence once the page is in motion.
  const glassRest = onDark
    ? "bg-night/55 backdrop-blur-xl border-transparent"
    : "bg-paper/60 backdrop-blur-xl border-transparent";
  const glassActive = onDark
    ? "bg-night/78 backdrop-blur-xl border-white/10"
    : "bg-paper/78 backdrop-blur-xl border-hairline";
  // Shared with TrustedByStrip — see src/lib/heroGlass.ts for the rule.
  // Border direction (`border-b` here, `border-t` on the strip) is
  // already handled by each consumer's own className.
  const immersive = `${HERO_GLASS_SURFACE} ${HERO_GLASS_HAIRLINE}`;

  const linkClass = onDark
    ? "text-paper/85 hover:text-paper"
    : "text-ink/85 hover:text-ink";

  const linkActiveClass = onDark ? "text-paper" : "text-ink";

  const iconBtnClass = onDark
    ? "text-paper/85 hover:text-paper hover:bg-white/10"
    : "text-ink/85 hover:text-ink hover:bg-fog";

  // Account initials chip — premium pill that adapts to header scheme.
  // The old version was always ink-on-ink and disappeared on the dark
  // hero. Now: white-frost on dark, faint-ink on light. Open state
  // always inverts to the brand-ink solid pill so the dropdown anchor
  // is unambiguous regardless of header surface.
  const accountChipRest = onDark
    ? "bg-paper/15 text-paper ring-1 ring-paper/25 hover:bg-paper/25"
    : "bg-ink/[0.06] text-ink ring-1 ring-ink/10 hover:bg-ink/[0.12]";
  const accountChipOpen = "bg-ink text-paper ring-1 ring-ink";

  const ctaVariant = onDark ? "invert" : "primary";

  const scrimBg = onDark
    ? "bg-night/40 backdrop-blur-md"
    : "bg-paper/30 backdrop-blur-md";

  // Identifier for crossfade keying.
  const contentKey =
    expansion?.kind === "search"
      ? "search"
      : expansion?.kind === "cart"
      ? "cart"
      : expansion?.kind === "nav"
      ? `nav-${expansion.label}`
      : "none";

  // POS workspace has its own POSChrome — hide the marketing header there.
  if (isPOSWorkspace) return null;

  return (
    <>
      {/* Scrim */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            onClick={close}
            aria-hidden="true"
            className={`fixed inset-0 z-30 ${scrimBg}`}
          />
        )}
      </AnimatePresence>

      <header
        onMouseLeave={scheduleClose}
        onMouseEnter={cancelClose}
        className={[
          "fixed top-0 inset-x-0 z-50",
          "transition-[background-color,backdrop-filter,border-color,color] duration-500",
          "border-b",
          isImmersive ? immersive : isActive ? glassActive : glassRest,
          onDark ? "text-paper" : "text-ink",
        ].join(" ")}
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* Top bar — at md+ the 3-column grid (1fr|auto|1fr) keeps the
            centre nav mathematically centred regardless of the
            asymmetric left logo and right icon-cluster widths. Below
            md the centre column is hidden, so we drop to a simple
            flex `justify-between`: logo flush left, icon cluster
            flush right — no phantom middle column eating space. */}
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between h-11 md:gap-x-4">
            <div className="flex md:justify-self-start">
              {/* `white` is bound to the immersive state — same condition
                  that drives the transparent navbar surface and the paper
                  text/icon colors. The Logo handles the crossfade. */}
              <Logo size={26} white={isImmersive} />
            </div>

            <nav className="hidden md:flex items-center md:justify-self-center" aria-label="Primary">
              <ul className="flex items-center">
                {navMenu.map((item) => {
                  const hasDropdown = !!(item.groups?.length || item.items?.length);
                  const isOpen =
                    expansion?.kind === "nav" && expansion.label === item.label;

                  return (
                    <li
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => onNavItemEnter(item)}
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={`inline-flex h-11 items-center px-3 text-[13px] font-normal transition-colors duration-200 ${
                            isOpen ? linkActiveClass : linkClass
                          }`}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`inline-flex h-11 items-center px-3 text-[13px] font-normal transition-colors duration-200 ${
                            isOpen ? linkActiveClass : linkClass
                          }`}
                          aria-haspopup="true"
                          aria-expanded={isOpen}
                          onFocus={() => hasDropdown && onNavItemEnter(item)}
                        >
                          {item.label}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Right cluster — flush right on every breakpoint. */}
            <div className="flex items-center gap-1 md:justify-self-end">
              {/* Language switcher — between search and the bag so it
                  reads as part of the icon cluster, not as nav content. */}
              <span className="hidden md:inline-flex mr-1">
                <LanguageSwitcher scheme={scheme} />
              </span>

              {/* Search */}
              <button
                type="button"
                aria-label={
                  expansion?.kind === "search" ? t("closeSearch") : t("openSearch")
                }
                aria-expanded={expansion?.kind === "search"}
                onClick={toggleSearch}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${iconBtnClass}`}
              >
                <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  {expansion?.kind === "search" ? (
                    <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  ) : (
                    <>
                      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M15 15L19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </>
                  )}
                </svg>
              </button>

              {/* Bag — routes to the dedicated /cart page. Count badge
                  surfaces when items exist. After Add to Cart the
                  user sees a small CartToast top-right; clicking the
                  bag opens the full /cart page. */}
              <Link
                href="/cart"
                aria-label={
                  cartCount > 0
                    ? `${t("openCart")} · ${t("cartItems", { count: cartCount })}`
                    : t("openCart")
                }
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${iconBtnClass}`}
              >
                {/* Modern shopping bag — rounded-square body with a
                    centered arch handle. Reads cleanly at 16-20px and
                    matches the editorial e-commerce vocabulary used
                    by Apple, Aesop, and Stripe. Stroke 1.5 keeps the
                    silhouette confident next to the slimmer 1.4
                    magnifier; e-com is the primary CTA on this row,
                    so it earns the extra weight. */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 7h10a0.8 0.8 0 0 1 0.8 0.86l-0.7 8.4a1.6 1.6 0 0 1-1.6 1.47H6.5a1.6 1.6 0 0 1-1.6-1.47l-0.7-8.4A0.8 0.8 0 0 1 5 7Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.4 7V5.6a2.6 2.6 0 1 1 5.2 0V7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                {cartCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[#E11D2A] text-white text-[10px] font-semibold tabular-nums leading-none"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Account — initials chip (signed in) or Sign in link
                  (signed out). isSignedIn (Better-Auth cookie) is the
                  auth source; profile is the bridged display data.
                  Both must be ready before we show the chip so we
                  never read `profile.fullName` on undefined. */}
              {visiblySignedIn && profile ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                    aria-label={`Account menu · signed in as ${profile.fullName}`}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.02em] transition-colors duration-300 ${
                      accountMenuOpen ? accountChipOpen : accountChipRest
                    }`}
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.32, 0.72, 0, 1)",
                    }}
                  >
                    {getInitials(profile)}
                  </button>
                  <AnimatePresence>
                    {accountMenuOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Close account menu"
                          onClick={() => setAccountMenuOpen(false)}
                          className="fixed inset-0 z-[60] cursor-default"
                          tabIndex={-1}
                        />
                        <motion.div
                          role="menu"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.16, ease: APPLE_EASE }}
                          className="absolute right-0 top-full mt-2 z-[70] w-[240px] rounded-xl border border-hairline bg-paper shadow-[0_18px_48px_rgba(0,0,0,0.10)] overflow-hidden"
                        >
                          <div className="px-3.5 py-3 border-b border-hairline">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-0.5">
                              {t("signedInAs")}
                            </p>
                            <p className="text-[13px] font-medium text-ink truncate">
                              {profile.fullName}
                            </p>
                            <p className="text-[11px] text-ink-mute truncate">
                              {profile.email}
                            </p>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/account"
                              onClick={() => setAccountMenuOpen(false)}
                              role="menuitem"
                              className="block px-3.5 py-2 text-[13px] text-ink hover:bg-canvas transition-colors"
                            >
                              {t("accountOrders")}
                            </Link>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setAccountMenuOpen(false);
                                void signOutEverywhere();
                              }}
                              className="block w-full text-left px-3.5 py-2 text-[13px] text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
                            >
                              {t("signOut")}
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/signin"
                  className={`hidden sm:inline-flex h-9 items-center px-2 text-[12.5px] font-medium transition-colors duration-300 ${
                    onDark
                      ? "text-paper/85 hover:text-paper"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {t("signIn")}
                </Link>
              )}

              {showSignInChrome && (
                // Hidden on mobile to keep the top bar from feeling
                // cramped. Mobile visitors reach the same destination
                // from the menu drawer's persistent footer CTA + the
                // StickyTrialCTA strip pinned to the viewport bottom.
                <span className="hidden md:inline-flex">
                  <Button href="/start-free-trial" variant={ctaVariant} size="sm">
                    {t("startTrial")}
                  </Button>
                </span>
              )}
              <button
                type="button"
                className={`md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${iconBtnClass}`}
                aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d={mobileOpen ? "M4 4l10 10M14 4L4 14" : "M2 5h14M2 13h14"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Expansion */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="expansion"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.45, ease: APPLE_EASE }}
              className="overflow-hidden"
            >
              <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-4 pb-12 md:pb-16">
                <motion.div
                  key={contentKey}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: APPLE_EASE, delay: 0.08 }}
                >
                  {expansion?.kind === "nav" ? (
                    <NavExpansion item={expansion.item} onSelect={close} scheme={scheme} />
                  ) : expansion?.kind === "search" ? (
                    <SearchExpansion onClose={close} scheme={scheme} />
                  ) : expansion?.kind === "cart" ? (
                    <EcommerceCard onClose={close} scheme={scheme} />
                  ) : null}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </header>

      {/* Apple-style drill-in mobile menu. Lives OUTSIDE the
          <header> stacking context so the full-screen sheet can sit
          above the page without fighting the header's sticky/blur
          chrome. Auto-close on route change is handled inside the
          component (pathname-aware via Link onClick + Esc). */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        scheme={scheme}
        // Same `visiblySignedIn` signal as the desktop chrome — see
        // the long comment near `const { profile, isSignedIn, ... }`
        // above. Drives mobile chrome off persisted localStorage data
        // so the drill-in menu doesn't flicker to "Sign in" / "Connexion"
        // during the brief useSession re-probe that follows every
        // locale switch.
        isSignedIn={visiblySignedIn}
        profile={profile ?? null}
        cartCount={cartCount}
      />
    </>
  );
}
