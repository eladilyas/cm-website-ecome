// Validate a `?next=` query parameter for post-auth redirects.
//
// Without this check a protocol-relative URL like `//evil.com/x`
// passes a naive `startsWith("/")` test and triggers a cross-origin
// redirect after sign-in. We require a leading `/` AND reject any
// value whose second character is also `/`.
//
// Callers also pass an `allowAdmin` flag so the customer auth pages
// can refuse `?next=/admin/...` (customers have no admin access) and
// the admin sign-in page can keep its own /admin allow-list logic.

export type SafeNextOptions = Readonly<{
  /** Default path to return when the input is missing or unsafe. */
  fallback: string;
  /**
   * When false, paths starting with `/admin` are also treated as
   * unsafe and replaced with the fallback. Customer signin/signup
   * surfaces should pass false; the admin signin page handles its
   * own scope.
   */
  allowAdmin?: boolean;
}>;

export function safeNext(
  raw: string | null | undefined,
  opts: SafeNextOptions,
): string {
  const fallback = opts.fallback;
  if (!raw) return fallback;
  // Must be a same-origin absolute path.
  if (!raw.startsWith("/")) return fallback;
  // Protocol-relative URL (//evil.com) or backslash-quirk paths.
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  // Reject CRLF / control characters that could split a Location header.
  if (/[\r\n\t]/.test(raw)) return fallback;
  // Optional admin scope guard.
  if (opts.allowAdmin === false && raw.startsWith("/admin")) {
    return fallback;
  }
  return raw;
}
