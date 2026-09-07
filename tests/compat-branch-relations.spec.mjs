// ============================================================
// tests/compat-branch-relations.spec.mjs
// ============================================================
// WHAT THIS ASSERTS, AND WHAT IT CANNOT.
//
// There is NO ORACLE FOR A PAIR CLAIM. Joey Yap's plotter is single-chart, probed
// and recorded 2026-08-12, so nothing outside this repo can confirm that a given
// pair of charts "really" carries a given cross-chart relation. This spec therefore
// asserts INTERNAL CONSISTENCY ONLY: that `compatBranchRelations` reads the repo's
// own locked tables, with two-chart inputs, exactly as those tables are written.
//
// That is the whole of what ruling A (Reyner, 2026-09-07, verbatim in
// docs/prompts/W-compat-1.md and PROGRESS.md's RULED 2026-09-07) approves:
//
//   "Using one branch from Person A and one from Person B does not constitute a
//    new BaZi rule; it is the same verified 六合 / 冲 / 害 / 刑 table with two-chart
//    inputs. Boundary: the detection rule is approved, but the relationship
//    interpretation is not automatically inherited from the single-chart meaning."
//
// So every expectation below is derived BY HAND from the table rows quoted in the
// comments, and each quote names the file and line it was read from. No expectation
// is derived by running the module under test, and none of them claims a MEANING.
//
// THE TABLES, quoted 2026-09-07:
//   六合  lib/bazi/stems.js:58    子丑  寅亥  卯戌  辰酉  巳申  午未
//   冲    lib/bazi/stems.js:64    子午  丑未  寅申  卯酉  辰戌  巳亥
//   害    lib/bazi/relations.js:30 子未  丑午  寅巳  卯辰  申亥  酉戌
//   刑    lib/bazi/stems.js:88-97  self: 辰 午 酉 亥 (repeated) · pair: 子卯
//                                  trine: 寅巳申 · 丑戌未  (three branches, see below)
//
// 三刑 CANNOT ARISE HERE AND THAT IS NOT AN OVERSIGHT. A punishment trine needs
// three branches; every fact in this module is PAIRWISE by specification (one
// branch from each chart, the pillar named), so two branches is all
// `branchPunishments` is ever handed. Ruling A lists exactly 六合 / 冲 / 害 / 刑, and
// the pairwise-detectable part of 刑 is self and pair. Cross-chart 三刑 needs a fact
// shape that names TWO pillars on one side; it is out of scope for tranche 1 and
// recorded as owed in the PR rather than improvised here.
// ============================================================

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateBaziChart } from '../lib/bazi/buildChart.js';
import { VALIDATION_CHARTS, HOUR_UNKNOWN_CHARTS } from './bazi-validation.fixture.js';
import { compatBranchRelations } from '../lib/compat/branchRelations.js';

const chartFor = (tc) => calculateBaziChart({ birthDate: tc.date, birthTime: tc.time });
const fixture = (id) => {
  const tc = [...VALIDATION_CHARTS, ...HOUR_UNKNOWN_CHARTS].find((c) => c.id === id);
  assert.ok(tc, `fixture chart ${id} exists`);
  return chartFor(tc);
};

// The four branches of each chart used below, printed from the engine 2026-09-07
// so a reader can check the hand derivations without running anything:
//   chart  1  巳 酉 子 巳   (day 子)
//   chart  2  午 寅 辰 未   (day 辰)
//   chart  3  申 辰 寅 辰   (day 寅)
//   chart  6  巳 寅 戌 子   (day 戌)
//   chart  7  酉 午 子 子   (day 子)
//   chart  9  午 未 辰 巳   (day 辰)
//   chart 11  午 丑 辰 寅   (day 辰)
//   chart 12  午 午 卯 午   (day 卯)
//   chart 101 巳 酉 子 --   (day 子, no hour; chart 1 without a birth time)

/** Compare emitted entries against hand-derived ones, ignoring nothing. */
const shape = (entries) => entries.map((e) => ({
  relation: e.relation,
  branches: e.branches,
  punishment: e.punishment ?? null,
  from: `${e.from.chart}.${e.from.position}`,
  to: `${e.to.chart}.${e.to.position}`,
}));

