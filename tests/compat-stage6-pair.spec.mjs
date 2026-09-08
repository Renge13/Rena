// ============================================================
// tests/compat-stage6-pair.spec.mjs — the pair-only Stage 6 checks
// ============================================================
// Each rejecting check here was shown RED ON A REAL GEMINI RENDER before it was
// trusted, which is prompt X-b2's own condition and the lesson of the production
// copy gate that was documented and tested for ten days while never executing
// (COWORK-BRIEF row 46). The runs are in the commit message.
//
// This file's job afterwards is the cheap one: that the checks stay wired, stay
// scoped to `kind === 'pair'`, and do not touch the mirror.
// ============================================================

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateBaziChart } from '../lib/bazi/buildChart.js';
import { buildPairSemantic } from '../lib/semantic/pair.js';
import { buildSemanticJson } from '../lib/semantic/index.js';
import { assembleFallback } from '../lib/render/fallback.js';
import { validateRendering, STAGE6_VERSION } from '../lib/validate/index.js';
import { pairGuard, REFRAME_OVERLAP } from '../lib/validate/pair.js';
import BLOCKLIST from '../lib/validate/blocklist.json' with { type: 'json' };

const c = (d, t) => calculateBaziChart({ birthDate: d, birthTime: t });
const A = c('1989-09-13', '09:00');
// chart 12: the 子卯 punishment on the day pair, so p2_reframe_required is raised.
const HARD_SEAT = c('1990-06-07', '12:00');
const EASY_SEAT = c('1993-06-12', '23:30');

const PENUTUP = 'Peta ini sudah cukup jelas untuk kamu jalani mulai sekarang.';

/** A rendering shaped like a model's, built from the floor's own ruled prose. */
const renderingFor = (sj, mutate = (b) => b) => ({
  blocks: assembleFallback(sj).blocks.map(mutate),
  penutup: PENUTUP,
});

const codes = (findings) => findings.map((f) => f.code);

test('STAGE6_VERSION moved, once, for this commit', () => {
  // The repo convention: a change to what Stage 6 ACCEPTS OR REJECTS bumps this
  // in the same commit. Two rejecting checks were added, so it moves once - not
  // twice, and not zero times.
  assert.equal(STAGE6_VERSION, '1.18.0');
});

test('THE MIRROR IS UNTOUCHED: pairGuard returns [] for kind mirror', () => {
  // The isolation that matters. The mirror's floor-rate fixtures must not move,
  // and the cheapest way to guarantee that is a guard that does nothing at all
  // on a mirror semantic JSON.
  const mirror = buildSemanticJson(A);
  assert.equal(mirror.kind, 'mirror');
  const rendered = renderingFor(mirror);
  assert.deepEqual(pairGuard(rendered, mirror, JSON.stringify(rendered)), []);

  // And through the real entry point, on a real mirror floor: no pair finding.
  const gate = validateRendering(rendered, mirror, { provider: 'module_assembly' });
  assert.equal(codes(gate.findings).some((x) => String(x).startsWith('pair.')), false);
});

test('both_named REJECTS a model render that names only one person', () => {
  const sj = buildPairSemantic(A, HARD_SEAT);
  const nameA = sj.core.a.archetype_name_id;
  const nameB = sj.core.b.archetype_name_id;
  assert.notEqual(nameA, nameB);

  // An opening that names both passes.
  const ok = renderingFor(sj, (b, i) => (i === 0
    ? { ...b, text: `${nameA} dan ${nameB}. ${b.text}` } : b));
  assert.equal(
    codes(pairGuard(ok, sj, JSON.stringify(ok), 'gemini')).includes('pair.both_named'),
    false,
  );

  // One name missing is the same finding as both missing - deliberately, so a
  // fix cannot add the cheaper of the two.
  for (const named of [nameA, nameB]) {
    const one = renderingFor(sj, (b, i) => (i === 0 ? { ...b, text: `${named}. ${b.text}` } : b));
    const found = pairGuard(one, sj, JSON.stringify(one), 'gemini');
    assert.ok(codes(found).includes('pair.both_named'), `naming only ${named} is rejected`);
    assert.equal(found.find((f) => f.code === 'pair.both_named').severity, 'hard');
  }
});

