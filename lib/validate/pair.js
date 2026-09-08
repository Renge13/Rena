// ============================================================
// Stage 6 — the checks that exist only for a pair reading
// ============================================================
// ACTIVE ONLY WHEN `semanticJson.kind === 'pair'`. A mirror reading has one
// subject and no reframe, so every check here would be either meaningless or
// wrong on it - and the mirror's floor-rate fixtures must not move.
//
// ── WHY THESE TWO REJECT AND THE THIRD DOES NOT ────────────
// `both_named` and `reframe_present` are HARD. Each was shown red on a REAL
// Gemini render before it was trusted, which is prompt X-b2's own condition and
// the lesson of the production copy gate that ran for ten days without ever
// executing (COWORK-BRIEF row 46).
//
// `no_verdict` ships with an EMPTY pattern list. The patterns are Indonesian
// constructions and therefore Reyner's alone (rule 20), and a check that fires
// and logs but rejects nothing is not a gate change - it cannot move the floor
// rate, which is the whole point of landing one that way first. It is here so
// that ruling the patterns is a data edit rather than a code change.
// ============================================================

import BLOCKLIST from './blocklist.json' with { type: 'json' };
import { stemOverlap } from './text.js';

/**
 * How much of the reframe's distinctive wording must survive into the block.
 *
 * ABOVE `COVERAGE_PARAMS.fieldOverlap` (0.2), which is the share a rewritten
 * SEED must keep. A seed is a default the renderer is meant to condition and
 * mostly reword; the reframe is the compat spec's ethical spine and a reading
 * that keeps a fifth of it has not carried it. UNFITTED like every threshold in
 * this repo - the n=10 run reports the distribution.
 */
export const REFRAME_OVERLAP = 0.5;

/** Shape-compatible with the other guards' findings. */
const finding = (code, message, factIds = [], severity = 'hard') => ({
  code, message, fact_ids: factIds, severity,
});

/**
 * BOTH people are named in the opening block.
 *
 * The pair analogue of `opening.archetype_missing`, and it is HARD where that one
 * is soft. The reason is that a mirror opening on the element instead of the
 * archetype is a reading that lands badly; a PAIR reading that names one person
 * and not the other is a reading about the wrong thing. It is the first
 * obligation the compat spec states and the one a reader would notice instantly.
 *
 * ── THE OPENING BLOCK, NOT THE WHOLE READING ───────────────
 * Same haystack rule as `openingGuard`: the first block's prose, headings
 * excluded. A name appearing in block four is not the reader meeting the pairing.
 * Unlike openingGuard this reads the whole first block rather than its first
 * sentence, because two names rarely fit in one and the compat prompt asks only
 * that they open the reading together.
 */
function checkBothNamed(rendered, semanticJson, out, provider) {
  // ── NOT ON THE FLOOR, AND THIS IS A CONTENT GAP RATHER THAN AN EXEMPTION ──
  // The module-assembly floor CANNOT name both people. `RENDER_COPY.floorIdentity`
  // is "Kamu adalah" + "dengan unsur", a single-subject sentence, and no ruled
  // cell opens a pair reading - the rulings file has 24 and none of them is an
  // opening. Naming both would need a new connective, which is user-facing
  // Indonesian and Reyner's alone (rule 20).
  //
  // So a HARD check here would make EVERY pair 503 the moment the provider
  // failed: the floor would hard-fail, `floorRefusalReason` would refuse it, and
  // rule 17's always-available floor would not be available at all. Measured
  // rather than reasoned - it turned the pair-semantic spec's four quadrants red
  // the moment the check was wired in.
  //
  // The mirror has the same shape and solved it the same way: its own
  // `opening.archetype_missing` is SOFT precisely so a floor is not killed by it.
  // This one stays HARD for a MODEL render, where the prompt asks for both names
  // and the model is capable of it, and does not run on the floor.
  //
  // **THE FLOOR NAMING NEITHER PERSON IS AN OPEN GAP**, owed in NEXT.md. One
  // ruled opening cell closes it and this exemption goes with it.
  if (provider === 'module_assembly') return;

  const a = semanticJson.core?.a?.archetype_name_id;
  const b = semanticJson.core?.b?.archetype_name_id;
  if (!a || !b) return;

  const opening = (rendered.blocks || [])[0]?.text || '';
  const missing = [
    !opening.includes(a) ? a : null,
    !opening.includes(b) ? b : null,
  ].filter(Boolean);

  if (missing.length === 0) return;

  // BOTH-MISSING AND ONE-MISSING ARE THE SAME FINDING, deliberately. The failure
  // is "the opening does not introduce the pairing", and splitting it would
  // invite a fix that adds the cheaper of the two names.
  out.push(finding(
    'pair.both_named',
    `the opening block must name both people; missing: ${missing.join(', ')}`,
    ['p5_pull_fit'],
  ));
}

