"use client";

// Checkout — Phase C2.
//
// Two-column premium B2B checkout. Form (contact / company /
// shipping / payment) on the left, sticky order summary on the
// right. CMI payment is the active path; Wafasalaf financing
// appears as a "coming next" preview that C3 will activate.
//
// Submission flow (CMI demo stub):
//   1. Validate form (inline red on submit)
//   2. Show CmiRedirectOverlay (full-screen, branded, 1.5s)
//   3. Create order via orderStore + clear cart
//   4. router.push("/checkout/success?ref=...")
//
// Auth gate (sign-in mandatory) lands in C4. For C2 anyone can
// check out — the contact email is captured so accounts can be
// linked later.

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

import { Link, useRouter } from "@/i18n/navigation";
import { useCartStore } from "@/lib/cartStore";
import { useCartLines, useCartTotals } from "@/lib/useCart";
import { VAT_RATE } from "@/lib/commerceConstants";
// Financing requests post to /api/financing (Postgres-backed). The
// localStorage financingStore is gone — same migration path as orders.
import { type AccountProfile } from "@/lib/accountStore";
import {
  useCheckoutDraftStore,
  type PaymentMethod as DraftPaymentMethod,
} from "@/lib/checkoutDraftStore";
import { useAuth } from "@/hooks/useAuth";
import {
  computeClassique,
  fmtMAD,
  type AgeBracket,
} from "@/lib/wafasalaf";
import { formatPrice } from "@/lib/formatPrice";
import { CheckoutFinancingPanel } from "@/components/checkout/CheckoutFinancingPanel";
import { CheckoutUpsells } from "@/components/checkout/CheckoutUpsells";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import {
  PreCheckoutUpsellDialog,
  hasSeenPreCheckoutUpsell,
  markPreCheckoutUpsellSeen,
} from "@/components/checkout/PreCheckoutUpsellDialog";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { CitySelect } from "@/components/forms/CitySelect";

const APPLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type PaymentMethod = DraftPaymentMethod;

