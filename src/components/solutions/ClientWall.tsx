// ClientWall — the full client roster as one full-bleed dark statement.
//
// Why dark, and why full-bleed:
//
//   • Legibility, solved structurally. Roughly 20 of the client brands ship
//     "colour" artwork that is itself light-inked — white knockout text inside
//     coloured rings, pale gold hairlines. On a light surface those need either
//     a dark chip or a typographic fallback, and a wall mixing chipped,
//     unchipped and text-only marks looks accidental. On a DARK surface every
//     brand uses its white lockup, so the whole roster is uniformly legible
//     with no per-brand special casing at all.
//
//   • It is the only place the full roster belongs. The proof stories carry
//     eleven named customers with narrative; the remaining thirty-odd have no
//     story attached, and padding them into story cards would be filler. As a
//     wall they do the one job they are good at — volume of evidence.
//
//   • Rhythm. The page around it is canvas and paper, so a full-bleed ink band
//     is the structural break that stops the section reading as one more grid.
//
// The lattice: logos sit in a hairline grid rather than floating in whitespace.
// Each cell is an equal box with 1px rules between, so the wall reads as a
// deliberate index — closer to a spec sheet than a logo dump — and every mark
// gets identical optical room. Combined with the ink-area normalisation baked
// into the assets, no brand can dominate its neighbour.

import { BrandLogo } from "@/components/ui/BrandLogo";
import { Reveal } from "@/components/ui/Reveal";
import { CLIENT_LOGOS } from "@/data/logos";

export function ClientWall({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  // Only brands with white artwork — on this surface that is the requirement,
  // and it is also what keeps the wall uniform.
  const roster = CLIENT_LOGOS.filter((l) => l.variants.onDark);

  return (
    <section data-scheme="dark" className="bg-ink text-paper">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] gap-10 lg:gap-16">
          {/* Copy column — stays with the wall rather than sitting above it,
              so the count and the evidence are read together. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-paper/45 mb-4">
                {eyebrow}
              </p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2
                className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold tracking-[-0.02em] leading-[1.06]"
                style={{ textWrap: "balance" }}
              >
                {title}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-5 text-[14.5px] md:text-[15px] leading-[1.6] text-paper/65 max-w-[34rem]">
                {body}
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-7 text-[clamp(2.5rem,5vw,3.75rem)] font-semibold tracking-[-0.03em] leading-none tabular-nums">
                {roster.length}
                <span className="text-[#E11D2A]">+</span>
              </p>
            </Reveal>
          </div>

          {/* The lattice. Negative margins + per-cell top/left rules give a
              continuous 1px grid without doubled lines at the seams, and
              without a wrapper border boxing the wall in. */}
          <Reveal delay={0.1}>
            <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 -mt-px -ml-px">
              {roster.map((logo) => (
                <li
                  key={logo.slug}
                  className="flex items-center justify-center py-6 md:py-7 border-t border-l border-paper/10"
                >
                  <BrandLogo
                    logo={logo}
                    surface="dark"
                    size="sm"
                    className="opacity-70 transition-opacity duration-500 hover:opacity-100"
                  />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
