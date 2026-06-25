"use client";

// /start-free-trial — high-conversion lead-capture page.
//
// Layout: 2-column split (Apple-style flagship signup). Left column carries
// value props + social proof + trust signals — so the user understands what
// they're getting before they decide to enter their details. Right column
// is the form card itself, elevated on bg-paper to feel like a focused
// action. Mobile stacks: form first (above the fold), value props below.
//
// Every visible string flows through next-intl; the consent + support
// links are stitched at runtime from <terms>/<privacy>/<link> markers
// so each locale phrases the surrounding sentence naturally.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { TextField } from "@/components/forms/TextField";
import { PhoneField } from "@/components/forms/PhoneField";
import { AutocompleteField } from "@/components/forms/AutocompleteField";
import { isValidCity } from "@/data/cities";
import { DEFAULT_COUNTRY } from "@/data/countries";
import {
  isValidInternationalPhone,
  saveLead,
  toE164,
} from "@/lib/leadCapture";

type Errors = Partial<Record<"fullName" | "brandName" | "city" | "phone", string>>;

export default function StartFreeTrialPage() {
  const t = useTranslations("startFreeTrial");
  const tF = useTranslations("startFreeTrial.fields");
  const [fullName, setFullName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY.iso);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo<Errors>(() => {
    const e: Errors = {};
    if (fullName.trim().length < 2) e.fullName = tF("fullNameError");
    if (brandName.trim().length < 2) e.brandName = tF("brandNameError");
    if (!city || !isValidCity(city)) e.city = tF("cityError");
    if (!isValidInternationalPhone(phone, country)) {
      e.phone = tF("phoneError");
    }
    return e;
  }, [fullName, brandName, city, phone, country, tF]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, brandName: true, city: true, phone: true });
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    saveLead({
      fullName: fullName.trim(),
      brandName: brandName.trim(),
      city: city.trim(),
      phone: toE164(phone, country),
    });
    window.setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 220);
  };

  if (submitted) {
    return <SuccessState name={fullName.trim().split(" ")[0]} />;
  }

  return (
    <section className="relative overflow-hidden bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(45% 50% at 75% 30%, rgba(225,29,42,0.08) 0%, rgba(225,29,42,0) 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(40% 45% at 18% 60%, rgba(80,130,200,0.07) 0%, rgba(80,130,200,0) 75%)",
          filter: "blur(40px)",
        }}
      />

      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 md:gap-16 lg:gap-20 items-start">
          {/* ── LEFT — value props + trust ────────────────────────────── */}
          <div className="order-2 md:order-1">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-4">
                {t("eyebrow")}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1
                className="text-[clamp(2rem,4.4vw,3rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[16ch]"
                style={{ textWrap: "balance" }}
              >
                {t("heroHeadline")}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 text-[16px] md:text-[18px] leading-[1.5] text-ink-soft max-w-[28rem]">
                {t("heroBody")}
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <ul className="mt-9 space-y-3.5">
                <Benefit text={t("benefits.b1")} />
                <Benefit text={t("benefits.b2")} />
                <Benefit text={t("benefits.b3")} />
                <Benefit text={t("benefits.b4")} />
              </ul>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-10 pt-6 border-t border-hairline max-w-[24rem]">
                <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute mb-2">
                  {t("trustedByEyebrow")}
                </p>
                <p className="text-[14px] leading-[1.5] text-ink-soft">
                  {t("trustedByBody")}
                </p>
              </div>
            </Reveal>
          </div>

          {/* ── RIGHT — form card ─────────────────────────────────────── */}
          <div className="order-1 md:order-2">
            <Reveal delay={0.12}>
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)",
                    boxShadow:
                      "0 24px 60px rgba(40,80,140,0.10), 0 4px 14px rgba(0,0,0,0.04)",
                  }}
                />
                <div className="rounded-3xl bg-paper border border-hairline p-6 md:p-8">
                  <p className="text-[12px] uppercase tracking-[0.16em] text-ink-mute mb-1">
                    {t("formEyebrow")}
                  </p>
                  <h2 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.012em] text-ink">
                    {t("formTitle")}
                  </h2>

                  <form
                    onSubmit={submit}
                    className="mt-7 space-y-5"
                    noValidate
                  >
                    <TextField
                      label={tF("fullName")}
                      value={fullName}
                      onChange={(v) => {
                        setFullName(v);
                        if (!touched.fullName)
                          setTouched((tt) => ({ ...tt, fullName: true }));
                      }}
                      error={touched.fullName ? errors.fullName : undefined}
                      autoComplete="name"
                      required
                    />
                    <TextField
                      label={tF("brandName")}
                      value={brandName}
                      onChange={(v) => {
                        setBrandName(v);
                        if (!touched.brandName)
                          setTouched((tt) => ({ ...tt, brandName: true }));
                      }}
                      error={touched.brandName ? errors.brandName : undefined}
                      autoComplete="organization"
                      required
                    />
                    <AutocompleteField
                      label={tF("city")}
                      value={city}
                      onChange={(v) => {
                        setCity(v);
                        if (!touched.city)
                          setTouched((tt) => ({ ...tt, city: true }));
                      }}
                      error={touched.city ? errors.city : undefined}
                      required
                    />
                    <PhoneField
                      value={phone}
                      onChange={(v) => {
                        setPhone(v);
                        if (!touched.phone)
                          setTouched((tt) => ({ ...tt, phone: true }));
                      }}
                      country={country}
                      onCountryChange={setCountry}
                      error={touched.phone ? errors.phone : undefined}
                      required
                    />

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 w-full h-12 rounded-full bg-ink text-paper text-[15px] font-medium hover:bg-ink/85 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
                      style={{
                        transitionTimingFunction:
                          "cubic-bezier(0.32, 0.72, 0, 1)",
                      }}
                    >
                      {submitting ? t("submitting") : t("submit")}
                    </button>

                    <TermsLine />
                  </form>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <BrandCheck variant="chip" size={11} className="mt-0.5 shrink-0" />
      <span className="text-[14px] md:text-[15px] leading-[1.5] text-ink">
        {text}
      </span>
    </li>
  );
}

