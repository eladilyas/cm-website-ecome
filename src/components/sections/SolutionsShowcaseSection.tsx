"use client";

// Solutions showcase — a single spatial composition.
//
// Not a grid of cards. Not a system diagram with abstract glyphs.
// One scene — every solution shown running on its actual device,
// arranged the way they'd live around a real counter: back-office
// laptop on a back shelf, KDS mounted above, customer display
// facing out, TPE on the till, handhelds in motion, phones in hand.
//
// Floating hairline labels with thin brand-red connector dots name
// each surface without imposing chrome. The composition itself does
// the explaining — typography is intentionally minimal.
//
// Implementation: one SVG composition with embedded raster product
// photos + SVG-drawn device frames for the surfaces we don't have
// hardware photography for. Scales cleanly to any width via viewBox.

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Button } from "@/components/ui/Button";

const CTA_HREF = "/support#contact" as const;

// ─── Section ─────────────────────────────────────────────────────

export function SolutionsShowcaseSection() {
  const t = useTranslations("home.solutions");
  return (
    <section
      data-scheme="light"
      className="relative bg-fog overflow-hidden"
    >
      <SectionDivider scheme="light" />

      {/* Ambient lighting behind the scene */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[80%] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 38%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      {/* Header */}
      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10 pt-28 md:pt-40 pb-10 md:pb-14 text-center">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-mute mb-4">
            {t("eyebrow")}
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="text-[clamp(1.875rem,4vw,3rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink"
            style={{ textWrap: "balance" }}
          >
            {t("headline")}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 text-[16px] md:text-[17px] leading-[1.55] text-ink-soft max-w-[34rem] mx-auto">
            {t("subtitle")}
          </p>
        </Reveal>
      </div>

      {/* Compact masonry — every solution visible in one
          viewport with varied card sizes for visual rhythm. */}
      <SharedSvgDefs />
      {/* Full-width masonry — no max-width constraint, minimal side
          padding. The grid spans the full viewport so the ecosystem
          reads as expansive rather than boxed-in. */}
      <div className="relative w-full px-4 sm:px-5 lg:px-6 pb-8 md:pb-10">
        <Reveal>
          <MasonryGrid />
        </Reveal>
      </div>

      {/* Footer */}
      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10 pb-20 md:pb-28 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-3">
            <Button href={CTA_HREF} variant="primary" size="lg">
              {t("ctaPrimary")}
            </Button>
            <Button href="/shop" variant="ghost" size="lg">
              {t("ctaSecondary")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Shared SVG defs — gradients + clip paths used by every
//     device SVG, defined once so every card SVG references them
//     without per-card duplication.

function SharedSvgDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
      aria-hidden
    >
      <defs>
        <radialGradient id="floor-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#1d1d1f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="screen-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="hero-halo" cx="0.5" cy="0.55" r="0.7">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#fbe5e8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fbe5e8" stopOpacity="0" />
        </radialGradient>
        <clipPath id="clip-macbook">
          <rect x="40" y="14" width="280" height="170" rx="3" />
        </clipPath>
        <clipPath id="clip-kds-tablet">
          <rect x="14" y="16" width="298" height="200" rx="6" />
        </clipPath>
        <clipPath id="clip-stock-tablet">
          <rect x="12" y="12" width="240" height="158" rx="5" />
        </clipPath>
        <clipPath id="clip-customer-vert">
          <rect x="10" y="14" width="124" height="186" rx="5" />
        </clipPath>
        <clipPath id="clip-queue-display">
          <rect x="12" y="14" width="150" height="208" rx="5" />
        </clipPath>
        <clipPath id="clip-iphone">
          <rect x="8" y="10" width="100" height="208" rx="14" />
        </clipPath>
        <clipPath id="clip-mobile-app">
          <rect x="8" y="10" width="114" height="240" rx="14" />
        </clipPath>
        <clipPath id="clip-kiosk">
          <rect x="32" y="52" width="136" height="506" rx="4" />
        </clipPath>
      </defs>
    </svg>
  );
}

// ─── Masonry grid — fits in viewport
//
// 6 columns × 3 rows = 18 cells, fully packed with 12 cards of
// varied spans. POS Software is the 2×2 hero, Self-Order Kiosk is
// a 1×2 tall portrait, Back Office and Kitchen Display are 2×1
// wide landscape cards, and the remaining 8 solutions are clean
// 1×1 tiles. `grid-auto-flow: dense` packs cells so there are no
// gaps. With 180px rows the entire grid is ~564px tall — fits in
// one viewport with the header and footer.

function MasonryGrid() {
  const t = useTranslations("home.solutions.cards");
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      style={{
        gridAutoRows: "180px",
        gridAutoFlow: "dense",
      }}
    >
      {/* Strict palette: cool grays + a single light-blue emphasis
          on POS (the only "blue" card in the composition). Two
          deep-slate accents (Self-Order Kiosk, Queue Management)
          anchor the rhythm. No yellow, no green, no warm tones,
          no saturated brand-color tints. */}

      {/* 01 · Self-Order Kiosk · 1×2 tall — anchors the left column.
          Uses the real Heron 1 product photo (the kiosk we actually
          sell on /shop) so the kiosk reads as a true hardware product
          alongside the POS, not a generic SVG illustration. Same
          hardware family as the Swan POS, so the visual continuity
          between solutions reinforces "one connected platform." */}
      <SolutionCard
        title={t("kiosk")}
        spanClass="lg:row-span-2"
        layout="tall"
        background="linear-gradient(180deg, #f3f5f8 0%, #e1e5ec 100%)"
        textTone="ink"
        visual={
          <div className="relative w-full h-full flex items-center justify-center px-2">
            <Image
              src="/hardware/heron-1.webp"
              alt="Heron 1 self-order kiosk — real product photo of the floor-standing customer terminal we ship for café and fast-food deployments"
              width={1000}
              height={1000}
              sizes="(min-width: 1024px) 220px, 45vw"
              className="object-contain w-auto h-full max-h-[500px]"
              style={{
                filter:
                  "drop-shadow(0 28px 44px rgba(20,25,35,0.22)) drop-shadow(0 6px 12px rgba(0,0,0,0.06))",
              }}
              priority={false}
            />
          </div>
        }
      />

      {/* 02 · POS Software · 2×2 HERO — only light-blue tinted card.
          Moved one slot right so it lands at cols 2–3 (central) rather
          than top-left corner, giving the core solution more visual
          weight in the composition. */}
      <SolutionCard
        title={t("pos")}
        description={t("posDesc")}
        spanClass="lg:col-span-2 lg:row-span-2"
        layout="hero"
        background="linear-gradient(160deg, #ffffff 0%, #f0f5fa 55%, #dbe6f2 100%)"
        textTone="ink"
        accent
        visual={
          <CardSvg viewBox="0 0 280 360">
            <HeroPos x={10} y={10} />
          </CardSvg>
        }
      />

      {/* 03 · Back Office · 2×1 wide — cool light gray */}
      <SolutionCard
        title={t("backOffice")}
        description={t("backOfficeDesc")}
        spanClass="lg:col-span-2"
        layout="wide"
        background="linear-gradient(180deg, #f4f6f9 0%, #e5e9ee 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 360 240">
            <DeviceMacBook x={20} y={10} />
          </CardSvg>
        }
      />

      {/* 04 · Mobile Application · 1×1 — neutral white-gray */}
      <SolutionCard
        title={t("mobileApp")}
        layout="standard"
        background="linear-gradient(180deg, #fafbfc 0%, #ecedf0 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 150 280">
            <DeviceMobileAppPhone x={10} y={10} />
          </CardSvg>
        }
      />

      {/* 05 · Kitchen Display · 2×1 wide — slate gray */}
      <SolutionCard
        title={t("kds")}
        description={t("kdsDesc")}
        spanClass="lg:col-span-2"
        layout="wide"
        background="linear-gradient(180deg, #eef0f3 0%, #dde0e5 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 360 240">
            <DeviceKdsTablet
              x={20}
              y={10}
              uiSrc="/mockups/kds-light.png"
            />
          </CardSvg>
        }
      />

      {/* 06 · Customer Display · 1×1 — light gray */}
      <SolutionCard
        title={t("customerDisplay")}
        layout="standard"
        background="linear-gradient(180deg, #f5f6f8 0%, #e3e5ea 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 160 230">
            <DeviceCustomerVertical x={8} y={8} />
          </CardSvg>
        }
      />

      {/* 07 · Queue Management · 1×1 — moved earlier in the dense
          flow so Stock Management lands closer to the POS-adjacent
          slots, reinforcing its operational link to the core till. */}
      <SolutionCard
        title={t("queue")}
        layout="standard"
        background="linear-gradient(180deg, #f4f6f9 0%, #e3e7ed 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 190 250">
            <DeviceQueueDisplay x={8} y={10} />
          </CardSvg>
        }
      />

      {/* 08 · Online Ordering · 1×1 — soft blue-gray */}
      <SolutionCard
        title={t("onlineOrdering")}
        layout="standard"
        background="linear-gradient(180deg, #eef2f7 0%, #d6dde6 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 150 280">
            <DeviceIphone
              x={10}
              y={10}
              uiSrc="/mockups/mobile-delivery.png"
            />
          </CardSvg>
        }
      />

      {/* 09 · Stock Management · 1×1 — cool gray */}
      <SolutionCard
        title={t("stock")}
        layout="standard"
        background="linear-gradient(180deg, #f1f3f6 0%, #dfe2e7 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 280 200">
            <DeviceStockTablet x={8} y={10} />
          </CardSvg>
        }
      />

      {/* 10 · Payment Terminal · 1×1 — neutral gray */}
      <SolutionCard
        title={t("paymentTerminal")}
        layout="standard"
        background="linear-gradient(180deg, #f4f5f7 0%, #e2e4e8 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 100 210">
            <DevicePaymentTerminalSvg x={10} y={10} />
          </CardSvg>
        }
      />

      {/* 11 · QR Menu · 1×1 — paper white */}
      <SolutionCard
        title={t("qrMenu")}
        layout="standard"
        background="linear-gradient(180deg, #fbfbfc 0%, #eaecf0 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 200 130">
            <QrMenuCard x={20} y={15} />
          </CardSvg>
        }
      />

      {/* 12 · Time & Attendance · 1×1 — workforce management module.
          Renamed from "Time Tracking" so the surface reads as the
          full HR/payroll companion (shift starts/ends, breaks, leave,
          attendance reports) rather than just a clock-punch tool. */}
      <SolutionCard
        title={t("timeAttendance")}
        layout="standard"
        background="linear-gradient(180deg, #f5f7fa 0%, #e1e5eb 100%)"
        textTone="ink"
        visual={
          <CardSvg viewBox="0 0 150 250">
            <DeviceTimePhone x={15} y={10} />
          </CardSvg>
        }
      />
    </div>
  );
}

