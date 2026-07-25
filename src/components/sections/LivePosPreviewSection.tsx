"use client";

// Home-page live POS preview — the "try the real product" moment.
//
// Iframes the Bakery-demo tenant with a POS ↔ Back-office tab toggle.
// A single "Sign in" button dispatches a postMessage to the tenant
// asking it to auto-fill and submit the demo credentials — no copy,
// no paste, no typing. Cross-origin browser sandboxing means the
// parent can't reach into the iframe's form directly; the handshake
// is the standard workaround for embedded auth flows.

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Arrow } from "@/components/ui/Arrow";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PREFILL_MESSAGE_TYPE = "cm:demo:prefill" as const;

type Tab = "pos" | "backoffice";
type SignInState = "idle" | "signing" | "done";

const TARGETS: Record<
  Tab,
  { url: string; credentials: { field: string; value: string }[] }
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

export function LivePosPreviewSection() {
  const t = useTranslations("home.livePos");
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
    <section
      data-scheme="light"
      className="relative bg-canvas overflow-hidden"
    >
      <SectionDivider scheme="light" />
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10 py-14 md:py-20">
        {/* Header row — copy left, tabs right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-end mb-8 md:mb-10">
          <div className="max-w-[46rem]">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-mute mb-4">
                {t("eyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2
                className="text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink"
                style={{ textWrap: "balance" }}
              >
                {t("title")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-4 text-[15px] md:text-[16px] leading-[1.55] text-ink-soft">
                {t("body")}
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <div
              role="tablist"
              aria-label={t("tabsLabel")}
              className="inline-flex items-center gap-1 rounded-full bg-paper ring-1 ring-hairline p-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.12)]"
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
          </Reveal>
        </div>

        {/* One-click sign-in row */}
        <Reveal delay={0.14}>
          <div className="mx-auto w-full max-w-[1080px] flex flex-wrap items-center gap-3 mb-4">
            <SignInButton
              state={signInState}
              idleLabel={t("signInCta")}
              signingLabel={t("signInSigning")}
              doneLabel={t("signInDone")}
              onClick={handleSignIn}
            />
            <p className="text-[12.5px] text-ink-mute">
              {t("signInHint")}
            </p>
            <button
              type="button"
              onClick={() => setShowCreds((s) => !s)}
              className="text-[12px] text-ink-mute hover:text-ink underline underline-offset-2 decoration-hairline hover:decoration-current transition-colors"
            >
              {showCreds ? t("hideCredentials") : t("showCredentials")}
            </button>
            <Link
              href="/demo"
              className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-ink hover:text-[#E11D2A] transition-colors"
            >
              {t("fullDemoCta")}
              <Arrow size={12} />
            </Link>
          </div>
        </Reveal>

        {/* Credentials disclosure — collapsed by default */}
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
              <div className="mx-auto w-full max-w-[1080px] flex flex-wrap items-center gap-2 mb-4">
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

        {/* Iframe host — clean bezel, no fake chrome, no overlay.
            Cap the container so the preview feels like a product-shot
            (not a takeover) while the 16:10 internal ratio keeps the
            simulator's own layout looking natural. */}
        <Reveal delay={0.18}>
          <div className="mx-auto w-full max-w-[1080px] rounded-2xl bg-ink ring-1 ring-hairline overflow-hidden shadow-[0_20px_50px_-24px_rgba(0,0,0,0.28)]">
            <div
              className="relative w-full bg-paper"
              style={{ aspectRatio: "16 / 10" }}
            >
              <AnimatePresence mode="wait">
                <motion.iframe
                  key={tab}
                  ref={iframeRef}
                  src={target.url}
                  title={
                    tab === "pos"
                      ? t("iframeTitle")
                      : t("iframeTitleBackoffice")
                  }
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  allow="clipboard-write; fullscreen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: APPLE_EASE }}
                />
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
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
        "inline-flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-medium transition-colors duration-200 " +
        (active
          ? "bg-ink text-paper"
          : "text-ink-soft hover:text-ink hover:bg-canvas")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      {icon}
      {label}
    </button>
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
