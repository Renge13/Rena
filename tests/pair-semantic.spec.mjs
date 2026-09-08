// ============================================================
// tests/pair-semantic.spec.mjs — the pair's semantic JSON
// ============================================================
// THE CONTRACT IS THE MIRROR'S, and that is the thing this file asserts. If the
// pair's output satisfied a slightly different contract, `renderReading`,
// `validateRendering`, `assembleFallback` and `persistRendered` would each need
// to know which kind they were handed - and the point of prompt X-b2 is that
// none of them does.
//
// So the assertions are mostly structural comparisons against a real mirror
// semantic JSON built in the same test, rather than a hand-written list of field
// names that could drift from what the mirror actually emits.
// ============================================================

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateBaziChart } from '../lib/bazi/buildChart.js';
import { buildSemanticJson } from '../lib/semantic/index.js';
import { buildPairSemantic } from '../lib/semantic/pair.js';
import { GLOSSARY } from '../lib/semantic/glossary.js';
import { VALIDATION_CHARTS, HOUR_UNKNOWN_CHARTS } from './bazi-validation.fixture.js';

const ALL = [...VALIDATION_CHARTS, ...HOUR_UNKNOWN_CHARTS];
const chart = (id) => {
  const tc = ALL.find((c) => c.id === id);
  assert.ok(tc, `fixture chart ${id} exists`);
  return calculateBaziChart({ birthDate: tc.date, birthTime: tc.time });
};
const pair = (x, y) => buildPairSemantic(chart(x), chart(y));

// Quadrant coverage under the V6 rule (run 3, 2026-09-08), hand-derived in
// tests/compat-pull-fit.spec.mjs: q1 = 2 x 6, q2 = 1 x 12, q3 = 3 x 7, q4 = 1 x 3.
const BY_QUADRANT = { q1: [2, 6], q2: [1, 12], q3: [3, 7], q4: [1, 3] };

test('kind is present on BOTH builders, and they differ', () => {
  // The one field every consumer branches on. Without it the two cache-key
  // spaces could collide and `renderOnce` would have nothing to select a prompt
  // by. Asserted on both because adding it to one is the failure mode.
  assert.equal(buildSemanticJson(chart(1)).kind, 'mirror');
  assert.equal(pair(1, 2).kind, 'pair');
});

test('THE CONTRACT: the pair carries every field the pipeline reads', () => {
  const mirror = buildSemanticJson(chart(1));
  const p = pair(1, 2);

  // The fields `renderReading`, `validateRendering`, `assembleFallback` and
  // `computeCacheKey` actually consume. Compared against the MIRROR's own output
  // rather than a hand-written list, so this cannot drift from reality.
  for (const field of ['kind', 'engine_version', 'target_language', 'core', 'facts', 'required_points', 'safety_flags']) {
    assert.ok(field in mirror, `precondition: the mirror has ${field}`);
    assert.ok(field in p, `the pair must carry ${field}`);
  }

  // Every fact has the shape `fact()` produces plus the ranking fields the
  // contract layer reads.
  for (const f of p.facts) {
    assert.equal(typeof f.id, 'string');
    assert.equal(typeof f.type, 'string');
    assert.ok(f.provenance, `${f.id} has provenance`);
    assert.ok(f.hierarchy?.role, `${f.id} has a hierarchy role`);
    assert.equal(typeof f.importance, 'number', `${f.id} has an importance`);
  }
});

test('EVERY required point has a backing fact, and every must_cover string exists on it', () => {
  // The contract's central invariant: a required point can never ask for content
  // that is not there. `requiredPoints()` derives must_cover from what the fact
  // carries, so this fails only if the pair builds a point some other way.
  for (const [quadrant, [x, y]] of Object.entries(BY_QUADRANT)) {
    const p = pair(x, y);
    const byId = new Map(p.facts.map((f) => [f.id, f]));
    for (const point of p.required_points) {
      const f = byId.get(point.fact_id);
      assert.ok(f, `${quadrant}: required point ${point.fact_id} has a backing fact`);
      for (const key of point.must_cover) {
        assert.ok(f[key], `${quadrant}: ${point.fact_id} carries its must_cover "${key}"`);
      }
    }
  }
});

test('every quadrant produces a p5_pull_fit SPINE fact', () => {
  for (const [quadrant, [x, y]] of Object.entries(BY_QUADRANT)) {
    const p = pair(x, y);
    const f = p.facts.find((x2) => x2.id === 'p5_pull_fit');
    assert.ok(f, `${quadrant}: the fact exists`);
    assert.equal(f.hierarchy.role, 'spine', `${quadrant}: it is spine`);
    assert.equal(f.provenance.quadrant, quadrant, `${quadrant}: and it is the right one`);
    assert.equal(p.core.quadrant, quadrant);

    // Spine facts are always required, whatever their importance.
    assert.ok(
      p.required_points.some((r) => r.fact_id === 'p5_pull_fit'),
      `${quadrant}: and it is a required point`,
    );
  }
});

