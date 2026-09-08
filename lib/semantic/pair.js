// ============================================================
// lib/semantic/pair.js — the pair reading's semantic JSON
// ============================================================
// THE SAME CONTRACT AS THE MIRROR'S, NOT A PARALLEL PIPELINE. `renderReading`,
// `validateRendering`, `assembleFallback`, `computeCacheKey` and `persistRendered`
// consume this unchanged. Every difference is CONTENT; the shape is
// `buildSemanticJson`'s.
//
// That is why the two helpers here are imported rather than reimplemented:
// `fact()` from facts.js builds each fact with the glossary content merged in and
// the gap made visible, and `requiredPoints()` from index.js derives coverage
// from what a fact actually carries. A second definition of either would be a
// second definition of the contract.
//
// ══ `kind` IS THE ONE FIELD EVERY CONSUMER BRANCHES ON ══════
// Added to both builders in the same commit. `renderOnce` picks the prompt by it,
// `validateRendering` activates the pair-only checks by it, and the CACHE KEY
// hashes it - which is what keeps the two key spaces from colliding.
//
// ══ NO BIRTH DATA. NO PERSON B ANYWHERE BUT AS DERIVED FACTS ══
// Ruled 2026-09-07: person B gets no mirror, no reading, no link. Nothing here
// carries a birth date or time for either person - only what the five
// `lib/compat/*` modules derived. The spec asserts it by scanning the serialised
// output for the literal values.
//
// ══ EVERY GLOSSARY STRING IS AN `@@UNRULED@@` PLACEHOLDER ═══
// `GLOSSARY.kompatibilitas` is keyed by Cowork and worded by Reyner, and until he
// rules it every cell is a sentinel. That is deliberate and it is why prompt
// X-b2's commit 5 waits: `assembleFallback` builds the deterministic floor out of
// these very strings, so a plausible draft would ship as a real reading the first
// time the provider refused. `scripts/check-unruled-copy.mjs` refuses a
// production build while any survives.
// ============================================================

import { GLOSSARY, elementId } from './glossary.js';
import { fact } from './facts.js';
import { mainProfile } from '../bazi/mainProfile.js';
import { ENGINE_VERSION, requiredPoints } from './index.js';

import { compatBranchRelations } from '../compat/branchRelations.js';
import { compatComplementarity } from '../compat/complementarity.js';
import { compatStemRelation } from '../compat/stemRelation.js';
import { compatTemperament } from '../compat/temperament.js';
import { compatPullFit } from '../compat/pullFit.js';

/**
 * The pair's safety flags. The mirror's four, plus three the pair needs.
 *
 * `no_verdict` - rule doc 2.4: no overall pass/fail and no score, ever.
 * `two_people` - rule 25 applies to BOTH people, and the reading must not advise
 *   either of them to leave or to stay. A mirror has one subject; this has two,
 *   and the failure mode a single-subject reading cannot have is taking a side.
 * `p2_reframe_required` - added conditionally, not here. See below.
 */
const PAIR_SAFETY_FLAGS = [
  'no_fatalism', 'no_medical', 'no_financial', 'no_god_ranking',
  'no_verdict', 'two_people',
];

/** The relations on the day pair that make the P2 reframe mandatory. */
const REFRAME_RELATIONS = new Set(['冲', '害', '刑']);

/** One person's identity block. Field names copied from the mirror's `core`. */
function coreFor(chart) {
  const dm = chart.day.stem;
  const profile = mainProfile(chart, { silent: true });
  return {
    day_master: dm,
    element: elementId(chart.day.element),
    archetype_key: GLOSSARY.arketipe[dm]?.name_id
      ? GLOSSARY.arketipe[dm].name_id.toLowerCase().replace(/\s+/gu, '_')
      : null,
    archetype_name_id: GLOSSARY.arketipe[dm]?.name_id ?? null,
    archetype_name_en: GLOSSARY.arketipe[dm]?.name_en ?? null,
    main_profile: profile.hanzi,
    main_profile_display: GLOSSARY.aspek[profile.hanzi].name_id,
    main_profile_bracket: GLOSSARY.aspek[profile.hanzi].name_en,
    hour_known: chart.hasHourPillar,
  };
}

/**
 * Roles per the prompt's table. `spine` facts are always required; `high` and
 * `normal` map to importances either side of CONTRACT_PARAMS.coverageFloor (65),
 * so `requiredPoints` includes the high ones and leaves the normal one optional.
 *
 * THESE ARE ASSIGNED, NOT SCORED. The mirror ranks its facts with `scoreFacts`
 * over axes fitted to a single chart - rarity against a population, palace
 * weight, verdict interaction. None of those axes is defined for a pair, and
 * inventing a scoring model to produce a ranking nobody has validated would be
 * exactly the improvisation rule 4 forbids in its own domain. The journey order
 * is the compat spec's (P0 -> P1 -> P2 -> P3 -> P4 -> P5 -> P7) and it is a
 * RULED order, so the facts carry it directly.
 */
const ROLE_IMPORTANCE = { spine: 100, high: 80, normal: 50 };

const pairFact = ({ id, role, type, provenance, entry, extra = {} }) => ({
  ...fact({ id, type, provenance, entry, extra }),
  hierarchy: { role },
  importance: ROLE_IMPORTANCE[role],
});

/**
 * Build the semantic JSON for a pair.
 *
 * @param {Object} chartA output of calculateBaziChart for person A
 * @param {Object} chartB the same for person B
 * @param {Object} [options]
 * @param {string} [options.engineVersion]
 * @returns {Object} the renderer's only input, same contract as the mirror's
 */
