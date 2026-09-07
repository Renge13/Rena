import 'server-only';
// ============================================================
// lib/pair/settle.js — settling a COMPAT purchase
// ============================================================
// Extracted from the webhook route so it is testable at all: no spec in this repo
// imports an `app/api/**` route, because Next's `@/` alias does not resolve under
// `node --test`. Every other handler lives in `lib/` for the same reason and the
// route is a thin wrapper (see lib/mirror/handlers.js).
//
// THE READING PATH IS NOT TOUCHED. Prompt X-b1: "Same fail-closed shape as the
// reading path; do not restructure the existing branch." So this is ADDITIVE -
// the webhook resolves a pair first and returns here, and the whole reading
// branch below it is byte-identical to what it was.
//
// ══ IDENTICAL RULES, NONE SOFTENED FOR THE NEWER PRODUCT ══
//  - the amount is verified against the SKU STORED AT INTENT, never against any
//    known price and never against the callback body (`amountMatchesSku`);
//  - a null or unknown `sku` does NOT unlock - fail-closed, rule 18;
//  - the flip is idempotent: `markPairPaid` transitions false->true only, so a
//    genuine Xendit double-fire cannot run a once-only side effect twice.
//
// ══ THE FAILURE THIS FILE EXISTS TO REFUSE ══════════════════
// A SECOND payable object means a new failure mode: one product's settled invoice
// granting access to another's. `settlePair` calls `markPairPaid` and nothing
// else - it can only ever settle the pair it was handed. The spec asserts both
// directions, and asserts at source level that `markPairPaid` has exactly one
// call site so no other path can flip a pair.
//
// ══ NO DELIVERY SIDE EFFECT, AND THAT IS WHY THERE IS NO CLAIM ══
// The reading path guards its WhatsApp send with a claim/release mutex. There is
// no send here: Katon has no email sender (ruling C's stated limit), so v1 shows
// the report link on screen and the stored email is a recovery record. Adding a
// claim for a send that does not exist would be the shape rule 15 criticises in
// the deleted OpenAI secondary - a branch that reads like a mitigation and has
// never once executed. When X-b3 wires a sender, the claim arrives with it.
// ============================================================

import { markPairPaid } from '../pairStore.js';
import { amountMatchesSku } from '../pricing.js';

/**
 * Settle a compat purchase against Xendit's own record.
 *
 * @param {string} pairId the pair id (the invoice's external_id)
 * @param {Object} pairRow the pair row, already loaded
 * @param {boolean} statusPaid Xendit says the money arrived
 * @param {number|null} settledAmount the RE-FETCHED amount; null only in dev,
 *   where no invoice exists to verify against
 * @returns {Promise<{paid: boolean, reason: string|null}>} `paid` is whether this
 *   call transitioned the row, so a double-fire reports false the second time
 */
export async function settlePair(pairId, pairRow, statusPaid, settledAmount) {
  const amountOk = settledAmount === null ? true : amountMatchesSku(settledAmount, pairRow.sku);

  if (statusPaid && !amountOk) {
    // Logged without any personal data: the pair id and the sku only. Never the
    // email and never a birth date.
    console.error(
      `[webhook/xendit] amount rejected for pair ${pairId}: sku=${pairRow.sku ?? 'null'}`,
    );
    return { paid: false, reason: 'amount_mismatch' };
  }
  if (!statusPaid) return { paid: false, reason: 'not_paid' };

  const transitioned = await markPairPaid(pairId, new Date().toISOString());
  return { paid: transitioned, reason: transitioned ? null : 'already_paid' };
}
