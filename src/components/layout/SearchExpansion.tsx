"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  filterSearch,
  groupByCategory,
  useQuickLinks,
  useSearchIndex,
  type SearchEntry,
} from "@/lib/searchIndex";

type Props = {
  onClose: () => void;
  scheme: "light" | "dark";
};

// Header search — live filtering over a real route index.
//
// Behavior:
//   • Input autofocuses on open (deferred a frame so the expansion's
//     height animation lands cleanly).
//   • Typing filters results in real time against `searchSite` (substring
//     match over title + description + keywords). Cheap, deterministic,
//     correct at this scale.
//   • Empty query → "Quick links" band with five curated real routes.
//   • Non-empty + matches → grouped results by category.
//   • Non-empty + no matches → an explicit "no results" state with a
//     Contact-Sales fallback that goes to a real anchor.
//   • Enter on a query selects the top result and navigates.
//   • Esc-to-close handled by the parent <Header>.
//
// Every link this component renders points to a route that exists in
// /app — the search will never serve a 404.

export function SearchExpansion({ onClose, scheme }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const t = useTranslations("search");
  const index = useSearchIndex();
  const quickLinks = useQuickLinks();

  // Defer focus a frame so the height-expand animation settles first.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(() => filterSearch(index, query), [index, query]);
  const grouped = useMemo(() => groupByCategory(results), [results]);
  const hasQuery = query.trim().length > 0;

  // Pressing Enter on a non-empty query: go to top result.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasQuery || results.length === 0) return;
    const top = results[0];
    onClose();
    router.push(top.href);
  };

  // ── Themed classes (one source per role to keep light/dark in sync) ──
  const eyebrowClass =
    scheme === "dark" ? "text-paper/55" : "text-ink-mute";
  const inputClass =
    scheme === "dark"
      ? "text-paper placeholder:text-paper/40"
      : "text-ink placeholder:text-ink-mute";
  const iconClass = scheme === "dark" ? "text-paper/55" : "text-ink-mute";
  const dividerClass =
    scheme === "dark" ? "border-white/10" : "border-hairline";
  const resultTitleClass =
    scheme === "dark"
      ? "text-paper group-hover:text-paper"
      : "text-ink group-hover:text-ink";
  const resultDescClass =
    scheme === "dark" ? "text-paper/55" : "text-ink-mute";
  const arrowClass =
    scheme === "dark"
      ? "text-paper/45 group-hover:text-paper"
      : "text-ink-mute group-hover:text-ink";

  return (
    <div>
      {/* ── Search input row ────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <label htmlFor="site-search" className="sr-only">
          {t("label")}
        </label>
        <div className={`flex items-center gap-4 pb-5 border-b ${dividerClass}`}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
            className={`flex-shrink-0 ${iconClass}`}
          >
            <circle
              cx="10"
              cy="10"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M15 15L19 19"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className={`flex-1 bg-transparent border-0 outline-none text-[clamp(1.5rem,3vw,2rem)] font-normal tracking-tight ${inputClass}`}
          />
        </div>
      </form>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {!hasQuery ? (
        // Empty state — curated quick links.
        <div className="mt-8">
          <p className={`text-[12px] font-normal mb-3 ${eyebrowClass}`}>
            {t("quickLinks")}
          </p>
          <ul className="space-y-1">
            {quickLinks.map((entry) => (
              <li key={entry.href}>
                <ResultRow
                  entry={entry}
                  onClose={onClose}
                  resultTitleClass={resultTitleClass}
                  resultDescClass={resultDescClass}
                  arrowClass={arrowClass}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : results.length === 0 ? (
        // No-results state — explicit guidance, real fallback link.
        <div className="mt-8 max-w-[560px]">
          <p
            className={`text-[15px] font-medium leading-snug ${
              scheme === "dark" ? "text-paper" : "text-ink"
            }`}
          >
            {t("noResults", { query: query.trim() })}
          </p>
          <p className={`mt-1.5 text-[13px] ${eyebrowClass}`}>
            {t("noResultsHint")}
          </p>
          <div className="mt-4">
            <ResultRow
              entry={{
                id: "fallbackContact",
                title: t("fallbackContact.title"),
                description: t("fallbackContact.description"),
                href: "/support#contact",
                category: "helpLegal",
                categoryLabel: t("categories.helpLegal"),
              }}
              onClose={onClose}
              resultTitleClass={resultTitleClass}
              resultDescClass={resultDescClass}
              arrowClass={arrowClass}
            />
          </div>
        </div>
      ) : (
        // Results — grouped by category, in canonical order.
        <div className="mt-8 space-y-7">
          {grouped.map((group) => (
            <div key={group.category}>
              <p className={`text-[12px] font-normal mb-3 ${eyebrowClass}`}>
                {group.categoryLabel}
              </p>
              <ul className="space-y-1">
                {group.entries.map((entry) => (
                  <li key={entry.href}>
                    <ResultRow
                      entry={entry}
                      onClose={onClose}
                      resultTitleClass={resultTitleClass}
                      resultDescClass={resultDescClass}
                      arrowClass={arrowClass}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single result row ────────────────────────────────────────────────

function ResultRow({
  entry,
  onClose,
  resultTitleClass,
  resultDescClass,
  arrowClass,
}: {
  entry: SearchEntry;
  onClose: () => void;
  resultTitleClass: string;
  resultDescClass: string;
  arrowClass: string;
}) {
  return (
    <Link
      href={entry.href}
      onClick={onClose}
      className="group flex items-baseline gap-3 py-1.5 transition-colors"
    >
      <span
        aria-hidden="true"
        className={`inline-block w-4 transition-colors ${arrowClass}`}
      >
        →
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={`block text-[15px] font-semibold tracking-[-0.005em] transition-colors ${resultTitleClass}`}
        >
          {entry.title}
        </span>
        {entry.description && (
          <span
            className={`block text-[12px] mt-0.5 leading-snug ${resultDescClass}`}
          >
            {entry.description}
          </span>
        )}
      </span>
    </Link>
  );
}