// ─── Solution card — layouts adjust to card span:
//   • hero     (2×2): big visual top, title + desc bottom
//   • tall     (1×2): full-height visual, title at bottom
//   • wide     (2×1): visual left, title + desc right
//   • standard (1×1): compact visual top, title bottom

type CardLayout = "hero" | "tall" | "wide" | "standard";

function SolutionCard({
  title,
  description,
  spanClass = "",
  layout,
  background,
  textTone,
  accent = false,
  visual,
}: {
  title: string;
  description?: string;
  spanClass?: string;
  layout: CardLayout;
  background: string;
  textTone: "ink" | "paper";
  accent?: boolean;
  visual: React.ReactNode;
}) {
  const isDark = textTone === "paper";
  const titleColor = isDark ? "text-paper" : "text-ink";
  const descColor = isDark ? "text-paper/60" : "text-ink-soft";

  // Different layouts arrange visual + text differently
  if (layout === "wide") {
    return (
      <CardShell spanClass={spanClass} background={background} isDark={isDark}>
        <div className="relative h-full flex items-center gap-4 px-5 md:px-7">
          <div className="relative flex-1 h-full flex items-center justify-center min-w-0">
            {visual}
          </div>
          <div className="relative flex-1 min-w-0">
            <h3
              className={
                "text-[clamp(1.4rem,2vw,2rem)] font-bold tracking-[-0.028em] leading-[1.05] " +
                titleColor
              }
            >
              {title}
            </h3>
            {description && (
              <p
                className={
                  "mt-2 text-[12px] md:text-[13px] leading-[1.45] " + descColor
                }
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </CardShell>
    );
  }

  // hero / tall / standard share a top-visual, bottom-text shape.
  // Apple-editorial typography: heavy weights, tight tracking,
  // generous size variance per layout. Titles read as product
  // statements, not labels.
  const titleSize = accent
    ? // POS HERO — display-size, dominates the composition.
      "text-[clamp(2rem,3.2vw,3.25rem)]"
    : layout === "tall"
      ? "text-[clamp(1.4rem,1.8vw,1.85rem)]"
      : layout === "standard"
        ? "text-[clamp(1rem,1.2vw,1.2rem)]"
        : "text-[clamp(1.4rem,1.8vw,1.85rem)]";
  const titleTracking = accent
    ? "tracking-[-0.035em]"
    : "tracking-[-0.022em]";
  const titleLeading = accent ? "leading-[0.98]" : "leading-[1.08]";

  return (
    <CardShell spanClass={spanClass} background={background} isDark={isDark}>
      <div className="relative h-full flex flex-col">
        <div className="relative flex-1 flex items-center justify-center px-3 pt-3 pb-1 min-h-0">
          {visual}
        </div>
        <div
          className={
            "relative px-4 md:px-5 " +
            (layout === "standard" ? "pb-3 pt-1" : "pb-5 md:pb-6 pt-1")
          }
        >
          <h3
            className={
              titleSize +
              " font-bold " +
              titleTracking +
              " " +
              titleLeading +
              " " +
              titleColor +
              (layout === "standard" ? " text-center" : "")
            }
          >
            {title}
          </h3>
          {description && layout !== "standard" && (
            <p
              className={
                (accent
                  ? "mt-3 text-[14px] md:text-[15px] leading-[1.45] max-w-[26ch] "
                  : "mt-2 text-[12px] md:text-[13px] leading-[1.45] ") +
                descColor
              }
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </CardShell>
  );
}

function CardShell({
  spanClass,
  background,
  children,
}: {
  spanClass: string;
  background: string;
  /** Retained on the public type for backwards-compat with callers
      that still pass it; ignored internally. All cards now share the
      same unified light surface treatment. */
  isDark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={"relative overflow-hidden " + spanClass}
      style={{ background }}
    >
      {children}
    </article>
  );
}

// ─── CardSvg — wraps a device in a properly-sized SVG that
//     scales to fit the card's visual area while preserving
//     aspect ratio.

function CardSvg({
  viewBox,
  children,
}: {
  viewBox: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className="w-auto h-full max-h-full max-w-full"
    >
      {children}
    </svg>
  );
}

// ─── Hero POS terminal (Swan photo) ─────────────────────────────

function HeroPos({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* No halo — Apple-style restraint. The POS reads as the
          hero via size + label weight + drop shadow alone, not via
          a colored ambient that competes with the composition. */}
      {/* Floor shadow */}
      <ellipse
        cx={x + 130}
        cy={y + 332}
        rx="148"
        ry="22"
        fill="url(#floor-shadow)"
      />
      <image
        href="/hardware/swan-1-gen-2.webp"
        x={x}
        y={y}
        width="260"
        height="340"
        preserveAspectRatio="xMidYMid meet"
        style={{
          filter: "drop-shadow(0 36px 60px rgba(110,85,95,0.32))",
        }}
      />
    </g>
  );
}

// ─── MacBook (Back Office) — purpose-built dashboard UI ──────────
//
// Renders a clean analytics dashboard inside the MacBook screen
// (KPI strip + weekly revenue bar chart + top products + recent
// transactions). No raster image — every pixel is intentional, so
// the device reads unambiguously as the Back Office.

function DeviceMacBook({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Floor shadow */}
      <ellipse cx="180" cy="220" rx="160" ry="14" fill="url(#floor-shadow)" />
      {/* Lid */}
      <rect
        x="20"
        y="0"
        width="320"
        height="200"
        rx="10"
        fill="#1d1d1f"
        style={{
          filter: "drop-shadow(0 18px 28px rgba(20,25,35,0.22))",
        }}
      />
      {/* Screen (white surface for the dashboard) */}
      <rect x="36" y="10" width="288" height="178" rx="5" fill="#ffffff" />

      {/* Dashboard UI */}
      <g clipPath="url(#clip-macbook)">
        {/* Top nav strip */}
        <rect x="40" y="14" width="280" height="20" fill="#fafafc" />
        <circle cx="50" cy="24" r="4" fill="#E11D2A" />
        <text
          x="58"
          y="27"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="6.5"
          fill="#1d1d1f"
          fontWeight="700"
          letterSpacing="-0.15"
        >
          Caisse Manager
        </text>
        <text
          x="58"
          y="32.4"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="3.4"
          fill="#9aa0a6"
          letterSpacing="0.4"
        >
          Overview · Today
        </text>
        {/* Sidebar icons */}
        <g fill="#9aa0a6">
          {[170, 184, 198, 212, 226, 240].map((cx) => (
            <circle key={cx} cx={cx} cy="24" r="1.4" />
          ))}
        </g>
        {/* Avatar */}
        <circle cx="310" cy="24" r="5" fill="#E11D2A" />
        <text
          x="310"
          y="26"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="4.5"
          fill="#ffffff"
          fontWeight="700"
          textAnchor="middle"
        >
          AI
        </text>

        {/* KPI strip — 4 tiles */}
        {[
          { label: "REVENUE", value: "48,240", unit: "MAD", trend: "+12%" },
          { label: "ORDERS", value: "1,284", unit: "this wk", trend: "+8%" },
          { label: "AVG TICKET", value: "67", unit: "MAD", trend: "+3%" },
          { label: "RETURN %", value: "0.9", unit: "%", trend: "−0.4%" },
        ].map((k, i) => {
          const kx = 44 + i * 70;
          return (
            <g key={k.label}>
              <rect
                x={kx}
                y="42"
                width="64"
                height="36"
                rx="3"
                fill="#fafafc"
                stroke="#eef0f3"
                strokeWidth="0.4"
              />
              <text
                x={kx + 4}
                y="50"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="3.4"
                fill="#9aa0a6"
                fontWeight="700"
                letterSpacing="0.5"
              >
                {k.label}
              </text>
              <text
                x={kx + 4}
                y="64"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="11"
                fill="#1d1d1f"
                fontWeight="700"
                letterSpacing="-0.4"
              >
                {k.value}
              </text>
              <text
                x={kx + 4}
                y="72"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="3.4"
                fill="#6e6e73"
              >
                {k.unit}
              </text>
              {/* Trend badge */}
              <rect
                x={kx + 44}
                y="46"
                width="16"
                height="6"
                rx="1.5"
                fill={k.trend.startsWith("−") ? "#fff3eb" : "#eefaf3"}
              />
              <text
                x={kx + 52}
                y="50.5"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="3.4"
                fill={k.trend.startsWith("−") ? "#a64418" : "#1f7a59"}
                fontWeight="700"
                textAnchor="middle"
              >
                {k.trend}
              </text>
            </g>
          );
        })}

        {/* Chart area + side list */}
        {/* Bar chart */}
        <rect x="44" y="84" width="178" height="84" rx="3" fill="#fafafc" stroke="#eef0f3" strokeWidth="0.4" />
        <text
          x="48"
          y="94"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="3.6"
          fill="#9aa0a6"
          fontWeight="700"
          letterSpacing="0.4"
        >
          REVENUE · LAST 7 DAYS
        </text>
        {/* Bars */}
        {[
          { d: "Mon", h: 30 },
          { d: "Tue", h: 42 },
          { d: "Wed", h: 36 },
          { d: "Thu", h: 50 },
          { d: "Fri", h: 64 },
          { d: "Sat", h: 56 },
          { d: "Sun", h: 28 },
        ].map((bar, i) => {
          const bx = 50 + i * 24;
          const by = 158 - bar.h;
          return (
            <g key={bar.d}>
              <rect
                x={bx}
                y={by}
                width="14"
                height={bar.h}
                rx="1.5"
                fill={i === 4 ? "#E11D2A" : "#1d1d1f"}
                fillOpacity={i === 4 ? "0.9" : "0.85"}
              />
              <text
                x={bx + 7}
                y="166"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="3.4"
                fill="#9aa0a6"
                textAnchor="middle"
                fontWeight="600"
              >
                {bar.d}
              </text>
            </g>
          );
        })}

        {/* Side list — top products */}
        <rect x="226" y="84" width="92" height="84" rx="3" fill="#fafafc" stroke="#eef0f3" strokeWidth="0.4" />
        <text
          x="230"
          y="94"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="3.6"
          fill="#9aa0a6"
          fontWeight="700"
          letterSpacing="0.4"
        >
          TOP PRODUCTS
        </text>
        {[
          { name: "Cappuccino", sales: "124" },
          { name: "Croissant", sales: "98" },
          { name: "Espresso", sales: "84" },
          { name: "Tagine", sales: "42" },
        ].map((p, i) => {
          const py = 104 + i * 14;
          return (
            <g key={p.name}>
              <text
                x="230"
                y={py + 6}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="4.4"
                fill="#1d1d1f"
                fontWeight="600"
              >
                {p.name}
              </text>
              <text
                x="314"
                y={py + 6}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="4.4"
                fill="#9aa0a6"
                fontWeight="700"
                textAnchor="end"
              >
                {p.sales}
              </text>
            </g>
          );
        })}
      </g>

      {/* Screen glare */}
      <rect
        x="36"
        y="10"
        width="288"
        height="178"
        rx="5"
        fill="url(#screen-glass)"
      />
      {/* Camera dot */}
      <circle cx="180" cy="6" r="1.2" fill="#3a3a3f" />
      {/* Hinge / base */}
      <path
        d="M 5 200 L 355 200 L 348 212 Q 348 216 344 216 L 16 216 Q 12 216 12 212 Z"
        fill="#c9ccd1"
      />
      <rect x="148" y="200" width="64" height="2.2" rx="1" fill="#a8acb3" />
    </g>
  );
}

// ─── KDS landscape tablet ───────────────────────────────────────

function DeviceKdsTablet({
  x,
  y,
  uiSrc,
}: {
  x: number;
  y: number;
  uiSrc: string;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Wall mount line */}
      <line
        x1="155"
        y1="0"
        x2="155"
        y2="14"
        stroke="#c9ccd1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="155" cy="2" r="2.5" fill="#a8acb3" />
      {/* Body */}
      <rect
        x="0"
        y="6"
        width="326"
        height="220"
        rx="10"
        fill="#1d1d1f"
        style={{
          filter: "drop-shadow(0 22px 36px rgba(20,25,35,0.22))",
        }}
      />
      {/* Screen */}
      <rect x="14" y="16" width="298" height="200" rx="6" fill="#0a0b0d" />
      <image
        href={uiSrc}
        x="14"
        y="16"
        width="298"
        height="200"
        preserveAspectRatio="xMidYMid slice"
        clipPath="url(#clip-kds-tablet)"
      />
      {/* Glare */}
      <rect
        x="14"
        y="16"
        width="298"
        height="200"
        rx="6"
        fill="url(#screen-glass)"
      />
      {/* Camera */}
      <circle cx="163" cy="11" r="1.4" fill="#3a3a3f" />
    </g>
  );
}

// ─── Stock landscape tablet ─────────────────────────────────────

function DeviceStockTablet({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Floor shadow */}
      <ellipse cx="132" cy="190" rx="120" ry="12" fill="url(#floor-shadow)" />
      {/* Body */}
      <rect
        x="0"
        y="0"
        width="264"
        height="180"
        rx="9"
        fill="#1d1d1f"
        style={{
          filter: "drop-shadow(0 18px 28px rgba(20,25,35,0.20))",
        }}
      />
      <rect x="12" y="12" width="240" height="158" rx="5" fill="#ffffff" />

      {/* Inventory UI — purpose-built, no shared backoffice image. */}
      <g clipPath="url(#clip-stock-tablet)">
        {/* Header */}
        <rect x="12" y="12" width="240" height="20" fill="#fafafc" />
        <text
          x="20"
          y="25"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="7"
          fill="#1d1d1f"
          fontWeight="700"
          letterSpacing="-0.15"
        >
          Inventory
        </text>
        <text
          x="20"
          y="29.8"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="3.6"
          letterSpacing="0.6"
          fill="#6e6e73"
        >
          218 SKUs · 4 low
        </text>
        {/* Search pill */}
        <rect x="170" y="16" width="74" height="12" rx="6" fill="#f1f1f3" />
        <circle cx="178" cy="22" r="2" stroke="#6e6e73" strokeWidth="0.7" fill="none" />
        <line x1="180" y1="24" x2="182" y2="26" stroke="#6e6e73" strokeWidth="0.7" />
        <text x="186" y="24" fontFamily="system-ui, -apple-system, sans-serif" fontSize="4" fill="#9aa0a6">
          Search SKU
        </text>

        {/* Column header */}
        <line x1="20" y1="38" x2="244" y2="38" stroke="#e5e7eb" strokeWidth="0.6" />
        <g fontFamily="system-ui, -apple-system, sans-serif" fontSize="3.6" fill="#9aa0a6" letterSpacing="0.5" fontWeight="600">
          <text x="20" y="46">PRODUCT</text>
          <text x="156" y="46">ON HAND</text>
          <text x="204" y="46">STATUS</text>
        </g>

        {/* Row template */}
        {[
          { name: "Espresso beans · 1kg", sku: "BEAN-001", qty: "48", status: "ok" },
          { name: "Milk, whole · 1L", sku: "MILK-WHL", qty: "6", status: "low" },
          { name: "Cardboard cups · 12oz", sku: "CUP-12OZ", qty: "320", status: "ok" },
          { name: "Croissant butter", sku: "CROI-BTR", qty: "2", status: "low" },
          { name: "Tagine clay pot", sku: "TGN-CLY", qty: "12", status: "ok" },
        ].map((r, i) => {
          const ry = 52 + i * 20;
          return (
            <g key={r.sku}>
              {i % 2 === 1 && (
                <rect x="14" y={ry - 4} width="236" height="18" fill="#fafafc" />
              )}
              <text
                x="20"
                y={ry + 5}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="4.6"
                fill="#1d1d1f"
                fontWeight="600"
              >
                {r.name}
              </text>
              <text
                x="20"
                y={ry + 11}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="3.4"
                fill="#9aa0a6"
                letterSpacing="0.3"
              >
                {r.sku}
              </text>
              <text
                x="170"
                y={ry + 7}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="6"
                fill="#1d1d1f"
                fontWeight="700"
                textAnchor="middle"
              >
                {r.qty}
              </text>
              {/* Status pill */}
              <rect
                x="200"
                y={ry + 1}
                width="34"
                height="8"
                rx="2"
                fill={r.status === "low" ? "#fff3eb" : "#eefaf3"}
              />
              <circle
                cx="206"
                cy={ry + 5}
                r="1.4"
                fill={r.status === "low" ? "#E11D2A" : "#34a17b"}
              />
              <text
                x="210"
                y={ry + 6.6}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="3.6"
                fill={r.status === "low" ? "#a64418" : "#1f7a59"}
                fontWeight="700"
                letterSpacing="0.3"
              >
                {r.status === "low" ? "LOW" : "HEALTHY"}
              </text>
            </g>
          );
        })}
      </g>

      <rect
        x="12"
        y="12"
        width="240"
        height="158"
        rx="5"
        fill="url(#screen-glass)"
      />
      <circle cx="132" cy="7" r="1.3" fill="#3a3a3f" />
    </g>
  );
}

