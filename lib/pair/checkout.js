import 'server-only';
// ============================================================
// lib/pair/checkout.js — the compat-specific half of POST /api/pay/[id]
// ============================================================
// Extracted for the same reason as settle.js: no spec imports an `app/api/**`
// route, because Next's `@/` alias does not resolve under `node --test`. The
// reading half of that route is UNTOUCHED - this holds only what compat adds.
//
// ══ RULING C, AND ITS EXACT SCOPE ══════════════════════════
// "Email-only identity, not a conventional account. At first compatibility
// checkout: collect email, associate the purchase/report with it, provide access
// through a secure link. No passwords, login, reset-password or sessions."
//
// So the email is REQUIRED at compat checkout and is SHAPE-CHECKED ONLY. Nothing
// here verifies an address, sends to it, or treats it as a credential - the pair
// id is still the bearer token, exactly as a reading id is. **Katon has no email
// sender**, so v1 shows the report link on screen after payment and this is a
// recovery record. Whether anything is ever sent is X-b3's and Reyner's.
//
// It is collected AT CHECKOUT and not at create, because a pair can be created
// and abandoned, and storing an address for an abandoned pair collects personal
// data for nothing.
// ============================================================

/**
 * A basic shape check. Deliberately not RFC-complete: an over-strict pattern
 * rejects real addresses, and nothing downstream depends on the address being
 * deliverable - there is no sender. It exists to catch a typo and an empty field.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate and normalise the email a compat checkout must carry.
 *
 * @param {unknown} raw `body.email`
 * @returns {{ email: string, error: null } | { email: null, error: string }}
 */
export function compatEmail(raw) {
  const email = typeof raw === 'string' ? raw.trim() : '';
  if (!email || !EMAIL_RE.test(email)) return { email: null, error: 'email_required' };
  return { email, error: null };
}

/**
 * Which object is being bought, and is the request coherent?
 *
 * `compat` buys a PAIR; every other sku buys a reading. The two id namespaces are
 * separate tables, so the SKU decides which to resolve rather than trying both
 * and taking whatever answers. A reading id presented with `sku=compat` is a
 * caller error - the request names a product and an object of the wrong kind - so
 * it is a 400 rather than a silent resolution, which is how a buyer would end up
 * paying the compat price against an artifact object.
 *
 * @param {string} sku
 * @param {Object|null} pairRow result of getPair(id)
 * @param {Object|null} readingRow result of getReading(id)
 * @returns {{ kind: 'pair'|'reading', row: Object } | { kind: 'error', error: string, status: number }}
 */
export function resolveCheckoutTarget(sku, pairRow, readingRow) {
  if (sku === 'compat') {
    if (pairRow) return { kind: 'pair', row: pairRow };
    if (readingRow) return { kind: 'error', error: 'compat_requires_pair', status: 400 };
    return { kind: 'error', error: 'not_found', status: 404 };
  }
  if (readingRow) return { kind: 'reading', row: readingRow };
  return { kind: 'error', error: 'not_found', status: 404 };
}
