<!--
STATUS: RELEASED 2026-09-08 by Reyner (product model 09-07; V6 and descriptor 09-08). Written by Cowork.
Cowork wrote this into the working tree; Claude Code commits it FIRST, alone, on `feat/compat-2b2`.
Depends on PR A (gate) and PR B (V6) being merged first. Do not start before both are on main.
-->

# Prompt X-b2 — Compat tranche 2b2: the prose pipeline (no UI)

Branch `feat/compat-2b2`. Six ordered commits. The compat report enters the SAME pipeline the
mirror uses — `renderReading` → Gemini → Stage 6 → `render_cache` → floor on refusal — as a new
instance of the semantic-JSON contract, not a parallel pipeline. Nothing here has a page.

Read `CLAUDE.md` (rules 14-17 especially), `docs/NEXT.md`, `docs/prompts/X-compat-2b1.md`,
`docs/product/compatibility-reading-spec.md` (P1-P5, P7), `docs/product/compat-p4-p5-rules.md` (as
amended by PR B), `lib/semantic/index.js` (the contract: `core`, `facts`, `required_points`,
`safety_flags`, `requiredPoints()`), `lib/semantic/facts.js` (the `fact()` shape and one worked fact,
`spouse_palace` at :474), `lib/render/index.js` (`renderOnce`, `persistRendered`), `lib/render/prompt.js`
(`loadPrompt`, `PROMPT_VERSION`), `lib/render/fallback.js` (`assembleFallback`), `lib/validate/index.js`
(`validateRendering`, `STAGE6_VERSION`), `docs/content/renderer-prompt.txt`, `docs/content/glossary.json`.

## THE TWO FACTS THAT SHAPE THIS PROMPT

1. **The floor is glossary text.** `assembleFallback` builds blocks from each required fact's own
   strings (`label`, `label_meaning`, seeds). So the compat report has NO deterministic floor until
   `glossary.json` carries a `kompatibilitas` section with ruled Indonesian text. Reyner rules
   register; Cowork drafts the worksheet in parallel with this build. Until ruled, every cell is an
   `@@UNRULED: kompat_<key>@@` placeholder — which the (now real) production gate refuses, correctly.
   **Commit 5 (floor rate) cannot run on placeholders and waits for the rulings.** Commits 0-4 do not.
2. **A new Stage 6 check counts only after it has been seen red on a real compat render.** The
   production copy gate was documented and tested for ten days without ever running (PR A). No check
   added here is cited as protection until its red run against an actual Gemini output is in the
   commit message.

## Commit 0 — this file, alone
`docs/prompts/X-compat-2b2.md`.

## Commit 1 — the pair semantic JSON (`lib/semantic/pair.js`)
`buildPairSemantic(chartA, chartB, { engineVersion })` returns an object satisfying the SAME contract
`buildSemanticJson` returns, so `renderReading`, `validateRendering`, `assembleFallback`,
`computeCacheKey` and `persistRendered` consume it unchanged. Differences are content, not shape:
- `kind: 'pair'` at top level (the mirror has no `kind`; add `kind: 'mirror'` there in the same commit
  so the cache key spaces cannot collide and the prompt selector in commit 2 has one field to read).
- `core`: `a` and `b` each `{ day_master, element, archetype_key, archetype_name_id, archetype_name_en,
  main_profile, main_profile_display, main_profile_bracket }` (copy the mirror's `core` field names
  exactly); plus `pattern` (P4) and `quadrant` (P5) as ids; `target_language: 'id'`; `hour_known`
  for each; `engine_version`.
- `facts[]`, each built with the existing `fact()` helper, with these ids and roles:
  | id | source | role |
  |---|---|---|
  | `p0_names` | both archetypes (opening obligation: BOTH names in the opening, mirroring the mirror's `archetype` must_cover) | spine |
  | `p2_day_pair` | `branchRelations.dayBranchPair` | spine |
  | `p2_b_hits_a`, `p2_a_hits_b` | palace hits (one fact each; may be empty → omitted) | high |
  | `p3_a_supplies`, `p3_b_supplies`, `p3_same_imbalance` | complementarity (omit null/empty) | high |
  | `p1_stem_relation` | `stemRelation.cycle` + `combination` when present | normal |
  | `p4_temperament` | `temperament.pattern` + both gods | high |
  | `p5_pull_fit` | quadrant + `pull_reasons` + `fit_reasons` | spine |
  Each fact's `entry` comes from `GLOSSARY.kompatibilitas.<key>` (commit 1 adds the section with
  every key present and every string a `PENDING('kompat_<key>')` placeholder — the KEY set is
  Cowork's, the TEXT is Reyner's). Provenance carries the raw engine fact so the renderer can name
  branches, elements and gods. `required_points` via the existing `requiredPoints()`; spine facts are
  always required.
- `safety_flags`: the mirror's plus `no_verdict` (no overall pass/fail, no score), `p2_reframe_required`
  when `p2_day_pair` is clash/harm/punishment (the spec's mandatory reframe), `two_people` (rule 25
  applies to both; no advice to leave/stay).
