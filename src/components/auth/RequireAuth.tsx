"use client";

// RequireAuth — declarative client-side auth guard.
//
// Wrap any subtree that requires a signed-in user. While the session
// is being probed, renders `fallback` (default: a quiet loading line).
// Once the probe resolves to a signed-out state, replaces the subtree
// with a redirect to /signin?next=<current>. Once signed in, renders
// children.
//
// Use this for fine-grained client guards (e.g. a "Submit" button on
// a partially-anonymous page). For full-route protection prefer the
// server-side middleware at src/middleware.ts — it's faster and has
// no flash of unauthenticated UI.

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({
  children,
  fallback,
  redirectTo = "/signin",
}: {
  children: ReactNode;
  /** Rendered while the session is being probed. */
  fallback?: ReactNode;
  /** Sign-in URL — defaults to /signin; pass /signup for new flows. */
  redirectTo?: "/signin" | "/signup";
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { isPending, isSignedIn } = useAuth();

  useEffect(() => {
    if (isPending) return;
    if (isSignedIn) return;
    const target = encodeURIComponent(pathname);
    router.replace(`${redirectTo}?next=${target}`);
  }, [isPending, isSignedIn, pathname, redirectTo, router]);

  if (isPending || !isSignedIn) {
    return (
      <>
        {fallback ?? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <p className="text-[13px] text-ink-mute">Loading your account…</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
