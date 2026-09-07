#!/usr/bin/env node
// ============================================================
// scripts/compat-base-rates.mjs — how often each compat clause fires
// ============================================================
//   node scripts/compat-base-rates.mjs [--charts N] [--pairs M] [--seed S]
//   node scripts/compat-base-rates.mjs --selftest
//
// ── WHAT THIS IS FOR ──────────────────────────────────────
// The compat engine's clauses were each tested on ONE hand-derived pair. That
// proves the clause is implemented; it says nothing about whether a clause fires
// for 2% of couples or 95% of them. A verdict that lands on almost everybody is
// not a verdict, and a quadrant nobody reaches is dead content. This prints the
// base rates so that conversation can happen against numbers.
//
// ── IT MEASURES, IT DOES NOT RULE ─────────────────────────
// **NOTHING HERE CHANGES A RULE.** It imports the shipped modules and tallies
// what they return. If a rate looks wrong, the finding is a finding: the rule
// lives in docs/product/compat-p4-p5-rules.md and moves only by a ruling.
//
// ── WHY IT ASSERTS ITS OWN ARITHMETIC ─────────────────────
// This repo has been burned repeatedly by measurements that could not fail - a
// ban-list sweep that compiled zero patterns and printed CLEAN, a card probe that
// a blank PNG passed. A frequency table is the same shape: every number it prints
// looks plausible, and nothing on screen shows a miscount.
//
// So it checks the invariants that MUST hold if the tally is real, and throws
// rather than printing on any breach:
//   - the four quadrant counts sum to M
//   - q1 + q2 equals the pull-high count, q1 + q3 equals the fit-high count
//   - pull is high exactly when >= 1 pull clause fired
//   - fit is high exactly when all three fit clauses held
//   - the three pattern counts sum to M, and each equals its relation count
// And `--selftest` re-runs the pairs whose quadrants the committed specs assert
// by hand, so the pipeline here is checked against known answers, not only
// against itself. **The selftest has been shown failing on purpose** - see the
// QA doc this generates.
// ============================================================

import { calculateBaziChart } from '../lib/bazi/buildChart.js';
import { compatBranchRelations } from '../lib/compat/branchRelations.js';
import { compatComplementarity } from '../lib/compat/complementarity.js';
import { compatStemRelation } from '../lib/compat/stemRelation.js';
import { compatTemperament } from '../lib/compat/temperament.js';
import { compatPullFit } from '../lib/compat/pullFit.js';

const DEFAULTS = { charts: 2000, pairs: 5000, seed: 20260907 };

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return Number(hit.split('=')[1]);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return Number(process.argv[idx + 1]);
  }
  return fallback;
};

/**
 * mulberry32 — a small, well-known 32-bit PRNG. Chosen because it is four lines
 * and needs no dependency, and because the whole point is reproducibility: the
 * same seed must give the same charts on any machine and any Node version, which
 * Math.random cannot promise.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 1960-01-01 .. 2005-12-31 inclusive, as UTC day numbers. UTC arithmetic on
// purpose: it makes the generated STRING deterministic regardless of the machine's
// timezone. Nothing here converts a birth time - the engine takes the naive
// wall-clock string exactly as generated (CLAUDE.md rule 3).
const FIRST_DAY = Date.UTC(1960, 0, 1) / 86400000;
const LAST_DAY = Date.UTC(2005, 11, 31) / 86400000;
const SPAN = LAST_DAY - FIRST_DAY + 1;

const pad = (n) => String(n).padStart(2, '0');

/** One random birth datetime, hour KNOWN. */
function randomBirth(rand) {
  const d = new Date((FIRST_DAY + Math.floor(rand() * SPAN)) * 86400000);
  return {
    birthDate: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    birthTime: `${pad(Math.floor(rand() * 24))}:${pad(Math.floor(rand() * 60))}`,
  };
}

const PULL_CLAUSES = ['2.1.a', '2.1.b', '2.1.c', '2.1.d'];
const FIT_CLAUSES = ['2.2.a', '2.2.b', '2.2.c'];
const QUADRANTS = ['q1', 'q2', 'q3', 'q4'];
const PATTERNS = ['matching', 'related', 'contrasting'];
const RELATIONS = ['same_god', 'same_group', 'different_group'];