test('the P2 REFRAME is flagged exactly when the day pair carries 冲, 害 or 刑', () => {
  // The spec's ethical spine, and the flag Stage 6's `reframe_present` will read.
  // 1 x 12's day pair is the 子卯 punishment; 3 x 7 has an empty day pair.
  const flagged = pair(1, 12);
  assert.ok(flagged.safety_flags.includes('p2_reframe_required'));
  assert.equal(flagged.facts.find((f) => f.id === 'p2_day_pair').type, 'tension');

  const clean = pair(3, 7);
  assert.ok(!clean.safety_flags.includes('p2_reframe_required'));
  assert.equal(clean.facts.find((f) => f.id === 'p2_day_pair').type, 'core');

  // And the flag is NOT raised by a palace 害 alone - 1 x 3 has two of them and an
  // empty day pair. The reframe is about the seat, per the spec.
  assert.ok(!pair(1, 3).safety_flags.includes('p2_reframe_required'));
});

test('the pair safety flags include the mirror\'s AND the two a pair needs', () => {
  const mirror = buildSemanticJson(chart(1));
  const p = pair(1, 2);
  for (const flag of mirror.safety_flags) {
    assert.ok(p.safety_flags.includes(flag), `the pair keeps the mirror's ${flag}`);
  }
  // rule doc 2.4, and rule 25 applied to two people rather than one.
  assert.ok(p.safety_flags.includes('no_verdict'));
  assert.ok(p.safety_flags.includes('two_people'));
});

test('EMPTY FACTS ARE OMITTED, never emitted as null', () => {
  // 3 x 7 carries no cross-chart branch relation at all, so both palace facts
  // must be absent rather than present-and-empty: `assembleFallback` builds a
  // block per required fact, and an empty one would be a heading with nothing
  // under it in the floor.
  const p = pair(3, 7);
  assert.equal(p.facts.some((f) => f.id === 'p2_b_hits_a'), false);
  assert.equal(p.facts.some((f) => f.id === 'p2_a_hits_b'), false);

  // 1 x 101 shares a missing element; 1 x 2 does not.
  assert.ok(pair(1, 101).facts.some((f) => f.id === 'p3_same_imbalance'));
  assert.equal(pair(1, 2).facts.some((f) => f.id === 'p3_same_imbalance'), false);
});

test('NO BIRTH DATA REACHES THE SEMANTIC JSON, for either person', () => {
  // Ruled 2026-09-07: B's birth input is the second input to a calculation and
  // nothing else. A's is refused too - the semantic JSON is handed to a PROVIDER
  // (lib/render/payload.js), and a birth date in it would leave the building.
  const p = pair(1, 2);
  assert.ok(p.facts.length > 0, 'precondition: there are facts, so this is not vacuous');

  const raw = JSON.stringify(p);
  for (const value of ['1989-09-13', '09:00', '1990-03-04', '14:00']) {
    assert.ok(!raw.includes(value), `${value} must not appear`);
  }
  for (const key of ['birth_date', 'birthDate', 'birth_time', 'birthTime']) {
    assert.ok(!raw.includes(key), `${key} must not appear`);
  }
});

test('every glossary cell it reads is an UNRULED placeholder, and none is missing', () => {
  // Two failures in one assertion, deliberately: a MISSING key would make
  // `contentFrom` return nulls and the fact would silently carry no content, and
  // a RULED-LOOKING string here would mean Code or Cowork had authored Indonesian.
  const p = pair(1, 12);   // the pair with the most facts
  for (const f of p.facts) {
    assert.ok(
      GLOSSARY.kompatibilitas[f.id],
      `${f.id} has a glossary cell - a missing one yields a silently empty fact`,
    );
    assert.ok(f.label_meaning?.includes('@@UNRULED'), `${f.id}'s content is a placeholder`);
    assert.equal(f.glossary_gap, undefined, `${f.id} is not a glossary GAP - the cell exists`);
  }

  // The seven owed labels, and the reframe.
  for (const k of ['matching', 'related', 'contrasting']) {
    assert.ok(GLOSSARY.kompatibilitas.pattern[k].name_id.includes('@@UNRULED'));
  }
  for (const k of ['q1', 'q2', 'q3', 'q4']) {
    assert.ok(GLOSSARY.kompatibilitas.quadrant[k].name_id.includes('@@UNRULED'));
  }
  assert.ok(GLOSSARY.kompatibilitas.reframe.label_meaning.includes('@@UNRULED'));
});

test('the badge and quadrant NAMES come from the glossary, never from the engine', () => {
  // Ruling P4: "the content layer can render the badge". The engine emits the id
  // and looks the name up; it never composes one. Asserted by checking the fact
  // carries the glossary's exact string.
  const p = pair(1, 2);
  const t = p.facts.find((f) => f.id === 'p4_temperament');
  assert.equal(
    t.provenance.pattern_name_id,
    GLOSSARY.kompatibilitas.pattern[t.provenance.pattern].name_id,
  );
  const q = p.facts.find((f) => f.id === 'p5_pull_fit');
  assert.equal(
    q.provenance.quadrant_name_id,
    GLOSSARY.kompatibilitas.quadrant[q.provenance.quadrant].name_id,
  );
});
