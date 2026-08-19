"use client";

// LivePosEmbed — the "try the real product" surface at /demo.
//
// Layout: compact hero + POS ↔ Back-office toggle + a big prominent
// "Sign in with demo account" button that posts a message to the
// iframe asking it to auto-fill and submit the credentials. Cross-
// origin browser sandboxing blocks the parent from writing directly
// into the tenant's inputs — the postMessage handshake is the
// standard workaround, matching how payment widgets and embedded
// auth flows are wired.
//
// Raw credentials remain available under a discreet "View credentials"
// toggle so visitors who want to sign in manually still can.

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PREFILL_MESSAGE_TYPE = "cm:demo:prefill" as const;

type Tab = "pos" | "backoffice";
type SignInState = "idle" | "signing" | "done";

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
  const t = useTranslations("demo.live");
  const [tab, setTab] = useState<Tab>("pos");
  const [signInState, setSignInState] = useState<SignInState>("idle");
  const [showCreds, setShowCreds] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const target = TARGETS[tab];

  const handleSignIn = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const origin = new URL(target.url).origin;
    const credentials = Object.fromEntries(
      target.credentials.map((c) => [c.field, c.value]),
    );
    iframe.contentWindow.postMessage(
      { type: PREFILL_MESSAGE_TYPE, surface: tab, credentials },
      origin,
    );
    setSignInState("signing");
    window.setTimeout(() => setSignInState("done"), 400);
    window.setTimeout(() => setSignInState("idle"), 2600);
  }, [tab, target]);

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setSignInState("idle");
    setShowCreds(false);
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6 pt-24 md:pt-28 pb-8 md:pb-10">
      {/* Compact header — one row: title + tab toggle. */}
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

          <div
            role="tablist"
            aria-label={t("tabsLabel")}
            className="inline-flex items-center gap-1 rounded-full bg-canvas ring-1 ring-hairline p-1"
          >
            <TabButton
              active={tab === "pos"}
              onClick={() => handleTabChange("pos")}
              label={t("tabPos")}
              icon={<PosIcon />}
            />
            <TabButton
              active={tab === "backoffice"}
              onClick={() => handleTabChange("backoffice")}
              label={t("tabBackoffice")}
              icon={<BackofficeIcon />}
            />
          </div>
        </div>

        {/* Primary action + discreet manual-credentials toggle */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Hidden on phones: it posts a prefill message to the iframe,
              which is not rendered below md, so tapping it would do nothing
              visible. The mobile card carries the real action instead. */}
          <div className="hidden md:block">
            <SignInButton
              state={signInState}
              idleLabel={t("signInCta")}
              signingLabel={t("signInSigning")}
              doneLabel={t("signInDone")}
              onClick={handleSignIn}
            />
          </div>
          <p className="hidden md:block text-[12.5px] text-ink-mute">
            {t("signInHint")}
          </p>
          <button
            type="button"
            onClick={() => setShowCreds((s) => !s)}
            className="text-[12px] text-ink-mute hover:text-ink underline underline-offset-2 decoration-hairline hover:decoration-current transition-colors"
          >
            {showCreds ? t("hideCredentials") : t("showCredentials")}
          </button>
          <a
            href={target.url}
            target="_blank"
            rel="noreferrer noopener"
            className="hidden md:inline-flex ml-auto items-center gap-1.5 h-8 px-2.5 rounded-full text-[11.5px] font-medium text-ink-mute hover:text-ink hover:bg-canvas transition-colors"
          >
            {t("openFullscreen")}
            <ExternalIcon />
          </a>
        </div>

        <AnimatePresence initial={false}>
          {showCreds && (
            <motion.div
              key={`creds-${tab}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: APPLE_EASE }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {target.credentials.map((c) => (
                  <CredentialTile
                    key={c.field}
                    label={t(`fields.${c.field}` as "user")}
                    value={c.value}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Phones: do NOT embed ────────────────────────────────────────
          The demo tenant itself refuses small viewports — it renders its own
          "Mobile Access Not Supported" panel. At 375px the 16:10 frame is
          only ~214px tall, so we were spending the most valuable slot on the
          page to display someone else's error message.
          Below md we show the honest thing instead: what the surface is, and
          one large control that opens it in a real tab where it works. */}
      <div className="md:hidden rounded-2xl ring-1 ring-hairline bg-canvas p-6 text-center">
        <span
          aria-hidden
          className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-paper ring-1 ring-hairline text-ink"
        >
          {tab === "pos" ? <PosIcon /> : <BackofficeIcon />}
        </span>
        <p className="text-[15px] font-semibold text-ink">
          {t("mobileCardTitle")}
        </p>
        <p className="mt-2 text-[13px] leading-[1.55] text-ink-soft">
          {t("mobileHint")}
        </p>
        <a
          href={target.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-5 inline-flex items-center justify-center gap-2 h-12 w-full px-5 rounded-full bg-ink text-paper text-[14px] font-semibold"
        >
          {t("openFullscreen")}
          <ExternalIcon />
        </a>
      </div>

      {/* ── md and up: the live embed ───────────────────────────────────
          16:10 so the simulator's own layout renders at natural aspect. No
          fake browser chrome — it reads as the real app. */}
      <div
        className="hidden md:block relative w-full rounded-2xl overflow-hidden ring-1 ring-hairline bg-ink"
        style={{ aspectRatio: "16 / 10" }}
      >
        <AnimatePresence mode="wait">
          <motion.iframe
            key={tab}
            ref={iframeRef}
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
    </div>
  );
}

function SignInButton({
  state,
  idleLabel,
  signingLabel,
  doneLabel,
  onClick,
}: {
  state: SignInState;
  idleLabel: string;
  signingLabel: string;
  doneLabel: string;
  onClick: () => void;
}) {
  const label =
    state === "signing" ? signingLabel : state === "done" ? doneLabel : idleLabel;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== "idle"}
      className={
        "inline-flex items-center gap-2 h-10 px-5 rounded-full text-[13.5px] font-semibold transition-all duration-200 " +
        (state === "done"
          ? "bg-emerald-600 text-white"
          : "bg-ink text-paper hover:bg-black shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)]")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      {state === "done" ? <CheckIcon /> : state === "signing" ? <SpinnerIcon /> : <KeyIcon />}
      <span>{label}</span>
    </button>
  );
}

function CredentialTile({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-paper ring-1 ring-hairline text-[12px] font-medium text-ink">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
        {label}
      </span>
      <span className="tabular-nums select-all">{value}</span>
    </span>
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
function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8l5-5M11 5l1.5 1.5M13 3l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="animate-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.6" />
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
