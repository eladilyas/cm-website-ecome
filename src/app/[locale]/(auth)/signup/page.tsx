"use client";

// /signup — premium email + password sign-up.
//
// Wired to Better-Auth via authClient.signUp.email(). Sends `name` as
// the Better-Auth display name; `fullName` flows through the
// `additionalFields` declared in src/server/auth.ts and persists to the
// Prisma User row.
//
// Password requirements visible inline (mins, mix). On success Better-
// Auth auto-signs the user in (autoSignIn: true in auth config) and
// we route to ?next=<path>.

import { Suspense, useMemo, useState } from "react";
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
import { signUp } from "@/lib/auth-client";
import { safeNext } from "@/lib/safeNext";

const MIN_PASSWORD_LEN = 8;

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const params = useSearchParams();
  // safeNext rejects protocol-relative URLs and `/admin/*` paths so
  // customer signup can't be turned into an open redirect.
  const nextHref = safeNext(params.get("next"), {
    fallback: "/account",
    allowAdmin: false,
  });
  const prefillEmail = params.get("email") ?? "";

  const tSignUp = useTranslations("auth.signUp");
  const tFields = useTranslations("auth.fields");
  const tValidation = useTranslations("auth.validation");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Derived: lightweight password strength signal. Three buckets keep
  // the indicator legible at a glance without a noisy progress bar.
  const strength = useMemo<"weak" | "ok" | "strong" | null>(() => {
    if (!password) return null;
    if (password.length < MIN_PASSWORD_LEN) return "weak";
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score >= 3 && password.length >= 12) return "strong";
    return "ok";
  }, [password]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = tValidation("required");
    const e = email.trim();
    if (!e) next.email = tValidation("required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      next.email = tValidation("invalidEmail");
    if (!password) next.password = tValidation("required");
    else if (password.length < MIN_PASSWORD_LEN)
      next.password = tValidation("passwordLength", { min: MIN_PASSWORD_LEN });
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setFormError(undefined);
    setSubmitting(true);

    try {
      const { error } = await signUp.email({
        email: email.trim(),
        password,
        name: fullName.trim(),
        fullName: fullName.trim(),
        callbackURL: nextHref,
      } as Parameters<typeof signUp.email>[0]);
      if (error) {
        console.error("[signUp] error:", error);
        setFormError(
          error.message ||
            error.statusText ||
            `${tSignUp("submittingFailed")}${error.code ? ` (${error.code})` : ""}`,
        );
        setSubmitting(false);
        return;
      }
      router.push(nextHref);
      router.refresh();
    } catch (err) {
      console.error("[signUp] threw:", err);
      setFormError(
        err instanceof Error ? err.message : tValidation("generic"),
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow={tSignUp("eyebrow")}
      heading={`${tSignUp("headingLine1")} ${tSignUp("headingLine2")}`}
      subheading={tSignUp("subheading")}
      footer={
        <p className="text-[13px] text-ink-soft text-center">
          {tSignUp("footerQuestion")}{" "}
          <Link
            href={`/signin${nextHref !== "/account" ? `?next=${encodeURIComponent(nextHref)}` : ""}`}
            className="text-ink font-medium hover:underline underline-offset-[5px]"
          >
            {tSignUp("footerLink")}
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <ErrorBanner message={formError} />

        <Field label={tFields("fullName")} error={fieldErrors.fullName}>
          <AuthInput
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) {
                setFieldErrors((s) => {
                  const { fullName: _drop, ...rest } = s;
                  void _drop;
                  return rest;
                });
              }
            }}
            placeholder={tFields("fullNamePlaceholder")}
            autoComplete="name"
            autoFocus
            errored={Boolean(fieldErrors.fullName)}
          />
        </Field>

        <Field label={tFields("email")} error={fieldErrors.email}>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((s) => {
                  const { email: _drop, ...rest } = s;
                  void _drop;
                  return rest;
                });
              }
            }}
            placeholder={tFields("emailPlaceholder")}
            autoComplete="email"
            errored={Boolean(fieldErrors.email)}
            inputMode="email"
          />
        </Field>

        <Field
          label={tFields("password")}
          error={fieldErrors.password}
          hint={
            password && strength ? (
              <PasswordStrengthTag strength={strength} />
            ) : (
              <span className="text-ink-mute">
                {tFields("passwordRequirement", { min: MIN_PASSWORD_LEN })}
              </span>
            )
          }
        >
          <AuthPasswordInput
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((s) => {
                  const { password: _drop, ...rest } = s;
                  void _drop;
                  return rest;
                });
              }
            }}
            placeholder={tFields("passwordSignUpPlaceholder")}
            autoComplete="new-password"
            errored={Boolean(fieldErrors.password)}
          />
        </Field>

        <div className="pt-2">
          <AuthSubmit loading={submitting}>{tSignUp("submit")}</AuthSubmit>
        </div>

        <ConsentLine />
      </form>
    </AuthShell>
  );
}

function PasswordStrengthTag({
  strength,
}: {
  strength: "weak" | "ok" | "strong";
}) {
  const tFields = useTranslations("auth.fields");
  if (strength === "weak") {
    return <span className="text-amber-600 font-medium">{tFields("passwordWeak")}</span>;
  }
  if (strength === "ok") {
    return <span className="text-ink-soft">{tFields("passwordOk")}</span>;
  }
  return (
    <span className="text-emerald-600 font-medium">{tFields("passwordStrong")}</span>
  );
}

/** Inline terms-and-privacy consent line. Catalog stores the prose
 *  with <terms>...</terms> and <privacy>...</privacy> markers so each
 *  locale can phrase the sentence naturally around the link text; we
 *  parse those markers here and stitch in locale-aware <Link>s. */
function ConsentLine() {
  const t = useTranslations("auth");
  const raw = t.raw("consentSignUp");
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
