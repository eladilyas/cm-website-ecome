// Account route shell — wraps every /account/* page with the
// auth-guarded sidebar layout.
//
// Two server-side guards run before AccountShell renders:
//   1. `loadActor()` re-verifies the Better-Auth session AGAINST THE
//      DATABASE. Middleware only checks cookie presence — a forged
//      or expired cookie passes that gate, so the layout must do its
//      own check or unauthenticated requests would leak server-rendered
//      account chrome (and trigger 500s when client islands call
//      authenticated APIs).
//   2. Operators (super-admin / admin / pre-sales / dispatcher) belong
//      in /admin, never in the customer portal. They get a server-side
//      redirect before any markup ships, even if their account also
//      carries the customer role.

import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account/AccountShell";
import { loadActor } from "@/server/policy";
import { isOperatorRole } from "@/server/rbac/catalog";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await loadActor();
  if (!actor) {
    // No valid session — bounce to signin with the current path as
    // `?next=` so the user lands back here after authenticating.
    // The layout can't read the request URL synchronously, so it
    // sends to plain /signin and lets the signin page default to
    // /account.
    redirect("/signin?next=/account");
  }
  if (actor.roles.some(isOperatorRole)) {
    redirect("/admin");
  }
  return <AccountShell>{children}</AccountShell>;
}
