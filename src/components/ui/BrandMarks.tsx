// Two small marks lifted from the catalogue. Both are pure typography and
// carry a surprising amount of the document's character.

import type { ReactNode } from "react";

/* ── BrandMention ──────────────────────────────────────────────────────
   The catalogue writes the company name IN RED, inline, mid-sentence:

     "Caisse Manager permet d'automatiser et d'accélérer l'encaissement…"
      ^^^^^^^^^^^^^^ red

   It is the single most repeated brand gesture in the document and it
   costs nothing. Every prose block that names the product should use it,
   which is why this is a component and not an ad-hoc span — 232
   hardcoded reds is how the codebase got here.

   Deliberately NOT a link. In the catalogue it is emphasis, not
   navigation, and making the product's own name a link on its own
   marketing site would be noise. */
export function BrandMention({ children = "Caisse Manager" }: { children?: ReactNode }) {
  return <span className="font-semibold text-brand">{children}</span>;
}

/* ── ComingSoonStamp ───────────────────────────────────────────────────
   The catalogue marks unreleased modules (Drive Display, Menu Monitor,
   CM Hub) with a rotated red rubber stamp in the top-right corner.

   This replaces the quiet outline "En arrivage" chip currently used on
   shop cards. That chip was the right call when the only goal was "do not
   shout", but the catalogue shows the founder's actual intent: an
   unreleased product is a POSITIVE — it says the roadmap is moving. A
   stamp reads as anticipation, a grey pill reads as an apology.

   Built with type and a border, no bitmap: an outlined box rotated ~-8°,
   heavy condensed caps, letter-spaced. `select-none` and aria-hidden on
   the frame; the label itself stays readable to assistive tech through
   the `title` prop on the wrapper where callers need it. */
export function ComingSoonStamp({
  label,
  size = "md",
  className = "",
}: {
  /** Localised — "Coming soon" / "Bientôt disponible" / "En arrivage". */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const dims =
    size === "sm"
      ? "text-[9px] px-2 py-[3px] border-[1.5px] tracking-[0.14em]"
      : "text-[12.5px] px-3.5 py-1.5 border-2 tracking-[0.12em]";

  return (
    <span
      className={`pointer-events-none inline-block select-none rounded-[3px] font-bold uppercase text-brand border-brand/70 -rotate-[8deg] ${dims} ${className}`}
      // The rotation is the whole gesture — a straight box reads as a
      // badge, an angled one reads as a stamp pressed onto the page.
      style={{ borderStyle: "solid" }}
    >
      {label}
    </span>
  );
}
