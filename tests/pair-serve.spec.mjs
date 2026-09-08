// ============================================================
// tests/pair-serve.spec.mjs — GET /api/pair/[id], the gated facts endpoint
// ============================================================
// THREE THINGS THIS FILE REFUSES, and each is a ruling rather than a preference:
//
//  1. AN UNPAID RESPONSE THAT LEAKS ANYTHING ABOUT EITHER CHART. Ruling 3
//     (2026-09-07 night): "No free P0 reading, no named relation tease, and no
//     Gemini render before payment." So unpaid gets the sku and the price and
//     nothing else - not even an archetype name, which is what the superseded P0
//     tease was going to show.
//
//  2. PERSON B'S BIRTH DATA IN A RESPONSE, PAID OR NOT. Her birth input is
//     server-only; only DERIVED facts may leave. The pair row holds
//     `b_birth_date` and `b_birth_time`, so this is a live leak surface, not a
//     hypothetical one.
//
//  3. PROSE. This endpoint is the deterministic floor of the compat report and
//     the seam X-b2 hangs the renderer off. Rule 14: the engine owns the facts,
//     the LLM chooses the words. Nothing here may carry a sentence.
//
// Charts are computed IN MEMORY from the pair's own birth inputs, never via a
// reading row - person B has no reading row and must never get one, which
// tests/pair-route.spec.mjs asserts at the create.
// ============================================================

import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';

import { priceFor } from '../lib/pricing.js';
import { createPair, getPair, markPairPaid } from '../lib/pairStore.js';
import { servePairFacts } from '../lib/pair/serve.js';

const readingMem = (globalThis.__katonReadingMem ??= new Map());
const pairMem = (globalThis.__katonPairMem ??= new Map());

// Fixture charts 1 and 2, so the derived facts are checkable against the compat
// specs that already assert this pair by hand: 1 x 2 is q1, with 2.1.d the only
// pull clause that fires (tests/compat-pull-fit.spec.mjs).
const A = { birthDate: '1989-09-13', birthTime: '09:00' };
const B = { birthDate: '1990-03-04', birthTime: '14:00' };

beforeEach(() => {
  readingMem.clear();
  pairMem.clear();
});

const newPair = async (over = {}) => {
  const id = `pair-${Math.random().toString(36).slice(2, 10)}`;
  await createPair({
    id,
    a_birth_date: A.birthDate, a_birth_time: A.birthTime, a_gender: null, a_term_side: null,
    b_birth_date: B.birthDate, b_birth_time: B.birthTime, b_gender: null, b_term_side: null,
    sku: 'compat', paid: false, email: null, ...over,
  });
  return id;
};

test('an unknown id is a 404', async () => {
  const res = await servePairFacts('no-such-pair');
  assert.equal(res.status, 404);
});

test('UNPAID returns the offer and NOTHING about either chart', async () => {
  const id = await newPair();
  const res = await servePairFacts(id);
  assert.equal(res.status, 200, 'the offer must be describable before it is bought');
  const body = await res.json();

  // Mirrors lib/deliver/handlers.js#NOT_PAID: the reason is a machine token, and
  // the response describes the OFFER so a paywall can render it.
  assert.equal(body.status, 'not_paid');
  assert.equal(body.sku, 'compat');
  assert.equal(body.price, priceFor('compat'));

  // Ruling 3, asserted as an exact key set so an added field has to be a
  // deliberate edit here rather than an accident in a later refactor.
  assert.deepEqual(Object.keys(body).sort(), ['price', 'sku', 'status']);
  assert.equal('facts' in body, false, 'no facts key at all before payment');

  // And nothing chart-shaped anywhere in the serialised body - no hanzi (a
  // pillar, a stem, a god), no archetype, no relation, no quadrant. The
  // superseded P0 tease was exactly "two archetype faces plus one named
  // relational fact", so those are the names to refuse by name.
  const raw = JSON.stringify(body);
  assert.ok(!/[一-鿿]/u.test(raw), 'no hanzi before payment');
  for (const leak of ['archetype', 'main_profile', 'pull', 'fit', 'quadrant', 'pattern', 'branch']) {
    assert.ok(!raw.includes(leak), `no ${leak} before payment`);
  }
});

