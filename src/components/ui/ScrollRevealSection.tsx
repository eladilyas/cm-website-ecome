// Semantic wrapper: ScrollRevealSection = Reveal with <section> as its root.
// Use when the entire section body needs to fade-in on scroll. For finer
// control (per-element stagger), use Reveal directly inside a plain section.

import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
};

export function ScrollRevealSection({
  children,
  className,
  delay,
  y,
  duration,
}: Props) {
  return (
    <Reveal as="section" className={className} delay={delay} y={y} duration={duration}>
      {children}
    </Reveal>
  );
}
