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
  // V6: 2.1.d NO LONGER CO-FIRES. The same 六合 appears in both palace scans, but
  // at the DAY position on each side, and 2.1.d now reads the month branch only.
  assert.deepEqual(out.pull_reasons, ['2.1.a']);

  // And the pair's quadrant MOVED, from q1 to q2: B's hour carries 刑, which the
  // extended 2.2.c now counts against fit.
  assert.equal(out.fit, 'low');
  assert.equal(out.quadrant, 'q2');
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
  // V6: only 2.1.b. Both palace 冲 entries sit at the DAY position, and 2.1.d now
  // reads the month branch only.
  assert.deepEqual(out.pull_reasons, ['2.1.b']);

  // And it still does not touch fit: 2.2.c bans 害 and 刑, never 冲, on the day
  // pair OR in a palace. So a clash raises pull and leaves fit alone, which is
  // the whole reason 2.1.b is a pull clause.
  assert.equal(out.fit, 'high');
  assert.deepEqual(out.fit_reasons, [held('2.2.b'), held('2.2.c')]);
  assert.equal(out.quadrant, 'q1');
});

test('2.1.c — a 天干五合 Day Master pair fires pull (charts 13 x 11)', () => {
  // "2.1.c `combination` present (Day Masters are a 天干五合 pair)"
  // 乙 + 庚 -> Metal. The day BRANCHES carry nothing, so this is the clause that
  // reaches pull through the stems alone; 2.1.d also fires from 六合@B.year.
  const out = pullFit(13, 11);
  assert.equal(out.pull, 'high');
  // 2.1.d STILL co-fires here under V6, and that is the useful half: B's MONTH
  // branch carries 冲 against A's day branch, which is exactly what the narrowed
  // clause reads. The B-year 六合 does not count any more.
  assert.deepEqual(out.pull_reasons, ['2.1.c', '2.1.d']);

  // A's year carries 刑 into B's day branch, so the extended 2.2.c lowers fit.
  assert.equal(out.fit, 'low');
  assert.equal(out.quadrant, 'q2');
});

test('2.1.d — ONLY the other person\'s MONTH branch fires pull (charts 1 x 2)', () => {
  // AMENDED 2026-09-08 (V6). The clause now reads: "the other person's MONTH
  // branch harmonises or clashes with your Day Branch. [...] NOT all four
  // pillars."
  //
  // CHARTS 1 x 2 IS THE CASE THAT CHANGES, and that is why it is the 2.1.d test.
  // Its palace entries are 冲 at B's YEAR, 害 at B's HOUR, and 六合 at A's MONTH.
  // Under the old clause the B-year 冲 fired and the pair was pull HIGH. Under
  // V6 the B-year 冲 is ignored - year is not month - and only A's month 六合
  // against B's day branch qualifies. It still fires, from the other direction.
  const out = pullFit(1, 2);
  assert.equal(out.pull, 'high');
  assert.deepEqual(out.pull_reasons, ['2.1.d']);

  // The B-side 冲 is at YEAR and must now count for nothing. Asserted directly on
  // the facts, so this cannot pass by accident through the A-side hit above.
  const [branches] = factsFor(1, 2);
  const bYear = branches.bHitsASpousePalace.find((e) => e.from.position === 'year');
  assert.equal(bYear.relation, '冲', 'the B-year clash is still THERE');
  assert.equal(
    branches.bHitsASpousePalace.some((e) => e.from.position === 'month'), false,
    'and B has NO month-branch relation, so the B side contributes nothing to pull',
  );
});

test('2.1.d — a NON-month palace hit alone no longer fires pull (charts 2 x 8)', () => {
  // The clause's whole point, isolated. Under the old rule any of eight pairings
  // could fire it; under V6 only two can. This pair has palace entries that are
  // all 刑 - never a pull clause in either version - so it is pull LOW both ways
  // and is here as the control for the pair below.
  const quiet = pullFit(2, 8);
  assert.equal(quiet.pull, 'low');

  // Charts 1 x 3: the ONLY palace entries are 害 at A's year and A's hour. 害 was
  // never a pull relation, so this stays low - but it also proves the scan is not
  // simply matching every entry.
  assert.equal(pullFit(1, 3).pull, 'low');
});

test('刑 and 害 in a PALACE fire no pull, and NOW LOWER FIT (charts 1 x 3)', () => {
  // THE TEST THAT INVERTS UNDER V6, and it is the sharpest one in the file.
  //
  // Under the ruled version, 2.2.c read the DAY PAIR only, so this pair's two
  // palace 害 entries left fit HIGH and it sat in q3. The extended 2.2.c counts
  // palace 害/刑 too, so the same pair is now fit LOW and sits in q4.
  //
  // The asymmetry with 2.1.d is deliberate and is stated in the rule doc: 2.1.d
  // reads the MONTH branch only, 2.2.c reads ALL palace entries. Pull asks where
  // the charge is and the ruling locates it at the month seat; fit asks whether
  // the two hold each other up, and friction anywhere counts against that.
  const out = pullFit(1, 3);

  // Pull is unchanged: 害 was never a pull relation in either version, so the two
  // entries still fire nothing.
  assert.equal(out.pull, 'low');
  assert.deepEqual(out.pull_reasons, []);

  // Fit MOVED.
  assert.equal(out.fit, 'low');
  assert.deepEqual(out.fit_reasons, [held('2.2.b'), failed('2.2.c')]);
  assert.equal(out.quadrant, 'q4');

  // And the 害 really is in a PALACE and not on the day pair - otherwise this
  // would be testing the old clause with a new name.
  const [branches] = factsFor(1, 3);
  assert.deepEqual(branches.dayBranchPair, [], 'the DAY PAIR is empty');
  assert.ok(
    branches.aHitsBSpousePalace.some((e) => e.relation === '害'),
    'the 害 that lowers fit is a palace entry',
  );
});

