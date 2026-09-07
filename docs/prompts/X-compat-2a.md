<!--
STATUS: RELEASED 2026-09-07 by Reyner. Written by Cowork after Reyner's P4/P5 rulings of the same day.
Cowork wrote this into the working tree; Claude Code commits it FIRST, alone, on `feat/compat-2a`.
Companion: `docs/product/compat-p4-p5-rules.md` (commit 1 of this prompt, also written by Cowork).
-->

# Prompt X-a — Compat tranche 2a: P4 / P5 engine facts and the product principle

Branch `feat/compat-2a`. Four ordered commits. Engine facts only; no UI, no route, no copy, no
Stage 6 change. Tranche 2b (UI, P0 card, email checkout, renderer prompt, Stage 6, content) is
prompt X-b and is NOT written yet.

Read `CLAUDE.md`, `docs/NEXT.md`, `docs/prompts/W-compat-1.md`, then
`docs/product/compat-p4-p5-rules.md` (commit 1 below).

## RULINGS, verbatim from Reyner, 2026-09-07 (evening)

**P4.** "P4 should NOT be facts-only A. I want a verdict/badge layer. [...] I do not want your
original B formula of same God / same group = colliding, different group = complementary. That is
too crude and not something we can substantiate. Instead, use a Katon-owned classification based on
the deterministic relationship between the two dominant Ten-God profiles: same God -> Matching
Pattern; same Ten-God family/group -> Related Pattern; different group -> Contrasting Pattern. The
engine should expose the underlying facts (`same_god`, `same_group`, `different_group`) and the
content layer can render the badge and interpretation. Important wording boundary: these badges are
Katon's interpretive framework, not claims that classical BaZi explicitly defines these three
relationship categories. The customer should therefore get both: (1) the factual identity of each
person's dominant Aspek, and (2) a clear relationship verdict/badge derived from those facts."

**P5.** "P5 remains accepted as written" — the PULL / FIT booleans in
`docs/product/compat-p4-p5-rules.md`, including clash counted as PULL and harm/punishment lowering
FIT. The four quadrant LABELS and the three P4 badge NAMES are NOT yet ruled in Indonesian: they
ship as `@@UNRULED@@` slots (seven strings, Reyner's).

**Spouse star.** "Keep the sourcing requirement, but mark it as high-value v1 candidate." Joey Yap's
*Hack Your Destiny With BaZi* does NOT state it (Cowork fetched 2026-09-07: absent). Two sources
still owed; NOT in this prompt.

**THE PRODUCT PRINCIPLE, Reyner 2026-09-07:** "Don't build Katon like a cautious astrology
calculator. Build it like a personality product with a rigorous calculation engine underneath. The
engine's job is to prevent bullshit. The presentation's job is to give the user something clear
enough to believe, remember, and talk about."

## Commit 0 — this file, alone
`docs/prompts/X-compat-2a.md`. Nothing else staged.

## Commit 1 — rulings and the principle land
- `docs/product/compat-p4-p5-rules.md`: Cowork has written it into the working tree beside this
  prompt. Commit it verbatim. It is the source the engine reads its rule from (commits 2-3 cite it).
- `docs/PROGRESS.md`: `## RULED 2026-09-07 (evening) — P4 badge layer, P5 accepted, product
  principle`, the four quoted blocks above verbatim. Deferred register: spouse star row, "high-value
  v1 candidate, two sources owed, Joey Yap HYDB checked and absent 2026-09-07".
- `CLAUDE.md` PRODUCT section: append ONE line, in Reyner's words, under the existing bullets:
  "**Principle (ruled 2026-09-07):** a personality product with a rigorous calculation engine
  underneath. The engine's job is to prevent bullshit; the presentation's job is to give the user
  something clear enough to believe, remember, and talk about." This is Reyner's ruling, not
  Cowork's paraphrase; it is the only CLAUDE.md edit and it needs no further word from him.
- `docs/NEXT.md`: CURRENT WORK = this prompt; owed list carries the seven unruled strings.

## Commit 2 — P4 temperament facts
`lib/compat/temperament.js`, pure function over two charts. Inputs: each chart's `main_profile`
(the hanzi `lib/bazi/mainProfile.js` returns; read-only, rule 7). Emits:
```
{ kind: 'compat_temperament',
  a: { god: '正印', element_relation: 'resource' },
  b: { god: '偏印', element_relation: 'resource' },
  relation: 'same_god' | 'same_group' | 'different_group',
  pattern: 'matching' | 'related' | 'contrasting' }   // Katon framework; label is content's
```
**Do NOT add a family table.** A Ten God is the element relation to the Day Master plus polarity,
so `same_group` is "same element relation, polarity ignored". Derive the relation from what
`lib/bazi/tenGods.js` already exposes — grep for how it names the five relations (companion /
output / wealth / influence / resource or their equivalents) and reuse that; quote the export in the
commit message. If `tenGods.js` exposes only the god, derive the relation from the god's element
versus the Day Master's element using the SAME cycle function commit 4 of prompt W named, and
assert in the test that the ten gods map 2:1 onto five relations. No glossary edit.
Tests red first: one pair per `relation` value from fixture charts, plus the 2:1 assertion.

## Commit 3 — P5 pull / fit facts
`lib/compat/pullFit.js`, pure function over the outputs of tranche 1's three modules. Implements
`docs/product/compat-p4-p5-rules.md` section P5 EXACTLY — the doc is the rule, the code cites its
section numbers in comments, and the test quotes each clause it asserts. Emits:
```
{ kind: 'compat_pull_fit',
  pull: 'high' | 'low', pull_reasons: [...fact ids that fired],
  fit:  'high' | 'low', fit_reasons:  [...clauses that held or failed],
  quadrant: 'q1' | 'q2' | 'q3' | 'q4' }
```
`pull_reasons` / `fit_reasons` are so the renderer (and Reyner) can see WHY, not a score.
Tests red first. Try to reach all four quadrants from fixture pairs; record any unreachable
quadrant as a fixture gap in `NEXT.md` rather than inventing a chart.

## Not to do
No UI, no route, no pricing change, no `STAGE6_VERSION` bump, no Indonesian strings, no glossary
edit, no spouse-star code. `lib/compat/` still contains no interpretation prose.
At the end: suite green, PR opened, `NEXT.md` owed list: seven unruled strings (Reyner), spouse-star
sources (Cowork), prompt X-b (Cowork to write: second-person input, P0 comparison card, email-only
checkout + `/privasi` wording, relational renderer prompt + Stage 6 gate, content in Reyner's
register).
