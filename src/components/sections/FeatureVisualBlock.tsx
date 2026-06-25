import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { VISUAL_SYSTEM, type VisualTone } from "@/lib/visualSystem";

type Layout = "center" | "text-left" | "text-right";
type Size = "lead" | "split";

type CTA = { label: string; href: string };

type Props = {
  tone: VisualTone;
  /** "center" = Apple-tile pattern. "text-left/right" = asymmetric showcase. */
  layout?: Layout;
  /** "lead" = full hero-style tile. "split" = half-width tile for 2-up grids. */
  size?: Size;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  ctaPrimary?: CTA;
  ctaSecondary?: CTA;
  visual: ReactNode;
};

// Single consolidated section primitive. Replaces the earlier ProductTile
// (centered) + FeatureShowcase (asymmetric) pair so every product section
// flows through one set of layout rules and one set of visual tokens.
//
// Layout variants:
//   • center      — eyebrow → title → subtitle → CTAs → visual below
//   • text-left   — text left half, visual right half (asymmetric showcase)
//   • text-right  — visual left half, text right half
//
// Size variants (only affect "center" layout):
//   • lead   — large hero-style tile, generous padding, big title
//   • split  — half-width tile for 2-up grids, vertically balanced

export function FeatureVisualBlock({
  tone,
  layout = "center",
  size = "lead",
  eyebrow,
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  visual,
}: Props) {
  const tokens = VISUAL_SYSTEM[tone];
  const isDark = tone === "dark";
  const isCenter = layout === "center";
  const textOnLeft = layout === "text-left";

  // Center layout
  if (isCenter) {
    const isLead = size === "lead";
    const padY = isLead
      ? "pt-20 md:pt-28 pb-20 md:pb-28"
      : "pt-16 md:pt-20 pb-16 md:pb-20";
    const titleScale = isLead
      ? "text-[clamp(1.875rem,4vw,3rem)]"
      : "text-[clamp(1.5rem,2.6vw,2rem)]";
    const sectionExtras = isLead
      ? ""
      : "h-full flex flex-col min-h-[640px] md:min-h-[760px]";

    return (
      <section
        data-scheme={tokens.scheme}
        className={`${tokens.surface} ${tokens.ink} ${padY} ${sectionExtras} overflow-hidden`}
      >
        <div
          className={[
            "mx-auto max-w-[1280px] px-6 lg:px-10 text-center",
            isLead ? "" : "flex-1 flex flex-col",
          ].join(" ")}
        >
          <Reveal>
            {eyebrow ? (
              <p
                className={`text-[11px] font-medium uppercase tracking-[0.14em] mb-4 ${tokens.inkMute}`}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2 className={`${titleScale} font-semibold tracking-tight leading-[1.05]`}>
              {title}
            </h2>
            {subtitle ? (
              <p
                className={`mt-4 text-[17px] md:text-[19px] leading-[1.45] max-w-[32rem] mx-auto ${tokens.inkSoft}`}
              >
                {subtitle}
              </p>
            ) : null}
            {(ctaPrimary || ctaSecondary) && (
              <div className="mt-6 flex items-center justify-center gap-3">
                {ctaPrimary ? (
                  <Button
                    href={ctaPrimary.href}
                    variant={isDark ? "invert" : "primary"}
                    size="sm"
                  >
                    {ctaPrimary.label}
                  </Button>
                ) : null}
                {ctaSecondary ? (
                  <Button href={ctaSecondary.href} variant="outline" size="sm">
                    {ctaSecondary.label}
                  </Button>
                ) : null}
              </div>
            )}
          </Reveal>

          {visual ? (
            <Reveal
              delay={0.08}
              className={
                isLead
                  ? "mt-12 md:mt-16 mx-auto max-w-[920px]"
                  : "mt-10 md:mt-12 flex-1 flex items-center justify-center w-full"
              }
            >
              {visual}
            </Reveal>
          ) : null}
        </div>
      </section>
    );
  }

  // Asymmetric layouts
  return (
    <section
      data-scheme={tokens.scheme}
      className={`${tokens.surface} ${tokens.ink} overflow-hidden`}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text */}
          <div className={textOnLeft ? "md:order-1" : "md:order-2"}>
            <Reveal>
              {eyebrow ? (
                <p
                  className={`text-[11px] font-medium uppercase tracking-[0.14em] mb-4 ${tokens.inkMute}`}
                >
                  {eyebrow}
                </p>
              ) : null}
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight leading-[1.07]">
                {title}
              </h2>
              {subtitle ? (
                <p
                  className={`mt-4 text-[17px] md:text-[19px] leading-[1.45] max-w-[32rem] ${tokens.inkSoft}`}
                >
                  {subtitle}
                </p>
              ) : null}
              {(ctaPrimary || ctaSecondary) && (
                <div className="mt-7 flex items-center gap-3">
                  {ctaPrimary ? (
                    <Button
                      href={ctaPrimary.href}
                      variant={isDark ? "invert" : "primary"}
                      size="sm"
                    >
                      {ctaPrimary.label}
                    </Button>
                  ) : null}
                  {ctaSecondary ? (
                    <Button href={ctaSecondary.href} variant="outline" size="sm">
                      {ctaSecondary.label}
                    </Button>
                  ) : null}
                </div>
              )}
            </Reveal>
          </div>
          {/* Visual */}
          <div className={textOnLeft ? "md:order-2" : "md:order-1"}>
            <Reveal delay={0.08}>{visual}</Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