// ─── Customer-facing vertical tablet ────────────────────────────

function DeviceCustomerVertical({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Stand */}
      <rect x="58" y="216" width="28" height="6" rx="2" fill="#c9ccd1" />
      <rect x="65" y="200" width="14" height="18" fill="#dde0e6" />
      {/* Body */}
      <rect
        x="0"
        y="0"
        width="144"
        height="210"
        rx="9"
        fill="#1d1d1f"
        style={{
          filter: "drop-shadow(0 18px 28px rgba(20,25,35,0.22))",
        }}
      />
      <rect x="10" y="14" width="124" height="186" rx="5" fill="#ffffff" />
      <g clipPath="url(#clip-customer-vert)">
        {/* Customer display UI — mock */}
        <rect x="10" y="14" width="124" height="20" fill="#fdf6ef" />
        <circle cx="22" cy="24" r="4" fill="#E11D2A" opacity="0.9" />
        <rect x="30" y="20" width="48" height="3" rx="1.5" fill="#1d1d1f" />
        <rect x="30" y="26" width="36" height="2.5" rx="1.25" fill="#6e6e73" />
        {/* Items */}
        <g
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5.5"
          fill="#1d1d1f"
        >
          <text x="14" y="50">Cappuccino</text>
          <text x="14" y="64">Croissant</text>
          <text x="14" y="78">Mineral water</text>
        </g>
        <g
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5.5"
          fill="#6e6e73"
          textAnchor="end"
        >
          <text x="130" y="50">28.00</text>
          <text x="130" y="64">14.00</text>
          <text x="130" y="78">8.00</text>
        </g>
        <line x1="14" y1="84" x2="130" y2="84" stroke="#e5e7eb" />
        {/* Total */}
        <text
          x="14"
          y="98"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="6.5"
          fill="#1d1d1f"
          fontWeight="600"
        >
          Total
        </text>
        <text
          x="130"
          y="98"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="9"
          fill="#1d1d1f"
          fontWeight="700"
          textAnchor="end"
        >
          50 MAD
        </text>
        {/* CTA */}
        <rect x="16" y="112" width="112" height="12" rx="3" fill="#1d1d1f" />
        <text
          x="72"
          y="120"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5.5"
          fill="#ffffff"
          fontWeight="600"
          textAnchor="middle"
        >
          Thank you
        </text>
        {/* Loyalty strip — relevant info instead of decorative dots */}
        <rect x="16" y="132" width="112" height="44" rx="3" fill="#fff8f4" stroke="#fde2cf" strokeWidth="0.4" />
        <text
          x="22"
          y="142"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="4"
          letterSpacing="0.8"
          fill="#6e6e73"
          fontWeight="700"
        >
          LOYALTY
        </text>
        <text
          x="22"
          y="156"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="9.5"
          fill="#E11D2A"
          fontWeight="700"
          letterSpacing="-0.2"
        >
          +5 points
        </text>
        <text
          x="22"
          y="168"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="4.4"
          fill="#6e6e73"
        >
          23 total earned
        </text>
        {/* Stamp dots — visualize loyalty progress (5 of 10) */}
        <g>
          {Array.from({ length: 10 }).map((_, i) => (
            <circle
              key={i}
              cx={80 + (i % 5) * 9.5}
              cy={i < 5 ? 154 : 167}
              r="2.4"
              fill={i < 5 ? "#E11D2A" : "#fce4d4"}
            />
          ))}
        </g>
      </g>
      <rect
        x="10"
        y="14"
        width="124"
        height="186"
        rx="5"
        fill="url(#screen-glass)"
      />
      <circle cx="72" cy="7" r="1.2" fill="#3a3a3f" />
    </g>
  );
}

