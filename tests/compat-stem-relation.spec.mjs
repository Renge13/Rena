// ============================================================
// tests/compat-stem-relation.spec.mjs
// ============================================================
// WHAT THIS ASSERTS, AND WHAT IT CANNOT.
//
// There is NO ORACLE FOR A PAIR CLAIM (Joey Yap's plotter is single-chart, probed
// 2026-08-12). Nothing here claims that a pair of people "really" stands in a
// given relation. This spec asserts INTERNAL CONSISTENCY: that
// `compatStemRelation` reads the engine's own five-element cycle and the one
// recorded 天干五合 table, and combines them without inventing anything.
//
// ── THE CYCLE IS NOT WRITTEN HERE, AND THAT IS RULE 4 ──────
// The five-element cycle is asked of `elementRelation` (lib/semantic/facts.js:675),
// which reads GENERATES and CONTROLS at :667-668. Its five return values are named
// from the DAY MASTER's point of view and TWO OF THEM READ BACKWARDS at a glance -
// `is_controlled` fires when the FIRST argument controls the second (財 Wealth is
// what you control), and `controls` fires when the SECOND controls the first
// (官殺 Officer controls you). That is a live trap, so the mapping is PINNED BY
// ASSERTION below against the tables rather than trusted from the names.
//
// ── THE 五合 TABLE IS NOT WRITTEN HERE EITHER ─────────────
// It is read from docs/engine/stem-combinations.json, whose provenance - both
// sources quoted verbatim, with the fetch record and the one URL that failed - is
// docs/engine/stem-combinations.md. Prompt W's own copy of the table was NOT
// implemented from: a table handed to a session in a prompt is input, not a source.
//
// ── THE COUNTS ARE ENUMERATED, NOT ASSUMED ────────────────
// Prompt W says "the 95 non-pair cases ... (10x10 minus 5 pairs counted both
// orders)". THOSE TWO HALVES DISAGREE AND THE PARENTHESIS IS THE CORRECT ONE:
// 10 x 10 = 100 ordered stem pairs, and 5 combinations counted in both orders is
// 10 of them, leaving 90. 95 is what you get subtracting 5 instead of 10. This
// spec enumerates and asserts 100 / 10 / 90 rather than adopting either number,
// so the arithmetic comes from the enumeration.
// ============================================================

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { STEM_ELEMENTS } from '../lib/bazi/stems.js';
import { elementRelation } from '../lib/semantic/facts.js';
import { calculateBaziChart } from '../lib/bazi/buildChart.js';
import { VALIDATION_CHARTS } from './bazi-validation.fixture.js';
import TABLE from '../docs/engine/stem-combinations.json' with { type: 'json' };
import { compatStemRelation } from '../lib/compat/stemRelation.js';

const STEMS = Object.keys(STEM_ELEMENTS);
/** The function reads day stems and nothing else, so a pair of them is a valid input. */
const asChart = (stem) => ({ day: { stem } });
const fixture = (id) => {
  const tc = VALIDATION_CHARTS.find((c) => c.id === id);
  assert.ok(tc, `fixture chart ${id} exists`);
  return calculateBaziChart({ birthDate: tc.date, birthTime: tc.time });
};

test('the ten stems and the recorded table are the shape this spec assumes', () => {
  assert.equal(STEMS.length, 10);
  assert.equal(TABLE.pairs.length, 5);
  // Every pair is two distinct stems, and all ten stems are used exactly once - so
  // the table cannot be missing a stem or double-booking one.
  const used = TABLE.pairs.flatMap((p) => p.stems);
  assert.equal(used.length, 10);
  assert.deepEqual([...used].sort(), [...STEMS].sort());
  for (const pair of TABLE.pairs) {
    assert.equal(pair.stems.length, 2);
    assert.notEqual(pair.stems[0], pair.stems[1]);
    assert.ok(
      ['Wood', 'Fire', 'Earth', 'Metal', 'Water'].includes(pair.transformTarget),
      `${pair.stems.join('')} target is an engine element key`,
    );
  }
});

test('the cycle mapping is pinned against GENERATES and CONTROLS, not read off the names', () => {
  // GENERATES = { Wood: Fire, Fire: Earth, Earth: Metal, Metal: Water, Water: Wood }
  // CONTROLS  = { Wood: Earth, Fire: Metal, Earth: Water, Metal: Wood, Water: Fire }
  // (lib/semantic/facts.js:667-668)
  //
  // 甲 Wood, 丙 Fire, 戊 Earth, 庚 Metal, 壬 Water — one stem per element, so each
  // case below is a bare cycle check with no combination in play.
  assert.equal(elementRelation('Wood', 'Wood'), 'same');
  assert.equal(elementRelation('Wood', 'Fire'), 'drains');        // Wood generates Fire
  assert.equal(elementRelation('Wood', 'Water'), 'feeds');        // Water generates Wood
  assert.equal(elementRelation('Wood', 'Earth'), 'is_controlled'); // Wood controls Earth
  assert.equal(elementRelation('Wood', 'Metal'), 'controls');      // Metal controls Wood

  // And the module reports them in the direction those tables actually say.
  assert.equal(compatStemRelation(asChart('甲'), asChart('甲')).cycle, 'same');
  assert.equal(compatStemRelation(asChart('甲'), asChart('丙')).cycle, 'a_produces_b');
  assert.equal(compatStemRelation(asChart('甲'), asChart('壬')).cycle, 'b_produces_a');
  assert.equal(compatStemRelation(asChart('甲'), asChart('戊')).cycle, 'a_controls_b');
  assert.equal(compatStemRelation(asChart('甲'), asChart('庚')).cycle, 'b_controls_a');

  // The mirror of each is the mirror relation, in both directions, for every stem
  // pair. A one-sided implementation passes the five cases above and fails here.
  const MIRROR = {
    same: 'same',
    a_produces_b: 'b_produces_a',
    b_produces_a: 'a_produces_b',
    a_controls_b: 'b_controls_a',
    b_controls_a: 'a_controls_b',
  };
  for (const x of STEMS) {
    for (const y of STEMS) {
      const forward = compatStemRelation(asChart(x), asChart(y)).cycle;
      const backward = compatStemRelation(asChart(y), asChart(x)).cycle;
      assert.equal(backward, MIRROR[forward], `${x} vs ${y} mirrors`);
    }
  }
});

