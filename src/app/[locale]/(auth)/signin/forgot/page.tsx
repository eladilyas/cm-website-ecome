"use client";

// /signin/forgot — password-reset request form.
//
// One field: email. On submit we call Better-Auth's `forgetPassword`,
// which fans out via our NotificationService (Resend in prod, console
// log in demo). We ALWAYS render the same confirmation regardless of
// whether the email is registered — exposing the difference would let
// an attacker enumerate accounts. The reset link itself is single-use
// and short-lived; security lives in the token, not the response copy.

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  AuthInput,
  AuthSubmit,
  ErrorBanner,
  Field,
} from "@/components/auth/AuthForm";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const t = useTranslations("auth.forgot");
  const tFields = useTranslations("auth.fields");
  const tValidation = useTranslations("auth.validation");

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError(tValidation("required"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError(tValidation("invalidEmail"));
      return;
    }
    setFieldError(undefined);
    setFormError(undefined);
    setSubmitting(true);
    try {
      // redirectTo is the page the email link sends them to after
      // they click — Better-Auth appends `?token=...` so the reset
      // page can submit a new password with the bearer token.
      await authClient.requestPasswordReset({
        email: trimmed,
        redirectTo: "/signin/reset",
      });
      // Always render the success state regardless of whether the
      // email was registered (account enumeration defence).
      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : tValidation("generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      heading={<>{t("heading")}</>}
      subheading={sent ? t("sentSubheading") : t("subheading")}
      footer={
        <p className="text-[13px] text-ink-soft text-center">
          {t("footerQuestion")}{" "}
          <Link
            href="/signin"
            className="text-ink font-medium hover:underline underline-offset-[5px]"
          >
            {t("footerLink")}
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-[13px] text-emerald-800 leading-[1.55]"
            role="status"
          >
            {t("sentBanner", { email })}
          </div>
          <p className="text-[12.5px] text-ink-mute leading-[1.6]">
            {t("sentHint")}
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <ErrorBanner message={formError} />

          <Field label={tFields("email")} error={fieldError}>
            <AuthInput
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError(undefined);
              }}
              placeholder={tFields("emailPlaceholder")}
              autoComplete="email"
              autoFocus
              errored={Boolean(fieldError)}
              inputMode="email"
            />
          </Field>

          <AuthSubmit loading={submitting}>
            {submitting ? t("submitting") : t("submit")}
          </AuthSubmit>
        </form>
      )}
    </AuthShell>
  );
}
