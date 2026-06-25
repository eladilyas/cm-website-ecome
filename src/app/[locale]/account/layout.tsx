// Account route shell — wraps every /account/* page with the
// auth-guarded sidebar layout.
//
// Two guards run before AccountShell renders:
//   1. Cookie presence is enforced one layer up by src/middleware.ts.
//   2. Role check here — operators (super-admin / admin / pre-sales
//      / dispatcher) belong in /admin, never in the customer portal.
//      They get a server-side redirect to /admin before any markup
//      ships. This keeps the customer surface a strict customer-only
//      space even when an operator account also carries the customer
//      role chip.

import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account/AccountShell";
import { getUserRoles } from "@/server/auth-helpers";
import { isOperatorRole } from "@/server/rbac/catalog";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const roles = await getUserRoles();
  if (roles.some(isOperatorRole)) {
    redirect("/admin");
  }
  return <AccountShell>{children}</AccountShell>;
}
