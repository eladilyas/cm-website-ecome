"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";

type Props = {
  onClose: () => void;
  scheme: "light" | "dark";
};

// Apple-style ecommerce panel content (no chrome — the surrounding header
// expansion provides the surface). PLG-flavored: left column hooks into trial,
// right column is a product list with tiny icons. Sign-in lives here, not in
// the top bar — same pattern as Apple's bag panel.

type ProductIconKind = "monitor" | "kds" | "phone" | "kiosk" | "hardware";

type ProductLink = {
  /** Translation key under `nav.ecommerceCard.products`. */
  labelKey: "pos" | "kds" | "mobile" | "kiosk" | "store";
  href: string;
  icon: ProductIconKind;
};

const PRODUCTS: ProductLink[] = [
  { labelKey: "pos", href: "/products/pos", icon: "monitor" },
  { labelKey: "kds", href: "/products/kds", icon: "kds" },
  { labelKey: "mobile", href: "/products/online-ordering-app", icon: "phone" },
  { labelKey: "kiosk", href: "/products/kiosk", icon: "kiosk" },
  { labelKey: "store", href: "/shop", icon: "hardware" },
];

export function EcommerceCard({ onClose, scheme }: Props) {
  const t = useTranslations("nav.ecommerceCard");
  const eyebrowClass =
    scheme === "dark" ? "text-paper/55" : "text-ink-mute";
  const titleClass = scheme === "dark" ? "text-paper" : "text-ink";
  const captionClass = scheme === "dark" ? "text-paper/70" : "text-ink-soft";
  const itemClass =
    scheme === "dark"
      ? "text-paper hover:text-paper/70"
      : "text-ink hover:text-ink-soft";
  const iconWrapClass =
    scheme === "dark"
      ? "text-paper/85 bg-white/8 ring-1 ring-white/10"
      : "text-ink/85 bg-paper ring-1 ring-hairline";
  const divider = scheme === "dark" ? "border-white/10" : "border-hairline";
  const signinClass =
    scheme === "dark"
      ? "text-paper/65 hover:text-paper"
      : "text-ink-mute hover:text-ink";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-x-12 gap-y-10">
      {/* Left — PLG trial hook */}
      <div>
        <p className={`text-[12px] mb-3 ${eyebrowClass}`}>{t("trialEyebrow")}</p>
        <h3
          className={`text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight leading-[1.1] ${titleClass}`}
        >
          {t("trialHeadingLine1")}
          <br />
          {t("trialHeadingLine2")}
        </h3>
        <p className={`mt-3 text-[14px] leading-[1.5] max-w-[26rem] ${captionClass}`}>
          {t("trialCaption")}
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Button
            href="/start-free-trial"
            variant={scheme === "dark" ? "invert" : "primary"}
            size="sm"
            onClick={onClose}
          >
            {t("trialPrimary")}
          </Button>
          <Button href="/pricing" variant="outline" size="sm" onClick={onClose}>
            {t("trialSecondary")}
          </Button>
        </div>
      </div>

      {/* Right — product shortcuts */}
      <div>
        <p className={`text-[12px] mb-4 ${eyebrowClass}`}>{t("productsEyebrow")}</p>
        <ul className="space-y-2">
          {PRODUCTS.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                onClick={onClose}
                className={`flex items-center gap-3 py-1.5 text-[14px] font-medium transition-colors ${itemClass}`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${iconWrapClass}`}
                >
                  <ProductIcon kind={p.icon} />
                </span>
                {t(`products.${p.labelKey}`)}
              </Link>
            </li>
          ))}
        </ul>

        <div className={`mt-6 pt-4 border-t ${divider}`}>
          <Link
            href="/signin"
            onClick={onClose}
            className={`text-[13px] font-medium transition-colors ${signinClass}`}
          >
            {t("signInLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProductIcon({ kind }: { kind: ProductIconKind }) {
  const c = "stroke-current";
  switch (kind) {
    case "monitor":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1.5" y="2" width="11" height="8" rx="1" className={c} strokeWidth="1.2" />
          <path d="M5 12.5h4M7 10v2.5" className={c} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "kds":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1.5" y="2" width="4" height="10" rx="0.8" className={c} strokeWidth="1.2" />
          <rect x="6.5" y="2" width="4" height="10" rx="0.8" className={c} strokeWidth="1.2" />
        </svg>
      );
    case "phone":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="3.5" y="1.5" width="7" height="11" rx="1.5" className={c} strokeWidth="1.2" />
          <path d="M6 11h2" className={c} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "kiosk":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="2.5" y="1.5" width="9" height="9" rx="0.8" className={c} strokeWidth="1.2" />
          <path d="M5 13h4M7 10.5V13" className={c} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "hardware":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1.5" y="4" width="11" height="6.5" rx="0.8" className={c} strokeWidth="1.2" />
          <path d="M4 7h6M4 9h3" className={c} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
  }
}
