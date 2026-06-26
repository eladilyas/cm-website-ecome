"use client";

// /signin/reset — landing page that the reset-password email links to.
//
// Reads a single-use `token` from the URL (Better-Auth appended it),
// asks the user for a new password, calls `resetPassword`. On success
// we route the user back to /signin so they can log in with the new
// credentials — Better-Auth invalidates other live sessions on reset.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  AuthPasswordInput,
  AuthSubmit,
  ErrorBanner,
  Field,
} from "@/components/auth/AuthForm";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const t = useTranslations("auth.reset");
  const tFields = useTranslations("auth.fields");
  const tValidation = useTranslations("auth.validation");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: typeof fieldErrors = {};
    if (!password) next.password = tValidation("required");
    else if (password.length < 8) next.password = tValidation("passwordShort");
    if (!confirm) next.confirm = tValidation("required");
    else if (confirm !== password) next.confirm = tValidation("passwordMismatch");
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setFormError(t("missingToken"));
      return;
    }
    if (!validate()) return;
    setFormError(undefined);
    setSubmitting(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (error) {
        setFormError(error.message || t("failed"));
        setSubmitting(false);
        return;
      }
      // Reset OK — bounce to /signin with a marker so the page can
      // surface a "password updated" confirmation banner.
      router.push("/signin?reset=ok");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : tValidation("generic"));
      setSubmitting(false);
    }
  }

  const missingToken = !token;

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      heading={<>{t("heading")}</>}
      subheading={missingToken ? t("missingTokenHint") : t("subheading")}
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
      {missingToken ? (
        <div className="space-y-4">
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-[13px] text-amber-800 leading-[1.55]"
            role="status"
          >
            {t("missingToken")}
          </div>
          <Link
            href="/signin/forgot"
            className="inline-flex items-center text-[13px] text-ink font-medium hover:underline underline-offset-[5px]"
          >
            {t("requestNewLink")} →
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <ErrorBanner message={formError} />

          <Field label={tFields("newPassword")} error={fieldErrors.password}>
            <AuthPasswordInput
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((s) => ({ ...s, password: undefined }));
              }}
              placeholder={tFields("passwordSignUpPlaceholder")}
              autoComplete="new-password"
              autoFocus
              errored={Boolean(fieldErrors.password)}
            />
          </Field>

          <Field
            label={tFields("confirmPassword")}
            error={fieldErrors.confirm}
          >
            <AuthPasswordInput
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (fieldErrors.confirm)
                  setFieldErrors((s) => ({ ...s, confirm: undefined }));
              }}
              placeholder={tFields("passwordSignUpPlaceholder")}
              autoComplete="new-password"
              errored={Boolean(fieldErrors.confirm)}
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