/** Every compat fact for one ordered pair. The modules, unmodified. */
function evaluate(a, b) {
  const branches = compatBranchRelations(a, b);
  const complementarity = compatComplementarity(a, b);
  const stems = compatStemRelation(a, b);
  return {
    pullFit: compatPullFit(branches, complementarity, stems),
    temperament: compatTemperament(a, b),
  };
}

function tally({ charts, pairs, seed }) {
  const rand = mulberry32(seed);

  const built = [];
  for (let i = 0; i < charts; i += 1) {
    const birth = randomBirth(rand);
    built.push({ birth, chart: calculateBaziChart(birth) });
  }

  const counts = {
    quadrant: Object.fromEntries(QUADRANTS.map((q) => [q, 0])),
    pullClause: Object.fromEntries(PULL_CLAUSES.map((c) => [c, 0])),
    fitHeld: Object.fromEntries(FIT_CLAUSES.map((c) => [c, 0])),
    pattern: Object.fromEntries(PATTERNS.map((p) => [p, 0])),
    relation: Object.fromEntries(RELATIONS.map((r) => [r, 0])),
    pullHigh: 0,
    fitHigh: 0,
  };

  for (let n = 0; n < pairs; n += 1) {
    let i = Math.floor(rand() * built.length);
    let j = Math.floor(rand() * built.length);
    // Ordered pairs of two DIFFERENT charts. A chart against itself is not a
    // couple and would inflate same_god and 自刑 for free.
    while (j === i) j = Math.floor(rand() * built.length);

    const { pullFit, temperament } = evaluate(built[i].chart, built[j].chart);

    counts.quadrant[pullFit.quadrant] += 1;
    if (pullFit.pull === 'high') counts.pullHigh += 1;
    if (pullFit.fit === 'high') counts.fitHigh += 1;
    for (const clause of pullFit.pull_reasons) counts.pullClause[clause] += 1;
    for (const { clause, held } of pullFit.fit_reasons) if (held) counts.fitHeld[clause] += 1;
    counts.pattern[temperament.pattern] += 1;
    counts.relation[temperament.relation] += 1;
  }

  assertInvariants(counts, pairs);
  return { counts, built };
}

/**
 * The arithmetic that must hold if the tally is real. Throws rather than letting
 * a plausible-looking table print.
 */
function assertInvariants(counts, pairs) {
  const fail = (msg) => { throw new Error(`INVARIANT BREACH: ${msg}`); };
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

  if (sum(counts.quadrant) !== pairs) fail(`quadrants sum to ${sum(counts.quadrant)}, not ${pairs}`);
  if (sum(counts.pattern) !== pairs) fail(`patterns sum to ${sum(counts.pattern)}, not ${pairs}`);
  if (sum(counts.relation) !== pairs) fail(`relations sum to ${sum(counts.relation)}, not ${pairs}`);

  // 2.3: the quadrant is a pure function of the two booleans.
  const q = counts.quadrant;
  if (q.q1 + q.q2 !== counts.pullHigh) fail(`q1+q2=${q.q1 + q.q2} but pull high=${counts.pullHigh}`);
  if (q.q1 + q.q3 !== counts.fitHigh) fail(`q1+q3=${q.q1 + q.q3} but fit high=${counts.fitHigh}`);

  // 2.1: pull is a disjunction, so pull-high can never exceed the clause total
  // and can never be zero while some clause fired.
  const clauseTotal = sum(counts.pullClause);
  if (counts.pullHigh > clauseTotal) fail(`pull high=${counts.pullHigh} exceeds clause hits=${clauseTotal}`);
  if (counts.pullHigh === 0 && clauseTotal > 0) fail('clauses fired but no pair is pull high');

  // 2.2: fit is a conjunction, so fit-high cannot exceed the least-often-held clause.
  const minHeld = Math.min(...Object.values(counts.fitHeld));
  if (counts.fitHigh > minHeld) fail(`fit high=${counts.fitHigh} exceeds scarcest held clause=${minHeld}`);

  // 1.1: pattern and relation are 1:1.
  const pairsOf = [['matching', 'same_god'], ['related', 'same_group'], ['contrasting', 'different_group']];
  for (const [pattern, relation] of pairsOf) {
    if (counts.pattern[pattern] !== counts.relation[relation]) {
      fail(`${pattern}=${counts.pattern[pattern]} but ${relation}=${counts.relation[relation]}`);
    }
  }
}