test('2.2.c — 刑 on the DAY PAIR lowers fit (charts 1 x 12, and 2 x 8)', () => {
  // "2.2.c `dayBranchPair` contains neither harm 害 nor punishment 刑"
  // 1 x 12: day pair is the 子卯 punishment pair, and the palace scans carry 冲, so
  // pull is high and fit is low - the addictive-hard quadrant.
  const hard = pullFit(1, 12);
  assert.equal(hard.pull, 'high');
  // B's MONTH carries 冲, so 2.1.d survives the narrowing here.
  assert.deepEqual(hard.pull_reasons, ['2.1.d']);
  assert.equal(hard.fit, 'low');
  assert.deepEqual(hard.fit_reasons, [held('2.2.b'), failed('2.2.c')]);
  assert.equal(hard.quadrant, 'q2');

  // 2 x 8: day pair is 自刑 辰辰 and every palace entry is 刑, which fires no pull
  // clause. Same failing fit clause, the other pull side.
  const quiet = pullFit(2, 8);
  assert.equal(quiet.pull, 'low');
  assert.deepEqual(quiet.pull_reasons, []);
  assert.equal(quiet.fit, 'low');
  assert.deepEqual(quiet.fit_reasons, [held('2.2.b'), failed('2.2.c')]);
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
  assert.deepEqual(out.fit_reasons, [failed('2.2.b'), held('2.2.c')]);
  // Nothing in either chart's branches relates, so pull is low: q4.
  assert.equal(out.pull, 'low');
  assert.equal(out.quadrant, 'q4');
});

test('2.2.a IS DELETED — supply no longer decides fit at all', () => {
  // DELETED 2026-09-08 (V6). The rule doc's table is the evidence: as ruled it
  // held on 100.0% of 5000 pairs, tightened to rank-0 on 99.5%, tightened to both
  // directions on 99.9%, and deleting it left fit-high at 42.4% - V3's 42.4%
  // exactly. A conjunct that never fails is not a check.
  //
  // THE TEST THAT STOOD HERE ASSERTED THE OPPOSITE and could only do it with a
  // STIPULATED complementarity object, because no real pair could fail the
  // clause. Its own comment said so. That is the tell this deletion acts on.
  //
  // So the assertion inverts: handing pullFit a pair with NO supplier in either
  // direction must now leave fit untouched.
  // CHARTS 3 x 7, which carry no cross-chart relation at all - no day pair, no
  // palace entry, no shared gap - so 2.2.b and 2.2.c both hold and fit is HIGH
  // for reasons that have nothing to do with supply. That isolation is the point:
  // it makes the supplier the only thing varying between the two calls below.
  //
  // It is NOT charts 1 x 3, which this test used when it was first written. Under
  // V6 that pair is fit LOW - its palace 害 now fails 2.2.c - so the baseline
  // would have been false and the assertion below would have proved nothing. The
  // stale premise was caught by this test failing, not by reading it.
  const [branches, , stems] = factsFor(3, 7);
  const baseline = compatPullFit(
    branches,
    { aSupplies: { element: 'Metal', receiver_favourable_rank: 0 }, bSupplies: null, sameImbalance: [] },
    stems,
  );
  assert.equal(baseline.fit, 'high');

  const noSupplier = compatPullFit(
    branches,
    { aSupplies: null, bSupplies: null, sameImbalance: [] },
    stems,
  );
  assert.equal(noSupplier.fit, 'high', 'no supplier anywhere, and fit is UNAFFECTED');
  assert.deepEqual(noSupplier.fit_reasons.map((r) => r.clause), ['2.2.b', '2.2.c'],
    'TWO fit clauses now, not three - 2.2.a is gone from the reasons entirely');
});

test('2.3 — all four quadrants, from the pull/fit pair and nothing else', () => {
  // | pull | fit | id |
  // | high | high | q1 |  | high | low | q2 |  | low | high | q3 |  | low | low | q4 |
  // ALL FOUR STILL REACHABLE FROM REAL PAIRS UNDER V6, and three of these four
  // cells changed occupant - which is the amendment working rather than a
  // renumbering. q1 was 1 x 2 and is now 2 x 6; q3 was 1 x 3 and is now 3 x 7,
  // the pair with no cross-chart relation at all; 1 x 3 moved to q4.
  const cases = [
    [[2, 6], 'q1', 'high', 'high'],
    [[1, 12], 'q2', 'high', 'low'],
    [[3, 7], 'q3', 'low', 'high'],
    [[1, 3], 'q4', 'low', 'low'],
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
  // 2.2.a IS GONE FROM THE CLAUSE SET ENTIRELY. A stale id surviving in a reason
  // would be a renderer explaining a quadrant from a clause that no longer exists.
  const CLAUSES = new Set(['2.1.a', '2.1.b', '2.1.c', '2.1.d', '2.2.b', '2.2.c']);
  for (const id of out.pull_reasons) assert.ok(CLAUSES.has(id), `pull reason ${id}`);
  assert.equal(out.fit_reasons.length, 2, 'TWO fit clauses now, reported held or failed');
  assert.ok(!JSON.stringify(out).includes('2.2.a'), 'no trace of the deleted clause');
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
