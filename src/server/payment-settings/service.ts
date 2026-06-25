// Payment-methods configuration — persisted as a single row in the
// generic Setting key/value store (no schema migration needed).
//
// Shape locked at 3 methods (CMI / Wafasalaf / Wire transfer); the
// admin can enable/disable each and fill in Wire-transfer details
// (bank / RIB / IBAN / SWIFT) that surface on /checkout/success +
// the operations email. No additional methods are configurable here
// by design — adding a fourth means a deliberate code change.
//
// Storage key: "payment_methods"
//
// Read path:  getPaymentSettings()  — server components / actions
// Write path: updatePaymentSettings(input, actorId)  — admin only

import { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export type PaymentMethodKey = "cmi" | "wafasalaf" | "wireTransfer";

export type PaymentMethodConfig = {
  cmi: {
    /** Enable / disable on the checkout payment picker. */
    enabled: boolean;
    /** Human label shown on the payment card. */
    label: string;
    /** Status note shown alongside the label. CMI is "Pending
     *  Integration — API not yet implemented" until the real
     *  webhook contract is wired. */
    note: string;
  };
  wafasalaf: {
    enabled: boolean;
    label: string;
    /** Display sub-label, e.g. "24-month financing · subject to credit approval". */
    description: string;
  };
  wireTransfer: {
    enabled: boolean;
    label: string;
    /** Bank name shown on confirmation page + email. */
    bankName: string;
    /** Account holder (your company's legal name). */
    accountHolder: string;
    /** Moroccan RIB — 24 digits, formatted however the bank prints it. */
    rib: string;
    /** International account number. */
    iban: string;
    /** Bank SWIFT / BIC code. */
    swift: string;
    /** Free-form payment reference convention shown to the buyer. */
    referenceHint: string;
  };
};

export const DEFAULT_PAYMENT_CONFIG: PaymentMethodConfig = {
  cmi: {
    // CMI runs as a demo flow today: the checkout overlay simulates a
    // CMI redirect for ~1.5s, then writes the order to Postgres with
    // status PAID. The real CMI webhook/API integration will replace
    // the simulation later without touching the storefront UX. Enabled
    // by default so buyers see card payments as a first-class option.
    enabled: true,
    label: "Card · CMI",
    note: "Card payments via CMI · demo mode (test transactions only).",
  },
  wafasalaf: {
    enabled: true,
    label: "Wafasalaf financing · 24 months",
    description:
      "Pay in monthly installments. Subject to credit approval.",
  },
  wireTransfer: {
    enabled: true,
    label: "Wire transfer",
    bankName: "",
    accountHolder: "",
    rib: "",
    iban: "",
    swift: "",
    referenceHint:
      "Please include your order reference in the transfer description so we can match the payment in our records.",
  },
};

const SETTING_KEY = "payment_methods";

/** Returns the current configuration, falling back to safe defaults
 *  for any missing fields. Always returns a complete object. */
export async function getPaymentSettings(): Promise<PaymentMethodConfig> {
  const row = await db.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return DEFAULT_PAYMENT_CONFIG;
  // Shallow-merge with defaults — newly-added fields after a deploy
  // shouldn't crash old persisted rows.
  const stored = row.value as Partial<PaymentMethodConfig>;
  return {
    cmi: { ...DEFAULT_PAYMENT_CONFIG.cmi, ...(stored.cmi ?? {}) },
    wafasalaf: {
      ...DEFAULT_PAYMENT_CONFIG.wafasalaf,
      ...(stored.wafasalaf ?? {}),
    },
    wireTransfer: {
      ...DEFAULT_PAYMENT_CONFIG.wireTransfer,
      ...(stored.wireTransfer ?? {}),
    },
  };
}

export async function updatePaymentSettings(
  next: PaymentMethodConfig,
  actorId: string,
): Promise<void> {
  // No CMI lockdown — admins can enable/disable any of the three
  // methods independently. CMI's demo behaviour (simulated redirect
  // + order creation) is gated in the checkout page, not the schema.
  const value = next as unknown as Prisma.InputJsonValue;
  await db.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value, updatedBy: actorId },
    update: { value, updatedBy: actorId },
  });
}
