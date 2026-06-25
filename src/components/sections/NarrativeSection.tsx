import { Reveal } from "@/components/ui/Reveal";

// Split visual story (Option A, no-3D revision):
//   Left  · strict 3-tier typographic hierarchy (main / secondary / muted)
//   Right · subtle abstract gradient composition — soft red glow + cool tint
//           highlight. Pure CSS. NO 3D object (the 3D check is reserved
//           exclusively for the hero), NO product photo, NO literal logo
//           duplication. The composition reads as "brand color cloud" — a
//           minimal abstract anchor that doesn't compete with the typography.

export function NarrativeSection() {
  return (
    <section data-scheme="light" className="bg-canvas overflow-hidden">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-28 md:py-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Typography — left */}
          <div className="md:order-1 text-left">
            <Reveal>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-mute mb-6">
                One platform
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="text-[clamp(1.875rem,3.8vw,2.875rem)] font-semibold tracking-tight leading-[1.1] text-ink">
                Built for the future of commerce.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-5 text-[16px] md:text-[18px] leading-[1.5] text-ink-soft max-w-[28rem]">
                Every transaction. Every shift. Every detail.
              </p>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-3 text-[14px] leading-[1.55] text-ink-mute max-w-[28rem]">
                Designed to feel like nothing at all.
              </p>
            </Reveal>
          </div>

          {/* Abstract composition — right (replaces the 3D HeroBrandObject)
              Three soft radial blobs, blurred and stacked, paint a quiet
              "brand color cloud" on the canvas. No literal product/logo. */}
          <div className="md:order-2">
            <Reveal delay={0.08}>
              <div
                aria-hidden="true"
                className="relative aspect-square w-full max-w-[480px] mx-auto"
              >
                {/* Primary red glow — upper-left, the dominant mass */}
                <div
                  className="absolute inset-[6%]"
                  style={{
                    background:
                      "radial-gradient(52% 52% at 38% 38%, rgba(225,29,42,0.22) 0%, rgba(225,29,42,0) 72%)",
                    filter: "blur(28px)",
                  }}
                />
                {/* Cool tint counter-balance — lower-right, picks up canvas blue */}
                <div
                  className="absolute inset-[10%]"
                  style={{
                    background:
                      "radial-gradient(45% 45% at 70% 72%, rgba(80,130,200,0.18) 0%, rgba(80,130,200,0) 72%)",
                    filter: "blur(36px)",
                  }}
                />
                {/* Inner highlight — pinpoint sheen at the brand cloud's heart */}
                <div
                  className="absolute inset-[28%]"
                  style={{
                    background:
                      "radial-gradient(50% 50% at 50% 35%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)",
                    filter: "blur(20px)",
                  }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
