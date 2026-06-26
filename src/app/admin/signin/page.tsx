// Admin sign-in — operator-only entry point.
//
// Lives outside the customer `/signin` flow on purpose:
//   • Different chrome — dark, focused, no marketing nav. The
//     middleware-level admin gate redirects all unauth `/admin/*`
//     traffic here, so this is the canonical operator login.
//   • Different post-auth route — successful sign-in lands the
//     operator at `/admin` (or the original `?next=` if it pointed
//     inside `/admin`). The customer `/signin` lands users in
//     `/account` and is the wrong destination for staff.
//   • Different copy — "Sign in to the admin console" rather than
//     the consumer-facing "Welcome back" register.
//
// The form itself reuses Better-Auth's `signIn.email` client just
// like the customer signin — only the surface and routing differ.

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { signIn } from "@/lib/auth-client";

export default function AdminSigninPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminSigninForm />
    </Suspense>
  );
}

function Fallback() {
  return (
    <main className="min-h-svh grid place-items-center bg-night text-paper">
      <p className="text-[12px] text-paper/55">Loading…</p>
    </main>
  );
}

function AdminSigninForm() {
  const router = useRouter();
  const params = useSearchParams();

  // Where to land after a successful sign-in. We accept the `?next=`
  // hint the middleware sets when redirecting unauth admin traffic,
  // but ONLY if it points inside `/admin/*` — otherwise we fall back
  // to the admin home so operators never leak into the customer
  // portal even if a stale link tries to push them there.
  const nextRaw = params.get("next") ?? "/admin";
  const nextHref =
    nextRaw === "/admin" || nextRaw.startsWith("/admin/") ? nextRaw : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }
    setFormError(undefined);
    setSubmitting(true);
    try {
      const { error } = await signIn.email({
        email: email.trim(),
        password,
        callbackURL: nextHref,
      });
      if (error) {
        const keys = Object.keys(error);
        console.error("[admin signIn] error", {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          code: error.code,
          keys,
        });
        const empty = keys.length === 0 && !error.message;
        setFormError(
          error.message ||
            error.statusText ||
            (empty
              ? "Authentication service unreachable. Please try again in a moment."
              : `Sign-in failed.${error.code ? ` (${error.code})` : ""}`),
        );
        setSubmitting(false);
        return;
      }
      router.push(nextHref);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-svh grid place-items-center bg-night text-paper px-6 py-12">
      <div className="w-full max-w-[420px]">
        {/* Brand mark + eyebrow */}
        <div className="text-center mb-10">
          <div
            aria-hidden
            className="inline-flex items-center justify-center w-11 h-11 rounded-[10px] bg-[#E11D2A]/12 ring-1 ring-[#E11D2A]/35 mb-5"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5.5 10.2l3 3 6-7"
                stroke="#ff8a92"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-paper/45 mb-2">
            Caisse Manager · Admin console
          </p>
          <h1 className="text-[clamp(1.5rem,2.6vw,1.875rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-paper">
            Sign in to the admin console
          </h1>
          <p className="mt-2.5 text-[13px] text-paper/60 leading-[1.55]">
            Operator access only. Customers should{" "}
            <Link
              href="/signin"
              className="text-paper/85 underline underline-offset-[5px] decoration-paper/30 hover:decoration-paper/70 transition-colors"
            >
              sign in here
            </Link>
            .
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-[14px] bg-white/[0.04] ring-1 ring-white/10 backdrop-blur-sm p-7 md:p-8">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {formError && (
              <div className="rounded-lg border border-[#E11D2A]/40 bg-[#E11D2A]/10 px-3.5 py-2.5 text-[12.5px] text-[#ffb3b8]">
                {formError}
              </div>
            )}

            <label className="block">
              <span className="block text-[11.5px] font-medium uppercase tracking-[0.14em] text-paper/55 mb-1.5">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@caissemanager.com"
                autoComplete="email"
                inputMode="email"
                autoFocus
                className="w-full h-11 px-3.5 rounded-lg bg-night/60 border border-white/12 text-[13.5px] text-paper placeholder:text-paper/35 focus:outline-none focus:border-paper/40 transition-colors"
              />
            </label>

            <label className="block">
              <span className="block text-[11.5px] font-medium uppercase tracking-[0.14em] text-paper/55 mb-1.5">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-11 px-3.5 rounded-lg bg-night/60 border border-white/12 text-[13.5px] text-paper placeholder:text-paper/35 focus:outline-none focus:border-paper/40 transition-colors"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full h-11 rounded-lg bg-[#E11D2A] text-white text-[13.5px] font-medium enabled:hover:bg-[#c8141f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-7 text-center text-[11.5px] text-paper/40 leading-[1.55]">
          Need an operator account? Contact your super-admin — operator
          access is provisioned manually, not self-served.
        </p>
      </div>
    </main>
  );
}
