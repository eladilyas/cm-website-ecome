"use client";

// /signin — premium email + password sign-in.
//
// Wired to Better-Auth via authClient.signIn.email(). On success we
// route to ?next=<path> (default /account). On failure we surface the
// provider error verbatim — Better-Auth returns user-readable messages
// for the common cases ("Invalid email or password", etc.).
//
// Visual language lives in @/components/auth/AuthShell + AuthForm —
// this file is composition + state only.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  AuthInput,
  AuthPasswordInput,
  AuthSubmit,
  ErrorBanner,
  Field,
} from "@/components/auth/AuthForm";
import { signIn } from "@/lib/auth-client";
import { safeNext } from "@/lib/safeNext";

export default function SigninPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <SigninContent />
    </Suspense>
  );
}

function SigninContent() {
  const router = useRouter();
  const params = useSearchParams();
  // safeNext rejects protocol-relative URLs (`//evil.com/...`),
  // control-character splits, and `/admin/*` paths that customer
  // signin must never redirect to.
  const nextHref = safeNext(params.get("next"), {
    fallback: "/account",
    allowAdmin: false,
  });
  const prefillEmail = params.get("email") ?? "";

  const tSignIn = useTranslations("auth.signIn");
  const tFields = useTranslations("auth.fields");
  const tValidation = useTranslations("auth.validation");

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: typeof fieldErrors = {};
    const e = email.trim();
    if (!e) next.email = tValidation("required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      next.email = tValidation("invalidEmail");
    if (!password) next.password = tValidation("required");
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setFormError(undefined);
    setSubmitting(true);

    try {
      const { error } = await signIn.email({
        email: email.trim(),
        password,
        callbackURL: nextHref,
      });
      if (error) {
        // Better-Auth's `{ error }` shape collapses to `{}` when the
        // backend never produced a structured response (network drop,
        // 5xx with empty body, Prisma reaching an unreachable DB). Log
        // the keys + status so the cause shows up in the console
        // even when the message is undefined.
        const keys = Object.keys(error);
        console.error("[signIn] error", {
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
              ? tSignIn("submittingUnreachable")
              : `${tSignIn("submittingFailed")}${error.code ? ` (${error.code})` : ""}`),
        );
        setSubmitting(false);
        return;
      }
      // On success Better-Auth sets the session cookie. Push the user
      // forward; the destination should re-fetch session state.
      router.push(nextHref);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : tValidation("generic"),
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow={tSignIn("eyebrow")}
      heading={<>{tSignIn("heading")}</>}
      subheading={tSignIn("subheading")}
      footer={
        <p className="text-[13px] text-ink-soft text-center">
          {tSignIn("footerQuestion")}{" "}
          <Link
            href={`/signup${nextHref !== "/account" ? `?next=${encodeURIComponent(nextHref)}` : ""}`}
            className="text-ink font-medium hover:underline underline-offset-[5px]"
          >
            {tSignIn("footerLink")}
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <ErrorBanner message={formError} />

        <Field label={tFields("email")} error={fieldErrors.email}>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((s) => ({ ...s, email: undefined }));
              }
            }}
            placeholder={tFields("emailPlaceholder")}
            autoComplete="email"
            autoFocus
            errored={Boolean(fieldErrors.email)}
            inputMode="email"
          />
        </Field>

        <Field
          label={tFields("password")}
          error={fieldErrors.password}
          hint={
            <Link
              href="/signin/forgot"
              className="hover:text-ink transition-colors underline-offset-[5px] hover:underline"
            >
              {tFields("forgotPassword")}
            </Link>
          }
        >
          <AuthPasswordInput
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((s) => ({ ...s, password: undefined }));
              }
            }}
            placeholder={tFields("passwordSignInPlaceholder")}
            autoComplete="current-password"
            errored={Boolean(fieldErrors.password)}
          />
        </Field>

        <div className="pt-2">
          <AuthSubmit loading={submitting}>{tSignIn("submit")}</AuthSubmit>
        </div>

        <ConsentLine variant="signIn" />
      </form>
    </AuthShell>
  );
}

function ConsentLine({ variant }: { variant: "signIn" | "signUp" }) {
  const t = useTranslations("auth");
  const raw = variant === "signIn" ? t.raw("consent") : t.raw("consentSignUp");
  // The catalog stores the line with <terms>...</terms> and
  // <privacy>...</privacy> placeholders so each locale can phrase the
  // sentence naturally around the link text. We split on the markers
  // here and stitch in next-intl Links so the prose stays one line.
  const text = typeof raw === "string" ? raw : "";
  const parts = text
    .replace("<terms>", "[[T]]")
    .replace("</terms>", "[[/T]]")
    .replace("<privacy>", "[[P]]")
    .replace("</privacy>", "[[/P]]");

  const segments: React.ReactNode[] = [];
  let remaining = parts;
  let key = 0;
  while (remaining.length > 0) {
    const tStart = remaining.indexOf("[[T]]");
    const pStart = remaining.indexOf("[[P]]");
    const nextIdx = [tStart, pStart].filter((n) => n >= 0).sort((a, b) => a - b)[0];
    if (nextIdx === undefined || nextIdx < 0) {
      segments.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (nextIdx > 0) segments.push(<span key={key++}>{remaining.slice(0, nextIdx)}</span>);
    if (nextIdx === tStart) {
      const close = remaining.indexOf("[[/T]]");
      const label = remaining.slice(nextIdx + 5, close);
      segments.push(
        <Link
          key={key++}
          href="/legal/terms"
          className="text-ink-soft hover:text-ink underline-offset-[4px] hover:underline"
        >
          {label}
        </Link>,
      );
      remaining = remaining.slice(close + 6);
    } else {
      const close = remaining.indexOf("[[/P]]");
      const label = remaining.slice(nextIdx + 5, close);
      segments.push(
        <Link
          key={key++}
          href="/legal/privacy"
          className="text-ink-soft hover:text-ink underline-offset-[4px] hover:underline"
        >
          {label}
        </Link>,
      );
      remaining = remaining.slice(close + 6);
    }
  }

  return (
    <p className="text-[11.5px] text-ink-mute text-center leading-[1.55] pt-1">
      {segments}
    </p>
  );
}

function AuthFallback() {
  const t = useTranslations("auth");
  return (
    <div className="min-h-svh bg-paper flex items-center justify-center">
      <div className="text-[13px] text-ink-mute">{t("loading")}</div>
    </div>
  );
}
