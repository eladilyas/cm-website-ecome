"use client";

// Tiny sign-out button used in the admin top bar. Clears Better-Auth's
// cookie + the demo accountStore + routes to /signin.
//
// Kept as its own file (rather than inlined in AdminShell) so the
// shell can stay a server component.

import { useRouter } from "next/navigation";

import { signOut as authSignOut } from "@/lib/auth-client";
import { useAccountStore } from "@/lib/accountStore";

export function AdminSignOut() {
  const router = useRouter();

  async function handle() {
    await authSignOut();
    useAccountStore.getState().signOut();
    router.push("/signin");
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex h-9 items-center justify-center rounded-full border border-hairline-strong bg-paper px-3.5 text-[12px] font-medium text-ink-soft hover:text-ink hover:bg-fog transition-colors duration-200"
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      Sign out
    </button>
  );
}