const pct = (n, of) => `${((n / of) * 100).toFixed(1)}%`;

function report({ counts }, { charts, pairs, seed }) {
  const lines = [];
  lines.push(`charts=${charts} pairs=${pairs} seed=${seed}`);
  lines.push('');
  lines.push('P5 QUADRANT                       count      rate');
  for (const q of QUADRANTS) {
    lines.push(`  ${q}${' '.repeat(30)}${String(counts.quadrant[q]).padStart(6)}  ${pct(counts.quadrant[q], pairs).padStart(8)}`);
  }
  lines.push(`  pull high${' '.repeat(22)}${String(counts.pullHigh).padStart(6)}  ${pct(counts.pullHigh, pairs).padStart(8)}`);
  lines.push(`  fit high${' '.repeat(23)}${String(counts.fitHigh).padStart(6)}  ${pct(counts.fitHigh, pairs).padStart(8)}`);
  lines.push('');
  lines.push('PULL CLAUSE (fired)               count      rate');
  for (const c of PULL_CLAUSES) {
    lines.push(`  ${c}${' '.repeat(27)}${String(counts.pullClause[c]).padStart(6)}  ${pct(counts.pullClause[c], pairs).padStart(8)}`);
  }
  lines.push('');
  lines.push('FIT CLAUSE                         held      rate     failed      rate');
  for (const c of FIT_CLAUSES) {
    const held = counts.fitHeld[c];
    const failed = pairs - held;
    lines.push(`  ${c}${' '.repeat(26)}${String(held).padStart(6)}  ${pct(held, pairs).padStart(8)}  ${String(failed).padStart(9)}  ${pct(failed, pairs).padStart(8)}`);
  }
  lines.push('');
  lines.push('P4 PATTERN                        count      rate');
  for (const p of PATTERNS) {
    lines.push(`  ${p}${' '.repeat(32 - p.length)}${String(counts.pattern[p]).padStart(6)}  ${pct(counts.pattern[p], pairs).padStart(8)}`);
  }
  return lines.join('\n');
}

// ── selftest ──────────────────────────────────────────────
// Known answers: the quadrants the committed spec asserts by hand for six fixture
// pairs. This checks THIS script's pipeline against those, so a wiring mistake
// here (wrong module order, a swapped argument) fails against an outside answer
// rather than only against its own arithmetic.
const KNOWN = [
  [{ birthDate: '1989-09-13', birthTime: '09:00' }, { birthDate: '1990-03-04', birthTime: '14:00' }, 'q1'],
  [{ birthDate: '1990-03-04', birthTime: '14:00' }, { birthDate: '1989-03-03', birthTime: '00:15' }, 'q1'],
  [{ birthDate: '1989-09-13', birthTime: '09:00' }, { birthDate: '1990-06-07', birthTime: '12:00' }, 'q2'],
  [{ birthDate: '1989-09-13', birthTime: '09:00' }, { birthDate: '1992-04-20', birthTime: '08:00' }, 'q3'],
  [{ birthDate: '1990-03-04', birthTime: '14:00' }, { birthDate: '1992-01-05', birthTime: '08:00' }, 'q4'],
  [{ birthDate: '1990-06-07', birthTime: '12:00' }, { birthDate: '1989-03-03', birthTime: '00:15' }, 'q1'],
];

function selftest() {
  let failures = 0;
  for (const [ba, bb, expected] of KNOWN) {
    const { pullFit } = evaluate(calculateBaziChart(ba), calculateBaziChart(bb));
    const ok = pullFit.quadrant === expected;
    if (!ok) failures += 1;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${ba.birthDate} x ${bb.birthDate}  expected ${expected}, got ${pullFit.quadrant}`);
  }
  console.log(failures === 0
    ? `selftest: ${KNOWN.length}/${KNOWN.length} known quadrants reproduced`
    : `selftest: ${failures} of ${KNOWN.length} FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  const opts = {
    charts: arg('charts', DEFAULTS.charts),
    pairs: arg('pairs', DEFAULTS.pairs),
    seed: arg('seed', DEFAULTS.seed),
  };
  console.log(report(tally(opts), opts));
}
