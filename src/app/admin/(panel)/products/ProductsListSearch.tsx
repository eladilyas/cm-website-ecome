"use client";

// Search input for /admin/products. Debounced; mirrors the typed value
// to the `?q=` URL param so refreshes preserve the query and the
// page-level server component picks it up via searchParams.
//
// Status filter chips already mirror via the URL too — we just preserve
// whichever is active when the user types in here.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductStatus } from "@prisma/client";

export function ProductsListSearch({
  initialQuery,
  statusFilter,
}: {
  initialQuery: string;
  statusFilter: ProductStatus | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const timerRef = useRef<number | null>(null);

  // Debounce URL pushes by 250ms so each keystroke doesn't trigger a
  // server roundtrip.
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const params = new URLSearchParams();
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      if (statusFilter) params.set("status", statusFilter);
      const qs = params.toString();
      router.replace(qs ? `/admin/products?${qs}` : "/admin/products", {
        scroll: false,
      });
    }, 250);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value, statusFilter, router]);

  return (
    <label className="relative inline-block">
      <span className="sr-only">Search products</span>
      <SearchIcon />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name, slug, or tagline"
        className="h-9 w-[260px] sm:w-[300px] pl-8 pr-3 rounded-full bg-paper border border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04] text-[12.5px] text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus:outline-none"
      />
    </label>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-mute"
      width="14"
      height="14"
    >
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m10.5 10.5 3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
