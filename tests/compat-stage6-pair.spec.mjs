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
import { buildPairSemantic, variantKeysFor } from '../lib/semantic/pair.js';
import { buildSemanticJson } from '../lib/semantic/index.js';
import { assembleFallback } from '../lib/render/fallback.js';
import { validateRendering, STAGE6_VERSION } from '../lib/validate/index.js';
import { pairGuard, REFRAME_OVERLAP } from '../lib/validate/pair.js';
import { styleGuard } from '../lib/validate/style.js';
import { renderedText } from '../lib/validate/text.js';
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
  // 1.21.0: the penutup scoped by whether the READING carries any tension
  // (Reyner, 2026-09-08, ruling on the measurement of the first scope).
  assert.equal(STAGE6_VERSION, '1.21.0');
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
    codes(pairGuard(ok, sj, JSON.stringify(ok))).includes('pair.both_named'),
    false,
  );

  // One name missing is the same finding as both missing - deliberately, so a
  // fix cannot add the cheaper of the two.
  //
  // THE OPENING IS REPLACED, NOT PREFIXED, since 2026-09-08: the floor's own
  // opening now carries both names (p0_opening), so prefixing one name to it left
  // a fixture that named BOTH and the assertion could not fail. Caught by running
  // it - the fixture had quietly stopped expressing the proposition.
  for (const named of [nameA, nameB]) {
    const one = renderingFor(sj, (b, i) => (i === 0 ? { ...b, text: `${named} membuka bacaan ini.` } : b));
    const found = pairGuard(one, sj, JSON.stringify(one));
    assert.ok(codes(found).includes('pair.both_named'), `naming only ${named} is rejected`);
    assert.equal(found.find((f) => f.code === 'pair.both_named').severity, 'hard');
  }
});

test('THE FLOOR NAMES BOTH PEOPLE, so both_named now runs on it too', () => {
  // ── THIS TEST INVERTED, AS ITS PREVIOUS VERSION SAID IT WOULD ──
  // It used to read "both_named DOES NOT run on the floor, and that is a content
  // gap", and it asserted the exemption plus the precondition that made the
  // exemption necessary: the floor genuinely did not name both people, because no
  // ruled cell opened a pair reading. Reyner ruled kompatibilitas.p0_opening on
  // 2026-09-08 and the gap closed, so the exemption went with it.
  const sj = buildPairSemantic(A, HARD_SEAT);
  const floor = renderingFor(sj);
  const nameA = sj.core.a.archetype_name_id;
  const nameB = sj.core.b.archetype_name_id;

  // The opening block is the one that changed. It is the FLOOR's own prose, from
  // Reyner's ruled template - nothing here was authored to make a test pass.
  assert.ok(floor.blocks[0].text.includes(nameA), 'the floor opening names A');
  assert.ok(floor.blocks[0].text.includes(nameB), 'and B');

  // THE PARAMETER IS GONE FROM THE CONTRACT, not just unread. A guard that still
  // ACCEPTS a provider is one edit away from branching on it again.
  assert.equal(pairGuard.length, 3, 'pairGuard no longer takes a provider');
  assert.equal(
    codes(pairGuard(floor, sj, JSON.stringify(floor))).includes('pair.both_named'),
    false,
    'the floor names both, so nothing is found',
  );

  // And through the real door, for BOTH providers, which is where the exemption
  // used to live.
  for (const provider of ['module_assembly', 'gemini']) {
    const g = validateRendering(floor, sj, { provider });
    assert.equal(codes(g.findings).includes('pair.both_named'), false, `clean for ${provider}`);
  }

  // Rule 17's floor is still servable, which is the thing the exemption was
  // protecting and is now protected by the content instead.
  const gate = validateRendering(floor, sj, { provider: 'module_assembly' });
  assert.equal(gate.hard, false, 'the floor carries no HARD finding');
  assert.equal(gate.ok, true, 'the floor passes');
});

test('A FLOOR THAT LOST THE OPENING IS REJECTED, provider notwithstanding', () => {
  // The check must be able to FAIL on the floor now, or removing the exemption
  // bought nothing. Strip the opening block's names the way a future edit to
  // fallback.js or to the cell could.
  const sj = buildPairSemantic(A, HARD_SEAT);
  const floor = renderingFor(sj);
  const stripped = {
    ...floor,
    blocks: floor.blocks.map((b, i) => (i === 0 ? { ...b, text: 'Bacaan ini tentang kalian.' } : b)),
  };
  const found = pairGuard(stripped, sj, JSON.stringify(stripped));
  assert.ok(codes(found).includes('pair.both_named'));
  assert.equal(found.find((f) => f.code === 'pair.both_named').severity, 'hard');
  // Through the real door too, on the FLOOR's provider - the path the exemption
  // used to make unreachable.
  const gate = validateRendering(stripped, sj, { provider: 'module_assembly' });
  assert.equal(gate.hard, true, 'a floor that lost the opening is HARD-rejected');
});

