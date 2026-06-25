// Edge middleware — three jobs in one pass:
//
//   1. Locale routing (next-intl). Resolves the active locale from
//      the URL prefix (/en → en) or the Accept-Language header,
//      falling back to French (default). Rewrites the request so
//      Next sees /[locale]/... even when the visitor hits /shop.
//
//   2. Auth redirect for /account/* and /admin/* (cookie presence
//      check, fast — no DB hit). Forged cookies still fail signature
//      validation in the downstream route handler. Path is checked
//      AFTER locale normalization so /en/account works too.
//
//   3. Per-request CSP nonce. Modern CSP best practice is to drop
//      `'unsafe-inline'` for script-src and instead emit a fresh
//      nonce per request. Next 16 picks the nonce up from the
//      `x-nonce` request header and threads it into its own
//      inline runtime scripts.
//
// Why one middleware: Next runs a single middleware per request, and
// there's no built-in way to compose two. Folding the concerns keeps
// the runtime cost at one function call and lets locale + auth + CSP
// share the same NextResponse so headers don't collide.

import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PREFIXES = ["/account", "/admin"];

/** Path is protected regardless of locale prefix — strip a leading
 *  /fr or /en before matching so /en/account triggers the same redirect
 *  as /account. */
function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

function isProtected(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return PROTECTED_PREFIXES.some(
    (p) => stripped === p || stripped.startsWith(p + "/"),
  );
}

/** The admin route group lives at `src/app/admin/`, deliberately
 *  OUTSIDE the `[locale]` segment — the admin panel ships English-only
 *  and stays out of the FR/EN split. next-intl's middleware otherwise
 *  rewrites every URL to `/[locale]/...`, which would send `/admin` to
 *  `/fr/admin` (a non-existent route) → 404. Detect admin paths up-
 *  front and skip the i18n rewrite branch entirely. */
function isAdminPath(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  return stripped === "/admin" || stripped.startsWith("/admin/");
}

/** Build the Content-Security-Policy header value for this request.
 *
 *  `upgrade-insecure-requests` is opt-in via FORCE_HTTPS_CSP=1. We
 *  keep it OFF by default because it forces the browser to rewrite
 *  every relative URL on the page from http:// to https:// — which
 *  breaks every static asset when the app is served over plain HTTP
 *  (no domain yet, IP+port deployment). Once the site is behind TLS
 *  (custom domain + certbot), flip FORCE_HTTPS_CSP=1 in the env. */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const forceHttps = process.env.FORCE_HTTPS_CSP === "1";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.cloudflarestorage.com https://api.resend.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self' blob:",
  ];
  if (forceHttps) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Auth redirect for protected routes. Done BEFORE locale rewriting
  // so the redirect URL is clean.
  //
  // /admin/* traffic redirects to a dedicated /admin/signin page —
  // operators get a focused, dark-themed sign-in surface with no
  // marketing chrome. The customer /signin and admin /admin/signin
  // both call the same Better-Auth client; only the rendering and
  // the post-auth landing route differ.
  //
  // The signin endpoint itself is publicly reachable — exclude it
  // from the protected check or the redirect loops on itself.
  if (isProtected(pathname) && stripLocale(pathname) !== "/admin/signin") {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      const isAdmin = isAdminPath(pathname);
      const target = isAdmin ? "/admin/signin" : "/signin";
      const url = new URL(target, request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  // Mint a per-request nonce. crypto.randomUUID is available on
  // the Edge runtime; base64 keeps the CSP value compact.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Admin routes live outside the `[locale]` segment. Letting next-intl
  // run on `/admin/*` would rewrite it to `/fr/admin/...` (which doesn't
  // exist) and produce a 404. Skip the i18n middleware for these paths
  // — we still attach the CSP + nonce headers below.
  if (isAdminPath(pathname)) {
    const adminResponse = NextResponse.next();
    adminResponse.headers.set("x-middleware-request-x-nonce", nonce);
    adminResponse.headers.set("Content-Security-Policy", buildCsp(nonce));
    return adminResponse;
  }

  // Let next-intl handle locale detection + redirect/rewrite. It
  // returns either:
  //   • a redirect (visitor needed to be moved from / to /en or back)
  //   • a rewrite-headers response (visitor stays on the URL but the
  //     request internally targets /[locale]/...)
  const response = intlMiddleware(request);

  // Forward the nonce to Next via a request header so the framework
  // injects it into its own inline scripts. We mutate the request
  // headers the next-intl response already prepared so the locale
  // header + the nonce header both reach the downstream handler.
  response.headers.set("x-middleware-request-x-nonce", nonce);

  // Set the CSP on the response so the browser enforces it.
  response.headers.set("Content-Security-Policy", buildCsp(nonce));

  return response;
}

export const config = {
  matcher: [
    // Run on every request EXCEPT:
    //   • _next/static, _next/image — Next-managed static assets
    //   • favicon.ico, /robots.txt, /sitemap.xml — static files
    //   • /api/* — JSON endpoints don't render HTML, no CSP needed
    //   • file extensions (.png, .jpg, .webp, .svg, .mp4) — assets
    //
    // Negative lookahead keeps the matcher concise; the auth
    // redirect logic inside still gates on path prefix so we only
    // redirect when the path actually starts with /account or
    // /admin (after locale strip).
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
