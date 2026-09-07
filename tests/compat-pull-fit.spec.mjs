// ============================================================
// tests/compat-pull-fit.spec.mjs
// ============================================================
// P5, "accepted as written" by Reyner 2026-09-07 (evening). THE RULE IS
// docs/product/compat-p4-p5-rules.md SECTION 2, and every case below quotes the
// clause it asserts, verbatim, so the doc and the test cannot drift silently.
//
// There is NO ORACLE FOR A PAIR CLAIM (Joey Yap's plotter is single-chart, probed
// 2026-08-12). Nothing here claims a pair "really" has pull or fit. What is
// asserted is that the module implements the ruled clauses exactly, over facts
// tranche 1's three modules produced.
//
// ── THE FACTS EVERY CASE IS DERIVED FROM ──────────────────
// Printed from lib/compat/{branchRelations,complementarity,stemRelation}.js on
// 2026-09-07 and hand-read against section 2's clauses. These are INPUTS to
// pullFit, produced by modules with their own specs, not by the module under test.
//
//   1 x 2    day []                     palace 冲@B.year 害@B.hour, 六合@A.month
//            combo ABSENT   supplies a=Water b=Wood   sameImbalance []
//   2 x 6    day [冲 辰戌]               palace 冲@B.day, 冲@A.day
//            combo ABSENT   supplies a=Metal b=Water  sameImbalance []
//   12 x 6   day [六合 卯戌]             palace 六合@B.day 刑@B.hour, 六合@A.day
//            combo ABSENT   supplies a=Metal b=Metal  sameImbalance []
//   13 x 11  day []                     palace 六合@B.year 冲@B.month, 刑@A.year
//            combo 乙庚->Metal  supplies a=Fire b=Metal  sameImbalance []
//   1 x 12   day [刑/pair 子卯]          palace 冲x3 刑x1, 冲 刑
//            combo ABSENT   supplies a=Metal b=Wood   sameImbalance []
//   1 x 3    day []                     palace (none), 害@A.year 害@A.hour
//            combo ABSENT   supplies a=Metal b=Wood   sameImbalance []
//   2 x 8    day [刑/self 辰辰]          palace 刑x2, 刑
//            combo ABSENT   supplies a=Fire b=Water   sameImbalance []
//   1 x 101  day []                     palace (none), (none)
//            combo ABSENT   supplies a=Fire b=Fire    sameImbalance ["Wood"]
//
// ── ONE CLAUSE CANNOT BE FAILED FROM THE FIXTURE ──────────
// 2.2.a ("`aSupplies` or `bSupplies` is non-null") never fails: no fixture chart
// lacks enough elements for a supplier to come back null, which tranche 1 already
// recorded as a fixture gap. It is asserted HOLDING in every case below and its
// failing branch is covered with a stipulated input, said out loud where it is
// used. All four QUADRANTS are reachable from real pairs.
// ============================================================

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateBaziChart } from '../lib/bazi/buildChart.js';
import { compatBranchRelations } from '../lib/compat/branchRelations.js';
import { compatComplementarity } from '../lib/compat/complementarity.js';
import { compatStemRelation } from '../lib/compat/stemRelation.js';
import { VALIDATION_CHARTS, HOUR_UNKNOWN_CHARTS } from './bazi-validation.fixture.js';
import { compatPullFit } from '../lib/compat/pullFit.js';

const ALL = [...VALIDATION_CHARTS, ...HOUR_UNKNOWN_CHARTS];
const chartFor = (id) => {
  const tc = ALL.find((c) => c.id === id);
  assert.ok(tc, `fixture chart ${id} exists`);
  return calculateBaziChart({ birthDate: tc.date, birthTime: tc.time });
};
/** The three tranche-1 outputs for a pair, which is all pullFit consumes. */
const factsFor = (x, y) => {
  const a = chartFor(x);
  const b = chartFor(y);
  return [compatBranchRelations(a, b), compatComplementarity(a, b), compatStemRelation(a, b)];
};
const pullFit = (x, y) => compatPullFit(...factsFor(x, y));
const held = (clause) => ({ clause, held: true });
const failed = (clause) => ({ clause, held: false });

test('2.1.a — day-branch 六合 fires pull (charts 12 x 6)', () => {
  // "2.1.a `dayBranchPair` contains harmony 六合"
  // Day branches 卯 and 戌 are the 六合 row 卯戌. 2.1.d ALSO fires here, because
  // the same 六合 shows up in both palace scans, and both are reported: 2.5 wants
  // the renderer to see every clause that fired, not just the first.
  const out = pullFit(12, 6);
  assert.equal(out.pull, 'high');
  assert.deepEqual(out.pull_reasons, ['2.1.a', '2.1.d']);
});

