// Shared "hero glass" treatment.
//
// Both the navbar (in its immersive-over-hero state) and the
// trusted-by strip pinned at the bottom of the hero use this exact
// glass formula so the top and bottom edges of the hero read as a
// single premium frosted system — same transparency, same blur
// intensity, same hairline weight.
//
// Composition:
//   • bg-night/30        — 30% night veil. Subtle darkening that
//                          backs the white text without reading as a
//                          panel; the video underneath is still fully
//                          present.
//   • backdrop-blur-lg   — 16px blur. Soft frost — enough that
//                          micro-text and icons gain a calm backing
//                          field, still well short of "over-processed".
//   • border-white/10    — barely-perceptible hairline that gives
//                          the edge a sense of being a surface
//                          rather than a wash. Direction (top vs
//                          bottom) is applied by the consumer.
//
// Edit here and the change propagates to both edges of the hero.

export const HERO_GLASS_SURFACE = "bg-night/30 backdrop-blur-lg";
export const HERO_GLASS_HAIRLINE = "border-white/10";