Tests `tests/pair-semantic.spec.mjs`, red first: contract shape (every required point has a backing
fact; every `must_cover` string exists on the fact); `kind` present; pairs from fixture reaching each
quadrant produce a `p5_pull_fit` spine fact; B's birth data absent from the semantic JSON (only
derived facts). Reuse `tests/stage3-contract.spec.mjs`'s assertions by import where possible.

## Commit 2 — the compat renderer prompt and its selection
- `docs/content/compat-renderer-prompt.txt`: the master prompt for the pair. **Structure only from
  Cowork; register from the mirror prompt.** Reuse the mirror prompt's voice, format and prohibition
  sections VERBATIM by reference (copy them; do not paraphrase — a paraphrased rule is a second rule).
  Add the compat-specific instructions: the journey order P0 names → P1 → P2 (with the reframe when
  flagged) → P3 → P4 badge → P5 quadrant → P7 map (2-3 strengths, 2-3 frictions, one sentence on what
  the pairing asks of each); both people named by archetype throughout; no score, no verdict, no
  ranking of the two people; the pattern and quadrant labels are the glossary's, never the model's.
- `lib/render/prompt.js`: `loadPrompt(kind)`; `MASTER_PROMPT` becomes `MASTER_PROMPTS = { mirror, pair }`
  and `PROMPT_VERSION` becomes per kind (the hash includes the kind's file). `renderOnce` selects by
  `semanticJson.kind`. `assertPromptLoaded` covers both. **`prompt_version` stored on `render_cache`
  must now be the pair prompt's hash for pair rows** — assert it in a test; the 09-05 state doc's
  warning about `prompt_version: null` dissolving into a legitimate case applies here.
Tests red first: selection by kind; distinct versions; the mirror's version unchanged by this commit
(paste the hash before and after).

## Commit 3 — compat Stage 6 checks, ISOLATED (`STAGE6_VERSION` bump, nothing else in the commit)
Add to `validateRendering`, active only when `semanticJson.kind === 'pair'`:
- `both_named`: both `archetype_name_id` values appear in the opening block (the pair analogue of
  `lib/validate/opening.js`).
- `no_verdict`: rejects a rendered text carrying an overall pass/fail or score construction. The
  PATTERNS are Indonesian and therefore Reyner's — ship the check with an EMPTY pattern list under a
  `blocklist.json` category `verdict` plus its `_rule`, so it fires-and-logs nothing until he rules
  the patterns (a check that fires and logs but rejects nothing is not a gate change under the
  isolation rule; the version bump here is for `both_named` and `reframe_present`).
- `reframe_present`: when `safety_flags` has `p2_reframe_required`, the `p2_day_pair` block must
  cover the glossary's reframe string (a `must_cover` on that fact, so it is the ordinary coverage
  check doing the work — no new mechanism).
**Each rejecting check is shown red on a REAL compat render**: run one Gemini render of a fixture
pair (needs `GEMINI_API_KEY`; if unavailable locally, mark the commit BLOCKED and say so rather than
substituting a stub) and paste the rejection. Bump `STAGE6_VERSION` once. `blocklist.json#_rule` and
the constant's docblock already say why.

## Commit 4 — `GET /api/pair/[id]/reading`
`lib/pair/serveReading.js` + route. Paid gate identical to `servePairFacts` (unpaid → `not_paid`,
nothing else). Paid: charts in memory → `buildPairSemantic` → `renderReading` → serve
`{ status, facts, reading, served_from: 'cache'|'render'|'floor' }`. `persistRendered` is the single
door (rule 16): floors are served and never stored; set `pair.cache_key` on first successful persist.
Rate-limited via the same `consume()` dimensions as the mirror GET. Tests red first: unpaid serves no
prose; paid serves a render from a provider stub; a floor is served and NOT persisted (assert the
cache table count); a second paid call is a cache hit with the provider stub throwing if touched
(copy `tests/mirror-route.spec.mjs`'s stub pattern).

## Commit 5 — floor rate at n=10 (AFTER Reyner's glossary rulings are applied)
Reuse the n-renders harness on ten fixture pairs covering all four quadrants and at least one
`p2_reframe_required` pair. Record as `docs/qa/<date>-compat-renders-n10.md` with the same table the
mirror's 2026-08-22 run used. Precondition for X-b3: pooled floor rate at or below the mirror's ruled
10%. If above, stop and report which check rejects most — do not loosen a check to pass.

## Not to do
No UI, no route other than commit 4's, no pricing change, no Indonesian prose authored by Code or
Cowork (placeholders only; the worksheet is Reyner's), no P5 rule change (PR B owns it), no change to
what the MIRROR's Stage 6 accepts (assert its floor-rate fixtures unchanged).
At the end: suite green; PR open; `NEXT.md` owed: `kompatibilitas` glossary rulings and `verdict`
patterns (Reyner), seven labels (Reyner), X-b3 (Cowork).

## Parallel, Cowork: `docs/content/compat-glossary-worksheet.md`
Every `kompat_<key>` with: the engine fact it describes, the spec's intent line (P2 reframe etc.),
Cowork's English gloss of what the cell must say, a draft in Reyner's syntax patterned on the most
recent rulings file, and an empty RULING column. Swept against `blocklist.json` compiled exactly as
`lib/validate/style.js` compiles it, and against 3-gram overlap with every existing seed, before
Reyner sees it. Applied by `scripts/apply-rulings.mjs --expect <N>` when ruled.
