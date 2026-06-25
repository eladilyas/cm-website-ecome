// 403 — landing page for "signed in but not allowed".
//
// Used by `requireRole()` in src/server/auth-helpers.ts. We keep the
// page tone honest + non-alarming: it's almost always a missing role
// grant, not an attacker.

import Link from "next/link";

export const metadata = {
  title: "Access required · Caisse Manager",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-canvas px-6 py-16">
      <div className="max-w-[480px] text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-mute font-medium mb-3">
          Access required
        </p>
        <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-semibold tracking-[-0.022em] leading-[1.1] text-ink">
          You don&rsquo;t have access to this page.
        </h1>
        <p className="mt-4 text-[14px] text-ink-soft leading-[1.55]">
          Your account is signed in but doesn&rsquo;t carry the role needed
          for this area. If you believe this is a mistake, ask a Super
          Admin to grant your account the right role.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-hairline-strong bg-paper px-5 text-[13px] font-medium text-ink hover:bg-fog transition-colors"
          >
            Back to site
          </Link>
          <Link
            href="/account"
            className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-medium text-paper hover:bg-ink-soft transition-colors"
          >
            My account
          </Link>
        </div>
      </div>
    </div>
  );
}