type FormState = {
  fullName: string;
  email: string;
  /** Dial code only — "+212" etc. Combined with phoneNumber on submit. */
  phoneCode: string;
  /** National number, no leading zero / no dial code. */
  phoneNumber: string;
  companyName: string;
  ice: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

// Initial defaults live in src/lib/checkoutDraftStore.ts — this page
// no longer maintains form state locally, it binds straight to the
// persisted draft so users never lose what they typed across auth
// redirects.

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations("checkout");
  const tSuccess = useTranslations("checkoutSuccess");
  const clearCart = useCartStore((s) => s.clearCart);
  // Order creation goes through the /api/orders endpoint now —
  // Postgres-backed, transactional, role-scoped. The Zustand
  // orderStore is gone.
  // No store-backed creator anymore — see the POST flow below.

  // Auth — single source of truth. Profile may be undefined for an
  // unauthenticated visitor; we show the form anyway and gate the
  // submit. AuthGate is rendered below for the unauthenticated path.
  const { profile } = useAuth();

  // Persistent checkout draft — survives sign-in/sign-up redirects so
  // users never re-type what they already filled. Read once, then
  // patch on every keystroke. Holds form fields + payment method +
  // financing age.
  const draft = useCheckoutDraftStore((s) => s.draft);
  const patchDraft = useCheckoutDraftStore((s) => s.patch);
  const clearDraft = useCheckoutDraftStore((s) => s.clear);

  const lines = useCartLines();
  const totals = useCartTotals();
  const paymentSettings = usePaymentSettings();
  const vat = useMemo(() => +(totals.subtotal * VAT_RATE).toFixed(2), [
    totals.subtotal,
  ]);
  const grandTotal = totals.subtotal + vat;

  // The form state is now the draft store directly. Local state only
  // holds transient UI concerns (validation errors, submission flag).
  const form: FormState = useMemo(
    () => ({
      fullName: draft.fullName,
      email: draft.email,
      phoneCode: draft.phoneCode,
      phoneNumber: draft.phoneNumber,
      companyName: draft.companyName,
      ice: draft.ice,
      street: draft.street,
      city: draft.city,
      postalCode: draft.postalCode,
      country: draft.country,
    }),
    [draft],
  );
  const paymentMethod = draft.paymentMethod;
  const financingAge = draft.financingAge;
  const setPaymentMethod = (m: PaymentMethod) => patchDraft({ paymentMethod: m });
  const setFinancingAge = (a: AgeBracket) => patchDraft({ financingAge: a });

  // Promote whichever method is admin-enabled into the draft.
  //
  // Two roles for this effect:
  //   1. First-visit: `paymentMethod` starts as `null` in the
  //      draft store (we no longer hard-code "cmi" as default —
  //      see checkoutDraftStore.ts). The first enabled method
  //      wins.
  //   2. Live admin toggle: if the admin disables the method the
  //      visitor previously selected (or had locally persisted
  //      from an old session), promote them to the first still-
  //      enabled method.
  //
  // Why useEffect (not render-time set): patchDraft writes to
  // Zustand's persist layer → localStorage. That throws on the
  // SSR pass and triggers cross-component setState during render.
  // The effect runs after mount on the client only.
  useEffect(() => {
    const currentIsAvailable =
      paymentMethod !== null &&
      ((paymentMethod === "cmi" && paymentSettings.cmi.enabled) ||
        (paymentMethod === "wafasalaf" && paymentSettings.wafasalaf.enabled) ||
        (paymentMethod === "wire-transfer" &&
          paymentSettings.wireTransfer.enabled));
    if (currentIsAvailable) return;
    const firstAvailable: PaymentMethod | null = paymentSettings.cmi.enabled
      ? "cmi"
      : paymentSettings.wafasalaf.enabled
        ? "wafasalaf"
        : paymentSettings.wireTransfer.enabled
          ? "wire-transfer"
          : null;
    if (firstAvailable) setPaymentMethod(firstAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paymentSettings.cmi.enabled,
    paymentSettings.wafasalaf.enabled,
    paymentSettings.wireTransfer.enabled,
    paymentMethod,
  ]);

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-payment upsell — surfaces once just before the customer hits
  // "Continue to payment", IF the cart has at least one product
  // whose top complementary pair isn't already in the cart.
  const { productsBySlug } = useCatalog();
  const addToCart = useCartStore((s) => s.addToCart);
  const [preUpsellOpen, setPreUpsellOpen] = useState(false);
  const preUpsellCandidate = useMemo(() => {
    if (lines.length === 0) return null;
    const cartSet = new Set(lines.map((l) => l.slug));
    for (const l of lines) {
      for (const pairSlug of l.product.complementaryWith ?? []) {
        if (cartSet.has(pairSlug)) continue;
        const pair = productsBySlug[pairSlug];
        if (pair) return pair;
      }
    }
    return null;
  }, [lines, productsBySlug]);

  // Prefill empty draft fields when the signed-in profile arrives.
  // React 19 "store previous prop in state" pattern — sync block
  // during render runs once per profile.id transition. Only fills
  // blanks so anything the buyer has already typed wins.
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  const profileId = profile?.id ?? null;
  if (profileId !== prefilledFor) {
    setPrefilledFor(profileId);
    if (profile) {
      const fill: Partial<typeof draft> = {};
      if (!draft.fullName) fill.fullName = profile.fullName;
      if (!draft.email) fill.email = profile.email;
      if (!draft.phoneNumber) {
        fill.phoneCode = profile.phoneCode;
        fill.phoneNumber = profile.phoneNumber;
      }
      if (!draft.companyName) fill.companyName = profile.companyName;
      if (!draft.ice && profile.companyIce) fill.ice = profile.companyIce;
      if (Object.keys(fill).length > 0) patchDraft(fill);
    }
  }

  // Server-side snapshot — pulls phone / company / shipping from
  // the user's most-recent order. This is what removes the "type
  // your address every time" friction: returning buyers see their
  // last shipping details pre-filled and only need to confirm or
  // tweak. Fields stay editable.
  //
  // Fires once per signed-in session (deps: profileId). Failure is
  // silent — checkout still works, just without the prefill.
  const [snapshotPrefilled, setSnapshotPrefilled] = useState(false);
  useEffect(() => {
    if (!profileId) return;
    let alive = true;
    fetch("/api/account/checkout-snapshot", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((snap) => {
        if (!alive || !snap) return;
        const fill: Partial<typeof draft> = {};
        // Contact — only fill blanks. The user's profile pass above
        // already covered fullName/email/phone, so this is mostly a
        // backstop for accounts created before phone was captured.
        if (!draft.phoneNumber && snap.contact?.phone) {
          const phone = String(snap.contact.phone).trim();
          // Best-effort split of "+212 6 12..." into code + number.
          const m = phone.match(/^(\+\d{1,4})\s*(.*)$/);
          if (m) {
            fill.phoneCode = m[1] ?? draft.phoneCode;
            fill.phoneNumber = (m[2] ?? "").trim();
          } else {
            fill.phoneNumber = phone;
          }
        }
        if (!draft.companyName && snap.company?.name) {
          fill.companyName = snap.company.name;
        }
        if (!draft.ice && snap.company?.ice) {
          fill.ice = snap.company.ice;
        }
        // Shipping — the high-value prefill. Previous order's
        // address becomes the default for the next.
        if (snap.shipping) {
          if (!draft.street) fill.street = snap.shipping.street;
          if (!draft.city) fill.city = snap.shipping.city;
          if (!draft.postalCode) fill.postalCode = snap.shipping.postalCode;
          if (!draft.country || draft.country === "MA") {
            fill.country = snap.shipping.country;
          }
        }
        if (Object.keys(fill).length > 0) {
          patchDraft(fill);
          // Surface a quiet "we saved this from last time" notice
          // only when shipping was filled — the strongest signal
          // that this is a returning buyer.
          if (snap.shipping) setSnapshotPrefilled(true);
        }
      })
      .catch(() => {
        // Network blip — leave fields untouched.
      });
    return () => {
      alive = false;
    };
    // Only re-runs when the signed-in identity changes. We
    // intentionally don't depend on `draft` so a keystroke doesn't
    // re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // Monthly preview for the Wafasalaf CTA label — same calculation
  // the panel itself will run. Reuses computeClassique against the
  // TTC total over 24 months for the selected age bracket.
  const monthlyEstimate = useMemo(() => {
    if (grandTotal <= 0) return 0;
    try {
      return computeClassique(grandTotal, 24, financingAge).monthly;
    } catch {
      return 0;
    }
  }, [grandTotal, financingAge]);

  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    patchDraft({ [key]: e.target.value } as Partial<typeof draft>);
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  // Empty-cart guard — render a friendly redirect.
  if (lines.length === 0 && !submitting) {
    return <EmptyCheckout />;
  }

  // Auth gate — checkout requires a customer account so orders +
  // financing can be tracked across visits. C4: cart is preserved
  // through signup/signin via ?next=/checkout, so the user lands
  // right back here with their items intact.
  if (!profile && !submitting) {
    return <AuthGate />;
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    const required = t("errorRequired");
    if (!form.fullName.trim()) next.fullName = required;
    if (!form.email.trim()) next.email = required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = t("errorEmail");
    if (!form.phoneNumber.trim()) next.phoneNumber = required;
    if (!form.companyName.trim()) next.companyName = required;
    if (!form.street.trim()) next.street = required;
    if (!form.city.trim()) next.city = required;
    if (!form.postalCode.trim()) next.postalCode = required;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to the first error so users see it.
      requestAnimationFrame(() => {
        const firstErr = document.querySelector(
          "[data-error='true']",
        ) as HTMLElement | null;
        firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    // Pre-payment upsell — surface ONCE per session, only if there's
    // a real complementary candidate. The dialog can either add the
    // product or skip; in both cases proceedToSubmit() then runs.
    // Falls through immediately if no candidate or already seen.
    if (preUpsellCandidate && !hasSeenPreCheckoutUpsell()) {
      markPreCheckoutUpsellSeen();
      setPreUpsellOpen(true);
      return;
    }
    proceedToSubmit();
  };

  const proceedToSubmit = () => {
    // Snapshot the selected method ONCE at click time. Every
    // branch below — submit cadence, API endpoint, overlay copy —
    // reads `chosen` instead of the live `paymentMethod` so a
    // mid-flight state change (background `usePaymentSettings`
    // refetch flipping the method, late-arriving Zustand
    // hydration, etc.) cannot make a financing submit fall into
    // the CMI redirect overlay.
    const chosen: PaymentMethod | null = paymentMethod;

    // Belt-and-suspenders: if for any reason no method is set, or
    // the chosen method has just been admin-disabled between the
    // click and this handler, surface a clear error instead of
    // silently routing through a wrong gateway.
    if (
      chosen === null ||
      (chosen === "cmi" && !paymentSettings.cmi.enabled) ||
      (chosen === "wafasalaf" && !paymentSettings.wafasalaf.enabled) ||
      (chosen === "wire-transfer" && !paymentSettings.wireTransfer.enabled)
    ) {
      alert(
        "The selected payment method is no longer available. Please pick another.",
      );
      return;
    }

    setSubmitting(true);

    const contact = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      // Combine dial code + national number into E.164-ish display
      // form ("+212 6 12 34 56 78"). The number is whatever the user
      // typed — no strict format validation in C2/C3 (the value is
      // only used for display and CRM lookup in the demo).
      phone: `${form.phoneCode} ${form.phoneNumber.trim()}`,
    };
    const company = {
      name: form.companyName.trim(),
      ice: form.ice.trim() || undefined,
    };
    const shipping = {
      street: form.street.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country,
    };

    // Submit. Real CMI integration would POST + wait for a webhook
    // here; for now POST to /api/orders or /api/financing directly so
    // Postgres has the record before we route to the success page.
    //
    // IMPORTANT: read `chosen` (snapshot above), not `paymentMethod`
    // (live store value). Prevents a financing submit from being
    // misrouted through the CMI branch if the live state shifts
    // between click and POST.
    const submit = async () => {
      try {
        if (chosen === "wafasalaf") {
          // Financing → Postgres via /api/financing. Reuse the same
          // monthly quote the panel showed the customer.
          const quote = computeClassique(grandTotal, 24, financingAge);
          const finBody = {
            ageBracket:
              financingAge === "under60" ? "UNDER_60" : "SIXTY_PLUS",
            contact,
            company: {
              name: company.name || null,
              ice: company.ice || null,
            },
            shipping: {
              ...shipping,
              notes: null,
            },
            items: lines.map((l) => ({
              slug: l.slug,
              name: l.product.name,
              subline: l.product.subline ?? null,
              qty: l.qty,
              unitPrice: l.product.priceFrom,
            })),
            quote: {
              months: 24,
              monthly: quote.monthly,
              firstMonthly: quote.firstMonthly,
              fileFee: quote.fileFee,
              totalCost: quote.totalCost,
            },
          };
          const res = await fetch("/api/financing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finBody),
          });
          const json = (await res.json().catch(() => ({}))) as {
            request?: { ref: string };
            error?: string;
          };
          if (!res.ok || !json.request) {
            setSubmitting(false);
            alert(
              json.error
                ? `Financing request failed: ${json.error}`
                : "Financing request failed. Please retry.",
            );
            return;
          }
          clearCart();
          clearDraft();
          router.push(`/checkout/success?ref=${json.request.ref}`);
          return;
        }

        // Order paths (CMI + wire transfer) → server.
        const apiPaymentMethod = chosen === "cmi" ? "CMI" : "BANK_TRANSFER";

        const body = {
          paymentMethod: apiPaymentMethod,
          contact,
          company: {
            name: company.name || null,
            ice: company.ice || null,
          },
          shipping: {
            ...shipping,
            notes: null,
          },
          items: lines.map((l) => ({
            slug: l.slug,
            name: l.product.name,
            subline: l.product.subline ?? null,
            qty: l.qty,
            unitPrice: l.product.priceFrom,
          })),
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json().catch(() => ({}))) as {
          order?: { ref: string };
          error?: string;
        };

        if (!res.ok || !json.order) {
          // Bring the customer back to a sane state — keep the cart
          // + the draft so they can retry.
          setSubmitting(false);
          alert(
            json.error
              ? `Order failed: ${json.error}`
              : "Order failed. Please retry.",
          );
          return;
        }

        clearCart();
        clearDraft();
        router.push(`/checkout/success?ref=${json.order.ref}`);
      } catch (err) {
        setSubmitting(false);
        alert(
          err instanceof Error
            ? `Order failed: ${err.message}`
            : "Network error. Please retry.",
        );
      }
    };

    // Submission cadence per method:
    //   • CMI            — show the 1.5s "Redirecting to CMI…"
    //                      overlay first, then write the (PAID) order.
    //                      Demo flow.
    //   • Wafasalaf      — submit immediately. The order lands in
    //                      PENDING_FINANCING_APPROVAL — NOT paid —
    //                      so we never want the CMI delay or its
    //                      copy here.
    //   • Wire transfer  — submit immediately, order in AWAITING_PAYMENT.
    //
    // Reads `chosen` (snapshot), so a state change between click and
    // this branch can never misroute financing into the CMI delay.
    if (chosen === "cmi") {
      window.setTimeout(submit, 1500);
    } else {
      submit();
    }
  };

  return (
    <>
      <section className="min-h-[80vh] bg-canvas pt-10 md:pt-14 pb-16">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          {/* Header */}
          <div className="mb-8 md:mb-10 flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-2">
                {t("eyebrow")}
              </p>
              <h1 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
                {t("heading")}
              </h1>
            </div>
            <p className="text-[12px] text-ink-mute inline-flex items-center gap-1.5">
              <LockIcon />
              {t("tlsPill")}
            </p>
          </div>

          {/* Two-column grid */}
          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-10 items-start"
          >
            {/* LEFT — form sections */}
            <div className="space-y-6">
              {profile && (
                <SignedInBanner
                  profile={profile}
                  onSignOut={async () => {
                    // Clear Better-Auth cookie first, then the local
                    // store; finally send the visitor back through
                    // sign-in so they don't checkout-as-someone-else.
                    const { signOut: authSignOut } = await import(
                      "@/lib/auth-client"
                    );
                    await authSignOut();
                    const { useAccountStore } = await import(
                      "@/lib/accountStore"
                    );
                    useAccountStore.getState().signOut();
                    router.push("/signin?next=/checkout");
                  }}
                />
              )}

              {snapshotPrefilled && (
                <div
                  className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 flex items-start gap-3"
                  role="status"
                >
                  <span
                    aria-hidden
                    className="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M3 7.5l2.5 2.5L11 4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink leading-snug">
                      {t("prefillTitle")}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-soft leading-snug">
                      {t("prefillBody")}
                    </p>
                  </div>
                </div>
              )}

              <Section
                title={t("sectionContact")}
                subtitle={t("sectionContactSubtitle")}
              >
                <Field label={t("fullName")} error={errors.fullName}>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={update("fullName")}
                    placeholder={t("placeholderFullName")}
                    className={inputCls(errors.fullName)}
                    data-error={Boolean(errors.fullName)}
                    autoComplete="name"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={t("email")} error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder={t("emailPlaceholder")}
                      className={inputCls(errors.email)}
                      data-error={Boolean(errors.email)}
                      autoComplete="email"
                    />
                  </Field>
                  <Field label={t("phone")} error={errors.phoneNumber}>
                    <PhoneInput
                      phoneCode={form.phoneCode}
                      phoneNumber={form.phoneNumber}
                      onPhoneCodeChange={(v) => patchDraft({ phoneCode: v })}
                      onPhoneNumberChange={(v) =>
                        patchDraft({ phoneNumber: v })
                      }
                      errored={Boolean(errors.phoneNumber)}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                title={t("sectionCompany")}
                subtitle={t("sectionCompanySubtitle")}
              >
                <Field label={t("companyName")} error={errors.companyName}>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={update("companyName")}
                    placeholder={t("placeholderCompanyName")}
                    className={inputCls(errors.companyName)}
                    data-error={Boolean(errors.companyName)}
                    autoComplete="organization"
                  />
                </Field>
                <Field label={t("companyIce")} optional optionalLabel={t("optional")}>
                  <input
                    type="text"
                    value={form.ice}
                    onChange={update("ice")}
                    placeholder={t("placeholderIce")}
                    className={inputCls()}
                    inputMode="numeric"
                  />
                </Field>
              </Section>

              <Section title={t("sectionShipping")}>
                <Field label={t("shippingStreet")} error={errors.street}>
                  <input
                    type="text"
                    value={form.street}
                    onChange={update("street")}
                    placeholder={t("placeholderStreet")}
                    className={inputCls(errors.street)}
                    data-error={Boolean(errors.street)}
                    autoComplete="street-address"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                  <Field label={t("shippingCity")} error={errors.city}>
                    <CitySelect
                      value={form.city}
                      onChange={(v) => patchDraft({ city: v })}
                      errored={Boolean(errors.city)}
                    />
                  </Field>
                  <Field label={t("shippingPostalCode")} error={errors.postalCode}>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={update("postalCode")}
                      placeholder={t("placeholderPostal")}
                      className={inputCls(errors.postalCode)}
                      data-error={Boolean(errors.postalCode)}
                      autoComplete="postal-code"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
                <Field label={t("country")}>
                  <select
                    value={form.country}
                    onChange={update("country")}
                    className={inputCls()}
                  >
                    <option value="MA">{t("countryMorocco")}</option>
                  </select>
                </Field>
              </Section>

              <Section title={t("sectionPayment")}>
                <div className="space-y-2.5">
                  {/* Each method is gated on its admin-configured
                      `enabled` flag (live from /api/payment-settings).
                      All three methods are first-class selectable
                      options; CMI runs as a demo flow today (simulated
                      redirect → order written with PAID status) until
                      the real CMI webhook/API integration ships. */}
                  {paymentSettings.cmi.enabled && (
                    <PaymentCard
                      active={paymentMethod === "cmi"}
                      onClick={() => setPaymentMethod("cmi")}
                      logo={{ src: "/logos/cmi.svg", alt: "CMI" }}
                      title={paymentSettings.cmi.label}
                      description={paymentSettings.cmi.note}
                      rightLabel={
                        paymentMethod === "cmi"
                          ? t("paymentSelected")
                          : t("paymentAvailable")
                      }
                    />
                  )}
                  {paymentSettings.wafasalaf.enabled && (
                    <PaymentCard
                      active={paymentMethod === "wafasalaf"}
                      onClick={() => setPaymentMethod("wafasalaf")}
                      logo={{ src: "/logos/wafasalaf.svg", alt: "Wafasalaf" }}
                      title={paymentSettings.wafasalaf.label}
                      description={
                        monthlyEstimate > 0
                          ? t("paymentWafasalafFrom", {
                              amount: fmtMAD(monthlyEstimate),
                              desc: paymentSettings.wafasalaf.description,
                            })
                          : paymentSettings.wafasalaf.description
                      }
                      rightLabel={
                        paymentMethod === "wafasalaf"
                          ? t("paymentSelected")
                          : t("paymentAvailable")
                      }
                    />
                  )}
                  {paymentSettings.wireTransfer.enabled && (
                    <PaymentCard
                      active={paymentMethod === "wire-transfer"}
                      onClick={() => setPaymentMethod("wire-transfer")}
                      icon={<BankIcon />}
                      title={paymentSettings.wireTransfer.label}
                      description={t("paymentWireDescription")}
                      rightLabel={
                        paymentMethod === "wire-transfer"
                          ? t("paymentSelected")
                          : t("paymentAvailable")
                      }
                    />
                  )}
                </div>
              </Section>

              {/* Submit row — primary CTA. Disabled until a payment
                  method is resolved (either persisted from a prior
                  session OR promoted from the live admin config). */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || paymentMethod === null}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-soft disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
                  }}
                >
                  {submitting ? (
                    <>{t("submitting")}</>
                  ) : paymentMethod === "cmi" ? (
                    <>
                      {t("submitCmiAmount", { amount: formatPrice(grandTotal) })}
                      <Arrow />
                    </>
                  ) : paymentMethod === "wire-transfer" ? (
                    <>
                      {t("submitWireAmount", { amount: formatPrice(grandTotal) })}
                      <Arrow />
                    </>
                  ) : (
                    <>
                      {monthlyEstimate > 0
                        ? t("submitFinancingMonthly", {
                            amount: fmtMAD(monthlyEstimate),
                          })
                        : t("submitFinancingAmount", {
                            amount: formatPrice(grandTotal),
                          })}
                      <Arrow />
                    </>
                  )}
                </button>
                <p className="mt-3 text-[11px] text-ink-mute leading-snug max-w-[36rem]">
                  {paymentMethod === "cmi"
                    ? t("footerCmi")
                    : paymentMethod === "wire-transfer"
                      ? t("footerWire")
                      : t("footerFinancing")}
                </p>
              </div>
            </div>

            {/* RIGHT — sticky order summary (+ financing panel when applicable) */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
              {/* Context-aware upsell — auto-hides when the cart has
                  no eligible complementary pairs OR the customer has
                  already dismissed it this session. */}
              <CheckoutUpsells cartSlugs={lines.map((l) => l.slug)} />

              <div className="rounded-2xl border border-hairline bg-paper p-5 md:p-6">
                <header className="flex items-baseline justify-between gap-3 mb-4">
                  <h2 className="text-[14px] font-semibold tracking-[-0.005em] text-ink">
                    {t("summaryTitle")}
                  </h2>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-mute tabular-nums">
                    {t("summaryItemsCount", { count: totals.itemCount })}
                  </p>
                </header>

                <ul className="divide-y divide-hairline">
                  {lines.map((l) => (
                    <li
                      key={l.slug}
                      className="py-2.5 flex items-baseline justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-ink truncate">
                          {l.product.name}
                          {l.product.subline && (
                            <span className="ml-1.5 text-[11px] font-normal text-ink-mute">
                              {l.product.subline}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-mute tabular-nums">
                          {formatPrice(l.product.priceFrom)} × {l.qty}
                        </p>
                      </div>
                      <p className="text-[12.5px] font-semibold tabular-nums text-ink shrink-0">
                        {formatPrice(l.lineTotal)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-hairline space-y-1.5 text-[13px]">
                  <SummaryRow
                    label={tSuccess("subtotalHT")}
                    value={formatPrice(totals.subtotal)}
                  />
                  <SummaryRow
                    label={t("vatLine", { pct: (VAT_RATE * 100).toFixed(0) })}
                    value={formatPrice(vat)}
                    muted
                  />
                  <SummaryRow
                    label={t("shipping")}
                    value={t("shippingEstimated")}
                    muted
                    small
                  />
                  <div className="mt-2.5 pt-2.5 border-t border-hairline flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
                      {tSuccess("totalTTC")}
                    </span>
                    <span className="text-[20px] md:text-[22px] font-semibold tabular-nums tracking-[-0.018em] text-ink">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                <Link
                  href="/shop"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-ink-mute hover:text-ink transition-colors"
                >
                  {t("backToShopping")}
                </Link>
              </div>

              {/* Wafasalaf breakdown — only when financing is selected.
                  Stacks under the order summary so buyers can read total
                  → monthly without losing the cart context. */}
              {paymentMethod === "wafasalaf" && (
                <CheckoutFinancingPanel
                  amount={grandTotal}
                  ageBracket={financingAge}
                  onAgeChange={setFinancingAge}
                />
              )}
            </aside>
          </form>
        </div>
      </section>

      <PreCheckoutUpsellDialog
        product={preUpsellCandidate}
        open={preUpsellOpen}
        onAccept={() => {
          if (preUpsellCandidate) addToCart(preUpsellCandidate.slug, 1);
          setPreUpsellOpen(false);
          proceedToSubmit();
        }}
        onSkip={() => {
          setPreUpsellOpen(false);
          proceedToSubmit();
        }}
      />

      <SubmissionOverlay open={submitting} method={paymentMethod} />
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function AuthGate() {
  const t = useTranslations("checkout.authGate");
  return (
    <section className="min-h-[60vh] bg-canvas flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[460px]">
        <div className="rounded-2xl border border-hairline bg-paper px-7 py-8 md:px-8 md:py-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <div className="mx-auto w-12 h-12 rounded-full bg-canvas border border-hairline flex items-center justify-center text-ink-soft mb-5">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <rect
                x="4"
                y="10"
                width="14"
                height="9"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M6.5 10V7a4.5 4.5 0 0 1 9 0v3"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-2">
            {t("eyebrow")}
          </p>
          <h1 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.005em] text-ink leading-[1.2]">
            {t("title")}
          </h1>
          <p className="mt-3 text-[13px] text-ink-soft leading-[1.5] max-w-[28rem] mx-auto">
            {t("body")}
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href={{ pathname: "/signup", query: { next: "/checkout" } }}
              className="h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
              style={{
                transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              {t("createAccount")}
            </Link>
            <Link
              href={{ pathname: "/signin", query: { next: "/checkout" } }}
              className="h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full border border-hairline-strong text-ink hover:bg-canvas hover:border-ink/40 transition-colors"
            >
              {t("signIn")}
            </Link>
          </div>
          <p className="mt-5 text-[11px] text-ink-mute">{t("demoNote")}</p>
        </div>
      </div>
    </section>
  );
}

function SignedInBanner({
  profile,
  onSignOut,
}: {
  profile: AccountProfile;
  onSignOut: () => void;
}) {
  const t = useTranslations("checkout.signedIn");
  const label = t("label");
  const switchAccount = t("switchAccount");
  const initials = useMemo(() => {
    const parts = profile.fullName.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return profile.fullName.slice(0, 2).toUpperCase();
  }, [profile.fullName]);

  return (
    <div className="rounded-xl border border-hairline bg-paper px-4 py-3 flex items-center gap-3">
      <span
        aria-hidden
        className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full bg-ink text-paper text-[12px] font-semibold tracking-[0.02em]"
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-ink-mute">{label}</p>
        <p className="text-[13px] font-medium text-ink truncate">
          {profile.fullName}
          <span className="ml-1.5 text-[12px] font-normal text-ink-mute">
            · {profile.email}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="shrink-0 text-[12px] text-ink-soft hover:text-ink underline-offset-4 hover:underline"
      >
        {switchAccount}
      </button>
    </div>
  );
}

function EmptyCheckout() {
  const t = useTranslations("checkout.emptyCheckout");
  return (
    <section className="min-h-[60vh] bg-canvas flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-[420px]">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-paper border border-hairline flex items-center justify-center text-ink-mute mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 4h2.5l2.5 11h11l2-8H7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="20" r="1.5" fill="currentColor" />
            <circle cx="18" cy="20" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-[20px] font-semibold tracking-[-0.005em] text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 text-[13px] text-ink-mute leading-[1.5]">
          {t("body")}
        </p>
        <Link
          href="/shop"
          className="mt-6 h-11 px-5 inline-flex items-center text-[13px] font-medium rounded-full bg-ink text-paper hover:bg-ink-soft transition-colors"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-paper p-5 md:p-6">
      <header className="mb-4">
        <h2 className="text-[14px] font-semibold tracking-[-0.005em] text-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[12px] text-ink-mute leading-snug">
            {subtitle}
          </p>
        )}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  optional,
  optionalLabel,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  /** Localized "(optional)" suffix. Defaults to "(optional)" so
   *  consumers that don't pass it don't crash; production callers
   *  always pass the localized value from the catalog. */
  optionalLabel?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-mute">
          {label}
          {optional && (
            <span className="ml-1.5 normal-case tracking-normal text-ink-mute/70">
              {optionalLabel ?? "(optional)"}
            </span>
          )}
        </span>
        {error && (
          <span className="text-[11px] text-red-600 font-medium">
            {error}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function inputCls(error?: string): string {
  return (
    "w-full h-11 px-3 rounded-lg bg-paper border text-[13px] text-ink placeholder:text-ink-mute focus:outline-none transition-colors " +
    (error
      ? "border-red-300 focus:border-red-500"
      : "border-hairline focus:border-ink/40")
  );
}

function PaymentCard({
  active,
  disabled,
  onClick,
  icon,
  logo,
  title,
  description,
  rightLabel,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** SVG icon — used for methods without a partner logo (e.g. wire
   *  transfer's bank icon). Either `icon` or `logo` must be set. */
  icon?: React.ReactNode;
  /** Partner logo to render as a trust-signal badge — used for CMI
   *  and Wafasalaf. Renders the SVG at native colors with a clean
   *  white plate so the brand reads instantly. */
  logo?: { src: string; alt: string };
  title: string;
  description: string;
  rightLabel: string;
}) {
  const isClickable = !disabled && Boolean(onClick);
  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={disabled}
      aria-pressed={active ? true : undefined}
      className={
        "w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors " +
        (active
          ? "border-ink bg-canvas"
          : disabled
            ? "border-hairline bg-paper opacity-60 cursor-not-allowed"
            : "border-hairline bg-paper hover:bg-canvas hover:border-hairline-strong cursor-pointer")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      {logo ? (
        <span
          aria-hidden
          className="shrink-0 inline-flex items-center justify-center w-12 h-10 rounded-lg overflow-hidden bg-white border border-hairline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt={logo.alt}
            className="h-8 w-auto object-contain"
          />
        </span>
      ) : (
        <span
          aria-hidden
          className={
            "shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border " +
            (active
              ? "border-ink/20 bg-paper text-ink"
              : "border-hairline bg-canvas text-ink-mute")
          }
        >
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={
              "text-[13.5px] font-semibold tracking-[-0.005em] " +
              (active ? "text-ink" : "text-ink-soft")
            }
          >
            {title}
          </p>
          <span
            className={
              "text-[10px] font-medium uppercase tracking-[0.12em] " +
              (active
                ? "text-emerald-700"
                : disabled
                  ? "text-amber-700"
                  : "text-ink-mute")
            }
          >
            {rightLabel}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-ink-mute leading-[1.5]">
          {description}
        </p>
      </div>
      {/* Radio indicator */}
      {!disabled && (
        <span
          aria-hidden
          className={
            "mt-1 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center " +
            (active ? "border-ink" : "border-hairline-strong")
          }
        >
          {active && (
            <span className="w-2 h-2 rounded-full bg-ink" />
          )}
        </span>
      )}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  small,
}: {
  label: string;
  value: string;
  muted?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={muted ? "text-ink-mute" : "text-ink-soft"}>{label}</span>
      <span
        className={
          "tabular-nums " +
          (small ? "text-[11px] text-ink-mute" : muted ? "text-ink-soft" : "text-ink")
        }
      >
        {value}
      </span>
    </div>
  );
}

function SubmissionOverlay({
  open,
  method,
}: {
  open: boolean;
  /** May be null in the brief window before `usePaymentSettings`
   *  has picked a default. The overlay is only opened when submit
   *  fires (after the guard ensures a valid method), so a null
   *  here is a defensive fallback — we render generic copy
   *  rather than risking the CMI branch by default. */
  method: PaymentMethod | null;
}) {
  const t = useTranslations("checkout.overlay");
  const isFinancing = method === "wafasalaf";
  const isWire = method === "wire-transfer";
  const isCmi = method === "cmi";
  // Default to the financing copy when method is somehow unknown —
  // safer than defaulting to CMI's "Redirecting to CMI…", which
  // would be flat wrong for any non-card path.
  const title = isCmi
    ? t("cmiTitle")
    : isWire
      ? t("wireTitle")
      : t("financingTitle");
  const subtitle = isCmi
    ? t("cmiSubtitle")
    : isWire
      ? t("wireSubtitle")
      : t("financingSubtitle");
  const footer = isCmi
    ? t("cmiFooter")
    : isWire
      ? t("wireFooter")
      : t("financingFooter");
  void isFinancing;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: APPLE_EASE }}
          className="fixed inset-0 z-[1100] bg-canvas/95 backdrop-blur-md flex items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            className="rounded-2xl bg-paper border border-hairline shadow-[0_30px_80px_rgba(0,0,0,0.12)] px-8 py-10 text-center max-w-[440px]"
          >
            <div className="mx-auto w-12 h-12 rounded-full border-2 border-ink/10 border-t-ink animate-spin mb-5" />
            <h2 className="text-[17px] font-semibold tracking-[-0.005em] text-ink">
              {title}
            </h2>
            <p className="mt-2 text-[13px] text-ink-mute leading-[1.5]">
              {subtitle}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-mute">
              <LockIcon />
              {footer}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect
        x="2"
        y="5.5"
        width="8"
        height="5"
        rx="0.8"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}


function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M2.5 8.5L10 3l7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 9v6M8.5 9v6M11.5 9v6M16 9v6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M2.5 16.5h15"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
