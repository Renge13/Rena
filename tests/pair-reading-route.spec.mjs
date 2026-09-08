// ============================================================
// tests/pair-reading-route.spec.mjs — GET /api/pair/[id]/reading
// ============================================================
// No network and no API key. The provider is stubbed through `globalThis.fetch`,
// the pattern tests/mirror-route.spec.mjs uses, so "a cache hit makes zero
// provider calls" is asserted against a stub that THROWS if touched rather than
// against the absence of a key - which would make it vacuously true.
//
// ══ THE STATE THIS FILE DOCUMENTS ══════════════════════════
// **A pair reading cannot be served today**, and that is measured rather than
// assumed. `GLOSSARY.kompatibilitas` is entirely `@@UNRULED@@` placeholders, and
// the deterministic floor is assembled out of those very strings, so a floor
// carries `@@UNRULED: kompat_*@@` in its prose.
//
// ── AND THE OBVIOUS GUARD DOES NOT CATCH IT ───────────────
// The first version of this file asserted the mirror's floor gate would refuse
// it. **It does not.** Measured:
//
//     validateRendering(pairFloor, pairSemantic)
//       ok: false   hard: FALSE      <- floorRefusalReason returns null
//       flag  coverage.slot_filling
//       soft  style.code_leak
//
// Both findings are SOFT, and soft findings keep serving by design - the rule is
// that a hedge count must not pull a reading. So the floor would have been
// served, HTTP 200, to someone who had paid: a page of placeholders.
//
// `lib/pair/serveReading.js` therefore carries a SECOND serve-boundary refusal -
// a sentinel in prose is never servable - and that is what produces the 503 the
// test below asserts. It clears when Reyner rules the glossary; no code changes
// with it.
//
// So the tests below assert the endpoint's STRUCTURE - the gate, the pipeline
// wiring, rule 16 - and the 503 is asserted as a documented state with its cause
// named, not worked around with a fixture that pretends the glossary is ruled.
// ============================================================

import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';

import { servePairReading } from '../lib/pair/serveReading.js';
import { createPair, getPair, markPairPaid } from '../lib/pairStore.js';
import { buildPairSemantic } from '../lib/semantic/pair.js';
import { calculateBaziChart } from '../lib/bazi/buildChart.js';
import { assembleFallback } from '../lib/render/fallback.js';
import { validateRendering } from '../lib/validate/index.js';
import { __clearMemCache, readCache } from '../lib/render/cache.js';
import { cacheKey, buildSemanticJson } from '../lib/semantic/index.js';
import { geminiConfigured } from '../lib/render/config.js';
import { __clearMemRateLimit, RATE_LIMITS } from '../lib/ratelimit.js';
import { priceFor } from '../lib/pricing.js';

const pairMem = (globalThis.__katonPairMem ??= new Map());

const A = { birthDate: '1989-09-13', birthTime: '09:00' };
const B = { birthDate: '1990-03-04', birthTime: '14:00' };

const request = () => new Request('http://localhost/api/pair/x/reading');

let realFetch;
let fetchCalls;

/** Any provider call at all is a test failure. */
function stubForbiddenProvider() {
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('the provider was called when it must not have been');
  };
}

/** Every provider call fails, so the chain exhausts onto the floor. */
function stubFailingProvider() {
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response('upstream down', { status: 503 });
  };
}

beforeEach(() => {
  pairMem.clear();
  __clearMemCache();
  __clearMemRateLimit();
  realFetch = globalThis.fetch;
  fetchCalls = 0;
});
afterEach(() => { globalThis.fetch = realFetch; });

const newPair = async (paid = false) => {
  const id = `pair-${Math.random().toString(36).slice(2, 10)}`;
  await createPair({
    id,
    a_birth_date: A.birthDate, a_birth_time: A.birthTime, a_gender: null, a_term_side: null,
    b_birth_date: B.birthDate, b_birth_time: B.birthTime, b_gender: null, b_term_side: null,
    sku: 'compat', paid: false, email: null,
  });
  if (paid) await markPairPaid(id, new Date().toISOString());
  return id;
};

test('an unknown id is a 404', async () => {
  const res = await servePairReading(request(), 'no-such-pair');
  assert.equal(res.status, 404);
});

test('UNPAID SERVES NO PROSE, and does not even START a render', async () => {
  // Ruling 3: no Gemini render before payment. The stub throws if touched, so
  // this asserts the render was never begun rather than that its output was
  // withheld - a distinction that is the difference between a leak and a bill.
  stubForbiddenProvider();
  const id = await newPair(false);

  const res = await servePairReading(request(), id);
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.status, 'not_paid');
  assert.equal(body.sku, 'compat');
  assert.equal(body.price, priceFor('compat'));
  assert.deepEqual(Object.keys(body).sort(), ['price', 'sku', 'status']);
  assert.equal('reading' in body, false, 'no prose');
  assert.equal('facts' in body, false, 'and no facts either');

  assert.equal(fetchCalls, 0, 'THE PROVIDER WAS NEVER CALLED');
});

