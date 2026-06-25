"use client";

// useAuth — single auth API for the entire client app.
//
// Wraps Better-Auth's `useSession()` and bridges into the demo
// `accountStore` so consumers get ONE call returning everything they
// need: session status, signed-in flag, the user's profile, and a
// session-ready signal for guard rendering.
//
// Use this in components anywhere — Header, AccountShell, checkout,
// financing, etc. — instead of reaching into `useAccountStore` or
// `useSession` directly. The bridge sync is performed once globally
// by `<AuthBridge />`; this hook only consumes the resulting state.

import {
  selectCurrentProfile,
  useAccountStore,
  type AccountProfile,
} from "@/lib/accountStore";
import { useSession } from "@/lib/auth-client";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
  // Business additionalFields we declared in src/server/auth.ts
  fullName?: string;
  phone?: string;
  odooContactId?: string;
};

type UseAuthResult = {
  /** Better-Auth session payload (raw). null when signed out. */
  session: { user: SessionUser } | null | undefined;
  /** Convenience: the user object alone. */
  user: SessionUser | null;
  /** Demo profile mirror used by /account portal + checkout prefill. */
  profile: AccountProfile | undefined;
  /** True until Better-Auth completes the first session probe. */
  isPending: boolean;
  /** True once the session probe is done AND a session exists. */
  isSignedIn: boolean;
  /** Email if signed in, else undefined. */
  email: string | undefined;
};

export function useAuth(): UseAuthResult {
  const { data, isPending } = useSession();
  const profile = useAccountStore(selectCurrentProfile);

  const session = (data ?? null) as UseAuthResult["session"];
  const user = (session?.user ?? null) as SessionUser | null;

  return {
    session,
    user,
    profile,
    isPending,
    isSignedIn: Boolean(user),
    email: user?.email,
  };
}
