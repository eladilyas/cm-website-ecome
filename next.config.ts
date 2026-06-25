import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Wire next-intl to its request-config file. Required so the
// server-side useTranslations / getTranslations APIs can find
// their per-locale message catalogs at build + request time.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Production security headers. Applied to every response. Each
// header is scoped narrowly enough to let the app function but
// closes off the common drive-by attack surface (clickjacking,
// MIME-sniffing, referrer leaks, mixed-content).
//
// CSP is intentionally NOT included here — it requires per-deploy
// origin allow-lists (Better-Auth domain, Resend CDN, R2 bucket,
// Wafasalaf/CMI when wired) that are easier to express as a
// dedicated middleware once those integrations land. Until then,
// these headers cover ~80% of the production-hardening checklist.
// Content-Security-Policy is NOT set here — it's emitted per-request
// by `src/middleware.ts` with a fresh nonce, so static-list CSP would
// only fight the middleware. This array carries the headers that DO
// stay constant across requests.

const SECURITY_HEADERS = [
  // Stops Internet Explorer / Safari from sniffing payloads and
  // executing them as a different MIME type than the server declares.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Modern equivalent of X-Frame-Options. Keeps the site from being
  // embedded in an iframe by anyone — clickjacking defense.
  { key: "X-Frame-Options", value: "DENY" },
  // Limit which Referer leaks out of cross-origin navigations.
  // strict-origin-when-cross-origin keeps full URLs internal and
  // sends only the origin (not the path) cross-site.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Browser feature gates. Locks down every powerful API by default —
  // explicit opt-ins live in the per-route `<meta>` tags if ever
  // needed (camera/microphone, payment-request, etc.).
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), magnetometer=(), gyroscope=(), interest-cohort=()",
  },
  // HSTS — force HTTPS for one year, include subdomains, allow
  // browser preload list inclusion. ONLY emit when FORCE_HTTPS_CSP=1
  // is set — for HTTP-only deployments (no domain yet, IP+port) HSTS
  // pins the browser to HTTPS for a year and prevents future HTTP
  // access from the same browser. Once TLS is in front of the app
  // (custom domain + certbot), set FORCE_HTTPS_CSP=1 to re-enable.
  ...(process.env.FORCE_HTTPS_CSP === "1"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
  // Stops automatic DNS prefetching of links in the page — small
  // privacy win, no functional impact.
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // No remotePatterns — all product imagery is served locally from
  // /public/hardware/ and /public/mockups/. Keep this list empty so we
  // notice if anything tries to reach for an external image again.

  async headers() {
    return [
      {
        // Apply to every route. Static assets pick these up too,
        // which is what we want for Referrer-Policy and HSTS.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
