"use client";

// LivePosEmbed — the "try the real product" surface. Iframes the live
// bakery-demo tenant (POS on one tab, back-office on the other) and
// pairs it with a sticky credentials card that supports one-click
// copy.
//
// Cross-origin iframes cannot be programmatically filled from the
// parent — the browser sandboxes cookies, JS, and form access. So the
// best UX we can build is:
//   1. Credentials visible on a side card at all times.
//   2. Every credential value is one click to copy (Clipboard API).
//   3. A clear step-1 / step-2 flow so the visitor knows the order.
//   4. A "fullscreen" escape hatch that pops the app into a fresh tab
//      for a real hands-on session without the marketing chrome.
//
// The iframe is `sandbox`-free so the tenant app's own scripts run
// normally; that's fine since we only iframe our own domain.

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Tab = "pos" | "backoffice";

const TARGETS: Record<
  Tab,
  {
    url: string;
    credentials: { field: string; value: string; hint?: string }[];
  }
> = {
  pos: {
    url: "https://bakery-pos.demo.caisse-manager.ma/",
    credentials: [
      { field: "user", value: "test", hint: "Manager account" },
      { field: "pin", value: "0000", hint: "4-digit PIN" },
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
    <div className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-10 py-8 md:py-12">
      {/* Header */}
      <header className="mb-6 md:mb-8">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-ink-mute">
          {t("eyebrow")}
        </p>
        <h1
          className="mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[24ch]"
          style={{ textWrap: "balance" }}
        >
          {t("title")}
        </h1>
        <p className="mt-4 text-[14.5px] md:text-[15px] leading-[1.55] text-ink-soft max-w-[42rem]">
          {t("body")}
        </p>
      </header>

      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label={t("tabsLabel")}
        className="inline-flex items-center gap-1 rounded-full bg-canvas ring-1 ring-hairline p-1 mb-5"
      >
        <TabButton
          active={tab === "pos"}
          onClick={() => setTab("pos")}
          label={t("tabPos")}
          hint={t("tabPosHint")}
        />
        <TabButton
          active={tab === "backoffice"}
          onClick={() => setTab("backoffice")}
          label={t("tabBackoffice")}
          hint={t("tabBackofficeHint")}
        />
      </div>

      {/* Body — two-column on lg+, stacked on smaller. Iframe on the
          right, credentials + guide on the left. */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 md:gap-6">
        {/* Sign-in helper card */}
        <aside className="lg:sticky lg:top-24 self-start rounded-2xl bg-paper ring-1 ring-hairline overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.20em] text-ink-mute">
              {t("credentialsEyebrow")}
            </p>
            <h2 className="mt-1.5 text-[15px] font-semibold text-ink leading-[1.35]">
              {t("credentialsTitle")}
            </h2>
            <p className="mt-1 text-[12px] text-ink-soft leading-[1.5]">
              {t("credentialsBody")}
            </p>
          </div>
          <div className="p-4 space-y-2.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: APPLE_EASE }}
                className="space-y-2.5"
              >
                {target.credentials.map((c) => (
                  <CredentialRow
                    key={c.field}
                    label={t(`fields.${c.field}` as "user")}
                    value={c.value}
                    hint={c.hint}
                    copyLabel={t("copy")}
                    copiedLabel={t("copied")}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
            <div className="pt-2 border-t border-hairline flex flex-col gap-1.5 text-[11.5px] text-ink-mute leading-[1.55]">
              <p>{t("stepGuide")}</p>
              <a
                href={target.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-ink font-medium hover:underline underline-offset-[5px]"
              >
                {t("openFullscreen")}
                <ExternalIcon />
              </a>
            </div>
          </div>
        </aside>

        {/* Iframe host */}
        <div className="rounded-2xl bg-ink ring-1 ring-hairline overflow-hidden">
          {/* Chrome bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-hairline-dark bg-ink text-paper/80">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-paper/25" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-paper/25" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-paper/25" aria-hidden />
            </div>
            <p
              className="text-[11.5px] text-paper/70 tabular-nums truncate max-w-[52ch]"
              title={target.url}
            >
              {target.url}
            </p>
            <span aria-hidden className="h-2.5 w-2.5" />
          </div>
          <div
            className="relative w-full bg-paper"
            style={{ aspectRatio: "16 / 10" }}
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
                loading="lazy"
                referrerPolicy="no-referrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: APPLE_EASE }}
              />
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile hint — the live app expects a POS-sized display */}
      <p className="mt-6 lg:hidden text-[12.5px] text-ink-mute leading-[1.55] rounded-xl bg-canvas ring-1 ring-hairline px-4 py-3">
        {t("mobileHint")}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "group inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-medium transition-colors duration-200 " +
        (active
          ? "bg-ink text-paper"
          : "text-ink-soft hover:text-ink hover:bg-paper")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      {label}
      <span
        className={
          "text-[10px] font-medium uppercase tracking-[0.12em] " +
          (active ? "text-paper/60" : "text-ink-mute")
        }
      >
        {hint}
      </span>
    </button>
  );
}

function CredentialRow({
  label,
  value,
  hint,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  hint?: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }, [value]);

  return (
    <div className="rounded-xl bg-canvas ring-1 ring-hairline px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-mute">
          {label}
        </p>
        <button
          type="button"
          onClick={onCopy}
          aria-live="polite"
          className={
            "inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10.5px] font-medium transition-colors duration-200 " +
            (copied
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-paper text-ink ring-1 ring-hairline hover:bg-ink hover:text-paper")
          }
        >
          {copied ? (
            <>
              <CheckIcon />
              {copiedLabel}
            </>
          ) : (
            <>
              <CopyIcon />
              {copyLabel}
            </>
          )}
        </button>
      </div>
      <p className="mt-1 text-[13.5px] font-medium text-ink tabular-nums break-all">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-[11px] text-ink-mute leading-[1.4]">{hint}</p>
      )}
    </div>
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