/**
 * The P2 reframe is present when the seat is difficult.
 *
 * `p2_reframe` is a FACT with its own ruled cell, so this is the ordinary
 * coverage question asked at a place where a miss is an ethics failure rather
 * than a thinness one: the compat spec's spine is that a clash is never a
 * verdict. `coverageGuard` already requires every required point to be covered,
 * but it is SOFT on a miss and this must not be.
 *
 * WHAT IT CHECKS is that the reframe's own ruled text is reflected in the block
 * that carries the day pair - not that some reassuring words appear somewhere.
 *
 * ── IT USES stemOverlap, AND THE FIRST VERSION DID NOT ─────
 * That version took the cell's longest sentence and asked what share of its
 * 4-plus-letter words appeared in the block. On the real cell those words are
 * `gesekan pada kursi pasangan menandakan hubungan yang membutuhkan perhatian
 * ekstra kesadaran penuh` - and `pada`, `yang`, `hubungan`, `pasangan` and
 * `kursi` are all over any compat reading. **A real Gemini render with every
 * reframe sentence STRIPPED still scored above the threshold**, so the check
 * passed on text carrying no reframe at all. It was measuring its own
 * vocabulary.
 *
 * `stemOverlap` is the repo's own comparison: it drops stopwords, stems the
 * tails, and matches word-initially. `coverage.js` uses it for exactly this
 * question, so this is one definition of "did the idea survive" rather than a
 * second one - and the threshold sits above `COVERAGE_PARAMS.fieldOverlap`
 * because a reframe is not a seed the renderer may mostly drop.
 */
function checkReframePresent(rendered, semanticJson, out) {
  if (!(semanticJson.safety_flags || []).includes('p2_reframe_required')) return;

  const fact = (semanticJson.facts || []).find((f) => f.id === 'p2_reframe');
  if (!fact?.label_meaning) return;

  const blocks = rendered.blocks || [];
  const carrier = blocks.find((b) => (b.fact_ids || []).includes('p2_reframe'))
    ?? blocks.find((b) => (b.fact_ids || []).includes('p2_day_pair'))
    ?? blocks[0];

  const { ratio, hits, total, missing } = stemOverlap(fact.label_meaning, carrier?.text || '');
  if (total === 0) return;
  if (ratio >= REFRAME_OVERLAP) return;

  out.push(finding(
    'pair.reframe_missing',
    'the day pair is difficult and safety_flags asks for the reframe, but the '
    + `block carrying it keeps ${hits} of ${total} of its distinctive stems `
    + `(missing: ${missing.slice(0, 5).join(', ')})`,
    ['p2_reframe'],
  ));
}

/**
 * No overall verdict or score.
 *
 * SHIPS WITH NO PATTERNS AND THEREFORE REJECTS NOTHING. Rule doc 2.4 forbids a
 * score and an overall pass/fail, and the constructions that express one are
 * Indonesian - "cocok", "tidak cocok", a percentage, a rating - which makes them
 * Reyner's to rule. The category exists in `blocklist.json` with an empty list so
 * that ruling them is a data edit.
 *
 * It LOGS what it would have caught, at `flag` severity, which cannot fail a
 * reading. That is deliberate: a flag is visible in the QA table, so the patterns
 * can be fitted against real renders before any of them rejects anything.
 */
function checkNoVerdict(text, blocklist, out) {
  // `.patterns`, NOT the category object. The first version read
  // `blocklist?.verdict?.filter?.(...)` - and `verdict` is
  // `{ _rule, patterns }`, an object with no `.filter`, so the optional call
  // yielded undefined and the `?? []` swallowed it. **The check could never have
  // fired, even after Reyner ruled the patterns**, and it would have looked armed
  // the whole time. Caught by asking what the expression evaluates to rather than
  // by reading it.
  const entries = (blocklist?.verdict?.patterns ?? []).filter((e) => e?.pattern);
  for (const entry of entries) {
    const regex = new RegExp(entry.pattern, entry.flags || 'iu');
    if (regex.test(text)) {
      out.push(finding(
        'pair.verdict',
        `${entry.pattern} - a pair reading states no overall verdict (rule doc 2.4)`,
        [],
        'flag',
      ));
    }
  }
}

/**
 * Every pair-only check. Returns [] for a mirror reading.
 *
 * @param {Object} rendered normalised rendering
 * @param {Object} semanticJson
 * @param {string} text the rendered text the other guards read
 * @param {string} provider which producer made it; the floor is exempt from
 *   `both_named` - see that function for why that is a content gap
 * @returns {Object[]} findings
 */
export function pairGuard(rendered, semanticJson, text, provider) {
  if (semanticJson?.kind !== 'pair') return [];
  const out = [];
  checkBothNamed(rendered, semanticJson, out, provider);
  checkReframePresent(rendered, semanticJson, out);
  checkNoVerdict(text, BLOCKLIST, out);
  return out;
}