test('every one of the five combinations is detected, in both orders', () => {
  for (const pair of TABLE.pairs) {
    const [x, y] = pair.stems;
    for (const [first, second] of [[x, y], [y, x]]) {
      const out = compatStemRelation(asChart(first), asChart(second));
      assert.deepEqual(
        out.combination,
        { pair: pair.stems, transformTarget: pair.transformTarget },
        `${first} + ${second} is ${pair.stems.join('')} -> ${pair.transformTarget}`,
      );
      // `pair` comes back in the TABLE's order regardless of input order, so the
      // same combination reads identically whichever person supplied which stem.
      assert.deepEqual(out.combination.pair, pair.stems);
    }
  }
});

test('EXHAUSTIVE: 100 ordered pairs, 10 carry a combination, 90 have the field ABSENT', () => {
  // A table typo cannot pass this: the pair set is derived from the enumeration and
  // compared to the JSON, so a wrong entry shows up as a wrong member as well as a
  // wrong count.
  let total = 0;
  let withCombination = 0;
  const found = new Set();

  for (const x of STEMS) {
    for (const y of STEMS) {
      total += 1;
      const out = compatStemRelation(asChart(x), asChart(y));
      if ('combination' in out) {
        withCombination += 1;
        found.add(out.combination.pair.join(''));
        continue;
      }
      // ABSENT, NOT NULL. Ruling B makes the field mean "these two stems ARE a
      // combination"; a null would assert something about the 90 that are not.
      assert.equal('combination' in out, false, `${x} + ${y} must omit the field`);
    }
  }

  assert.equal(total, 100);
  assert.equal(withCombination, 10);
  assert.equal(total - withCombination, 90);
  assert.deepEqual(
    [...found].sort(),
    TABLE.pairs.map((p) => p.stems.join('')).sort(),
  );
});

test('no Day Master is transformed and no element recalculated (ruling B)', () => {
  // 丁 + 壬 -> Wood is the sharpest case: neither stem is Wood, so if anything
  // anywhere applied the transformation, the reported elements would move.
  const out = compatStemRelation(asChart('丁'), asChart('壬'));
  assert.deepEqual(out.combination, { pair: ['丁', '壬'], transformTarget: 'Wood' });

  // The two stems still report their OWN elements, from STEM_ELEMENTS.
  assert.deepEqual(out.a, { stem: '丁', element: 'Fire' });
  assert.deepEqual(out.b, { stem: '壬', element: 'Water' });

  // And the cycle is still Fire vs Water, untouched by the combination: Water
  // controls Fire, so from A's side it is b_controls_a.
  assert.equal(out.cycle, 'b_controls_a');
  assert.equal(out.cycle, {
    same: 'same', drains: 'a_produces_b', feeds: 'b_produces_a',
    is_controlled: 'a_controls_b', controls: 'b_controls_a',
  }[elementRelation('Fire', 'Water')]);
});

test('real charts go through the same path as the synthetic stem pairs', () => {
  // The enumeration above uses `{ day: { stem } }` because the fixture's 13 charts
  // cover only 7 of the 10 stems (己, 丁 and 辛 never appear as a Day Master), so
  // 10x10 is not reachable from it. This case runs real calculateBaziChart output
  // to show the module reads `chart.day.stem` off the genuine object.
  //   chart 7  is 甲子 day -> 甲 Wood
  //   chart 11 is 庚辰 day -> 庚 Metal
  const out = compatStemRelation(fixture(7), fixture(11));
  assert.deepEqual(out.a, { stem: '甲', element: 'Wood' });
  assert.deepEqual(out.b, { stem: '庚', element: 'Metal' });
  assert.equal(out.cycle, 'b_controls_a');   // Metal controls Wood
  assert.equal('combination' in out, false); // 甲庚 is a clash, not one of the five

  // 乙 + 庚 IS one of the five. Chart 13 is 乙未 day.
  const combining = compatStemRelation(fixture(13), fixture(11));
  assert.deepEqual(combining.combination, { pair: ['乙', '庚'], transformTarget: 'Metal' });
});

test('facts only - no prose, no score, no Indonesian string', () => {
  const allowed = new Set([
    'compat_stem_relation', 'Wood', 'Fire', 'Earth', 'Metal', 'Water',
    'same', 'a_produces_b', 'b_produces_a', 'a_controls_b', 'b_controls_a',
  ]);
  const stem = new RegExp(`^[${STEMS.join('')}]$`, 'u');

  for (const x of STEMS) {
    for (const y of STEMS) {
      const walk = (node, path) => {
        if (typeof node === 'string') {
          assert.ok(
            allowed.has(node) || stem.test(node),
            `${path} carries a non-fact string: ${JSON.stringify(node)}`,
          );
          return;
        }
        if (node && typeof node === 'object') {
          for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
        }
      };
      walk(compatStemRelation(asChart(x), asChart(y)), `${x}+${y}`);
    }
  }

  // The pinyin column of the JSON is documentation for a human reading the table;
  // it must not travel into an emitted fact.
  const out = compatStemRelation(asChart('甲'), asChart('己'));
  assert.equal('pinyin' in out.combination, false);
});
