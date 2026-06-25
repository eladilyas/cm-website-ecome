import type { ReactNode } from "react";

type Tone = "light" | "dark";
type Aspect = "terminal" | "tablet" | "phone" | "kds";

type Props = {
  tone?: Tone;
  aspect?: Aspect;
  children: ReactNode;
  className?: string;
  /** Adds a subtle floor stand below the device (for terminals/tablets). */
  stand?: boolean;
};

const aspectClass: Record<Aspect, string> = {
  terminal: "aspect-[16/10]",
  tablet: "aspect-[4/3]",
  phone: "aspect-[9/19]",
  kds: "aspect-[16/9]",
};

const bezelClass: Record<Tone, string> = {
  light: "bg-[linear-gradient(180deg,#fafafa_0%,#e8e8ea_100%)] ring-1 ring-black/10",
  dark: "bg-[linear-gradient(180deg,#2c2c2e_0%,#0c0c0d_100%)] ring-1 ring-white/5",
};

const screenInsetClass: Record<Aspect, string> = {
  terminal: "inset-3",
  tablet: "inset-3",
  phone: "inset-[10px]",
  kds: "inset-3",
};

const radiusOuter: Record<Aspect, string> = {
  terminal: "rounded-[28px]",
  tablet: "rounded-[24px]",
  phone: "rounded-[44px]",
  kds: "rounded-[22px]",
};

const radiusInner: Record<Aspect, string> = {
  terminal: "rounded-[16px]",
  tablet: "rounded-[14px]",
  phone: "rounded-[34px]",
  kds: "rounded-[12px]",
};

export function MockupFrame({
  tone = "dark",
  aspect = "terminal",
  children,
  className = "",
  stand = false,
}: Props) {
  return (
    <div className={`relative ${className}`}>
      {/* Outer device chrome */}
      <div
        className={[
          "relative w-full",
          aspectClass[aspect],
          radiusOuter[aspect],
          bezelClass[tone],
          // Layered shadow: tight ambient + diffuse drop
          "shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_30px_60px_-20px_rgba(0,0,0,0.35),0_12px_24px_-8px_rgba(0,0,0,0.15)]",
        ].join(" ")}
      >
        {/* Inner screen */}
        <div
          className={[
            "absolute",
            screenInsetClass[aspect],
            radiusInner[aspect],
            "overflow-hidden bg-paper",
            "ring-1 ring-black/5",
          ].join(" ")}
        >
          {children}
        </div>
        {/* Subtle top highlight */}
        <div
          className={`absolute inset-x-12 top-0 h-px ${radiusOuter[aspect]} bg-white/30`}
          aria-hidden="true"
        />
      </div>

      {stand ? (
        <div
          className="mx-auto -mt-px"
          aria-hidden="true"
          style={{
            width: "38%",
            height: "26px",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 60%, rgba(0,0,0,0) 100%)",
            clipPath: "polygon(8% 0, 92% 0, 100% 100%, 0 100%)",
          }}
        />
      ) : null}
    </div>
  );
}
