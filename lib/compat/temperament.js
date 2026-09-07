// ============================================================
// lib/compat/temperament.js — P4 temperament facts
// ============================================================
// FACTS ONLY. No prose, no badge label, no score. Rule 14: the engine owns all
// facts, hierarchy and structure; the LLM chooses only words. The three PATTERNS
// here are ids, and their Indonesian names are seven unruled strings belonging to
// Reyner and to the content layer - see docs/product/compat-p4-p5-rules.md 1.1.
//
// THE RULE IS docs/product/compat-p4-p5-rules.md SECTION 1. This file implements
// it and cites its clause numbers; a change there is a behaviour change and ships
// with a red test first.
//
// ── RULING P4, Reyner 2026-09-07 (evening) ────────────────
// A Katon-owned classification over the two dominant Ten-God profiles: same God ->
// Matching Pattern; same Ten-God family/group -> Related Pattern; different group
// -> Contrasting Pattern. The engine exposes `same_god` / `same_group` /
// `different_group` and the content layer renders the badge.
//
// The wording boundary is part of the ruling, not a disclaimer: **these three
// patterns are Katon's interpretive framework, NOT a claim that classical BaZi
// defines these categories.** Nothing here should ever be rendered as though a
// classical source named them. And per rule 25 the badge ranks nothing - matching
// is not "good", contrasting is not "bad"; it names a SHAPE.
//
// Reyner explicitly REFUSED the earlier formula that mapped same-group to
// "colliding" and different-group to "complementary" - "too crude and not
// something we can substantiate". That was a fit verdict dressed as a fact. Fit
// lives in pullFit.js, from its own ruled clauses.
//
// ── THERE IS NO TEN-GOD FAMILY TABLE IN THIS FILE ─────────
// Rule doc 1.3: "The five groups are not a new table: a Ten God is
// element-relation x polarity, so `same_group` is 'same element relation, polarity
// ignored', derived from `lib/bazi/tenGods.js` (read-only)."
//
// `lib/bazi/tenGods.js` is rule 7 CLOSED and is read, never written. It names the
// five relations only in its header comments (lines 8-12) and exports no relation
// field: `tenGod()` returns { hanzi, label, stem, element, polarity } and its
// GENERATES / CONTROLS tables are module-private. So prompt X-a's stated fallback
// applies - the relation is derived from the god's element against the Day
// Master's element by `elementRelation` (lib/semantic/facts.js:675), the same
// function commit 4 of prompt W named, and the five names below are transcribed
// from tenGods.js:8-12 so the vocabulary is its, not a new one.
//
// A hanzi -> family map would have been a table, would have needed maintaining
// beside tenGods.js, and would have been free to disagree with it. Deriving it
// cannot disagree, and the spec proves that exhaustively over all 100
// Day-Master-x-target stem pairs: every god resolves to exactly one relation,
// every relation is reached by exactly two gods, and the grouping matches the one
// tenGods.js's own private tables produce.
// ============================================================

import { STEM_ELEMENTS } from '../bazi/stems.js';
import { mainProfile } from '../bazi/mainProfile.js';
import { elementRelation } from '../semantic/facts.js';

/**
 * elementRelation's five outputs in tenGods.js's own vocabulary (its lines 8-12):
 *   same element        -> companion (比劫)
 *   DM generates target -> output    (食傷)
 *   DM controls target  -> wealth    (財)
 *   target controls DM  -> officer   (官殺)
 *   target generates DM -> resource  (印)
 *
 * Two of elementRelation's names read backwards and this is where that matters:
 * `is_controlled` fires when the FIRST argument controls the second (財 Wealth is
 * what you control) and `controls` when the SECOND controls the first (官殺). The
 * spec pins all five against tenGods.js rather than trusting the names.
 */
const RELATION = {
  same: 'companion',
  drains: 'output',
  is_controlled: 'wealth',
  controls: 'officer',
  feeds: 'resource',
};

/**
 * The Ten God FAMILY of a god whose element is `godElement`, for a Day Master of
 * `dmElement`. Polarity is ignored, which is exactly what makes two gods one
 * group (rule doc 1.3).
 *
 * Exported so the spec can assert the 2:1 mapping directly against
 * `tenGods.js`'s `tenGod()` across all 100 stem pairs.
 *
 * @param {string} dmElement Day Master element, an engine key
 * @param {string} godElement the god's element, an engine key
 * @returns {'companion'|'output'|'wealth'|'officer'|'resource'}
 */
export function tenGodRelation(dmElement, godElement) {
  return RELATION[elementRelation(dmElement, godElement)];
}

/** Rule doc 1.1: one pattern per relation, and the pattern ranks nothing. */
const PATTERN = {
  same_god: 'matching',
  same_group: 'related',
  different_group: 'contrasting',
};

/** One person's dominant Aspek and its family. `main_profile` is read-only (rule 7). */
function profileOf(chart) {
  // `silent: true` matches lib/semantic/index.js:230 - the fallback warning is for
  // the reading pipeline, and a compat fact emitting it would be noise on a path
  // that is not the reading.
  const profile = mainProfile(chart, { silent: true });
  return {
    god: profile.hanzi,
    element_relation: tenGodRelation(STEM_ELEMENTS[chart.day.stem], profile.element),
  };
}

/**
 * P4 temperament facts for two charts.
 *
 * Each god is relative to its OWN Day Master (rule doc 1.1, "element relation to
 * the Day Master"), so two people with different Day Masters can share a group.
 * The classification is a property of the pair, not of the order: swapping the two
 * charts swaps `a` and `b` and leaves `relation` and `pattern` alone.
 *
 * @param {Object} a Person A's chart, output of calculateBaziChart
 * @param {Object} b Person B's chart, output of calculateBaziChart
 * @returns {{
 *   kind: 'compat_temperament',
 *   a: { god: string, element_relation: string },
 *   b: { god: string, element_relation: string },
 *   relation: 'same_god'|'same_group'|'different_group',
 *   pattern: 'matching'|'related'|'contrasting',
 * }} facts only. `pattern` is a Katon-framework id; its Indonesian name is
 *    unruled and belongs to the content layer.
 */
export function compatTemperament(a, b) {
  const profileA = profileOf(a);
  const profileB = profileOf(b);

  // 1.1, in the doc's own order. same_god is checked first because a shared god
  // is necessarily a shared group - the 2:1 map guarantees it - so the order is
  // what makes the three cases exclusive rather than an accident.
  let relation;
  if (profileA.god === profileB.god) relation = 'same_god';
  else if (profileA.element_relation === profileB.element_relation) relation = 'same_group';
  else relation = 'different_group';

  return {
    kind: 'compat_temperament',
    a: profileA,
    b: profileB,
    relation,
    pattern: PATTERN[relation],
  };
}