export function buildPairSemantic(chartA, chartB, { engineVersion = ENGINE_VERSION } = {}) {
  const branches = compatBranchRelations(chartA, chartB);
  const complementarity = compatComplementarity(chartA, chartB);
  const stems = compatStemRelation(chartA, chartB);
  const temperament = compatTemperament(chartA, chartB);
  const pullFit = compatPullFit(branches, complementarity, stems);

  const a = coreFor(chartA);
  const b = coreFor(chartB);
  const K = GLOSSARY.kompatibilitas;

  const facts = [];

  // ── P0. The opening obligation: BOTH names. ──
  // The pair analogue of the mirror's archetype opening, and it is a `spine` fact
  // for the same reason - lib/validate/opening.js checks the mirror's; commit 3's
  // `both_named` checks this one.
  facts.push(pairFact({
    id: 'p0_names',
    role: 'spine',
    type: 'core',
    provenance: {
      kind: 'pair_names',
      a: { archetype: a.archetype_name_id, day_master: a.day_master },
      b: { archetype: b.archetype_name_id, day_master: b.day_master },
    },
    entry: K.p0_names,
  }));

  // ── P2. The day pair - the seat the spec reads as the spouse palace. ──
  const dayRelations = branches.dayBranchPair.map((e) => e.relation);
  facts.push(pairFact({
    id: 'p2_day_pair',
    role: 'spine',
    type: dayRelations.some((r) => REFRAME_RELATIONS.has(r)) ? 'tension' : 'core',
    provenance: {
      kind: 'compat_day_pair',
      relations: branches.dayBranchPair,
      a_branch: chartA.day.branch,
      b_branch: chartB.day.branch,
    },
    entry: K.p2_day_pair,
  }));

  // ── P2. The palace scans, one fact each, omitted when empty. ──
  for (const [id, entries, key] of [
    ['p2_b_hits_a', branches.bHitsASpousePalace, 'p2_b_hits_a'],
    ['p2_a_hits_b', branches.aHitsBSpousePalace, 'p2_a_hits_b'],
  ]) {
    if (entries.length === 0) continue;
    facts.push(pairFact({
      id,
      role: 'high',
      type: 'core',
      provenance: { kind: 'compat_palace_scan', entries },
      entry: K[key],
    }));
  }

  // ── P3. Complementarity. Null and empty are omitted, never emitted as null. ──
  for (const [id, supply, key] of [
    ['p3_a_supplies', complementarity.aSupplies, 'p3_a_supplies'],
    ['p3_b_supplies', complementarity.bSupplies, 'p3_b_supplies'],
  ]) {
    if (!supply) continue;
    facts.push(pairFact({
      id,
      role: 'high',
      type: 'core',
      provenance: { kind: 'compat_supply', ...supply },
      entry: K[key],
    }));
  }
  if (complementarity.sameImbalance.length > 0) {
    facts.push(pairFact({
      id: 'p3_same_imbalance',
      role: 'high',
      type: 'extremity',
      provenance: { kind: 'compat_same_imbalance', elements: complementarity.sameImbalance },
      entry: K.p3_same_imbalance,
    }));
  }

  // ── P1. The two Day Masters on the five-element cycle. ──
  facts.push(pairFact({
    id: 'p1_stem_relation',
    role: 'normal',
    type: 'core',
    provenance: {
      kind: 'compat_stem_relation',
      cycle: stems.cycle,
      a: stems.a,
      b: stems.b,
      // Present only when the two stems ARE a 天干五合 pair. `transformTarget` is
      // metadata and nothing applies it - ruling B, 2026-09-07.
      ...(stems.combination ? { combination: stems.combination } : {}),
    },
    entry: K.p1_stem_relation,
  }));

  // ── P4. The temperament badge. ──
  facts.push(pairFact({
    id: 'p4_temperament',
    role: 'high',
    type: 'core',
    provenance: {
      kind: 'compat_temperament',
      pattern: temperament.pattern,
      relation: temperament.relation,
      a: temperament.a,
      b: temperament.b,
      // The badge NAME is the glossary's, never the model's.
      pattern_name_id: GLOSSARY.kompatibilitas.pattern[temperament.pattern]?.name_id ?? null,
    },
    entry: K.p4_temperament,
  }));

  // ── P5. The quadrant. ──
  facts.push(pairFact({
    id: 'p5_pull_fit',
    role: 'spine',
    type: 'core',
    provenance: {
      kind: 'compat_pull_fit',
      quadrant: pullFit.quadrant,
      pull: pullFit.pull,
      fit: pullFit.fit,
      // 2.5: the renderer explains the quadrant FROM the clauses that fired and
      // never from its own inference.
      pull_reasons: pullFit.pull_reasons,
      fit_reasons: pullFit.fit_reasons,
      quadrant_name_id: GLOSSARY.kompatibilitas.quadrant[pullFit.quadrant]?.name_id ?? null,
    },
    entry: K.p5_pull_fit,
  }));

  const reframeRequired = dayRelations.some((r) => REFRAME_RELATIONS.has(r));

  return {
    kind: 'pair',
    engine_version: engineVersion,
    target_language: 'id',

    core: {
      a,
      b,
      pattern: temperament.pattern,
      quadrant: pullFit.quadrant,
    },

    facts,
    required_points: requiredPoints(facts, { coverageFloor: ROLE_IMPORTANCE.high }),

    safety_flags: reframeRequired
      ? [...PAIR_SAFETY_FLAGS, 'p2_reframe_required']
      : [...PAIR_SAFETY_FLAGS],

    qa: { facts_emitted: facts.length, facts_collapsed: [] },
  };
}
