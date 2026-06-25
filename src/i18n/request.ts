// Server-side message loader. next-intl calls this once per request
// to resolve which message catalog to load. We split catalogs by
// namespace to keep files manageable and to support per-route code
// splitting later if traffic ever justifies it.

import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // ISO 4217 currency + the IETF tag both anchor next-intl's
    // formatters. We surface dirham amounts everywhere, so MAD is
    // the only currency we need to declare.
    formats: {
      number: {
        mad: {
          style: "currency",
          currency: "MAD",
          maximumFractionDigits: 0,
        },
      },
    },
    timeZone: "Africa/Casablanca",
    // Missing-key safeguard.
    //
    // In production we render the key path (e.g. "auth.brandPanel.heading")
    // as the fallback rather than crashing the page — a visible-yet-
    // ugly placeholder is recoverable; a 500 is not. In development
    // we ALSO log a console.error so missing keys surface immediately
    // during local work + CI dev-mode runs.
    //
    // The companion `npm run i18n:check` script verifies catalog
    // parity at build time so this fallback should rarely fire in
    // production — both layers run, but neither one alone is enough.
    onError(error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[next-intl]", error.message);
      }
    },
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter(Boolean).join(".");
      if (process.env.NODE_ENV !== "production") {
        console.error(`[next-intl] missing key ${path} (${error.code})`);
      }
      return path;
    },
  };
});
