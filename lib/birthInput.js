// ============================================================
// lib/birthInput.js — validating one person's birth input
// ============================================================
// ONE SOURCE OF TRUTH, and it exists because a second one was about to be
// written. `POST /api/pair` needs to validate TWO births exactly as
// `POST /api/mirror` validates one; prompt X-b1 says to reuse the mirror's
// validator, and there was none to reuse - the checks were inline in
// `createMirrorReading` with the regexes as module-private consts.
//
// Copying them into the pair route would have been the shorter change and the
// wrong one: two copies of an input contract drift, and the repo has already paid
// for that shape once (a price ladder retyped inside a test went stale on a ruled
// change and reddened CI for a day; the fix was to read the ladder from the
// module). So this is EXTRACTED and both callers import it.
//
// NOTHING ABOUT THE RULES CHANGED IN THE EXTRACTION. Same regexes, same
// messages, same order of checks. The messages are part of the HTTP contract -
// clients see them in a 400 body - so they are preserved character for character
// rather than tidied. `tests/mirror-route.spec.mjs` and the pair spec both cover
// the behaviour.
//
// Why the season gate is NOT here: it is not validation. A boundary birth is a
// valid input that needs one more ANSWER from the buyer, and what to do about
// that differs per caller - the mirror asks in the client before creating
// anything, the pair route answers with a 409 because it has no client. See
// `needsTermSide` below, which is the shared PREDICATE, not the shared response.
// ============================================================

import { seasonTurnOnDate } from './bazi/index.js';

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validate one person's birth input.
 *
 * @param {Object} input `{ birthDate, birthTime, gender, termSide }`
 * @param {string} [prefix] prepended to the message when a caller validates more
 *   than one person, so a 400 says WHICH one failed. Empty for the mirror, whose
 *   message strings are an existing contract and must not gain a prefix.
 * @returns {string|null} the error message, or null when the input is valid
 */
export function birthInputError({ birthDate, birthTime = null, gender = null, termSide = null }, prefix = '') {
  const at = (message) => (prefix ? `${prefix}: ${message}` : message);

  if (typeof birthDate !== 'string' || !DATE_RE.test(birthDate)) {
    return at('birthDate (YYYY-MM-DD) is required');
  }
  if (birthTime !== null && (typeof birthTime !== 'string' || !TIME_RE.test(birthTime))) {
    return at('birthTime must be HH:MM (24h) or omitted');
  }
  if (gender !== null && gender !== 'male' && gender !== 'female') {
    return at('gender must be "male", "female", or omitted');
  }
  // The season gate's stored answer. It decides the MONTH PILLAR on the ~12 days
  // a year a 節 falls inside the birth day (migration 0003).
  if (termSide !== null && termSide !== 'before' && termSide !== 'after') {
    return at('termSide must be "before", "after", or omitted');
  }
  return null;
}

/**
 * Does this birth still need a `termSide` answer?
 *
 * THE CONDITION IS COPIED FROM THE CONSUMER, not reasoned out fresh.
 * `components/Funnel.jsx:334-339` is the shipped season gate and it reads:
 *
 *     if (turn?.needsHour) {
 *       const birthHour = birthTime === null ? null : Number(birthTime.slice(0, 2));
 *       if (birthHour === null || birthHour === turn.hour) { ...ask... }
 *     }
 *
 * With no time at all the turn is a whole day wide. With an hour, only the hour
 * CONTAINING the turn is ambiguous - every other hour sits cleanly on one side of
 * it and needs no question. Reconstructing that from the docs instead of copying
 * the live branch is how the two would come to disagree about the ~12 days a year
 * this fires.
 *
 * @returns {{ needed: boolean, term?: string, at?: string }}
 */
export function needsTermSide({ birthDate, birthTime = null, termSide = null }) {
  if (termSide === 'before' || termSide === 'after') return { needed: false };

  let turn;
  try {
    turn = seasonTurnOnDate(birthDate);
  } catch {
    // An unresolvable date is a validation problem, not a gate problem, and
    // birthInputError has already refused it by the time this is called.
    return { needed: false };
  }
  if (!turn) return { needed: false };

  const birthHour = birthTime === null ? null : Number(birthTime.slice(0, 2));
  if (birthHour !== null && birthHour !== turn.hour) return { needed: false };

  return { needed: true, term: turn.term, at: turn.at };
}