test('冲 and 害 reach A\'s day branch; 六合 reaches B\'s (charts 1 x 2)', () => {
  const out = compatBranchRelations(fixture(1), fixture(2));

  // A.day 子 vs B.day 辰. 子 appears in 六合 as 子丑, in 冲 as 子午, in 害 as 子未,
  // and in 刑 only as the pair 子卯. None of those is 辰, and 辰 is not repeated
  // across the two day branches, so there is nothing to report.
  assert.deepEqual(shape(out.dayBranchPair), []);

  // B's four branches against A.day 子:
  //   year  午  -> 冲, table row 子午 (stems.js:64)
  //   month 寅  -> nothing (寅's rows are 寅亥, 寅申, 寅巳)
  //   day   辰  -> nothing (辰's rows are 辰酉, 辰戌, 卯辰)
  //   hour  未  -> 害, table row 子未 (relations.js:30)
  assert.deepEqual(shape(out.bHitsASpousePalace), [
    { relation: '冲', branches: ['子', '午'], punishment: null, from: 'B.year', to: 'A.day' },
    { relation: '害', branches: ['子', '未'], punishment: null, from: 'B.hour', to: 'A.day' },
  ]);

  // A's four branches against B.day 辰:
  //   year  巳  -> nothing (巳's rows are 巳申, 巳亥, 寅巳)
  //   month 酉  -> 六合, table row 辰酉 (stems.js:58)
  //   day   子  -> nothing
  //   hour  巳  -> nothing
  assert.deepEqual(shape(out.aHitsBSpousePalace), [
    { relation: '六合', branches: ['辰', '酉'], punishment: null, from: 'A.month', to: 'B.day' },
  ]);
});

test('六合 on the day pair, and 子卯 punishment from B\'s hour (charts 12 x 6)', () => {
  const out = compatBranchRelations(fixture(12), fixture(6));

  // A.day 卯 vs B.day 戌 -> 六合, table row 卯戌 (stems.js:58).
  assert.deepEqual(shape(out.dayBranchPair), [
    { relation: '六合', branches: ['卯', '戌'], punishment: null, from: 'A.day', to: 'B.day' },
  ]);

  // B's branches against A.day 卯:
  //   year  巳  -> nothing
  //   month 寅  -> nothing
  //   day   戌  -> 六合, row 卯戌
  //   hour  子  -> 刑, PUNISHMENT_PAIRS row 子卯 (stems.js:97). `branches` comes
  //                back in the table's own order, not the input's.
  assert.deepEqual(shape(out.bHitsASpousePalace), [
    { relation: '六合', branches: ['卯', '戌'], punishment: null, from: 'B.day', to: 'A.day' },
    { relation: '刑', branches: ['子', '卯'], punishment: 'pair', from: 'B.hour', to: 'A.day' },
  ]);

  // A's branches against B.day 戌: 午, 午, 卯, 午. Only 卯 relates (六合 卯戌);
  // 午's rows are 午未, 子午, 丑午, none of them 戌.
  assert.deepEqual(shape(out.aHitsBSpousePalace), [
    { relation: '六合', branches: ['卯', '戌'], punishment: null, from: 'A.day', to: 'B.day' },
  ]);
});

test('自刑 forms across two charts that share a self-punishing branch (charts 9 x 11)', () => {
  const out = compatBranchRelations(fixture(9), fixture(11));

  // Both day branches are 辰, and 辰 is in SELF_PUNISHMENT (stems.js:88). Handed
  // two 辰, branchPunishments reports one self entry with both of them.
  assert.deepEqual(shape(out.dayBranchPair), [
    { relation: '刑', branches: ['辰', '辰'], punishment: 'self', from: 'A.day', to: 'B.day' },
  ]);

  // B's branches against A.day 辰: 午 no, 丑 no, 辰 -> 自刑, 寅 no.
  assert.deepEqual(shape(out.bHitsASpousePalace), [
    { relation: '刑', branches: ['辰', '辰'], punishment: 'self', from: 'B.day', to: 'A.day' },
  ]);

  // A's branches against B.day 辰: 午 no, 未 no, 辰 -> 自刑, 巳 no.
  assert.deepEqual(shape(out.aHitsBSpousePalace), [
    { relation: '刑', branches: ['辰', '辰'], punishment: 'self', from: 'A.day', to: 'B.day' },
  ]);
});

