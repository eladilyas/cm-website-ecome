"use client";

// Checkout draft store — persists every keystroke of the checkout form
// to localStorage so users don't lose what they typed when they get
// bounced through sign-in/sign-up.
//
// Lifecycle:
//   • User opens /checkout, starts typing → each keystroke saves here.
//   • User clicks "Sign in to continue" → redirects to /signin?next=/checkout.
//   • User signs in → returns to /checkout → form rehydrates from this store.
//   • User completes the order → `clear()` is called on success.
//
// This is intentionally separate from `cartStore` (which holds the
// items) and `accountStore` (which holds the profile). Drafts are
// session-scoped intent, not durable user data.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { AgeBracket } from "@/lib/wafasalaf";

export type PaymentMethod = "cmi" | "wafasalaf" | "wire-transfer";

/** A draft can start with NO method selected — the live
 *  `usePaymentSettings` hook then picks the first enabled option
 *  on mount. Hard-coding "cmi" as the default forced the CMI card
 *  to render selected even on pages where the admin had disabled
 *  it; null defers that decision until real config arrives. */
export type DraftPaymentMethod = PaymentMethod | null;

export type CheckoutDraft = {
  fullName: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
  companyName: string;
  ice: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: DraftPaymentMethod;
  financingAge: AgeBracket;
};

const EMPTY_DRAFT: CheckoutDraft = {
  fullName: "",
  email: "",
  phoneCode: "+212",
  phoneNumber: "",
  companyName: "",
  ice: "",
  street: "",
  city: "",
  postalCode: "",
  country: "MA",
  paymentMethod: null,
  financingAge: "under60",
};

type DraftState = {
  draft: CheckoutDraft;
};

type DraftActions = {
  /** Merge a partial patch into the draft. */
  patch: (patch: Partial<CheckoutDraft>) => void;
  /** Wipe the draft — call after a successful checkout. */
  clear: () => void;
};

export const useCheckoutDraftStore = create<DraftState & DraftActions>()(
  persist(
    (set) => ({
      draft: EMPTY_DRAFT,

      patch: (patch) =>
        set((state) => ({ draft: { ...state.draft, ...patch } })),

      clear: () => set({ draft: EMPTY_DRAFT }),
    }),
    {
      name: "cm-checkout-draft",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** Returns true when the draft has at least one non-default field. */
export function hasDraftContent(d: CheckoutDraft): boolean {
  return Boolean(
    d.fullName ||
      d.email ||
      d.phoneNumber ||
      d.companyName ||
      d.ice ||
      d.street ||
      d.city ||
      d.postalCode,
  );
}
