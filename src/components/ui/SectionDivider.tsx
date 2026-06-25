// Apple-style section divider.
//
// A 1px hairline that visually separates consecutive sections, bound to the
// page's max-w-[1280px] content container with the same px-6 lg:px-10
// gutters. Two scheme variants pick the right hairline color for the
// surrounding section's tone — light/canvas sections use a near-black low-
// opacity line; dark/night sections use a near-white low-opacity line.
//
// Place INSIDE a section (at the very top, before its content padding) so it
// inherits that section's background. Do NOT place between sections in the
// page tree — without a parent bg the line floats against whichever color
// happens to bleed through.
//
// Architectural note: the line is intentionally short of the section's full
// width (constrained to the content container). Apple does this — a full-
// bleed hairline reads as a window divider; a contained one reads as a
// chapter break in a designed document.

type Props = {
  /** Match the surrounding section's data-scheme. Default "light". */
  scheme?: "light" | "dark";
  /** Override the default container max-width if the section is full-bleed. */
  className?: string;
};

export function SectionDivider({ scheme = "light", className = "" }: Props) {
  const lineClass = scheme === "dark" ? "bg-white/[0.08]" : "bg-black/[0.08]";
  return (
    <div className={`mx-auto max-w-[1280px] px-6 lg:px-10 ${className}`} aria-hidden="true">
      <div className={`h-px ${lineClass}`} />
    </div>
  );
}