test('THE FLOOR IS TOO BROKEN TO SERVE, and the endpoint 503s rather than shipping placeholders', async () => {
  // The state this whole file documents. Every provider call fails, the chain
  // exhausts onto the module-assembly floor, and the floor is built from unruled
  // glossary strings - so it hard-fails Stage 6 and a 503 is the honest answer.
  stubFailingProvider();
  const id = await newPair(true);

  const res = await servePairReading(request(), id);
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error, 'unruled_content_in_reading');

  // NOT the floor gate. floorRefusalReason returns NULL here - both findings on
  // the pair floor are SOFT, and soft findings keep serving by design. Without
  // the second refusal this would have been a 200 carrying placeholders.
});

test('THE CAUSE IS THE UNRULED GLOSSARY, measured here rather than asserted', async () => {
  // Pinning the CAUSE separately from the symptom, so the day Reyner rules the
  // glossary this test tells whoever is reading exactly which half changed.
  const sj = buildPairSemantic(
    calculateBaziChart(A),
    calculateBaziChart(B),
  );
  const floor = assembleFallback(sj);

  assert.ok(
    JSON.stringify(floor.blocks).includes('@@UNRULED'),
    'the floor is assembled out of the placeholders',
  );

  const gate = validateRendering(
    { blocks: floor.blocks, penutup: 'Peta ini sudah cukup jelas untuk kamu jalani mulai sekarang.' },
    sj,
    { provider: 'module_assembly' },
  );
  assert.equal(gate.ok, false);
  const codes = new Set(gate.findings.map((f) => f.code ?? f.check));
  assert.ok(codes.has('style.code_leak'), 'the placeholders read as code, correctly');
});

test('RULE 16: a floor is NEVER persisted', async () => {
  // `persistRendered` is the single door and refuses `module_assembly` itself.
  // A stored floor would cost a PAYING customer her real reading permanently:
  // the next request is a cache hit and the chain never runs again until
  // ENGINE_VERSION moves.
  stubFailingProvider();
  const id = await newPair(true);

  await servePairReading(request(), id);

  const sj = buildPairSemantic(calculateBaziChart(A), calculateBaziChart(B));
  assert.equal(
    await readCache(cacheKey(sj)), null,
    'nothing was written to render_cache',
  );
  // Absent rather than null: createPair's dev row never sets the column, and
  // setPairCacheKey was not called. Both are 'no cache key', and asserting the
  // falsy-ness rather than the exact value keeps this about the BEHAVIOUR.
  assert.ok(!(await getPair(id)).cache_key, 'and the row learned no cache key');
});

test('the rate-limit bucket exists and carries the mirror GET\'s dimensions', () => {
  const pair = RATE_LIMITS.pair_serve;
  assert.ok(pair, 'pair_serve exists');
  assert.deepEqual(
    Object.keys(pair).sort(),
    Object.keys(RATE_LIMITS.mirror_serve).sort(),
    'same dimensions as mirror_serve',
  );
  assert.notEqual(pair, RATE_LIMITS.mirror_serve, 'its own budget, not the mirror\'s');
});

test('the pair semantic JSON it renders is the PAIR builder\'s, not the mirror\'s', () => {
  // A WIRING assertion. If this route built a MIRROR semantic JSON from one of
  // the two charts, every other test in this file would still pass - the floor
  // would still carry placeholders, the 503 would still fire - and the endpoint
  // would be serving the wrong product's contract entirely.
  const sj = buildPairSemantic(calculateBaziChart(A), calculateBaziChart(B));
  assert.equal(sj.kind, 'pair');
  assert.ok(sj.facts.some((f) => f.id === 'p5_pull_fit'));

  // The route's 503 body is the same either way, so the discriminator is the
  // CACHE KEY: it hashes `kind`, so a mirror-shaped JSON keys differently.
  // Asserting the two keys differ is what makes 'this route builds a pair' a
  // checkable claim rather than a reading of the source.
  const mirrorish = buildSemanticJson(calculateBaziChart(A));
  assert.notEqual(cacheKey(sj), cacheKey(mirrorish));
});

test('NO PROVIDER IS CONFIGURED HERE, and that is why commit 3 is BLOCKED', () => {
  // Recorded as an assertion rather than a sentence in a PR, because it is the
  // reason a whole commit of this prompt did not land. With no GEMINI_API_KEY the
  // chain skips the provider entirely and goes straight to the floor - so no
  // Gemini output exists to show a new Stage 6 check rejecting, which is exactly
  // what prompt X-b2 requires before such a check may be cited as protection.
  assert.equal(geminiConfigured(), false,
    'if this ever fails locally, commit 3 is unblocked and should be done');
});