// ─── Queue Management vertical display ──────────────────────────

function DeviceQueueDisplay({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="0"
        y="0"
        width="174"
        height="234"
        rx="10"
        fill="#1d1d1f"
        style={{
          filter: "drop-shadow(0 18px 30px rgba(20,25,35,0.22))",
        }}
      />
      <rect x="12" y="14" width="150" height="208" rx="5" fill="#0a1320" />
      <g clipPath="url(#clip-queue-display)">
        {/* Header band */}
        <rect x="12" y="14" width="150" height="22" fill="#152033" />
        <text
          x="20"
          y="28"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5.8"
          letterSpacing="1.2"
          fill="#7e8bab"
          fontWeight="700"
        >
          NOW SERVING
        </text>
        <circle cx="152" cy="25" r="2.2" fill="#E11D2A">
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Big number */}
        <text
          x="87"
          y="105"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="52"
          fill="#ffffff"
          fontWeight="800"
          textAnchor="middle"
          letterSpacing="-2"
        >
          A-42
        </text>
        {/* Up next */}
        <text
          x="20"
          y="140"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5.4"
          letterSpacing="1.2"
          fill="#7e8bab"
          fontWeight="700"
        >
          UP NEXT
        </text>
        <g
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fill="#cdd5e6"
          fontWeight="600"
        >
          <text x="20" y="160">A-43</text>
          <text x="56" y="160">A-44</text>
          <text x="92" y="160">A-45</text>
          <text x="128" y="160">A-46</text>
        </g>
        <g
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fill="#cdd5e6"
          fontWeight="600"
        >
          <text x="20" y="180">A-47</text>
          <text x="56" y="180">A-48</text>
          <text x="92" y="180">A-49</text>
        </g>
        {/* Footer band */}
        <rect x="12" y="196" width="150" height="26" fill="#152033" />
        <text
          x="87"
          y="212"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="6"
          fill="#7e8bab"
          textAnchor="middle"
          letterSpacing="1.4"
          fontWeight="600"
        >
          Caisse Manager
        </text>
      </g>
      <rect
        x="12"
        y="14"
        width="150"
        height="208"
        rx="5"
        fill="url(#screen-glass)"
      />
    </g>
  );
}