/** Consent line — `<terms>...</terms>` and `<privacy>...</privacy>`
 *  markers in the catalog give each locale natural phrasing around
 *  the link text; we parse them here and stitch in locale-aware
 *  Links so the prose stays one paragraph. */
function TermsLine() {
  const t = useTranslations("startFreeTrial");
  const raw = t.raw("terms");
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
    const candidates = [tStart, pStart].filter((n) => n >= 0).sort((a, b) => a - b);
    const nextIdx = candidates[0];
    if (nextIdx === undefined || nextIdx < 0) {
      segments.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (nextIdx > 0) segments.push(<span key={key++}>{remaining.slice(0, nextIdx)}</span>);
    if (nextIdx === tStart) {
      const close = remaining.indexOf("[[/T]]");
      const label = remaining.slice(nextIdx + 5, close);
      segments.push(
        <Link key={key++} href="/legal/terms" className="underline-offset-4 hover:underline">
          {label}
        </Link>,
      );
      remaining = remaining.slice(close + 6);
    } else {
      const close = remaining.indexOf("[[/P]]");
      const label = remaining.slice(nextIdx + 5, close);
      segments.push(
        <Link key={key++} href="/legal/privacy" className="underline-offset-4 hover:underline">
          {label}
        </Link>,
      );
      remaining = remaining.slice(close + 6);
    }
  }
  return (
    <p className="text-[11px] text-ink-mute leading-[1.5] text-center">
      {segments}
    </p>
  );
}

function SuccessState({ name }: { name: string }) {
  const t = useTranslations("startFreeTrial");
  const supportLineRaw = t.raw("successSupport");
  const supportLine = typeof supportLineRaw === "string" ? supportLineRaw : "";
  const [beforeLink, linkAndAfter] = supportLine.split("<link>");
  const [linkLabel, afterLink] = (linkAndAfter ?? "").split("</link>");

  return (
    <section className="relative overflow-hidden bg-canvas min-h-[70vh] flex items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(40% 35% at 50% 35%, rgba(225,29,42,0.08) 0%, rgba(225,29,42,0) 70%)",
          filter: "blur(40px)",
        }}
      />
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-16 md:py-24 w-full">
        <div className="max-w-[520px] mx-auto text-center">
          <Reveal>
            <BrandCheck variant="circle" size={28} />
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="mt-6 text-[clamp(2rem,4.4vw,3rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink"
              style={{ textWrap: "balance" }}
            >
              {name ? t("successWelcome", { name }) : t("successWelcomeNoName")}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-[17px] md:text-[19px] leading-[1.5] text-ink-soft">
              {t("successBody")}
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <Button href="/" variant="primary" size="md">
                {t("successPrimary")}
              </Button>
              <Link
                href="/demo"
                className="h-11 px-6 inline-flex items-center text-[14px] font-medium rounded-full border border-hairline-strong text-ink hover:bg-paper transition-colors"
                style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                {t("successSecondary")}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="mt-8 text-[12px] text-ink-mute">
              {beforeLink}
              <Link href="/support" className="underline-offset-4 hover:underline text-ink-soft">
                {linkLabel}
              </Link>
              {afterLink}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
