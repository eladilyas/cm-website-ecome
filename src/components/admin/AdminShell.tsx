"use client";

// AdminShell — premium fixed-rail layout for /admin/*.
//
// Top bar carries the brand mark + a "View site" escape hatch + the
// signed-in identity chip with a sign-out action. The left rail is a
// Linear-style sidebar with grouped nav (Operations → Catalog →
// Identity). The right pane scrolls.
//
// Mobile behaviour: on viewports < lg the sidebar collapses behind a
// hamburger trigger in the top bar; tapping it slides an opaque
// drawer in from the left. Standard CRM pattern (Stripe / Linear).
//
// Design language matches the marketing site:
//   • bg-canvas page background, bg-paper panels
//   • hairline borders, no heavy shadows
//   • 11px uppercase tracking-wide eyebrows, 13-14px body
//   • Apple cubic-bezier transitions, 150-200ms
//
// Role gating happens in src/app/admin/layout.tsx via `requireAdmin`;
// by the time this shell renders we know the visitor is at least an
// admin. We still surface the user's role on the chip so super-admins
// can see at-a-glance which permissions are active.

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { Logo } from "@/components/ui/Logo";
import { AdminSidebar } from "./AdminSidebar";
import { AdminSignOut } from "./AdminSignOut";
import { ROLE_SLUGS, type RoleSlug } from "@/server/rbac/catalog";

export function AdminShell({
  children,
  email,
  roles,
}: {
  children: React.ReactNode;
  email: string;
  roles: RoleSlug[];
}) {
  const isSuper = roles.includes(ROLE_SLUGS.superAdmin);
  const isAdmin = isSuper || roles.includes(ROLE_SLUGS.admin);
  const isPresales = !isAdmin && roles.includes(ROLE_SLUGS.presales);
  const isDispatcher = !isAdmin && roles.includes(ROLE_SLUGS.dispatcher);

  // Mobile drawer state — sidebar is hidden behind a hamburger on
  // viewports < lg. Auto-close on route change so navigation feels
  // natural; lock body scroll while open so the page underneath
  // doesn't move when the drawer is on top.
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // React 19 "store previous prop in state" pattern — close the drawer
  // the moment the pathname changes (link tap inside the drawer). The
  // sync block runs during render so we avoid setState-in-effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const roleLabel = isSuper
    ? "Super Admin"
    : isAdmin
      ? "Admin"
      : isPresales
        ? "Pre-sales"
        : isDispatcher
          ? "Dispatcher"
          : "—";

  return (
    <div className="min-h-svh bg-canvas text-ink flex flex-col">
      {/* Top bar — spans the full viewport width. Logo on the left
          aligns with the sidebar column; identity on the right with
          the content column. No mx-auto centering at this level: the
          sidebar must stay anchored to the left edge regardless of
          content width or scrollbar state. */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-paper/85 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3 sm:gap-6">
          {/* Mobile hamburger — only visible below lg. Toggles the
              slide-in sidebar drawer. */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-ink hover:bg-canvas transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden
            >
              <path
                d="M2 5h14M2 9h14M2 13h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3 min-w-0">
            {/* Logo routes back to /admin (not /) so admins stay
                inside the operations panel. The explicit "View site"
                link below is the only cross-over to public marketing. */}
            <Logo
              size={22}
              wordmark
              href="/admin"
              className="text-ink"
            />
            <span aria-hidden className="hidden sm:block w-px h-4 bg-hairline-strong" />
            <p className="hidden sm:block text-[11px] uppercase tracking-[0.16em] text-ink-mute font-medium">
              Admin
            </p>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] text-ink-mute hover:text-ink transition-colors"
            >
              <span>View site</span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M3 9l6-6M4 3h5v5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Email is hidden below sm to keep room for the sign-out
                  CTA on narrow phones. Role chip stays so the visitor
                  always sees what tier they're operating in. */}
              <div className="text-right hidden sm:block min-w-0">
                <p className="text-[11.5px] text-ink truncate max-w-[120px] md:max-w-[180px]">
                  {email}
                </p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink-mute leading-tight">
                  {roleLabel}
                </p>
              </div>
              <AdminSignOut />
            </div>
          </div>
        </div>
      </header>

      {/* Body — sidebar pinned to the left on lg+, hidden behind a
          hamburger on mobile. Content takes the rest. */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Desktop sidebar (lg+) — always-visible left rail. */}
        <aside
          className={
            "hidden lg:block border-hairline bg-canvas " +
            "w-[260px] shrink-0 border-r " +
            "sticky top-14 self-start " +
            "h-[calc(100svh-3.5rem)] overflow-y-auto"
          }
        >
          <div className="px-6 py-8">
            <AdminSidebar
              isSuper={isSuper}
              isAdmin={isAdmin}
              isPresales={isPresales}
              isDispatcher={isDispatcher}
            />
          </div>
        </aside>

        {/* Mobile drawer (below lg). Backdrop + slide-in panel.
            Tapping outside, the close button, or a nav link closes it. */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="admin-mobile-menu"
              className="lg:hidden fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <motion.aside
                role="dialog"
                aria-label="Admin navigation"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 top-0 bottom-0 w-[88vw] max-w-[320px] bg-paper border-r border-hairline overflow-y-auto"
              >
                <div className="h-14 px-5 flex items-center justify-between border-b border-hairline">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-ink-mute font-medium">
                    Navigate
                  </p>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                    className="inline-flex items-center justify-center w-9 h-9 -mr-1 rounded-full text-ink hover:bg-canvas transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M2 2l10 10M12 2L2 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="px-5 py-6">
                  <AdminSidebar
                    isSuper={isSuper}
                    isAdmin={isAdmin}
                    isPresales={isPresales}
                    isDispatcher={isDispatcher}
                  />
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-10 py-6 md:py-10">{children}</div>
        </main>
      </div>

      {/* Minimal technical footer — version + system status only. NOT
          the marketing footer. Spans full width to match the top bar. */}
      <footer className="border-t border-hairline bg-paper/60">
        <div className="px-6 lg:px-8 h-10 flex items-center justify-between text-[11px] text-ink-mute tabular-nums">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Caisse Manager · Admin</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
