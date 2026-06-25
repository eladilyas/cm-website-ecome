import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "invert" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-[13px]",
  md: "h-10 px-5 text-[14px]",
  lg: "h-12 px-7 text-[15px]",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary: "bg-paper text-ink ring-1 ring-hairline hover:bg-fog",
  ghost: "bg-transparent text-ink hover:text-ink-soft",
  invert: "bg-paper text-ink hover:bg-fog",
  outline:
    "bg-transparent text-current border border-current/25 hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type ButtonAsButton = CommonProps & { href?: undefined } & ComponentProps<"button">;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "sm", className = "", children, ...rest } = props;
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if ("href" in props && props.href) {
    const { href, ...linkRest } = rest as { href: string };
    return (
      <Link href={href} className={cls} {...linkRest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentProps<"button">)}>
      {children}
    </button>
  );
}
