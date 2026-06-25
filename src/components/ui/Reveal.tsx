"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "figure";
} & Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition" | "whileInView" | "viewport">;

export function Reveal({
  children,
  delay = 0,
  y = 16,
  duration = 0.9,
  className,
  as = "div",
  ...rest
}: Props) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    const StaticTag = as as "div";
    return <StaticTag className={className}>{children}</StaticTag>;
  }

  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0% -12% 0%" }}
      transition={{ duration, delay, ease: APPLE_EASE }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
