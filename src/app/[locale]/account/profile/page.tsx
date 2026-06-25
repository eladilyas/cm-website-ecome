"use client";

// Profile editor — edit the persisted account profile fields. Saves
// inline (no separate confirmation page); a transient "Saved" pill
// surfaces success without a modal interrupt. Every label resolves
// through next-intl so the form lives natively in FR and EN.

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  selectCurrentProfile,
  useAccountStore,
} from "@/lib/accountStore";
import { PhoneInput } from "@/components/forms/PhoneInput";

export default function ProfilePage() {
  const profile = useAccountStore(selectCurrentProfile);
  const updateProfile = useAccountStore((s) => s.updateProfile);
  const t = useTranslations("account.profilePage");

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phoneCode, setPhoneCode] = useState(profile?.phoneCode ?? "+212");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");
  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");
  const [companyIce, setCompanyIce] = useState(profile?.companyIce ?? "");

  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Sync local form state when profile changes (rehydrate / switch).
  // React 19 "previous prop in state" pattern — no effect needed.
  const [lastId, setLastId] = useState(profile?.id);
  if (profile && profile.id !== lastId) {
    setLastId(profile.id);
    setFullName(profile.fullName);
    setPhoneCode(profile.phoneCode);
    setPhoneNumber(profile.phoneNumber);
    setCompanyName(profile.companyName);
    setCompanyIce(profile.companyIce ?? "");
  }

  useEffect(() => {
    if (!savedAt) return;
    const id = window.setTimeout(() => setSavedAt(null), 3000);
    return () => window.clearTimeout(id);
  }, [savedAt]);

  if (!profile) {
    return null; // Shell handles auth-guard / loading
  }

  const dirty =
    fullName !== profile.fullName ||
    phoneCode !== profile.phoneCode ||
    phoneNumber !== profile.phoneNumber ||
    companyName !== profile.companyName ||
    (companyIce ?? "") !== (profile.companyIce ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    updateProfile({
      fullName: fullName.trim(),
      email: profile.email,
      phoneCode,
      phoneNumber: phoneNumber.trim(),
      companyName: companyName.trim(),
      companyIce: companyIce.trim() ? companyIce.trim() : undefined,
    });
    setSavedAt(Date.now());
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
          {t("eyebrow")}
        </p>
        <h2 className="mt-0.5 text-[20px] md:text-[22px] font-semibold tracking-[-0.012em] text-ink">
          {t("title")}
        </h2>
        <p className="mt-1 text-[13px] text-ink-soft">{t("subtitle")}</p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-paper border border-hairline p-5 md:p-7 space-y-5"
      >
        <Field label={t("fullName")} htmlFor="fullName">
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            className={inputClass}
          />
        </Field>

        <Field label={t("email")} htmlFor="email" hint={t("emailReadonly")}>
          <input
            id="email"
            type="email"
            value={profile.email}
            readOnly
            className={inputClass + " bg-canvas text-ink-mute"}
          />
        </Field>

        <Field label={t("phone")} htmlFor="phoneNumber">
          <PhoneInput
            phoneCode={phoneCode}
            phoneNumber={phoneNumber}
            onPhoneCodeChange={setPhoneCode}
            onPhoneNumberChange={setPhoneNumber}
          />
        </Field>

        <Field label={t("companyName")} htmlFor="companyName">
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            autoComplete="organization"
            className={inputClass}
          />
        </Field>

        <Field
          label={t("companyIce")}
          htmlFor="companyIce"
          hint={t("iceOptional")}
        >
          <input
            id="companyIce"
            type="text"
            value={companyIce}
            onChange={(e) => setCompanyIce(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11.5px] text-ink-mute">
            {savedAt ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckIcon />
                {t("saved")}
              </span>
            ) : dirty ? (
              t("dirty")
            ) : (
              t("clean")
            )}
          </p>
          <button
            type="submit"
            disabled={!dirty}
            className={
              "inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] font-medium transition-colors " +
              (dirty
                ? "bg-ink text-paper hover:bg-ink-soft"
                : "bg-canvas border border-hairline text-ink-mute cursor-not-allowed")
            }
            style={{
              transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-hairline bg-paper px-3.5 text-[14px] text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-hairline-strong transition-all";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label
          htmlFor={htmlFor}
          className="text-[12px] font-medium text-ink-soft"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[11px] text-ink-mute">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.5l2.5 2.5L9.5 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