// ─── Mobile Application — smartphone with manager dashboard ──────

function DeviceMobileAppPhone({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Floor shadow */}
      <ellipse cx="65" cy="278" rx="76" ry="10" fill="url(#floor-shadow)" />
      {/* Phone body */}
      <rect
        x="0"
        y="0"
        width="130"
        height="262"
        rx="22"
        fill="#1d1d1f"
        style={{
          filter: "drop-shadow(0 22px 38px rgba(40,50,70,0.28))",
        }}
      />
      <rect x="6" y="8" width="118" height="246" rx="16" fill="#ffffff" />
      <g clipPath="url(#clip-mobile-app)">
        {/* Status bar */}
        <text
          x="16"
          y="18"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="4"
          fill="#1d1d1f"
          fontWeight="600"
        >
          09:41
        </text>
        {/* Notch */}
        <rect x="54" y="11" width="22" height="6" rx="3" fill="#1d1d1f" />
        {/* Signal cluster (right of notch) */}
        <g fill="#1d1d1f">
          <rect x="92" y="14" width="1.6" height="3.6" rx="0.4" />
          <rect x="95" y="13" width="1.6" height="4.6" rx="0.4" />
          <rect x="98" y="12" width="1.6" height="5.6" rx="0.4" />
        </g>

        {/* Greeting */}
        <text
          x="16"
          y="34"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="4.2"
          letterSpacing="1.2"
          fill="#6e6e73"
          fontWeight="700"
        >
          GOOD MORNING
        </text>
        <text
          x="16"
          y="48"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="11"
          fill="#1d1d1f"
          fontWeight="700"
          letterSpacing="-0.3"
        >
          Aymane
        </text>

        {/* Live indicator */}
        <g>
          <rect x="80" y="38" width="38" height="11" rx="5.5" fill="#fff3f4" />
          <circle cx="86" cy="43.5" r="2" fill="#E11D2A">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <text
            x="91"
            y="46"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="4.2"
            fill="#a8161f"
            fontWeight="700"
            letterSpacing="0.4"
          >
            LIVE
          </text>
        </g>

        {/* KPI tiles 2x2 */}
        {[
          { x: 16, y: 56, label: "REVENUE", value: "12.4k", unit: "MAD" },
          { x: 70, y: 56, label: "ORDERS", value: "184", unit: "today" },
          { x: 16, y: 96, label: "AVG TICKET", value: "67", unit: "MAD" },
          { x: 70, y: 96, label: "RETURN %", value: "1.2", unit: "%" },
        ].map((k) => (
          <g key={k.label}>
            <rect x={k.x} y={k.y} width="48" height="32" rx="4" fill="#fafafc" />
            <text
              x={k.x + 4}
              y={k.y + 9}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="3.4"
              letterSpacing="0.6"
              fill="#9aa0a6"
              fontWeight="700"
            >
              {k.label}
            </text>
            <text
              x={k.x + 4}
              y={k.y + 22}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="10"
              fill="#1d1d1f"
              fontWeight="700"
              letterSpacing="-0.3"
            >
              {k.value}
            </text>
            <text
              x={k.x + 4}
              y={k.y + 29}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="3.4"
              fill="#6e6e73"
            >
              {k.unit}
            </text>
          </g>
        ))}

        {/* Sparkline mini chart */}
        <rect x="16" y="136" width="102" height="38" rx="4" fill="#fafafc" />
        <text
          x="20"
          y="146"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="3.4"
          letterSpacing="0.6"
          fill="#9aa0a6"
          fontWeight="700"
        >
          SALES — LAST 7 DAYS
        </text>
        <polyline
          points="20,168 32,164 44,165 56,158 68,160 80,151 92,154 104,148 114,142"
          fill="none"
          stroke="#E11D2A"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="114" cy="142" r="1.4" fill="#E11D2A" />

        {/* Recent orders header */}
        <text
          x="16"
          y="186"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="3.6"
          letterSpacing="0.6"
          fill="#9aa0a6"
          fontWeight="700"
        >
          RECENT
        </text>
        {/* Recent rows */}
        {[
          { ord: "#A-1042", item: "Cappuccino · Croissant", amt: "42.00" },
          { ord: "#A-1041", item: "Tagine · Mineral water", amt: "138.00" },
          { ord: "#A-1040", item: "Espresso x2", amt: "30.00" },
        ].map((r, i) => {
          const ry = 192 + i * 14;
          return (
            <g key={r.ord}>
              <text
                x="16"
                y={ry + 6}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="4.2"
                fill="#1d1d1f"
                fontWeight="600"
              >
                {r.ord}
              </text>
              <text
                x="16"
                y={ry + 11.5}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="3.4"
                fill="#9aa0a6"
              >
                {r.item}
              </text>
              <text
                x="114"
                y={ry + 8.5}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="4.4"
                fill="#1d1d1f"
                fontWeight="700"
                textAnchor="end"
              >
                {r.amt}
              </text>
            </g>
          );
        })}

        {/* Home indicator */}
        <rect x="46" y="244" width="38" height="2" rx="1" fill="#dde1e6" />
      </g>
      {/* Screen glare */}
      <rect
        x="6"
        y="8"
        width="118"
        height="246"
        rx="16"
        fill="url(#screen-glass)"
      />
    </g>
  );
}

