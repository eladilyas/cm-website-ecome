"use client";

// Home-page live POS preview — the "try the real product" moment.
//
// Iframes the Bakery-demo tenant with the same POS ↔ Back-office tab
// toggle as /demo, so a visitor's first impression is a full working
// product they can flip between and click into. No URL bar, no
// floating "open in tab" overlay that hides part of the app.

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Arrow } from "@/components/ui/Arrow";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Tab = "pos" | "backoffice";

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
  const target = TARGETS[tab];

  return (
    <section
      data-scheme="light"
      className="relative bg-canvas overflow-hidden"
    >
      <SectionDivider scheme="light" />
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-16 md:py-24">
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
          </Reveal>
        </div>

        {/* Credentials + full-demo link */}
        <Reveal delay={0.14}>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-mute">
              {t("credentialsLabel")}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.15, ease: APPLE_EASE }}
                className="flex flex-wrap items-center gap-2"
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
            <Link
              href="/demo"
              className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-ink hover:text-[#E11D2A] transition-colors"
            >
              {t("fullDemoCta")}
              <Arrow size={12} />
            </Link>
          </div>
        </Reveal>

        {/* Iframe host — clean bezel, no fake chrome, no overlay. */}
        <Reveal delay={0.18}>
          <div className="rounded-2xl bg-ink ring-1 ring-hairline overflow-hidden shadow-[0_20px_50px_-24px_rgba(0,0,0,0.28)]">
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
        "inline-flex items-center gap-1.5 h-8 pl-2.5 pr-2.5 rounded-full text-[12px] font-medium transition-colors duration-200 " +
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
      {copied ? (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2.5 6L5 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 8V2.5A0.5 0.5 0 012.5 2H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
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
