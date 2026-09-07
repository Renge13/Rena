// ============================================================
// lib/compat/branchRelations.js — CROSS-CHART branch relations (P2 facts)
// ============================================================
// FACTS ONLY. No prose, no score, no interpretation string. Rule 14: the engine
// owns all facts, hierarchy and structure; the LLM chooses only words.
//
// ── WHY THIS IS NOT A NEW BaZi RULE ────────────────────────
// Ruling A, Reyner 2026-09-07 (verbatim in docs/prompts/W-compat-1.md and in
// PROGRESS.md's RULED 2026-09-07):
//
//   "Existing Earthly Branch relationship tables can be applied cross-chart. Using
//    one branch from Person A and one from Person B does not constitute a new BaZi
//    rule; it is the same verified 六合 / 冲 / 害 / 刑 table with two-chart inputs.
//    Boundary: the detection rule is approved, but the relationship interpretation
//    is not automatically inherited from the single-chart meaning. Cross-chart
//    meaning belongs in the content/interpretation layer and must not be
//    improvised in the engine."
//
// So this file adds NO TABLE. Every relation it can report is read from a table
// that already exists and is already guarded:
//   六合  SIX_HARMONIES        lib/bazi/stems.js:58
//   冲    SIX_CLASHES          lib/bazi/stems.js:64
//   害    SIX_HARMS            lib/bazi/relations.js:30
//   刑    branchPunishments()  lib/bazi/stems.js:105
//
// 刑 COMES THROUGH branchPunishments AND NOWHERE ELSE. relations.js's own header
// says a second 刑 entry point would be a second source of truth for the same
// table, and that reasoning does not weaken just because the inputs now come from
// two charts. The punishment tables are not even imported here.
//
// ── WHAT THIS DELIBERATELY CANNOT DETECT ───────────────────
// 三刑 (punishment trines 寅巳申 and 丑戌未) and the trine harmonies 三合 / 半合 all
// need THREE branches. Every fact here is PAIRWISE - one branch from each chart,
// each named by its pillar - so `branchPunishments` is never handed more than two.
// Ruling A lists exactly 六合 / 冲 / 害 / 刑, and the pairwise-detectable part of 刑
// is self-punishment and the 子卯 pair. A cross-chart 三刑 would need a fact shape
// that names two pillars on one side; that is out of scope for tranche 1 and is
// recorded as owed rather than improvised here. See the spec's header.
//
// ── NO PALACE NAMES ────────────────────────────────────────
// Positions are the engine's own keys - 'year' | 'month' | 'day' | 'hour' - not
// palace names and not Indonesian domain glosses. lib/semantic/facts.js maps
// positions to palaces and their domains when it builds reading facts; doing it
// here would put display strings in a module that is forbidden to hold any, and
// would make a second mapping to keep in step.
// ============================================================

import { SIX_HARMONIES, SIX_CLASHES, branchPunishments } from '../bazi/stems.js';
import { SIX_HARMS } from '../bazi/relations.js';

/**
 * The pair tables, in emission order. 刑 is not here - it is a function call, not
 * a table this module reads.
 */
const PAIR_TABLES = [
  ['六合', SIX_HARMONIES],
  ['冲', SIX_CLASHES],
  ['害', SIX_HARMS],
];

/**
 * Positions of a chart, in reading order, hour omitted when unknown.
 *
 * Mirrors relations.js's private positionsOf. An unknown hour is `null` on the
 * chart object rather than absent, so a truthiness check is the guard: treating it
 * as a branch would invent a pillar the reader never gave us.
 */
function positionsOf(chart) {
  const out = [['year', chart.year], ['month', chart.month], ['day', chart.day]];
  if (chart.hour) out.push(['hour', chart.hour]);
  return out;
}

/**
 * Every relation between two single branches, from the tables above plus 刑.
 *
 * `branches` is reported in the TABLE's order, never the caller's, so the same
 * relation reads identically whichever chart supplied which side. That is also
 * what branchPunishments already does with its own rows.
 */
function relationsBetween(branchA, branchB) {
  const out = [];

  for (const [type, table] of PAIR_TABLES) {
    for (const [x, y] of table) {
      const matches = (x === branchA && y === branchB) || (x === branchB && y === branchA);
      if (matches) out.push({ relation: type, branches: [x, y] });
    }
  }

  // 刑, handed exactly the two branches. Self-punishment fires when both sides are
  // the same self-punishing branch; the 子卯 pair fires on either ordering. A
  // trine cannot fire on two branches, which is the documented limit above.
  for (const punishment of branchPunishments([branchA, branchB])) {
    out.push({
      relation: '刑',
      branches: [...punishment.branches],
      punishment: punishment.type,
    });
  }

  return out;
}

/** One emitted fact. Shaped after the branch_relation provenance in facts.js. */
function entry(relation, from, to) {
  return {
    kind: 'compat_branch_relation',
    relation: relation.relation,
    branches: relation.branches,
    ...(relation.punishment ? { punishment: relation.punishment } : {}),
    from,
    to,
  };
}

/**
 * Cross-chart branch relations between two charts (P2 facts).
 *
 * Emission order is stable: for the palace scans, position in reading order
 * (year, month, day, hour), and within a position 六合, 冲, 害, then 刑.
 *
 * @param {Object} a Person A's chart, output of calculateBaziChart
 * @param {Object} b Person B's chart, output of calculateBaziChart
 * @returns {{
 *   dayBranchPair: Object[],
 *   bHitsASpousePalace: Object[],
 *   aHitsBSpousePalace: Object[],
 * }} facts only; every array empty when the pair carries no relation
 */
export function compatBranchRelations(a, b) {
  const aDay = a.day.branch;
  const bDay = b.day.branch;

  // 1. The two Day branches against each other.
  const dayBranchPair = relationsBetween(aDay, bDay).map((relation) => entry(
    relation,
    { chart: 'A', position: 'day', branch: aDay },
    { chart: 'B', position: 'day', branch: bDay },
  ));

  // 2 and 3. Each of one chart's branches against the other's DAY branch - the
  // seat the compat spec reads as the spouse palace. Which palace that is, and
  // what it means, is the content layer's half of ruling A.
  const scan = (source, sourceId, targetBranch, targetId) => positionsOf(source)
    .flatMap(([position, pillar]) => relationsBetween(pillar.branch, targetBranch)
      .map((relation) => entry(
        relation,
        { chart: sourceId, position, branch: pillar.branch },
        { chart: targetId, position: 'day', branch: targetBranch },
      )));

  return {
    dayBranchPair,
    bHitsASpousePalace: scan(b, 'B', aDay, 'A'),
    aHitsBSpousePalace: scan(a, 'A', bDay, 'B'),
  };
}
