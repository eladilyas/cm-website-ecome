// Locale-aware navigation primitives. Drop-in replacements for
// next/link, next/navigation's useRouter, usePathname, redirect.
// They automatically handle the locale prefix so callers can
// write `<Link href="/shop">` and get the right URL in every
// language.

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
