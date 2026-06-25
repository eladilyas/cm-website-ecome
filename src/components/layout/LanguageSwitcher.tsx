"use client";

// Premium FR/EN language switcher.
//
// Behaviour:
//   • Reads the current locale from next-intl.
//   • Switching preserves the current pathname — visitors stay on
//     the same page in the other language, no homepage bounce.
//   • Compact pill on desktop (FR | EN), expanded labels in mobile
//     menu via the `variant="menu"` prop.
//
// Visual: matches the header icon-cluster scheme — translucent
// pill that flips to ink-fill on the active locale.

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Variant = "pill" | "menu";
type Scheme = "light" | "dark";

const LABEL: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
};

const FULL_LABEL: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

export function LanguageSwitcher({
  variant = "pill",
  scheme = "light",
  className = "",
}: {
  variant?: Variant;
  scheme?: Scheme;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSelect = (next: Locale) => {
    if (next === locale || pending) return;
    startTransition(() => {
      // next-intl router preserves the current path AND query string
      // when we pass the same pathname back with a new locale option.
      router.replace(pathname, { locale: next });
    });
  };

  if (variant === "menu") {
    // Mobile-menu treatment — stacked rows with full language names,
    // tap-friendly height. Active row gets the inset check.
    return (
      <div
        role="radiogroup"
        aria-label="Langue / Language"
        className={"flex flex-col gap-1 " + className}
      >
        {routing.locales.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(l)}
              className={
                "flex items-center justify-between h-11 px-4 rounded-xl text-[14px] font-medium transition-colors " +
                (active
                  ? "bg-ink text-paper"
                  : "text-ink hover:bg-fog")
              }
            >
              <span>{FULL_LABEL[l]}</span>
              {active && (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path
                    d="M3 7.5l2.5 2.5L11 4.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pill variant — desktop header. Compact, scheme-aware. Each
  // locale is a button; the active one fills with ink-solid so
  // the choice is unambiguous against any header background.
  const onDark = scheme === "dark";
  const trackClass = onDark
    ? "bg-paper/10 ring-1 ring-paper/15"
    : "bg-ink/[0.05] ring-1 ring-ink/10";
  const idleClass = onDark
    ? "text-paper/70 hover:text-paper"
    : "text-ink-soft hover:text-ink";
  const activeClass = onDark
    ? "bg-paper text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
    : "bg-ink text-paper shadow-[0_1px_2px_rgba(0,0,0,0.08)]";

  return (
    <div
      role="radiogroup"
      aria-label="Langue / Language"
      className={
        "inline-flex items-center gap-0.5 h-8 px-0.5 rounded-full " +
        trackClass +
        " " +
        className
      }
    >
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={FULL_LABEL[l]}
            onClick={() => onSelect(l)}
            disabled={pending}
            className={
              "inline-flex items-center justify-center h-7 min-w-[34px] px-2.5 rounded-full text-[11.5px] font-semibold tracking-[0.04em] transition-colors duration-200 disabled:opacity-60 " +
              (active ? activeClass : idleClass)
            }
            style={{
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}
