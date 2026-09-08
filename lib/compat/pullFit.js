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
// ══ AMENDED 2026-09-08 — V6, ruled by Reyner ══════════════
// Three clauses changed and one was DELETED. Evidence:
// docs/qa/2026-09-07-compat-base-rates.md, run 2b, seven rule sets on one seed
// and the same 5000 pairs.
//
//   2.1.d  narrowed to the other person's MONTH branch. It read ANY of the eight
//          palace pairings and fired on 72.1% of pairs, supplying almost the
//          whole of pull (74.9%). Narrowed: pull-high 47.2%.
//   2.2.a  DELETED. It held on 100.0% of 5000 pairs as ruled, 99.5% tightened to
//          rank-0, 99.9% tightened to both directions - and deleting it left
//          fit-high at 42.4%, which is V3's 42.4% EXACTLY. A conjunct that never
//          fails is not a check. Tightening was tried first and refuted.
//   2.2.b  wording only: "is empty", which is what this always did.
//   2.2.c  extended to palace 害/刑, not the day pair alone. Palace 害/刑 is
//          present on 57.3% of pairs, so fit-high goes 88.1% -> 42.4%. Deliberate:
//          fit was high for seven readers in eight, and a verdict that lands on
//          seven in eight is not a verdict.
//
// Net: q1 66.3% -> 21.5%, q2 8.6% -> 25.7%, q3 21.8% -> 20.9%, q4 3.4% -> 31.9%.
//
// ── TWO CLAUSES THAT LOOK LIKE BUGS AND ARE RULINGS ───────
// 2.1.b: A CLASH RAISES PULL. Ruled deliberately - the spec's P2 reframe calls a
// clashed seat "intensity and transformation", and intensity is attraction, not
// fit. A session that reads this as a sign error has found the ruling.
//
// 2.1.d vs 2.2.c: THE TWO CLAUSES STILL READ DIFFERENT SCOPES, and after V6 the
// asymmetry is sharper rather than gone. 2.1.d reads the MONTH branch only and
// counts only harmony and clash. 2.2.c reads the day pair AND every palace entry,
// and counts only 害 and 刑. So a pair can carry a palace 冲 that fires no pull
// and costs no fit, and a palace 害 that costs fit while firing no pull.
//
// The reason is in the rule doc: pull asks whether there is a charge, and the
// ruling locates that at the month seat; fit asks whether the two hold each other
// up day to day, and friction anywhere in the chart counts against that.
//
// ── ONE WORDING MISMATCH, NOW CLOSED ──────────────────────
// 2.2.b read "`sameImbalance` is false" until 2026-09-08 while the value was a
// LIST, empty when there is no shared gap. The code always read it as "empty";
// the doc now says so. No behaviour changed with that wording, and this note
// stays as the record that the two once disagreed.
// ============================================================

/** 2.1.d and 2.1.a/b both turn on these two and only these two. */
const HARMONY = '六合';
const CLASH = '冲';

/** 2.2.c bans exactly these two, from the day pair AND from either palace scan. */
const HARM = '害';
const PUNISHMENT = '刑';

/** 2.1.d reads this position and no other. */
const MONTH = 'month';

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
 *    when pull is low. `fit_reasons` reports BOTH fit clauses with whether
 *    each held - 2.5 wants the renderer to explain the quadrant from the facts
 *    rather than from its own inference, which needs the clauses that held as
 *    much as the ones that failed. Neither is a score (2.4).
 */
export function compatPullFit(branchRelations, complementarity, stemRelation) {
  const { dayBranchPair, bHitsASpousePalace, aHitsBSpousePalace } = branchRelations;
  // `aSupplies` and `bSupplies` are deliberately NOT read: 2.2.a is deleted, and
  // destructuring them would leave two bindings that look load-bearing.
  const { sameImbalance } = complementarity;

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
  // 2.1.d the other person's MONTH branch harmonises or clashes with this
  // person's day branch. In both scans `from` is the other person and `to` is the
  // day branch being hit, so "the other person's month branch" is
  // `from.position === 'month'` in either direction. NOT all four pillars - see
  // the amendment note in the header. 害 and 刑 are still neither and fire nothing.
  if (palace.some((e) => e.from.position === MONTH
    && (e.relation === HARMONY || e.relation === CLASH))) pull_reasons.push('2.1.d');

  const pull = pull_reasons.length > 0 ? 'high' : 'low';

  // ── 2.2 FIT — high when ALL clauses hold. Every clause is reported. ──
  // 2.2.a IS DELETED (2026-09-08). It is not commented out and not kept as a
  // reason with `held: true` - a clause that never failed should leave no trace,
  // or a renderer would explain a quadrant from a condition that decides nothing.
  const fit_reasons = [
    // 2.2.b `sameImbalance` is empty
    { clause: '2.2.b', held: sameImbalance.length === 0 },
    // 2.2.c neither 害 nor 刑, on the day pair OR in either palace scan
    {
      clause: '2.2.c',
      held: !dayRelations.includes(HARM)
        && !dayRelations.includes(PUNISHMENT)
        && !palace.some((e) => e.relation === HARM || e.relation === PUNISHMENT),
    },
  ];

  const fit = fit_reasons.every((r) => r.held) ? 'high' : 'low';

  // ── 2.3 Quadrant — a pure function of the two booleans, nothing else. ──
  const quadrant = pull === 'high'
    ? (fit === 'high' ? 'q1' : 'q2')
    : (fit === 'high' ? 'q3' : 'q4');

  return { kind: 'compat_pull_fit', pull, pull_reasons, fit, fit_reasons, quadrant };
}