test('THE EMPTY CASE: a pair with no cross-chart relation at all (charts 3 x 7)', () => {
  // This is the assertion a permissive implementation fails. Chart 3 is 申 辰 寅 辰
  // (day 寅) and chart 7 is 酉 午 子 子 (day 子). Hand-checked against all four
  // tables, in both directions:
  //   A.day 寅 needs 亥 (六合), 申 (冲) or 巳 (害); chart 7 has none of them.
  //   B.day 子 needs 丑, 午, 未 or 卯; chart 3 has none of them.
  //   No branch is repeated ACROSS the two charts among 辰 午 酉 亥, so no 自刑:
  //     chart 3's two 辰 are its own, and pairing either with a chart-7 branch
  //     never yields a second 辰.
  const out = compatBranchRelations(fixture(3), fixture(7));
  assert.deepEqual(out.dayBranchPair, []);
  assert.deepEqual(out.bHitsASpousePalace, []);
  assert.deepEqual(out.aHitsBSpousePalace, []);
});

test('an unknown hour is skipped, not treated as a branch (chart 1 vs chart 101)', () => {
  // Chart 101 IS chart 1 with the birth time removed (fixture row: from: 1), so the
  // only difference between these two runs is whether the hour pillar exists.
  // B is chart 3, day branch 寅. A's 巳 relates to it as 害 (row 寅巳,
  // relations.js:30), and chart 1 holds 巳 TWICE - year and hour.
  const withHour = compatBranchRelations(fixture(1), fixture(3));
  assert.deepEqual(shape(withHour.aHitsBSpousePalace), [
    { relation: '害', branches: ['寅', '巳'], punishment: null, from: 'A.year', to: 'B.day' },
    { relation: '害', branches: ['寅', '巳'], punishment: null, from: 'A.hour', to: 'B.day' },
  ]);

  // Same pair, hour unknown: the year 巳 still reports, the hour is absent
  // entirely rather than reported as null or as some default branch.
  const noHour = compatBranchRelations(fixture(101), fixture(3));
  assert.deepEqual(shape(noHour.aHitsBSpousePalace), [
    { relation: '害', branches: ['寅', '巳'], punishment: null, from: 'A.year', to: 'B.day' },
  ]);
  assert.ok(
    noHour.aHitsBSpousePalace.every((e) => e.from.position !== 'hour'),
    'no entry names an hour pillar the chart does not have',
  );
});

test('emits FACTS only - no prose, no score, no interpretation string', () => {
  // Rule 14: the engine owns facts, the LLM chooses words. Ruling A puts
  // cross-chart MEANING in the content layer, so nothing in lib/compat/ may carry
  // a sentence. This walks every emitted value and rejects any string that is not
  // a hanzi branch, a known relation name, a chart id or a pillar position.
  const allowed = new Set([
    '六合', '冲', '害', '刑', 'self', 'pair', 'A', 'B',
    'year', 'month', 'day', 'hour', 'compat_branch_relation',
  ]);
  const branch = /^[子丑寅卯辰巳午未申酉戌亥]$/u;

  for (const [x, y] of [[1, 2], [12, 6], [9, 11], [3, 7], [1, 3]]) {
    const out = compatBranchRelations(fixture(x), fixture(y));
    const walk = (node, path) => {
      if (typeof node === 'string') {
        assert.ok(
          allowed.has(node) || branch.test(node),
          `${path} carries a non-fact string: ${JSON.stringify(node)}`,
        );
        return;
      }
      if (typeof node === 'number') assert.fail(`${path} carries a number: ${node}`);
      if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
      }
    };
    walk(out, `${x}x${y}`);
  }
});
