"use client";

// AuthBridge — mounts once at the root and mirrors Better-Auth's
// session into the demo `accountStore`. Idempotent: only writes to
// the store when the cookie session changes.
//
// Why a global bridge instead of per-page logic:
//   • Header, checkout, account portal, and future surfaces all need
//     the mirrored profile.
//   • Running the sync in N components would mean N effects ping-pong
//     on store updates.
//   • One mount in `<SiteChrome>` keeps it consistent + auditable.
//
// The component itself renders nothing.

import { useEffect } from "react";

import { useSession } from "@/lib/auth-client";
import { useAccountStore } from "@/lib/accountStore";
import { DEFAULT_PHONE_CODE } from "@/data/phoneCodes";

export function AuthBridge() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    const state = useAccountStore.getState();

    // Signed out — clear the local profile pointer.
    if (!session?.user) {
      if (state.currentId) state.signOut();
      return;
    }

    // Signed in — find a profile in the local directory keyed by
    // email. If present, point currentId at it (idempotent). If not,
    // create a stub with the data Better-Auth knows about; the user
    // fills in company name / phone / ICE via /account/profile.
    const u = session.user as {
      email: string;
      name?: string;
      fullName?: string;
      phone?: string;
    };
    const existing = Object.values(state.directory).find(
      (p) => p.email.toLowerCase() === u.email.toLowerCase(),
    );
    if (existing) {
      if (state.currentId !== existing.id) {
        useAccountStore.setState({ currentId: existing.id });
      }
      return;
    }

    state.signUp({
      fullName: u.fullName || u.name || u.email.split("@")[0] || "",
      email: u.email,
      phoneCode: DEFAULT_PHONE_CODE,
      phoneNumber: u.phone ?? "",
      companyName: "",
    });
  }, [session, isPending]);

  return null;
}
