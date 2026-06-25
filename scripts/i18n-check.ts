/**
 * i18n parity check.
 *
 * Loads every catalog under messages/<locale>.json, computes the
 * recursive set of leaf keys, and ensures every locale carries the
 * same set as the reference (FR — the default locale).
 *
 * Exit codes:
 *   0  → all locales aligned
 *   1  → at least one locale is missing or has extra keys
 *
 * Wire as `npm run i18n:check` (see package.json). Run in CI before
 * deploy, run locally before merging an i18n change.
 *
 * NOTE: this is a *parity* check — it does NOT verify translation
 * quality, only that every key present in FR has a counterpart in
 * each other locale. next-intl's getMessageFallback (configured in
 * src/i18n/request.ts) is the second line of defence for any key
 * that slips through.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REFERENCE_LOCALE = "fr"; // matches routing.defaultLocale
const COMPARE_LOCALES = ["en"]; // every locale other than the reference
const MESSAGES_DIR = resolve(process.cwd(), "messages");

function loadCatalog(locale: string): Record<string, unknown> {
  const path = resolve(MESSAGES_DIR, `${locale}.json`);
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function leafKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${k}` : k;
    out.push(...leafKeys(v, next));
  }
  return out;
}

function setOf(values: string[]): Set<string> {
  return new Set(values);
}

const reference = loadCatalog(REFERENCE_LOCALE);
const refKeys = setOf(leafKeys(reference));

let failed = false;

for (const locale of COMPARE_LOCALES) {
  const catalog = loadCatalog(locale);
  const keys = setOf(leafKeys(catalog));

  const missing = [...refKeys].filter((k) => !keys.has(k)).sort();
  const extra = [...keys].filter((k) => !refKeys.has(k)).sort();

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✔ ${locale}: ${keys.size} keys, parity with ${REFERENCE_LOCALE}.`);
    continue;
  }

  failed = true;
  console.error(`✖ ${locale}: out of sync with ${REFERENCE_LOCALE}.`);
  if (missing.length > 0) {
    console.error(`  ${missing.length} missing key(s):`);
    for (const k of missing) console.error(`    - ${k}`);
  }
  if (extra.length > 0) {
    console.error(`  ${extra.length} extra key(s) (not present in ${REFERENCE_LOCALE}):`);
    for (const k of extra) console.error(`    + ${k}`);
  }
}

if (failed) {
  console.error("\ni18n parity check failed.");
  process.exit(1);
}

console.log(`\nAll ${COMPARE_LOCALES.length + 1} locales aligned.`);