test('PAID returns all five fact kinds, computed in memory', async () => {
  const id = await newPair();
  await markPairPaid(id, new Date().toISOString());

  const res = await servePairFacts(id);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'paid');

  // The five lib/compat/* modules, plus each person's identity facts.
  assert.deepEqual(
    Object.keys(body.facts).sort(),
    ['a', 'b', 'branchRelations', 'complementarity', 'pullFit', 'stemRelation', 'temperament'],
  );

  // Each person: the archetype and the dominant Aspek, which is what ruling P4
  // requires the customer to get alongside the badge ("the factual identity of
  // each person's dominant Aspek").
  for (const side of ['a', 'b']) {
    assert.ok(body.facts[side].archetype, `${side} has an archetype`);
    assert.ok(body.facts[side].main_profile, `${side} has a main_profile`);
  }

  // And the relational facts are the real ones. Charts 1 x 2 is **q2** with 2.1.d
  // as the only pull clause, hand-derived in tests/compat-pull-fit.spec.mjs - so
  // if this endpoint wired the two charts up in the wrong order or passed the
  // modules the wrong arguments, this is where it shows.
  //
  // IT WAS q1 UNTIL THE V6 AMENDMENT (2026-09-08) and the move is the rule
  // change reaching the endpoint, not a defect here: this pair carries 害 at B's
  // hour, which the extended 2.2.c now counts against fit. `pull_reasons` is
  // unchanged at ['2.1.d'] - A's MONTH branch harmonises with B's day branch, so
  // the narrowed clause still fires, from the other direction than it used to.
  assert.equal(body.facts.pullFit.quadrant, 'q2');
  assert.deepEqual(body.facts.pullFit.pull_reasons, ['2.1.d']);
  assert.equal(body.facts.branchRelations.kind ?? 'grouped', 'grouped');
  assert.ok(Array.isArray(body.facts.branchRelations.bHitsASpousePalace));
  assert.equal(body.facts.stemRelation.kind, 'compat_stem_relation');
  assert.equal(body.facts.temperament.kind, 'compat_temperament');
  assert.ok('sameImbalance' in body.facts.complementarity);
});

test('NO READING ROW IS CREATED TO SERVE A PAID PAIR', async () => {
  // The charts are computed in memory from the pair's own columns. A serve that
  // created readings "to reuse the pipeline" would mint two openable URLs per
  // report, and person B's is the one the ruling forbids.
  const id = await newPair();
  await markPairPaid(id, new Date().toISOString());
  assert.equal(readingMem.size, 0);

  await servePairFacts(id);
  await servePairFacts(id); // twice: a cache-on-first-serve would show up here

  assert.equal(readingMem.size, 0, 'serving a pair creates no reading row, ever');
});

test('PERSON B\'S BIRTH DATA NEVER LEAVES, paid or unpaid', async () => {
  const id = await newPair();

  for (const paid of [false, true]) {
    if (paid) await markPairPaid(id, new Date().toISOString());
    const body = await (await servePairFacts(id)).json();
    // WITHOUT THIS the test passes on a stub that returns nothing: an error body
    // trivially contains no birth date. A no-leak assertion has to prove there
    // was a real response that COULD have leaked.
    assert.equal(body.status, paid ? 'paid' : 'not_paid');
    if (paid) assert.ok(body.facts, 'a real paid body, so the scan below is not vacuous');
    const raw = JSON.stringify(body);

    // The literal values from the row. `1990-03-04` and `14:00` are B's, and
    // `1989-09-13` and `09:00` are A's - NEITHER may appear. A's birth data is
    // not secret from A, but this endpoint has no way to know its caller is A,
    // and echoing it back serves nothing.
    for (const value of ['1990-03-04', '14:00', '1989-09-13', '09:00']) {
      assert.ok(!raw.includes(value), `${value} must not appear (paid=${paid})`);
    }
    for (const key of ['b_birth_date', 'b_birth_time', 'birthDate', 'birthTime', 'email']) {
      assert.ok(!raw.includes(key), `${key} must not appear (paid=${paid})`);
    }
  }
});

test('NO PROSE: the paid body carries facts only', async () => {
  const id = await newPair();
  await markPairPaid(id, new Date().toISOString());
  const body = await (await servePairFacts(id)).json();
  // Same guard as above: prove the payload exists before asserting what is not
  // in it. A stub's error body has no prose in it either.
  assert.equal(body.status, 'paid');
  assert.ok(body.facts?.pullFit, 'a real paid body with real facts in it');

  // Every string in the payload must be a fact token, a hanzi run, an element
  // key, an archetype name or a clause id. A SENTENCE is what this refuses: the
  // renderer is X-b2's, and a sentence appearing here would mean the engine had
  // started choosing words (rule 14).
  const sentences = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      // A space-separated run of three or more words with a lowercase letter is
      // the shape of prose. Archetype names ("Api Unggun") are two words; clause
      // ids and element keys have none.
      if (/\s\S+\s\S+/u.test(node) && /[a-z]{3}/u.test(node)) sentences.push(`${path}: ${node}`);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    }
  };
  walk(body, 'body');
  assert.deepEqual(sentences, [], 'no prose in the deterministic floor');
});

test('the gate reads the STORED paid flag, not anything from the caller', async () => {
  // Rule 18: `paid` flips only in the verified webhook. There is no argument to
  // this handler that could assert payment, and the unpaid path is reached purely
  // from the row - so flipping the row is the only thing that changes the answer.
  const id = await newPair();
  assert.equal((await (await servePairFacts(id)).json()).status, 'not_paid');
  await markPairPaid(id, new Date().toISOString());
  assert.equal((await (await servePairFacts(id)).json()).status, 'paid');
  assert.equal((await getPair(id)).paid, true);
});
