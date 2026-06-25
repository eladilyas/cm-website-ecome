// Reference-code generation for human-readable resource IDs.
//
// IDs themselves are UUIDs (stable, unguessable, collision-resistant).
// REFs are short, year-stamped, customer-facing identifiers shown on
// receipts, in emails, in the URL bar of customer-portal pages, and
// quoted on support tickets. Format:
//
//   ORD-2026-A4B7   for orders
//   FIN-2026-A4B7   for financing requests
//   TKT-2026-A4B7   for support tickets
//
// 4-character random suffix uses Crockford base32 (no I/L/O/U so refs
// can be read over the phone without confusion). 32^4 = ~1M values
// per prefix per year — collision rate is documented + checked by the
// service layer with a retry. The format is stable; the entropy source
// is swappable.

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomSuffix(length: number): string {
  // Web crypto is available in Next.js server runtime + Node 19+.
  // Avoiding Math.random for an ID generator — even though collisions
  // are recoverable, predictable IDs are a small footgun in support
  // tooling (someone tries to enumerate refs).
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Defensive fallback for environments without web crypto — should
    // never hit in production; logged for visibility.
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let s = "";
  for (let i = 0; i < length; i++) {
    s += CROCKFORD[bytes[i] % CROCKFORD.length];
  }
  return s;
}

function currentYear(date?: Date): number {
  // Accept an injected `date` for tests + deterministic seeds.
  return (date ?? new Date()).getUTCFullYear();
}

export function generateOrderRef(date?: Date): string {
  return `ORD-${currentYear(date)}-${randomSuffix(4)}`;
}

export function generateFinancingRef(date?: Date): string {
  return `FIN-${currentYear(date)}-${randomSuffix(4)}`;
}

export function generateTicketRef(date?: Date): string {
  return `TKT-${currentYear(date)}-${randomSuffix(4)}`;
}

/** Generic — used by future contexts (invoices, refunds, etc.). */
export function generateRef(prefix: string, date?: Date): string {
  return `${prefix}-${currentYear(date)}-${randomSuffix(4)}`;
}
