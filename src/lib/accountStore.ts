"use client";

// Account persistence — Phase C4.
//
// Demo-grade auth (no password, no real backend). Keeps a small
// directory of profiles keyed by id, plus a `currentId` for the
// signed-in session. A returning visitor on the same browser can
// sign in via email lookup if they signed up before; otherwise
// the signin page redirects to signup with the email pre-filled.
//
// Real auth would use NextAuth / Supabase / Clerk here. The whole
// flow is local — when we wire a real backend later, the public
// API (signUp, signIn, signOut, useCurrentProfile) is what to
// preserve; the persisted directory turns into a fetch().

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AccountProfile = {
  id: string;
  fullName: string;
  email: string;
  /** Dial code only — "+212" etc. */
  phoneCode: string;
  /** National number (no leading zero / no dial code). */
  phoneNumber: string;
  companyName: string;
  /** Moroccan ICE / Patente — optional. */
  companyIce?: string;
  createdAt: number;
};

type SignUpInput = Omit<AccountProfile, "id" | "createdAt">;

type AccountState = {
  /** Directory of every profile that has ever signed up on this
   *  browser. Keyed by stable id. Email is unique-by-convention but
   *  not enforced beyond a case-insensitive lookup. */
  directory: Record<string, AccountProfile>;
  /** Currently signed-in profile id. null = signed out. */
  currentId: string | null;
};

type AccountActions = {
  signUp: (input: SignUpInput) => AccountProfile;
  /** Looks the email up case-insensitively. Returns true on
   *  success (and sets currentId); false if no account exists. */
  signIn: (email: string) => boolean;
  signOut: () => void;
  updateProfile: (patch: Partial<SignUpInput>) => void;
};

const INITIAL: AccountState = {
  directory: {},
  currentId: null,
};

const uid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

const normalize = (email: string) => email.trim().toLowerCase();

export const useAccountStore = create<AccountState & AccountActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      signUp: (input) => {
        const state = get();
        const emailKey = normalize(input.email);

        // If an account with this email already exists on this
        // browser, treat signUp as signIn-with-overwrite — keep
        // the existing id but update the profile fields. Avoids
        // creating duplicates when a user fills the signup form
        // twice (e.g. after clearing cache).
        const existing = Object.values(state.directory).find(
          (p) => normalize(p.email) === emailKey,
        );
        if (existing) {
          const updated: AccountProfile = {
            ...existing,
            fullName: input.fullName,
            phoneCode: input.phoneCode,
            phoneNumber: input.phoneNumber,
            companyName: input.companyName,
            companyIce: input.companyIce,
          };
          set({
            directory: { ...state.directory, [existing.id]: updated },
            currentId: existing.id,
          });
          return updated;
        }

        const profile: AccountProfile = {
          id: uid("acc"),
          createdAt: Date.now(),
          ...input,
        };
        set({
          directory: { ...state.directory, [profile.id]: profile },
          currentId: profile.id,
        });
        return profile;
      },

      signIn: (email) => {
        const emailKey = normalize(email);
        const match = Object.values(get().directory).find(
          (p) => normalize(p.email) === emailKey,
        );
        if (!match) return false;
        set({ currentId: match.id });
        return true;
      },

      signOut: () => set({ currentId: null }),

      updateProfile: (patch) => {
        const state = get();
        const id = state.currentId;
        if (!id) return;
        const current = state.directory[id];
        if (!current) return;
        set({
          directory: {
            ...state.directory,
            [id]: { ...current, ...patch },
          },
        });
      },
    }),
    {
      name: "cm-account",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

// ── Selectors ────────────────────────────────────────────────────────

/** Current profile (or undefined when signed out). Use inside React
 *  components via `useAccountStore(selectCurrentProfile)`. */
export function selectCurrentProfile(
  state: AccountState,
): AccountProfile | undefined {
  return state.currentId ? state.directory[state.currentId] : undefined;
}

/** Convenience boolean — true when there's an active session. */
export function selectIsSignedIn(state: AccountState): boolean {
  return state.currentId !== null;
}

/** Initials for the header chip (e.g. "Jane Doe" → "JD"). Always
 *  uppercase. Falls back to first two letters of the email if no
 *  fullName is set. */
export function getInitials(profile: AccountProfile): string {
  const parts = profile.fullName.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return profile.email.slice(0, 2).toUpperCase();
}
