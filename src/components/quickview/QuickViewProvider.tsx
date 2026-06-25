"use client";

// Global Quick View context.
//
// Mount once at the root (SiteChrome) so any client component can
// call `useQuickView().open(slug)` without lifting state through
// product-card props. The modal lives on its own portal layer (z-50)
// and reads the catalog from CatalogProvider — no extra fetch.
//
// Why a global provider:
//   • Multiple surfaces need it (shop grid, cart, checkout upsells,
//     pre-payment dialog) — co-locating state inside each surface
//     would force every parent to thread props.
//   • The modal binds to one product at a time and persists no state
//     across openings; a single context with a small (slug | null)
//     value is the right shape.
//   • Closes on Esc / backdrop click / "Add to cart" success — all
//     handled inside the modal, callers only need .open(slug).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { QuickViewModal } from "./QuickViewModal";

type QuickViewContextValue = {
  open: (slug: string) => void;
  close: () => void;
  /** The slug currently shown, or null when closed. Consumers rarely
   *  read this — most just call `open`. */
  currentSlug: string | null;
};

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  const open = useCallback((slug: string) => setCurrentSlug(slug), []);
  const close = useCallback(() => setCurrentSlug(null), []);

  const value = useMemo<QuickViewContextValue>(
    () => ({ open, close, currentSlug }),
    [open, close, currentSlug],
  );

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <QuickViewModal slug={currentSlug} onClose={close} />
    </QuickViewContext.Provider>
  );
}

/** Hook for any descendant of <QuickViewProvider />. Returns a stable
 *  object with `open(slug)` + `close()`. Throws if the provider isn't
 *  mounted — surfaces an error early during development. */
export function useQuickView(): QuickViewContextValue {
  const ctx = useContext(QuickViewContext);
  if (!ctx) {
    throw new Error(
      "useQuickView must be used inside <QuickViewProvider />. Mount the " +
        "provider once at SiteChrome.",
    );
  }
  return ctx;
}