// ─── Payment Terminal — custom SVG card reader ──────────────────
//
// A purpose-built TPE silhouette: card slot at top, NFC contactless
// zone at the screen, 12-key keypad, paper-roll printer slot. No
// ambiguity with a small POS — this clearly reads as a card reader.

function DevicePaymentTerminalSvg({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Floor shadow */}
      <ellipse cx="40" cy="186" rx="58" ry="9" fill="url(#floor-shadow)" />

      {/* Card slot at the very top — the slim insert opening */}
      <rect x="6" y="0" width="68" height="3" rx="1" fill="#0a0a0c" />

      {/* Printer / paper feed slot just below */}
      <rect x="14" y="6" width="52" height="2" rx="1" fill="#2a2c30" />

      {/* Main body */}
      <rect
        x="0"
        y="10"
        width="80"
        height="174"
        rx="6"
        fill="#1d1d1f"
        style={{ filter: "drop-shadow(0 18px 32px rgba(40,30,40,0.30))" }}
      />

      {/* Display panel */}
      <rect x="6" y="16" width="68" height="48" rx="3" fill="#0e1722" />
      {/* Amount on screen */}
      <text
        x="40"
        y="34"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="5"
        fill="#7e8bab"
        letterSpacing="1"
        fontWeight="600"
      >
        AMOUNT
      </text>
      <text
        x="40"
        y="51"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="14"
        fill="#ffffff"
        fontWeight="700"
        letterSpacing="-0.3"
      >
        142.00
      </text>
      <text
        x="40"
        y="60"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="4.4"
        fill="#7e8bab"
        letterSpacing="1"
        fontWeight="600"
      >
        MAD · TAP TO PAY
      </text>

      {/* NFC contactless zone — concentric arcs above keypad */}
      <g stroke="#E11D2A" strokeOpacity="0.85" fill="none" strokeLinecap="round">
        <path d="M 32 72 Q 40 66 48 72" strokeWidth="1.2">
          <animate
            attributeName="stroke-opacity"
            values="0.85;0.2;0.85"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M 28 76 Q 40 64 52 76" strokeWidth="1" strokeOpacity="0.5">
          <animate
            attributeName="stroke-opacity"
            values="0.5;0.05;0.5"
            dur="2.2s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        </path>
        <path d="M 24 80 Q 40 62 56 80" strokeWidth="0.8" strokeOpacity="0.3">
          <animate
            attributeName="stroke-opacity"
            values="0.3;0.02;0.3"
            dur="2.2s"
            begin="0.8s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Keypad — 4 rows × 3 columns */}
      <g>
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
          ["*", "0", "#"],
        ].map((row, ri) =>
          row.map((key, ci) => {
            const kx = 8 + ci * 22;
            const ky = 92 + ri * 22;
            const isAccent =
              (ri === 3 && ci === 2) || (ri === 0 && ci === 0); // confirm + cancel-style accents (visual variety only)
            return (
              <g key={`${ri}-${ci}`}>
                <rect
                  x={kx}
                  y={ky}
                  width="20"
                  height="16"
                  rx="3"
                  fill="#2a2c30"
                  stroke="#3a3d42"
                  strokeWidth="0.4"
                />
                <text
                  x={kx + 10}
                  y={ky + 11}
                  textAnchor="middle"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="6.5"
                  fill={isAccent ? "#E11D2A" : "#dde1e6"}
                  fontWeight="700"
                >
                  {key}
                </text>
              </g>
            );
          }),
        )}
      </g>

      {/* Bottom indicator strip */}
      <rect x="6" y="180" width="68" height="2" rx="1" fill="#3a3d42" />
    </g>
  );
}

