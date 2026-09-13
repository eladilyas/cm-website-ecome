// ProductContextShot — the product cut-out composited into a real scene.
//
// The reference PDPs lead with lifestyle photography: the jetski on water,
// the bike on a trail. Ours could not, because every product photo we hold
// is a cut-out on a transparent ground — correct for a grid, but flat as a
// hero, and it was the main thing still reading as "before" on this page.
//
// Rather than wait on a photo shoot, the backdrop comes from the brand ad
// clip: one frame per product category, showing that category's hardware in
// an actual Moroccan venue. A kiosk product sits against a row of kiosks in
// a branded fast-food interior; a handheld sits against a staff member
// working a restaurant counter.
//
// Honest about what it is: this is a CONTEXT panel, not a photograph of this
// specific SKU in the wild. So the backdrop is darkened and desaturated and
// the cut-out floats clearly in front of it, rather than being blended in to
// imply a shot that was never taken.
//
// Why a contained panel and not a full-bleed dark hero: the buy column
// beside it carries the availability badge, the Wafasalaf financing card and
// the cart button, all of which are designed for a light surface. Turning
// the whole hero dark would have meant restyling each of them, for a change
// the founder only asked for on the imagery. The panel gets the richness
// without that blast radius.

import Image from "next/image";

/** Live storefront category slugs that have a backdrop. Anything else — a
 *  new category, or `consumables`, which currently holds no products —
 *  falls through to the neutral treatment below. */
const CONTEXT_FOR: Record<string, string> = {
  pos: "/media/context/pos.webp",
  handheld: "/media/context/handheld.webp",
  kiosk: "/media/context/kiosk.webp",
  peripherals: "/media/context/peripherals.webp",
  syscall: "/media/context/syscall.webp",
  accessories: "/media/context/accessories.webp",
  "access-presence": "/media/context/access-presence.webp",
};

export function ProductContextShot({
  category,
  src,
  alt,
  /** Alt text for the backdrop. Empty — it is decorative, and the product
   *  image beside it already carries the meaningful description. */
  contextAlt = "",
}: {
  category: string;
  src: string;
  alt: string;
  contextAlt?: string;
}) {
  const context = CONTEXT_FOR[category];

  return (
    <div className="relative w-full max-w-[640px] mx-auto">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink ring-1 ring-hairline">
        {context ? (
          <>
            <Image
              src={context}
              alt={contextAlt}
              fill
              sizes="(min-width: 1280px) 640px, (min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
            {/* Vignette. The backdrop is already darkened in the asset; this
                deepens the edges specifically so the cut-out's silhouette
                separates from the scene instead of dissolving into it. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 60% at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.55) 100%)",
              }}
            />
          </>
        ) : (
          // Neutral fallback for a category with no backdrop — the previous
          // treatment, kept so an unmapped category degrades to something
          // deliberate rather than a black box.
          <div
            aria-hidden
            className="absolute inset-0 bg-canvas"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 45%, rgba(80,130,200,0.12) 0%, rgba(255,255,255,0) 70%), #fbfbfc",
            }}
          />
        )}

        {/* The product itself. Inset so it reads as sitting IN the frame
            rather than cropped by it, and given a heavier drop shadow than
            it needs on white — on a dark scene a soft shadow disappears and
            the cut-out looks pasted on. */}
        <div className="absolute inset-[9%]">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 560px, (min-width: 768px) 48vw, 88vw"
            priority
            className="object-contain"
            style={{
              filter: context
                ? "drop-shadow(0 24px 44px rgba(0,0,0,0.55)) drop-shadow(0 4px 10px rgba(0,0,0,0.4))"
                : "drop-shadow(0 32px 60px rgba(40,80,140,0.16)) drop-shadow(0 6px 14px rgba(0,0,0,0.10))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
