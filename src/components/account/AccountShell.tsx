"use client";

// Account portal shell — left sidebar nav + content pane.
//
// Mirrors the Backoffice IA in the simulator: a Linear-style sidebar
// (Overview / Orders / Financing / Profile) with a sticky-on-desktop
// nav and a content pane that scrolls. Labels resolve through
// next-intl so every section title + description tracks the active
// locale.
//
// Auth handling:
//   • Server-side: src/middleware.ts already redirects unauthenticated
//     visitors away from /account/* — by the time this shell renders
//     we know the session cookie is present.
//   • Client-side: useAuth() exposes the session + bridged profile.
//     The middleware guard is the primary defence; the client guard
//     handles late session expiry without a full reload.
//   • Sign-out hits BOTH Better-Auth (cookie clear) AND accountStore
//     (local profile pointer) in one motion.

import { useTranslations } from "next-intl";

import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { signOut as authSignOut } from "@/lib/auth-client";
import { useAccountStore, getInitials } from "@/lib/accountStore";
import { useAuth } from "@/hooks/useAuth";

type AccountHref =
  | "/account"
  | "/account/orders"
  | "/account/financing"
  | "/account/profile";

type NavItem = {
  href: AccountHref;
  label: string;
  description: string;
  icon: (active: boolean) => React.ReactNode;
};

/** Locale-aware Account sidebar nav. Returns the same shape as the
 *  legacy `NAV` const so every consumer stays unchanged — only the
 *  labels and descriptions read from the message catalog. */
function useAccountNav(): NavItem[] {
  const t = useTranslations("account.navItems");
  return [
    {
      href: "/account",
      label: t("overviewLabel"),
      description: t("overviewDesc"),
      icon: (active) => (
        <Icon active={active}>
          <path
            d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </Icon>
      ),
    },
    {
      href: "/account/orders",
      label: t("ordersLabel"),
      description: t("ordersDesc"),
      icon: (active) => (
        <Icon active={active}>
          <path
            d="M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            fill="none"
          />
        </Icon>
      ),
    },
    {
      href: "/account/financing",
      label: t("financingLabel"),
      description: t("financingDesc"),
      icon: (active) => (
        <Icon active={active}>
          <path
            d="M3 7h18v10H3z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M3 11h18M7 15h2"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </Icon>
      ),
    },
    {
      href: "/account/profile",
      label: t("profileLabel"),
      description: t("profileDesc"),
      icon: (active) => (
        <Icon active={active}>
          <circle
            cx="12"
            cy="9"
            r="3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d="M5 20c1.6-3.4 4.4-5 7-5s5.4 1.6 7 5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </Icon>
      ),
    },
  ];
}

function Icon({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
      className={active ? "text-ink" : "text-ink-mute"}
    >
      {children}
    </svg>
  );
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/account";
  const tShell = useTranslations("account.shell");
  const tNav = useTranslations("nav");
  const nav = useAccountNav();

  const { isPending, isSignedIn, profile } = useAuth();

  if (isPending || !isSignedIn || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[13px] text-ink-mute">{tShell("loading")}</p>
      </div>
    );
  }

  const initials = getInitials(profile);
  const firstName = profile.fullName.trim().split(/\s+/)[0] ?? "";

  async function handleSignOut() {
    await authSignOut();
    useAccountStore.getState().signOut();
    router.push("/");
  }

  return (
    <div className="bg-canvas border-y border-hairline">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-10 md:py-14">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
              {tShell("eyebrow")}
            </p>
            <h1 className="mt-1.5 text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] leading-[1.1] text-ink">
              {tShell("greeting", { firstName })}
            </h1>
            <p className="mt-1.5 text-[14px] text-ink-soft">
              {profile.companyName} · {profile.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-hairline-strong bg-paper text-[13px] font-medium text-ink hover:bg-fog transition-colors"
            style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
          >
            <SignOutIcon />
            {tNav("signOut")}
          </button>
        </header>

        {/* Mobile (<md): horizontal tab bar lets the content surface
            without a 280px sidebar pushed above the fold. The vertical
            sidebar card returns on md+. */}
        <nav
          aria-label={tShell("navLabel")}
          className="md:hidden -mx-5 px-5 mb-5 overflow-x-auto scrollbar-hide"
        >
          <ul className="flex gap-2 min-w-min">
            {nav.map((item) => {
              const active =
                item.href === "/account"
                  ? pathname === "/account"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "inline-flex items-center h-10 px-4 rounded-full text-[13px] font-medium transition-colors " +
                      (active
                        ? "bg-ink text-paper"
                        : "bg-paper border border-hairline text-ink-soft hover:text-ink hover:bg-canvas")
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 md:gap-8">
          {/* Desktop sidebar (md+ only) */}
          <aside className="hidden md:block md:sticky md:top-24 md:self-start">
            <div className="rounded-2xl bg-paper border border-hairline overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-hairline bg-canvas">
                <div className="h-9 w-9 rounded-full bg-ink text-paper text-[12px] font-semibold inline-flex items-center justify-center tracking-wide">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">
                    {profile.fullName}
                  </p>
                  <p className="text-[11px] text-ink-mute truncate">
                    {tShell("customerLabel")} · {profile.companyName}
                  </p>
                </div>
              </div>
              <nav className="p-2">
                {nav.map((item) => {
                  const active =
                    item.href === "/account"
                      ? pathname === "/account"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors " +
                        (active
                          ? "bg-canvas text-ink"
                          : "hover:bg-canvas text-ink-soft hover:text-ink")
                      }
                      style={{
                        transitionTimingFunction:
                          "cubic-bezier(0.32, 0.72, 0, 1)",
                      }}
                    >
                      <span className="mt-0.5">{item.icon(active)}</span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium">
                          {item.label}
                        </span>
                        <span
                          className={
                            "block text-[11px] " +
                            (active ? "text-ink-soft" : "text-ink-mute")
                          }
                        >
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M5.5 11H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M8 4l3 3-3 3M11 7H5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
