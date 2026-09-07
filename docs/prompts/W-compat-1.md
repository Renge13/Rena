<!--
STATUS: RELEASED 2026-09-07 by Reyner. Written by Cowork, amended same day after Claude Code's
survey (刑 lives in stems.js, not relations.js; PR #91 is merged; NEXT.md pointer is stale).
Cowork wrote this file into the working tree; Claude Code commits it FIRST, alone, on `feat/compat-1`.
-->

# Prompt W — Compat tranche 1: rulings into the repo, engine facts, sourced 五合

Branch `feat/compat-1`. Five ordered commits, each measured on its own. Do not bundle or reorder.
Read `CLAUDE.md`, then `docs/NEXT.md`, then `docs/product/compatibility-reading-spec.md` P0-P7.

## What this prompt is and is not
Engine facts for the paid Compatibility reading, under three rulings Reyner made 2026-09-07 (below).
NOT in this prompt: second-person UI, P0 comparison card, paywall or checkout, email capture, the
relational renderer prompt, Stage 6 changes, any Indonesian copy, P4/P5 (their deterministic rules
are not yet written). Those are tranche 2 (prompt X).
Rule 4 applies to everything here. The only new BaZi table is 天干五合 in commit 4, and it lands
only with its two sources quoted verbatim.
There is no oracle for a pair claim (Joey's plotter is single-chart, probed 2026-08-12). Every test
here asserts internal consistency against the repo's locked tables, and says so in its header.

## THE THREE RULINGS, verbatim from Reyner, 2026-09-07

A — YES. Existing Earthly Branch relationship tables can be applied cross-chart. Using one branch
from Person A and one from Person B does not constitute a new BaZi rule; it is the same verified
六合 / 冲 / 害 / 刑 table with two-chart inputs. Boundary: the detection rule is approved, but the
relationship interpretation is not automatically inherited from the single-chart meaning. Cross-chart
meaning belongs in the content/interpretation layer and must not be improvised in the engine.
This unblocks P2, P3, P5, and P7.

B — YES, with one important constraint. Implement the canonical 天干五合 pairs (甲己→土, 乙庚→金,
丙辛→水, 丁壬→木, 戊癸→火) but treat this as 五合 detection + traditional transformation-target
metadata, not as an instruction to transform either Day Master or recalculate its element. Whether 合
actually transforms is outside this MVP engine. Source it properly before implementation: Joey Yap's
material as one authority plus an independent source that explicitly gives both the five pairs and
the five target elements. If authoritative sources conflict, stop P1 rather than inventing a resolution.
SOURCES FOUND BY REYNER 2026-09-07:
  1. Joey Yap, *Hack Your Destiny With BaZi*, Joey Yap Research International, p.11, "Heavenly Stems
     Combination and Transformation 天干合化" — https://www.joeyyap.com/notes/hydb/Hack_Your_Destiny_With_BaZi.pdf
     (Cowork fetched it 2026-09-07 and confirmed the five pairs and elements on p.11.)
  2. 《黄帝内经·素问·五运行大论》: 「土主甲己，金主乙庚，水主丙辛，木主丁壬，火主戊癸。」
     https://ctext.org/huangdi-neijing/wu-yun-xing-da-lun (Reyner read it; Cowork got a 403.)

C — YES. Email-only identity, not a conventional account. At first compatibility checkout: collect
email, associate the purchase/report with it, provide access through a secure link. No passwords,
login, reset-password or sessions. Spec wording changes from "account + email created at first compat
checkout" to "Email identity is created/associated at first compat checkout; no password-based
account is required."

LAUNCH SCOPE, Reyner 2026-09-07: promotion happens when the MVP is ready END TO END, compat included.
This SUPERSEDES the 2026-08-19 ruling in `docs/NEXT.md` LAUNCH SCOPE that compat does not gate launch.

## Commit 0 — this file, alone
`docs/prompts/W-compat-1.md`. Nothing else staged.

## Commit 1 — rulings land in the ledger, nothing else changes
- `docs/PROGRESS.md`: add `## RULED 2026-09-07 — compat rulings A/B/C and launch scope` carrying the
  three rulings verbatim and the supersession. Update THE DEFERRED REGISTER compat row: 天干五合 is
  SOURCED (two sources above) and lands in commit 4; the cross-chart oracle question is CLOSED by
  ruling A (detection reuses tested tables; interpretation is content). Email-capture row: answered
  for compat by ruling C; the Rp 19.000 checkout is Reyner's separate call, open.
- `docs/NEXT.md`: pointer moves off PR #91 (merged 2026-09-03; #92-94 also merged, `gh pr list` empty
  2026-09-07 — quote the command). CURRENT WORK = this prompt. LAUNCH SCOPE marked SUPERSEDED
  2026-09-07 with the new scope. Record this as the pointer's eighth staleness in its design-note
  history, in one sentence, no new rule.
- `docs/product/compatibility-reading-spec.md`: the C wording change; header note dated.
- `lib/site/copy.js:293` comment: append that ruling C makes this false the day email is captured, and
  `/privasi` changes in the tranche-2 PR that ships it, in Reyner's wording. Comment only.
Commit message names every file staged.

## Commit 2 — cross-chart branch relations (P2 facts)
New `lib/compat/branchRelations.js`, pure function over two chart objects. Reuse: 六合 / 冲 / 害 from
the tables `lib/bazi/relations.js` already exports or consumes (grep, quote the export names in the
commit message); 刑 from `lib/bazi/stems.js:105#branchPunishments(branches)` — relations.js's own
header says a second 刑 entry point would be a second source of truth, so do not add one. Emits FACTS
only, no prose, no score, no interpretation string:
  1. `dayBranchPair`: relation(s) between A.day.branch and B.day.branch, branches named.
  2. `bHitsASpousePalace`: every relation between each of B's four branches and A.day.branch, with
     the B pillar named.
  3. `aHitsBSpousePalace`: the mirror.
Shape follows the existing semantic-JSON fact objects so tranche 2 feeds it to the renderer unchanged.
Tests `tests/compat-branch-relations.spec.mjs`: pairs drawn from `tests/bazi-validation.fixture.js`
charts; expected relations derived by hand from the SAME tables, table row quoted in the test comment.
Shown failing first: run once with the function returning no relations, paste the red run in the
commit message, then implement. Include one pair with NO relation so the empty case is asserted too.

## Commit 3 — cross-chart element complementarity (P3 facts)
`lib/compat/complementarity.js`: for each direction, does the other chart carry presence in the
element this chart's favourable-element logic names? Reuse the existing favourable-element and
element-presence functions from `lib/bazi/strength.ts` / `lib/semantic/` — grep and name them. Do NOT
recompute strength, do NOT touch `tenGods.js` or `mainProfile.js` (rule 7), do NOT use
`buildElementBars` as a strength input (rule 9). Emits `aSupplies`, `bSupplies` (element or null with
presence evidence) and `sameImbalance` (both lack the same element). Tests as commit 2, red first.

## Commit 4 — Day Master pair relation, with sourced 五合 (P1 facts)
Part a, docs first: `docs/engine/stem-combinations.md` — the five pairs and target elements, each of
the two sources quoted VERBATIM with URL and page/section, fetched by you in this session. If either
source cannot be reached or does not say exactly what is quoted above, STOP this commit and report;
do not implement from the prompt's copy of the table (rule 4: a table handed to you in a prompt is
input, not a source).
Part b: `lib/compat/stemRelation.js`: relation between A's Day Master stem and B's:
  - `cycle`: same element / A produces B / B produces A / A controls B / B controls A, via the
    five-element cycle the engine already uses (grep `lib/bazi/elementCycle.js` and `strength.ts`;
    name the function; if no reusable function exists, cite the docs/ line that states the cycle and
    the existing implementation site — never write the cycle from memory).
  - `combination`: `{ pair, transformTarget }` when the two stems are a 五合 pair, else absent (not
    null — absence means "not a pair"; the field's docblock says so). Read the table from
    `docs/engine/stem-combinations.md`'s companion data, one source of truth. NO mutation of either
    Day Master, no 合化 logic, per ruling B.
Tests red first, including the 95 non-pair cases by exhaustive enumeration (10x10 minus 5 pairs
counted both orders) so a table typo cannot pass.

## Not to do
No UI, no route, no schema migration, no pricing change (`compat` stays absent from
`SELLABLE_SKUS`), no `STAGE6_VERSION` bump (nothing here reaches a reader), no Indonesian strings,
no interpretation strings of any kind in `lib/compat/`.
At the end: full suite green plus the new specs, PR opened, `docs/NEXT.md` lists what tranche 2 is
owed and by whom: P4/P5 deterministic rules (Cowork drafts, Reyner rules); `/privasi` wording and
Rp 19.000 email-field decision (Reyner); second-person input, P0 comparison card, email checkout,
relational renderer prompt + Stage 6 (Code, prompt X).
