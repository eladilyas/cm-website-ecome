// Country dial codes available across the commerce funnel.
//
// Ordered: local code first, then immediate neighbours (Maghreb),
// then top diaspora destinations (EU + US), then Gulf B2B trade
// partners. Keep the list short — every entry slows the dropdown's
// scan time; expand only when a real customer base materializes.
//
// Used by: /checkout phone field, /signup phone field, future
// /account profile form, future Lead capture form.

export type PhoneCode = {
  /** "+212" — the actual dial prefix. */
  code: string;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  /** Human-readable label shown in the dropdown, with flag emoji. */
  label: string;
};

export const PHONE_CODES: readonly PhoneCode[] = [
  { code: "+212", country: "MA", label: "🇲🇦 Morocco (+212)" },
  { code: "+213", country: "DZ", label: "🇩🇿 Algeria (+213)" },
  { code: "+216", country: "TN", label: "🇹🇳 Tunisia (+216)" },
  { code: "+33", country: "FR", label: "🇫🇷 France (+33)" },
  { code: "+34", country: "ES", label: "🇪🇸 Spain (+34)" },
  { code: "+39", country: "IT", label: "🇮🇹 Italy (+39)" },
  { code: "+44", country: "GB", label: "🇬🇧 United Kingdom (+44)" },
  { code: "+49", country: "DE", label: "🇩🇪 Germany (+49)" },
  { code: "+1", country: "US", label: "🇺🇸 United States (+1)" },
  { code: "+971", country: "AE", label: "🇦🇪 United Arab Emirates (+971)" },
  { code: "+966", country: "SA", label: "🇸🇦 Saudi Arabia (+966)" },
] as const;

export const DEFAULT_PHONE_CODE = "+212";
