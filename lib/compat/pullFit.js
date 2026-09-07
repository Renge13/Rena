// ============================================================
// lib/compat/pullFit.js — P5 pull / fit facts
// ============================================================
// FACTS ONLY. No prose, no label, and by 2.4 NO SCORE. Rule 14: the engine owns
// all facts, hierarchy and structure; the LLM chooses only words. The four
// quadrant ids are ids - their Indonesian labels are four of the seven unruled
// strings belonging to Reyner and to the content layer.
//
// ── THE RULE IS docs/product/compat-p4-p5-rules.md SECTION 2 ──
// P5 was "accepted as written" by Reyner 2026-09-07 (evening), so that doc IS the
// rule and this file implements it clause by clause, citing each by number. A
// change to section 2 is a behaviour change and ships with a red test first; the
// spec quotes every clause it asserts so the two cannot drift silently.
//
// This is a pure function over the outputs of tranche 1's three modules. It
// computes nothing about a chart itself - no branch table, no element cycle, no
// strength - so there is exactly one place each fact comes from.
//
// ── TWO CLAUSES THAT LOOK LIKE BUGS AND ARE RULINGS ───────
// 2.1.b: A CLASH RAISES PULL. Ruled deliberately - the spec's P2 reframe calls a
// clashed seat "intensity and transformation", and intensity is attraction, not
// fit. A session that reads this as a sign error has found the ruling.
// 2.1.d vs 2.2.c: THE TWO CLAUSES READ DIFFERENT SCOPES. 2.1.d looks at both
// palace scans and counts only harmony and clash, so 害 and 刑 in a palace fire
// nothing at all. 2.2.c looks ONLY at `dayBranchPair` and bans 害 and 刑 there. So
// a pair can carry two palace 害 entries and still be fit HIGH. That is the doc,
// and it is the case the spec pins hardest.
//
// ── ONE WORDING MISMATCH, RESOLVED AND NOT PAPERED OVER ───
// 2.2.b reads "`sameImbalance` is false". The value is not a boolean: tranche 1's
// complementarity module emits `sameImbalance` as the LIST of elements absent from
// both charts, empty when there is none. The only coherent reading of the ruled
// clause is "empty", and that is what this implements. The doc is Reyner-ruled and
// was committed verbatim rather than corrected here; if the wording is ever
// tightened, this comment is the record of which reading shipped.
// ============================================================

/** 2.1.d and 2.1.a/b both turn on these two and only these two. */
const HARMONY = '六合';
const CLASH = '冲';

/** 2.2.c bans exactly these two from the day pair. */
const HARM = '害';
const PUNISHMENT = '刑';

/**
 * P5 pull / fit facts.
 *
 * @param {Object} branchRelations output of lib/compat/branchRelations.js
 * @param {Object} complementarity output of lib/compat/complementarity.js
 * @param {Object} stemRelation    output of lib/compat/stemRelation.js
 * @returns {{
 *   kind: 'compat_pull_fit',
 *   pull: 'high'|'low', pull_reasons: string[],
 *   fit: 'high'|'low', fit_reasons: { clause: string, held: boolean }[],
 *   quadrant: 'q1'|'q2'|'q3'|'q4',
 * }} `pull_reasons` lists every clause that FIRED, in doc order, and is empty
 *    when pull is low. `fit_reasons` reports ALL THREE fit clauses with whether
 *    each held - 2.5 wants the renderer to explain the quadrant from the facts
 *    rather than from its own inference, which needs the clauses that held as
 *    much as the ones that failed. Neither is a score (2.4).
 */
export function compatPullFit(branchRelations, complementarity, stemRelation) {
  const { dayBranchPair, bHitsASpousePalace, aHitsBSpousePalace } = branchRelations;
  const { aSupplies, bSupplies, sameImbalance } = complementarity;

  const dayRelations = dayBranchPair.map((entry) => entry.relation);
  const palace = [...bHitsASpousePalace, ...aHitsBSpousePalace];

  // ── 2.1 PULL — high when ANY clause fires. Doc order is the emission order. ──
  const pull_reasons = [];
  // 2.1.a `dayBranchPair` contains harmony 六合
  if (dayRelations.includes(HARMONY)) pull_reasons.push('2.1.a');
  // 2.1.b `dayBranchPair` contains clash 冲 — counted as pull on purpose
  if (dayRelations.includes(CLASH)) pull_reasons.push('2.1.b');
  // 2.1.c `combination` present (Day Masters are a 天干五合 pair). ABSENT, not
  // null, is how stemRelation.js reports "not a pair", so this is a key check.
  if ('combination' in stemRelation) pull_reasons.push('2.1.c');
  // 2.1.d any entry of either palace scan is harmony or clash. 害 and 刑 are
  // neither and fire nothing here.
  if (palace.some((e) => e.relation === HARMONY || e.relation === CLASH)) pull_reasons.push('2.1.d');

  const pull = pull_reasons.length > 0 ? 'high' : 'low';

  // ── 2.2 FIT — high when ALL clauses hold. Every clause is reported. ──
  const fit_reasons = [
    // 2.2.a `aSupplies` or `bSupplies` is non-null — a disjunction, not a pair
    { clause: '2.2.a', held: aSupplies !== null || bSupplies !== null },
    // 2.2.b `sameImbalance` is false — read as "empty", see the header
    { clause: '2.2.b', held: sameImbalance.length === 0 },
    // 2.2.c `dayBranchPair` contains neither harm 害 nor punishment 刑
    {
      clause: '2.2.c',
      held: !dayRelations.includes(HARM) && !dayRelations.includes(PUNISHMENT),
    },
  ];

  const fit = fit_reasons.every((r) => r.held) ? 'high' : 'low';

  // ── 2.3 Quadrant — a pure function of the two booleans, nothing else. ──
  const quadrant = pull === 'high'
    ? (fit === 'high' ? 'q1' : 'q2')
    : (fit === 'high' ? 'q3' : 'q4');

  return { kind: 'compat_pull_fit', pull, pull_reasons, fit, fit_reasons, quadrant };
}
