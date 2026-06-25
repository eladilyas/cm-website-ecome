// Lead-capture helpers. Pure localStorage for v1 — CRM integration arrives
// later. Centralized so we can swap the destination (webhook / fetch /
// supabase / etc) by editing one file.

export type Lead = {
  fullName: string;
  brandName: string;
  city: string;
  phone: string;
  capturedAt: number; // ms epoch
};

const LEAD_KEY = "cm_lead";
const FLAG_KEY = "cm_lead_captured";

export function saveLead(payload: Omit<Lead, "capturedAt">): Lead {
  const lead: Lead = { ...payload, capturedAt: Date.now() };
  try {
    localStorage.setItem(LEAD_KEY, JSON.stringify(lead));
    localStorage.setItem(FLAG_KEY, "1");
  } catch {
    // Private mode / storage disabled — silently ignore. The session still
    // proceeds (the user just can't deep-link back into /demo without
    // re-submitting).
  }
  return lead;
}

export function getLead(): Lead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEAD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Lead;
  } catch {
    return null;
  }
}

export function hasCapturedLead(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearLead(): void {
  try {
    localStorage.removeItem(LEAD_KEY);
    localStorage.removeItem(FLAG_KEY);
  } catch {
    // ignore
  }
}

// ── Phone validation (international) ──────────────────────────────────
// Backed by libphonenumber-js (min build, ~78KB gzip — only loaded on the
// onboarding route via dynamic import). Accepts numbers from every country
// and returns the canonical E.164 string when valid.

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

/**
 * Validate a phone number using libphonenumber-js. `defaultCountry` is the
 * ISO 3166-1 alpha-2 country code from the country selector — used when the
 * user enters a local-format number without a leading `+`.
 */
export function isValidInternationalPhone(raw: string, defaultCountry?: string): boolean {
  if (!raw) return false;
  try {
    const parsed = parsePhoneNumberFromString(
      raw,
      defaultCountry as CountryCode | undefined
    );
    return Boolean(parsed?.isValid());
  } catch {
    return false;
  }
}

/**
 * Return the E.164 form ("+212612345678") when valid; otherwise the input
 * value with normalization applied. Used at submit-time to store a canonical
 * lead record.
 */
export function toE164(raw: string, defaultCountry?: string): string {
  try {
    const parsed = parsePhoneNumberFromString(
      raw,
      defaultCountry as CountryCode | undefined
    );
    if (parsed?.isValid()) return parsed.number;
  } catch {
    // fall through
  }
  return normalizePhone(raw);
}