test('2.1.b — day-branch 冲 fires pull, ON PURPOSE (charts 2 x 6)', () => {
  // "2.1.b `dayBranchPair` contains clash 冲 — **counted as pull on purpose**:
  //  the spec's P2 reframe calls a clashed seat 'intensity and transformation';
  //  intensity is attraction, not fit"
  // THIS IS THE CLAUSE MOST LIKELY TO LOOK LIKE A BUG. Day branches 辰 and 戌 are
  // the 冲 row 辰戌, and the pair comes out pull HIGH. A later session that reads
  // a clash raising pull as a sign error has found the ruling, not a defect.
  const out = pullFit(2, 6);
  assert.equal(out.pull, 'high');
  assert.deepEqual(out.pull_reasons, ['2.1.b', '2.1.d']);

  // And it does not touch fit: 2.2.c bans only 害 and 刑 from the day pair, so a
  // day 冲 leaves all three fit clauses holding.
  assert.equal(out.fit, 'high');
  assert.deepEqual(out.fit_reasons, [held('2.2.a'), held('2.2.b'), held('2.2.c')]);
  assert.equal(out.quadrant, 'q1');
});

test('2.1.c — a 天干五合 Day Master pair fires pull (charts 13 x 11)', () => {
  // "2.1.c `combination` present (Day Masters are a 天干五合 pair)"
  // 乙 + 庚 -> Metal. The day BRANCHES carry nothing, so this is the clause that
  // reaches pull through the stems alone; 2.1.d also fires from 六合@B.year.
  const out = pullFit(13, 11);
  assert.equal(out.pull, 'high');
  assert.deepEqual(out.pull_reasons, ['2.1.c', '2.1.d']);
});

test('2.1.d — a palace harmony or clash alone fires pull (charts 1 x 2)', () => {
  // "2.1.d any entry of `bHitsASpousePalace` or `aHitsBSpousePalace` is harmony
  //  or clash"
  // The day pair is EMPTY and there is no combination, so 2.1.d is the only
  // clause that can fire: 冲 at B's year and 六合 at A's month.
  const out = pullFit(1, 2);
  assert.equal(out.pull, 'high');
  assert.deepEqual(out.pull_reasons, ['2.1.d']);
  assert.equal(out.fit, 'high');
  assert.equal(out.quadrant, 'q1');
});

test('刑 and 害 in a PALACE do not fire pull, and 害 there does not lower fit (charts 1 x 3)', () => {
  // THE SHARP CASE, and it is where implementing the doc differs from implementing
  // an intuition. 2.1.d says "harmony or clash" - 害 and 刑 are neither, so two
  // 害 entries in the palace scan fire NOTHING. And 2.2.c is scoped to
  // "`dayBranchPair` contains neither harm 害 nor punishment 刑", so those same two
  // palace 害 entries leave fit HIGH.
  const out = pullFit(1, 3);
  assert.equal(out.pull, 'low');
  assert.deepEqual(out.pull_reasons, []);
  assert.equal(out.fit, 'high');
  assert.deepEqual(out.fit_reasons, [held('2.2.a'), held('2.2.b'), held('2.2.c')]);
  assert.equal(out.quadrant, 'q3');
});

test('2.2.c — 刑 on the DAY PAIR lowers fit (charts 1 x 12, and 2 x 8)', () => {
  // "2.2.c `dayBranchPair` contains neither harm 害 nor punishment 刑"
  // 1 x 12: day pair is the 子卯 punishment pair, and the palace scans carry 冲, so
  // pull is high and fit is low - the addictive-hard quadrant.
  const hard = pullFit(1, 12);
  assert.equal(hard.pull, 'high');
  assert.deepEqual(hard.pull_reasons, ['2.1.d']);
  assert.equal(hard.fit, 'low');
  assert.deepEqual(hard.fit_reasons, [held('2.2.a'), held('2.2.b'), failed('2.2.c')]);
  assert.equal(hard.quadrant, 'q2');

  // 2 x 8: day pair is 自刑 辰辰 and every palace entry is 刑, which fires no pull
  // clause. Same failing fit clause, the other pull side.
  const quiet = pullFit(2, 8);
  assert.equal(quiet.pull, 'low');
  assert.deepEqual(quiet.pull_reasons, []);
  assert.equal(quiet.fit, 'low');
  assert.deepEqual(quiet.fit_reasons, [held('2.2.a'), held('2.2.b'), failed('2.2.c')]);
  assert.equal(quiet.quadrant, 'q4');
});

test('2.2.b — a shared missing element lowers fit (charts 1 x 101)', () => {
  // "2.2.b `sameImbalance` is false"
  // THE DOC SAYS "is false" AND THE VALUE IS AN ARRAY. tranche 1's
  // complementarity module emits `sameImbalance` as a list of elements absent from
  // both charts, empty when there is none, so the only coherent reading of the
  // ruled clause is "empty". Asserted here on the one shape that can fail it:
  // charts 1 and 101 both hold zero Wood, so sameImbalance is ["Wood"].
  const out = pullFit(1, 101);
  assert.equal(out.fit, 'low');
  assert.deepEqual(out.fit_reasons, [held('2.2.a'), failed('2.2.b'), held('2.2.c')]);
  // Nothing in either chart's branches relates, so pull is low: q4.
  assert.equal(out.pull, 'low');
  assert.equal(out.quadrant, 'q4');
});