// ─── iPhone for Online Ordering — uses ready phone mockup ───────

function DeviceIphone({
  x,
  y,
  uiSrc,
}: {
  x: number;
  y: number;
  uiSrc: string;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="60" cy="260" rx="74" ry="10" fill="url(#floor-shadow)" />
      <image
        href={uiSrc}
        x="0"
        y="0"
        width="120"
        height="244"
        preserveAspectRatio="xMidYMid meet"
        style={{
          filter: "drop-shadow(0 22px 38px rgba(40,55,85,0.28))",
        }}
      />
    </g>
  );
}

// ─── Time Tracking iPhone — SVG frame with clock-in UI ──────────

function DeviceTimePhone({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="58" cy="232" rx="68" ry="9" fill="url(#floor-shadow)" />
      {/* Phone body */}
      <rect
        x="0"
        y="0"
        width="116"
        height="228"
        rx="20"
        fill="#1d1d1f"
        style={{
          filter: "drop-shadow(0 22px 36px rgba(40,55,85,0.28))",
        }}
      />
      <rect x="6" y="8" width="104" height="212" rx="14" fill="#ffffff" />
      <g clipPath="url(#clip-iphone)">
        {/* Status bar */}
        <rect x="8" y="10" width="100" height="6" fill="#ffffff" />
        <text
          x="20"
          y="15"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="3.5"
          fill="#1d1d1f"
          fontWeight="600"
        >
          09:41
        </text>
        {/* Notch */}
        <rect x="44" y="12" width="28" height="6" rx="3" fill="#1d1d1f" />
        {/* Greeting */}
        <text
          x="14"
          y="36"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="4.5"
          letterSpacing="1.2"
          fill="#6e6e73"
          fontWeight="700"
        >
          TODAY
        </text>
        <text
          x="14"
          y="48"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10"
          fill="#1d1d1f"
          fontWeight="700"
          letterSpacing="-0.2"
        >
          Yasmine
        </text>
        {/* Clock disc */}
        <circle cx="58" cy="86" r="22" fill="#f4f1f8" stroke="#e2dbed" />
        <text
          x="58"
          y="90"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="12"
          fill="#1d1d1f"
          fontWeight="700"
          textAnchor="middle"
        >
          07:42
        </text>
        {/* Clock in button */}
        <rect x="14" y="120" width="88" height="20" rx="10" fill="#1d1d1f" />
        <circle cx="26" cy="130" r="3" fill="#34a17b" />
        <text
          x="64"
          y="133"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="7"
          fill="#ffffff"
          fontWeight="600"
          textAnchor="middle"
        >
          Clock in
        </text>
        {/* This week */}
        <text
          x="14"
          y="156"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="4"
          letterSpacing="1.2"
          fill="#6e6e73"
          fontWeight="700"
        >
          THIS WEEK
        </text>
        <g>
          <rect x="14" y="162" width="88" height="14" rx="3" fill="#fafafc" />
          <text
            x="18"
            y="171"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="5"
            fill="#1d1d1f"
          >
            Mon · 8h 12m
          </text>
          <rect x="14" y="180" width="88" height="14" rx="3" fill="#fafafc" />
          <text
            x="18"
            y="189"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="5"
            fill="#1d1d1f"
          >
            Tue · 7h 58m
          </text>
          <rect x="14" y="198" width="88" height="14" rx="3" fill="#fafafc" />
          <text
            x="18"
            y="207"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="5"
            fill="#1d1d1f"
          >
            Wed · 8h 04m
          </text>
        </g>
      </g>
      <rect
        x="6"
        y="8"
        width="104"
        height="212"
        rx="14"
        fill="url(#screen-glass)"
      />
    </g>
  );
}