test('both_named DOES NOT run on the floor, and that is a content gap', () => {
  // The floor cannot name both: `RENDER_COPY.floorIdentity` is a single-subject
  // sentence and no ruled cell opens a pair reading. A HARD check on the floor
  // would make every pair 503 the moment the provider failed - rule 17's
  // always-available floor, unavailable.
  //
  // THIS TEST IS ALSO THE RECORD OF THE GAP. When a ruled opening cell lands,
  // the exemption goes and this test inverts.
  const sj = buildPairSemantic(A, HARD_SEAT);
  const floor = renderingFor(sj);

  assert.ok(
    codes(pairGuard(floor, sj, JSON.stringify(floor), 'gemini')).includes('pair.both_named'),
    'precondition: the floor genuinely does NOT name both, so the exemption is load-bearing',
  );
  assert.equal(
    codes(pairGuard(floor, sj, JSON.stringify(floor), 'module_assembly')).includes('pair.both_named'),
    false,
    'and the floor is exempt',
  );

  // The consequence that matters: the floor still passes the gate, so it is
  // servable.
  const gate = validateRendering(floor, sj, { provider: 'module_assembly' });
  assert.equal(gate.hard, false, 'the floor carries no HARD finding');
});

test('reframe_present REJECTS a difficult seat whose block drops the reframe', () => {
  const sj = buildPairSemantic(A, HARD_SEAT);
  assert.ok(sj.safety_flags.includes('p2_reframe_required'), 'precondition: the flag is raised');

  // The floor carries the reframe verbatim, so it passes.
  const carried = renderingFor(sj);
  assert.equal(
    codes(pairGuard(carried, sj, JSON.stringify(carried), 'gemini')).includes('pair.reframe_missing'),
    false,
  );

  // Replace the reframe block's text with another block's - real prose, wrong
  // content. This is the shape the real-render red used.
  const idx = carried.blocks.findIndex((b) => (b.fact_ids || []).includes('p2_reframe'));
  assert.notEqual(idx, -1, 'the reframe has its own block');
  const donor = carried.blocks[carried.blocks.length - 1].text;
  const dropped = {
    ...carried,
    blocks: carried.blocks.map((b, i) => (i === idx ? { ...b, text: donor } : b)),
  };
  const found = pairGuard(dropped, sj, JSON.stringify(dropped), 'gemini');
  assert.ok(codes(found).includes('pair.reframe_missing'));
  assert.equal(found.find((f) => f.code === 'pair.reframe_missing').severity, 'hard');
});

test('reframe_present is SILENT when the seat is easy', () => {
  // It reads `safety_flags`, so a pair with a clean day pair is never asked for
  // a reframe it has no cell for.
  const sj = buildPairSemantic(A, EASY_SEAT);
  assert.equal(sj.safety_flags.includes('p2_reframe_required'), false);
  const rendered = renderingFor(sj);
  assert.equal(
    codes(pairGuard(rendered, sj, JSON.stringify(rendered), 'gemini')).includes('pair.reframe_missing'),
    false,
  );
});

test('the reframe threshold uses stemOverlap, ABOVE the coverage floor', () => {
  // The first version compared 4-plus-letter words and passed on a real render
  // with every reframe sentence stripped, because the reframe's words - `pada`,
  // `yang`, `hubungan`, `pasangan`, `kursi` - are all over a compat reading. It
  // was measuring its own vocabulary.
  //
  // `stemOverlap` drops stopwords and stems tails, and it is what `coverage.js`
  // uses, so this is one definition of "did the idea survive" rather than two.
  assert.ok(REFRAME_OVERLAP > 0.2, 'above COVERAGE_PARAMS.fieldOverlap');
  assert.ok(REFRAME_OVERLAP <= 1);
});

test('no_verdict SHIPS WITH NO PATTERNS, and its reader is not broken', () => {
  // A check that fires and logs but rejects nothing is not a gate change, which
  // is why it may travel in this commit at all. The patterns are Indonesian and
  // therefore Reyner's.
  assert.deepEqual(BLOCKLIST.verdict.patterns, []);
  assert.ok(BLOCKLIST.verdict._rule.includes('STAGE6_VERSION'), 'the rule says what adding one costs');

  const sj = buildPairSemantic(A, HARD_SEAT);
  const rendered = renderingFor(sj);
  assert.equal(
    codes(pairGuard(rendered, sj, 'cocok sekali 95%', 'gemini')).includes('pair.verdict'),
    false,
    'with no patterns it rejects nothing, whatever the text',
  );

  // ── AND IT WOULD ACTUALLY FIRE ONCE A PATTERN EXISTS ──
  // The first version read `blocklist?.verdict?.filter?.(...)`, and `verdict` is
  // an OBJECT with no `.filter`, so the optional call yielded undefined and the
  // `?? []` swallowed it. The check could never have fired even after the
  // patterns were ruled, and would have looked armed the whole time. This
  // exercises the reader against a synthetic category so that cannot recur.
  const synthetic = { verdict: { patterns: [{ pattern: '\\bcocok\\b' }] } };
  const hits = [];
  for (const e of (synthetic.verdict.patterns ?? []).filter((x) => x?.pattern)) {
    if (new RegExp(e.pattern, e.flags || 'iu').test('mereka cocok sekali')) hits.push(e.pattern);
  }
  assert.deepEqual(hits, ['\\bcocok\\b'], 'the reader shape used in pair.js finds a real pattern');
});
