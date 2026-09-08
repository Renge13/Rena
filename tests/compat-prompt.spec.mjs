// ============================================================
// tests/compat-prompt.spec.mjs — two prompts, selected by kind
// ============================================================
// THE ASSERTION THAT MATTERS MOST IS THE ONE ABOUT THE MIRROR: its
// `prompt_version` must be UNCHANGED by this split. That value is stamped on
// every row already in `render_cache`, and it exists so a flagged reading is
// attributable to the exact prompt that produced it. A version that moved
// because the code around it was refactored would silently orphan the
// attribution of every mirror reading ever cached.
//
// The second is that the shared sections are VERBATIM. Prompt X-b2: "do not
// paraphrase - a paraphrased rule is a second rule." The pair prompt COMPOSES
// itself from the mirror's own bytes rather than carrying a copy, so this test
// can assert byte-identity instead of taking a promise.
// ============================================================

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  MASTER_PROMPT, COMPAT_PROMPT, MASTER_PROMPTS, SHARED_SECTIONS,
  PROMPT_VERSION, PROMPT_VERSIONS, promptVersionFor, loadPrompt, assertPromptLoaded,
} from '../lib/render/prompt.js';

const ROOT = path.resolve(import.meta.dirname, '..');

test('THE MIRROR\'S PROMPT VERSION IS UNCHANGED BY THE SPLIT', () => {
  // Measured on `main` at c9234d2, immediately before this commit:
  //     MIRROR PROMPT_VERSION BEFORE: 22316c3349d0ea46
  // Pinned as a LITERAL rather than recomputed, because recomputing it here
  // would ask the same question through the same code and agree with itself
  // however the hash was built.
  assert.equal(PROMPT_VERSION, '22316c3349d0ea46');
  assert.equal(PROMPT_VERSIONS.mirror, PROMPT_VERSION, 'the named export is the map\'s value');
  assert.equal(promptVersionFor('mirror'), PROMPT_VERSION);
});

test('the two versions are distinct, so a row attributes to the right prompt', () => {
  assert.notEqual(PROMPT_VERSIONS.pair, PROMPT_VERSIONS.mirror);
  assert.match(PROMPT_VERSIONS.pair, /^[0-9a-f]{16}$/u);
  assert.equal(promptVersionFor('pair'), PROMPT_VERSIONS.pair);
});

test('selection is BY KIND, and an unknown kind throws rather than defaulting', () => {
  assert.equal(loadPrompt('mirror'), MASTER_PROMPT);
  assert.equal(loadPrompt('pair'), COMPAT_PROMPT);
  assert.notEqual(MASTER_PROMPT, COMPAT_PROMPT);

  // Defaulting to the mirror would render a PAIR with a one-person prompt and
  // produce a reading about one person from two charts - a wrong reading that
  // looks entirely well-formed, which is the worst shape of failure here.
  assert.throws(() => loadPrompt('nope'), /no master prompt for kind/u);
  assert.throws(() => loadPrompt(undefined), /no master prompt for kind/u);
  assert.throws(() => promptVersionFor('nope'), /no prompt version for kind/u);
});

test('THE SHARED SECTIONS ARE VERBATIM, byte for byte', () => {
  // Not "the pair prompt mentions the golden rules" - the mirror's own bytes.
  const raw = readFileSync(path.join(ROOT, 'docs', 'content', 'renderer-prompt.txt'), 'utf8')
    .replace(/\r\n?/gu, '\n');

  for (const heading of SHARED_SECTIONS) {
    const start = raw.indexOf(`\n${heading}\n`);
    assert.notEqual(start, -1, `the mirror prompt still has ${heading}`);
    const after = raw.indexOf('\n## ', start + 1);
    const body = raw.slice(start + 1, after === -1 ? undefined : after + 1);

    assert.ok(body.length > 200, `${heading} is substantial, not an empty match`);
    assert.ok(COMPAT_PROMPT.includes(body), `${heading} appears in the pair prompt VERBATIM`);
  }

  // And the hard bans really did travel. These are the ones the mirror's VOICE
  // section names, and a composition bug that silently produced an empty section
  // would drop every one of them while still passing a length check.
  for (const ban of ['ngerasa', 'tuh, lho, deh', 'bukan X, melainkan/tapi Y', 'Emoji']) {
    assert.ok(COMPAT_PROMPT.includes(ban), `the pair prompt carries the ban on ${ban}`);
  }
});

test('the pair prompt does NOT inherit the mirror-specific OUTPUT FORMAT', () => {
  // The mirror's says penutup names "who this person is" and mentions
  // `quiet_chart`. Both are false for a pair, which is why OUTPUT FORMAT is
  // written out in the compat file rather than shared.
  assert.ok(MASTER_PROMPT.includes('quiet_chart'), 'precondition: the mirror mentions it');
  assert.ok(!COMPAT_PROMPT.includes('quiet_chart'), 'the pair does not');
  assert.ok(!COMPAT_PROMPT.includes('who this person is'));

  // It still has an OUTPUT FORMAT of its own, with the same JSON schema.
  assert.ok(COMPAT_PROMPT.includes('## OUTPUT FORMAT'));
  assert.ok(COMPAT_PROMPT.includes('"blocks"'));
  assert.ok(COMPAT_PROMPT.includes('"penutup"'));
});

test('the pair prompt carries the constraints a two-subject reading needs', () => {
  // Each of these is a ruling, and each is a failure a one-person prompt has no
  // reason to guard against.
  for (const [what, needle] of [
    ['no score or overall verdict', 'NO SCORE AND NO OVERALL VERDICT'],
    ['no ranking the two people', 'NO RANKING THE TWO PEOPLE'],
    ['no advice to stay or leave', 'NO ADVICE TO STAY OR TO LEAVE'],
    ['B is never addressed', 'DO NOT ADDRESS PERSON B'],
    ['the names are the glossary\'s', 'THE PATTERN AND QUADRANT NAMES ARE THE GLOSSARY'],
    ['the mandatory P2 reframe', 'p2_reframe_required'],
    ['no 合化', 'NEVER as a transformation'],
  ]) {
    assert.ok(COMPAT_PROMPT.includes(needle), `the pair prompt states: ${what}`);
  }
});

test('assertPromptLoaded covers BOTH, and would catch a stripped section', () => {
  assert.equal(assertPromptLoaded(), true);
  assert.deepEqual(Object.keys(MASTER_PROMPTS).sort(), ['mirror', 'pair']);
  for (const [kind, prompt] of Object.entries(MASTER_PROMPTS)) {
    assert.ok(prompt.length > 1000, `${kind} is substantial`);
    assert.ok(prompt.includes('## VOICE'), `${kind} has VOICE`);
    assert.ok(prompt.includes('## OUTPUT FORMAT'), `${kind} has OUTPUT FORMAT`);
  }
});

test('the deploy traces BOTH prompt files', () => {
  // The pair prompt is read at RUNTIME exactly like the mirror's. A missing
  // trace entry is not a subtle bug: `lib/render/prompt.js` reads at module
  // load, so every route touching the render chain throws on a cold start. The
  // mirror entry's own comment records that this already happened once.
  const config = readFileSync(path.join(ROOT, 'next.config.mjs'), 'utf8');
  assert.ok(config.includes('./docs/content/renderer-prompt.txt'));
  assert.ok(config.includes('./docs/content/compat-renderer-prompt.txt'));
});