// ─── QR Menu — printed card lying flat ──────────────────────────

function QrMenuCard({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Floor shadow */}
      <ellipse cx="70" cy="98" rx="76" ry="8" fill="url(#floor-shadow)" />
      {/* Card body — slightly tilted via skewX feel */}
      <g transform="skewX(-12) translate(20 0)">
        <rect
          x="0"
          y="0"
          width="120"
          height="90"
          rx="6"
          fill="#ffffff"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="0.8"
          style={{
            filter: "drop-shadow(0 14px 22px rgba(40,30,40,0.18))",
          }}
        />
        {/* Brand */}
        <text
          x="14"
          y="20"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="7"
          fill="#1d1d1f"
          fontWeight="700"
          letterSpacing="-0.2"
        >
          Scan to order
        </text>
        <text
          x="14"
          y="30"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5"
          fill="#6e6e73"
        >
          Table 14
        </text>
        {/* QR */}
        <g transform="translate(14, 36)">
          <rect width="42" height="42" fill="#ffffff" />
          {/* QR pattern blocks (stylized) */}
          <rect x="0" y="0" width="10" height="10" fill="#1d1d1f" />
          <rect x="2" y="2" width="6" height="6" fill="#ffffff" />
          <rect x="4" y="4" width="2" height="2" fill="#1d1d1f" />

          <rect x="32" y="0" width="10" height="10" fill="#1d1d1f" />
          <rect x="34" y="2" width="6" height="6" fill="#ffffff" />
          <rect x="36" y="4" width="2" height="2" fill="#1d1d1f" />

          <rect x="0" y="32" width="10" height="10" fill="#1d1d1f" />
          <rect x="2" y="34" width="6" height="6" fill="#ffffff" />
          <rect x="4" y="36" width="2" height="2" fill="#1d1d1f" />

          {/* Scattered modules */}
          <g fill="#1d1d1f">
            <rect x="14" y="2" width="2" height="2" />
            <rect x="18" y="2" width="2" height="2" />
            <rect x="22" y="4" width="2" height="2" />
            <rect x="26" y="2" width="2" height="2" />
            <rect x="14" y="8" width="2" height="2" />
            <rect x="20" y="10" width="2" height="2" />
            <rect x="24" y="8" width="2" height="2" />
            <rect x="28" y="10" width="2" height="2" />
            <rect x="2" y="14" width="2" height="2" />
            <rect x="6" y="16" width="2" height="2" />
            <rect x="10" y="14" width="2" height="2" />
            <rect x="14" y="14" width="2" height="2" />
            <rect x="18" y="16" width="2" height="2" />
            <rect x="22" y="14" width="2" height="2" />
            <rect x="26" y="16" width="2" height="2" />
            <rect x="30" y="14" width="2" height="2" />
            <rect x="34" y="14" width="2" height="2" />
            <rect x="38" y="16" width="2" height="2" />
            <rect x="2" y="20" width="2" height="2" />
            <rect x="6" y="22" width="2" height="2" />
            <rect x="12" y="20" width="2" height="2" />
            <rect x="16" y="22" width="2" height="2" />
            <rect x="20" y="20" width="2" height="2" />
            <rect x="24" y="22" width="2" height="2" />
            <rect x="28" y="20" width="2" height="2" />
            <rect x="32" y="22" width="2" height="2" />
            <rect x="36" y="20" width="2" height="2" />
            <rect x="2" y="26" width="2" height="2" />
            <rect x="8" y="26" width="2" height="2" />
            <rect x="14" y="28" width="2" height="2" />
            <rect x="18" y="26" width="2" height="2" />
            <rect x="22" y="28" width="2" height="2" />
            <rect x="26" y="26" width="2" height="2" />
            <rect x="32" y="26" width="2" height="2" />
            <rect x="38" y="28" width="2" height="2" />
            <rect x="14" y="34" width="2" height="2" />
            <rect x="18" y="34" width="2" height="2" />
            <rect x="22" y="36" width="2" height="2" />
            <rect x="26" y="34" width="2" height="2" />
            <rect x="30" y="36" width="2" height="2" />
            <rect x="34" y="34" width="2" height="2" />
            <rect x="38" y="34" width="2" height="2" />
          </g>
        </g>
        {/* Right copy */}
        <text
          x="62"
          y="48"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5"
          fill="#1d1d1f"
          fontWeight="600"
        >
          1. Open camera
        </text>
        <text
          x="62"
          y="58"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5"
          fill="#1d1d1f"
          fontWeight="600"
        >
          2. Scan
        </text>
        <text
          x="62"
          y="68"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="5"
          fill="#1d1d1f"
          fontWeight="600"
        >
          3. Order
        </text>
      </g>
    </g>
  );
}


