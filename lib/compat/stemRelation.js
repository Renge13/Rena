// ============================================================
// lib/compat/stemRelation.js — Day Master PAIR relation (P1 facts)
// ============================================================
// FACTS ONLY. No prose, no score, no interpretation string. Rule 14: the engine
// owns all facts, hierarchy and structure; the LLM chooses only words.
//
// Two facts about the two Day Master stems: where they sit on the five-element
// cycle, and whether they are one of the five 天干五合 combinations.
//
// ── THE CYCLE IS ASKED OF THE ENGINE, NOT WRITTEN HERE ────
// `elementRelation` (lib/semantic/facts.js:675) reads GENERATES and CONTROLS at
// :667-668 and already answers exactly this question for the reading facts. Rule 4
// forbids writing a cycle from memory, and a second copy of it here would be free
// to disagree with the one that scored the chart.
//
// `lib/bazi/elementCycle.js` was the other candidate and is NOT usable: its
// GENERATED_BY and CONTROLLED_BY tables are module-private (only ELEMENT_STEMS and
// getSelarasPemicuStems are exported), and getSelarasPemicuStems answers a
// different question - which archetype stems feed or trigger a Day Master.
//
// TWO OF elementRelation's FIVE NAMES READ BACKWARDS, so the mapping below is
// spelled out and asserted in the spec against the tables rather than trusted:
//   'same'          both stems are the same element
//   'drains'        the FIRST element generates the second   -> a_produces_b
//   'feeds'         the SECOND generates the first           -> b_produces_a
//   'is_controlled' the FIRST controls the second (財 Wealth) -> a_controls_b
//   'controls'      the SECOND controls the first (官殺)      -> b_controls_a
//
// ── THE 五合 TABLE HAS ONE HOME AND IT IS NOT THIS FILE ───
// docs/engine/stem-combinations.json, whose provenance - both sources quoted
// verbatim, with the fetch record and the one URL that could not be reached - is
// docs/engine/stem-combinations.md beside it. Prompt W's copy of the table was not
// implemented from: a table handed to a session inside a prompt is INPUT, not a
// source (rule 4).
//
// ── RULING B: DETECTION AND METADATA, NEVER TRANSFORMATION ─
// Reyner, 2026-09-07: "treat this as 五合 detection + traditional
// transformation-target metadata, not as an instruction to transform either Day
// Master or recalculate its element. Whether 合 actually transforms is outside this
// MVP engine."
//
// So `transformTarget` is recorded and never applied. Nothing here mutates a Day
// Master, nothing recalculates an element, and there is no 合化 logic: the stems
// keep reporting their own elements from STEM_ELEMENTS, and `cycle` is computed
// from those same untouched elements. The spec asserts this on 丁 + 壬 -> Wood,
// where neither stem is Wood, so any applied transformation would be visible.
//
// ── ABSENT, NOT NULL ──────────────────────────────────────
// `combination` is OMITTED when the two stems are not one of the five. Absence
// means "not a pair". A null would be a claim about the 90 orderings that are not
// combinations, and there is nothing to claim about them.
// ============================================================

import { STEM_ELEMENTS } from '../bazi/stems.js';
import { elementRelation } from '../semantic/facts.js';
import TABLE from '../../docs/engine/stem-combinations.json' with { type: 'json' };

/** elementRelation's Day-Master-relative names, in A-and-B terms. See header. */
const CYCLE = {
  same: 'same',
  drains: 'a_produces_b',
  feeds: 'b_produces_a',
  is_controlled: 'a_controls_b',
  controls: 'b_controls_a',
};

/**
 * The 天干五合 pair these two stems form, or undefined.
 *
 * Matched in either order; the returned `stems` are the TABLE's own order, so the
 * same combination reads identically whichever person supplied which stem.
 */
function combinationFor(stemA, stemB) {
  return TABLE.pairs.find(({ stems: [x, y] }) => (
    (x === stemA && y === stemB) || (x === stemB && y === stemA)
  ));
}

/**
 * Relation between two charts' Day Master stems (P1 facts).
 *
 * @param {Object} a Person A's chart, output of calculateBaziChart
 * @param {Object} b Person B's chart, output of calculateBaziChart
 * @returns {{
 *   kind: 'compat_stem_relation',
 *   a: { stem: string, element: string },
 *   b: { stem: string, element: string },
 *   cycle: 'same'|'a_produces_b'|'b_produces_a'|'a_controls_b'|'b_controls_a',
 *   combination?: { pair: string[], transformTarget: string },
 * }} facts only. `combination` is ABSENT - not null - when the two stems are not
 *    one of the five 天干五合 pairs, and its `transformTarget` is metadata that
 *    nothing applies.
 */
export function compatStemRelation(a, b) {
  const stemA = a.day.stem;
  const stemB = b.day.stem;
  const elementA = STEM_ELEMENTS[stemA];
  const elementB = STEM_ELEMENTS[stemB];

  const combination = combinationFor(stemA, stemB);

  return {
    kind: 'compat_stem_relation',
    a: { stem: stemA, element: elementA },
    b: { stem: stemB, element: elementB },
    // Computed from the stems' OWN elements. A combination does not change them.
    cycle: CYCLE[elementRelation(elementA, elementB)],
    // `pinyin` is documentation for a human reading the table; it stays out of the
    // emitted fact.
    ...(combination
      ? { combination: { pair: combination.stems, transformTarget: combination.transformTarget } }
      : {}),
  };
}