test('2.2.a — no supplier in either direction lowers fit (STIPULATED input)', () => {
  // "2.2.a `aSupplies` or `bSupplies` is non-null"
  // THIS CLAUSE CANNOT BE FAILED FROM THE FIXTURE and that is said out loud rather
  // than worked around: no fixture chart lacks enough elements for a supplier to
  // come back null, which tranche 1 already recorded as a fixture gap. So the
  // failing branch is covered by handing pullFit a complementarity object with
  // both suppliers null. The branch relations and stem relation are REAL (charts
  // 1 x 3); only the complementarity is stipulated, and it asserts this module's
  // contract, not a BaZi claim.
  const [branches, , stems] = factsFor(1, 3);
  const out = compatPullFit(
    branches,
    { aSupplies: null, bSupplies: null, sameImbalance: [] },
    stems,
  );
  assert.equal(out.fit, 'low');
  assert.deepEqual(out.fit_reasons, [failed('2.2.a'), held('2.2.b'), held('2.2.c')]);

  // One non-null supplier is enough - the clause is a disjunction, not a pair.
  for (const supplies of [
    { aSupplies: { element: 'Fire' }, bSupplies: null, sameImbalance: [] },
    { aSupplies: null, bSupplies: { element: 'Fire' }, sameImbalance: [] },
  ]) {
    const one = compatPullFit(branches, supplies, stems);
    assert.deepEqual(one.fit_reasons[0], held('2.2.a'));
    assert.equal(one.fit, 'high');
  }
});

test('2.3 — all four quadrants, from the pull/fit pair and nothing else', () => {
  // | pull | fit | id |
  // | high | high | q1 |  | high | low | q2 |  | low | high | q3 |  | low | low | q4 |
  const cases = [
    [[1, 2], 'q1', 'high', 'high'],
    [[1, 12], 'q2', 'high', 'low'],
    [[1, 3], 'q3', 'low', 'high'],
    [[2, 8], 'q4', 'low', 'low'],
  ];
  for (const [[x, y], quadrant, pull, fit] of cases) {
    const out = pullFit(x, y);
    assert.equal(out.pull, pull, `${x}x${y} pull`);
    assert.equal(out.fit, fit, `${x}x${y} fit`);
    assert.equal(out.quadrant, quadrant, `${x}x${y} quadrant`);
  }

  // ALL FOUR ARE REACHABLE FROM REAL FIXTURE PAIRS, swept rather than asserted
  // from the four above - so a later session does not have to trust that the
  // sample was representative. Also checks the quadrant is a pure function of the
  // two booleans on every pair, with no fifth outcome anywhere.
  const QUADRANT = { 'high|high': 'q1', 'high|low': 'q2', 'low|high': 'q3', 'low|low': 'q4' };
  const seen = new Set();
  for (const p of ALL) {
    for (const q of ALL) {
      if (p.id === q.id) continue;
      const out = pullFit(p.id, q.id);
      assert.equal(out.quadrant, QUADRANT[`${out.pull}|${out.fit}`], `${p.id}x${q.id}`);
      seen.add(out.quadrant);
    }
  }
  assert.deepEqual([...seen].sort(), ['q1', 'q2', 'q3', 'q4']);
});

test('2.4 / 2.5 — reasons, no score, and no prose', () => {
  // 2.4 "No overall score." 2.5 the engine emits which clauses fired "so the
  // renderer explains the quadrant from facts and never from its own inference".
  const out = pullFit(12, 6);

  // Every reason is a clause id from the doc. No numbers anywhere: a score is the
  // one thing 2.4 forbids, and it would arrive as a number.
  const CLAUSES = new Set(['2.1.a', '2.1.b', '2.1.c', '2.1.d', '2.2.a', '2.2.b', '2.2.c']);
  for (const id of out.pull_reasons) assert.ok(CLAUSES.has(id), `pull reason ${id}`);
  assert.equal(out.fit_reasons.length, 3, 'all three fit clauses reported, held or failed');
  for (const r of out.fit_reasons) {
    assert.ok(CLAUSES.has(r.clause), `fit clause ${r.clause}`);
    assert.equal(typeof r.held, 'boolean');
  }

  const allowed = new Set([
    'compat_pull_fit', 'high', 'low', 'q1', 'q2', 'q3', 'q4', ...CLAUSES,
  ]);
  const walk = (node, path) => {
    if (typeof node === 'number') assert.fail(`${path} carries a number: ${node}`);
    if (typeof node === 'string') {
      assert.ok(allowed.has(node), `${path} carries a non-fact string: ${JSON.stringify(node)}`);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    }
  };
  for (const [x, y] of [[1, 2], [12, 6], [1, 12], [2, 8], [1, 3], [13, 11]]) {
    walk(pullFit(x, y), `${x}x${y}`);
  }
});
