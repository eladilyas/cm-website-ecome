"use client";

// LivePosEmbed — the "try the real product" surface.
//
// Above-the-fold layout: compact hero + prominent tab toggle + big
// iframe filling the rest of the viewport. No fake browser chrome —
// the iframe reads as the app itself, not a screenshot.
//
// The tab toggle lets visitors flip between POS and Back-office in
// one click. Credentials for the current surface sit inline on the
// same toolbar with click-to-copy buttons.

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Tab = "pos" | "backoffice";

const TARGETS: Record<
  Tab,
  {
    url: string;
    credentials: { field: string; value: string }[];
  }
> = {
  pos: {
    url: "https://bakery-pos.demo.caisse-manager.ma/",
    credentials: [
      { field: "user", value: "test" },
      { field: "pin", value: "0000" },
    ],
  },
  backoffice: {
    url: "https://bakery-backoffice.demo.caisse-manager.ma/dashboard",
    credentials: [
      { field: "email", value: "root@cm.com" },
      { field: "password", value: "Caisse@Manager" },
    ],
  },
};

export function LivePosEmbed() {
  const [tab, setTab] = useState<Tab>("pos");
  const target = TARGETS[tab];
  const t = useTranslations("demo.live");

  return (
    <div className="mx-auto max-w-[1560px] px-3 sm:px-4 lg:px-6 pt-4 md:pt-6 pb-8 md:pb-10">
      {/* Compact header — one row: title + tab toggle + copy chips.
          Everything fits on one line at lg+; wraps gracefully below. */}
      <header className="mb-3 md:mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 md:gap-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-1">
              {t("eyebrow")}
            </p>
            <h1 className="text-[clamp(1.35rem,2.4vw,1.875rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink">
              {t("title")}
            </h1>
          </div>

          {/* Tab toggle — the primary control */}
          <div
            role="tablist"
            aria-label={t("tabsLabel")}
            className="inline-flex items-center gap-1 rounded-full bg-canvas ring-1 ring-hairline p-1"
          >
            <TabButton
              active={tab === "pos"}
              onClick={() => setTab("pos")}
              label={t("tabPos")}
              icon={<PosIcon />}
            />
            <TabButton
              active={tab === "backoffice"}
              onClick={() => setTab("backoffice")}
              label={t("tabBackoffice")}
              icon={<BackofficeIcon />}
            />
          </div>
        </div>

        {/* Credentials toolbar — clickable chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 md:gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-mute mr-1">
            {t("credentialsLabel")}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.15, ease: APPLE_EASE }}
              className="flex flex-wrap items-center gap-1.5 md:gap-2"
            >
              {target.credentials.map((c) => (
                <CopyChip
                  key={c.field}
                  label={t(`fields.${c.field}` as "user")}
                  value={c.value}
                />
              ))}
            </motion.div>
          </AnimatePresence>
          <a
            href={target.url}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-auto inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] font-medium text-ink-mute hover:text-ink hover:bg-canvas transition-colors"
          >
            {t("openFullscreen")}
            <ExternalIcon />
          </a>
        </div>
      </header>

      {/* Iframe host — takes the whole visible area below the header.
          Height sized so the whole surface fits in a single viewport
          on any laptop (min ~600px viewport). No fake browser chrome
          — the iframe reads as the real app. */}
      <div
        className="relative w-full rounded-2xl overflow-hidden ring-1 ring-hairline bg-ink"
        style={{ height: "min(74vh, 800px)" }}
      >
        <AnimatePresence mode="wait">
          <motion.iframe
            key={tab}
            src={target.url}
            title={
              tab === "pos"
                ? t("iframeTitlePos")
                : t("iframeTitleBackoffice")
            }
            className="absolute inset-0 w-full h-full border-0"
            loading="eager"
            allow="clipboard-write; fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: APPLE_EASE }}
          />
        </AnimatePresence>
      </div>

      {/* Mobile hint — the live app expects a POS-sized display */}
      <p className="mt-3 lg:hidden text-[12px] text-ink-mute leading-[1.5]">
        {t("mobileHint")}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] font-medium transition-colors duration-200 " +
        (active
          ? "bg-ink text-paper"
          : "text-ink-soft hover:text-ink hover:bg-paper")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      {icon}
      {label}
    </button>
  );
}

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-live="polite"
      className={
        "inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-full text-[11.5px] font-medium transition-colors duration-200 " +
        (copied
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-paper text-ink ring-1 ring-hairline hover:bg-ink hover:text-paper")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
        {label}
      </span>
      <span className="font-semibold tabular-nums break-all">{value}</span>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

function PosIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 13h4M8 11v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function BackofficeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 8V2.5A0.5 0.5 0 012.5 2H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6L5 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M4 8l4-4M4.5 4H8v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