test('reframe_present REJECTS a difficult seat whose block drops the reframe', () => {
  const sj = buildPairSemantic(A, HARD_SEAT);
  assert.ok(sj.safety_flags.includes('p2_reframe_required'), 'precondition: the flag is raised');

  // The floor carries the reframe verbatim, so it passes.
  const carried = renderingFor(sj);
  assert.equal(
    codes(pairGuard(carried, sj, JSON.stringify(carried))).includes('pair.reframe_missing'),
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
  const found = pairGuard(dropped, sj, JSON.stringify(dropped));
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
    codes(pairGuard(rendered, sj, JSON.stringify(rendered))).includes('pair.reframe_missing'),
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
    codes(pairGuard(rendered, sj, 'cocok sekali 95%')).includes('pair.verdict'),
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

// ============================================================
// style.tension_collapse, SCOPED PER BLOCK FOR A PAIR
// ============================================================
// Ruled by Reyner 2026-09-08 on docs/qa/2026-09-08-compat-renders-n10.md, where
// this one category was 16 of 18 rejections. The red run is four REAL Gemini
// renders, re-gated byte-for-byte before and after; it is in the commit message.
// ============================================================

const PHRASE = 'Keduanya saling melengkapi dan tetap selaras.';

/** Read from the ruled data, never retyped. */
const TENSION = new Set(BLOCKLIST.style._pair_scope.tension_collapse.banned_in);

/** Append text to the block carrying `factId`. Fails loudly if there is none. */
const into = (rendering, factId, extra) => {
  const idx = rendering.blocks.findIndex((b) => (b.fact_ids || []).includes(factId));
  assert.notEqual(idx, -1, `precondition: a block carries ${factId}`);
  return {
    ...rendering,
    blocks: rendering.blocks.map((b, i) => (i === idx ? { ...b, text: `${b.text} ${extra}` } : b)),
  };
};

const tension = (rendering, sj) => styleGuard(rendering, renderedText(rendering), 'gemini', sj)
  .filter((f) => f.check === 'style.tension_collapse');

test("Reyner's scope lists are what he ruled, and they live in the DATA file", () => {
  // A silent edit to either list is a change to what Stage 6 accepts. Asserting
  // the literal sets means such an edit cannot land without also landing here,
  // where STAGE6_VERSION is asserted one screen up.
  const scope = BLOCKLIST.style._pair_scope.tension_collapse;
  assert.deepEqual(scope.banned_in,
    ['p2_clash', 'p2_harm', 'p2_punishment', 'p3_same_imbalance', 'p1_controls', 'p5_q2', 'p5_q4']);
  assert.deepEqual(scope.permitted_in,
    ['p3_supplies', 'p2_harmony', 'p1_combination', 'p5_q1', 'p5_q3']);
  // `_`-prefixed keys are skipped by style.js's compile filter, so the scope
  // block cannot be mistaken for a pattern category.
  assert.equal(Object.keys(BLOCKLIST.style).includes('_pair_scope'), true);
});

test('THE MIRROR IS UNTOUCHED: the whole reading is still one haystack', () => {
  const mirror = buildSemanticJson(A);
  const rendered = into(renderingFor(mirror), mirror.facts[0].id, PHRASE);
  const text = renderedText(rendered);

  // Rejected, as it always was.
  assert.equal(tension(rendered, mirror).length, 1);

  // And byte-identical to the pre-scope call, which passed no semanticJson at
  // all. This is the assertion that would catch a scope leaking onto the mirror.
  assert.deepEqual(
    styleGuard(rendered, text, 'gemini', mirror),
    styleGuard(rendered, text, 'gemini'),
  );
});

test('PERMITTED: harmony vocabulary in the P3 supply block passes', () => {
  const sj = buildPairSemantic(A, HARD_SEAT);
  const p3 = sj.facts.find((f) => f.id === 'p3_supply');
  assert.equal(variantKeysFor(p3)[0], 'p3_supplies', 'precondition: this pair has a supply');

  const rendered = into(renderingFor(sj), 'p3_supply', PHRASE);
  assert.deepEqual(tension(rendered, sj), [],
    'p3_supplies is a complementarity block and the phrase states the fact');
});

test('BANNED: the same phrase in the P2 tension block still rejects', () => {
  const sj = buildPairSemantic(A, HARD_SEAT);
  const p2 = sj.facts.find((f) => f.id === 'p2_day_pair');
  assert.equal(variantKeysFor(p2)[0], 'p2_punishment', 'precondition: a difficult seat');

  const rendered = into(renderingFor(sj), 'p2_day_pair', PHRASE);
  const found = tension(rendered, sj);
  assert.equal(found.length, 1, 'a tension dissolved into harmony is still the failure');
  assert.match(found[0].message, /saling melengkapi/);
});

test('BANNED: a low-fit quadrant block is a tension block', () => {
  const sj = buildPairSemantic(A, HARD_SEAT);
  const q = variantKeysFor(sj.facts.find((f) => f.id === 'p5_pull_fit'))[0];
  assert.equal(q, 'p5_q2');
  assert.equal(tension(into(renderingFor(sj), 'p5_pull_fit', PHRASE), sj).length, 1);
});

// ── THE PENUTUP, SCOPED BY THE READING (Reyner, 2026-09-08, second ruling) ──
// The first ruling scoped BLOCKS, and measuring it found the collision was not
// in a block: 4 of 4 real renders closed on "saling melengkapi" in the penutup
// and still rejected, so block scoping moved the floor rate by zero. The penutup
// carries no fact, so it is scoped by the WHOLE READING - scanned when any
// tension fact is present, permitted only when none is.

/** A pair with no tension key at all. 26 of 240 fixture pairs qualify. */
const CALM_A = c('1995-06-01', '06:00');   // chart 4
const CALM_B = c('1989-02-04', '04:00');   // chart 13

test('THE PENUTUP IS SCANNED when the reading carries a tension', () => {
  const sj = buildPairSemantic(A, HARD_SEAT);
  assert.ok(sj.facts.flatMap(variantKeysFor).some((k) => TENSION.has(k)),
    'precondition: this pair carries a tension');
  const rendered = { ...renderingFor(sj), penutup: `${PENUTUP} ${PHRASE}` };
  assert.equal(tension(rendered, sj).length, 1, 'harmony vocabulary in the close is the collapse');
});

test('THE PENUTUP IS PERMITTED when the reading carries none', () => {
  const sj = buildPairSemantic(CALM_A, CALM_B);
  const keys = sj.facts.flatMap(variantKeysFor);
  assert.equal(keys.some((k) => TENSION.has(k)), false,
    `precondition: no tension key in [${keys.join(' ')}]`);

  const rendered = { ...renderingFor(sj), penutup: `${PENUTUP} ${PHRASE}` };
  assert.deepEqual(tension(rendered, sj), [],
    'there is no tension in this reading for the close to dissolve');
});

test('IT IS NOT SCOPED BY QUADRANT: a calm quadrant with a clashed seat is scanned', () => {
  // The ruling says "any tension fact", not "a low-fit quadrant", and this is
  // why: q1 and q3 are permitted BLOCK keys, so scoping the close by quadrant
  // alone would permit harmony vocabulary over a clashed seat.
  const pairs = [[A, HARD_SEAT], [c('1978-02-16', '14:30'), c('1984-04-21', '18:45')]];
  let checked = 0;
  for (const [x, y] of pairs) {
    const sj = buildPairSemantic(x, y);
    const keys = sj.facts.flatMap(variantKeysFor);
    const seat = keys.find((k) => ['p2_clash', 'p2_harm', 'p2_punishment'].includes(k));
    if (!seat) continue;
    const rendered = { ...renderingFor(sj), penutup: `${PENUTUP} ${PHRASE}` };
    assert.equal(tension(rendered, sj).length, 1, `${seat} keeps the close scanned`);
    checked += 1;
  }
  assert.ok(checked > 0, 'at least one pair carried a difficult seat');
});

test('THE TENSION SET IS banned_in ITSELF, so the two cannot drift', () => {
  // The penutup rule and the block rule read ONE list. A key added to banned_in
  // becomes a tension for both at once, which is the only way to keep a
  // "scanned when there is a tension" rule honest.
  assert.deepEqual([...TENSION].sort(),
    BLOCKLIST.style._pair_scope.tension_collapse.banned_in.slice().sort());
  assert.ok(BLOCKLIST.style._pair_scope._penutup.includes('banned_in'),
    'the data says so as well as the code');
});

test('A BLOCK CARRYING BOTH KEYS IS SCANNED: tension wins', () => {
  // Not hypothetical - p2_palace_frame carries the frame plus every relation
  // found, so one block can hold a harmony and a punishment at once.
  const sj = buildPairSemantic(A, HARD_SEAT);
  const keys = variantKeysFor(sj.facts.find((f) => f.id === 'p2_palace_frame'));
  assert.ok(keys.includes('p2_clash') || keys.includes('p2_punishment'),
    'precondition: this pair\'s palace scan found a tension');

  // Hand the block a permitted key as well, the way a renderer merging two facts
  // into one block would.
  const base = renderingFor(sj);
  const idx = base.blocks.findIndex((b) => (b.fact_ids || []).includes('p2_palace_frame'));
  const merged = {
    ...base,
    blocks: base.blocks.map((b, i) => (i === idx
      ? { ...b, fact_ids: [...b.fact_ids, 'p3_supply'], text: `${b.text} ${PHRASE}` }
      : b)),
  };
  assert.equal(tension(merged, sj).length, 1, 'the permitted key does not launder the tension');
});
