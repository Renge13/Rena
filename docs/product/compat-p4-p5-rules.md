<!--
STATUS: RULED 2026-09-07 by Reyner. Written by Cowork from the worksheet of the same day
(Claude project: KATON-compat-p4-p5-worksheet-2026-09-07.md) and Reyner's revision of P4.
THIS FILE IS THE RULE. `lib/compat/temperament.js` and `lib/compat/pullFit.js` implement it and cite
its section numbers; a change here is a behaviour change and ships with a red test first.
Every input named exists on `main` at db9e74c or later: `lib/semantic/index.js:245-321` per chart,
`lib/compat/{branchRelations,complementarity,stemRelation}.js` cross-chart.
-->

# Compat P4 / P5 — the ruled rules

**Framing, ruled:** P4's three patterns and P5's 2x2 are **Katon's interpretive framework**. They are
deterministic and built only from classical facts the engine already computes, but they are NOT
claims that classical BaZi defines these categories. Content must never say they are.

## 1. P4 — temperament: Matching / Related / Contrasting

Inputs: each person's `main_profile` (dominant Aspek, one of ten).

| 1.1 relation | Definition | Pattern (Katon) | Label |
|---|---|---|---|
| `same_god` | both `main_profile` identical | **matching** | `@@UNRULED: p4_matching@@` |
| `same_group` | different god, same element relation to the Day Master (polarity differs): 比肩/劫財, 食神/傷官, 正財/偏財, 正官/七殺, 正印/偏印 | **related** | `@@UNRULED: p4_related@@` |
| `different_group` | different element relation | **contrasting** | `@@UNRULED: p4_contrasting@@` |

1.2 The reader gets BOTH: each person's Aspek named (glossary `name_id`, English pair once, rule
23) AND the pattern badge. The badge is not a fit verdict; "matching" is not "good" and
"contrasting" is not "bad" (rule 25).
1.3 The five groups are not a new table: a Ten God is element-relation x polarity, so `same_group`
is "same element relation, polarity ignored", derived from `lib/bazi/tenGods.js` (read-only).

## 2. P5 — pull / fit

### 2.1 PULL (is there a charge between the two charts?)
`pull = high` when ANY of:
- 2.1.a `dayBranchPair` contains harmony 六合
- 2.1.b `dayBranchPair` contains clash 冲 — **counted as pull on purpose**: the spec's P2 reframe
  calls a clashed seat "intensity and transformation"; intensity is attraction, not fit
- 2.1.c `combination` present (Day Masters are a 天干五合 pair)
- 2.1.d any entry of `bHitsASpousePalace` or `aHitsBSpousePalace` is harmony or clash
Otherwise `pull = low`.

### 2.2 FIT (do the energetics hold each other up day to day?)
`fit = high` when ALL of:
- 2.2.a `aSupplies` or `bSupplies` is non-null
- 2.2.b `sameImbalance` is false
- 2.2.c `dayBranchPair` contains neither harm 害 nor punishment 刑
Otherwise `fit = low`.

### 2.3 Quadrant
| pull | fit | id | Spec's description | Label |
|---|---|---|---|---|
| high | high | q1 | rare, easy | `@@UNRULED: p5_q1@@` |
| high | low | q2 | the addictive-hard one | `@@UNRULED: p5_q2@@` |
| low | high | q3 | slow-burn / steady | `@@UNRULED: p5_q3@@` |
| low | low | q4 | little there | `@@UNRULED: p5_q4@@` |

2.4 No overall score. If any number is ever shown it is labelled friction cost, per the spec's P7.
2.5 The engine emits `pull_reasons` and `fit_reasons` (which clauses fired) so the renderer explains
the quadrant from facts and never from its own inference (rule 14).

## 3. Flagged, not in v1 until sourced: the spouse star
Classically one person's Day Master being the other's spouse star (正官/七殺 for her, 正財/偏財 for
him) is a marriage-affinity signal; it would add a clause 2.1.e to PULL. **Ruled high-value v1
candidate, sourcing required** (two authorities, same bar as 天干五合). Joey Yap, *Hack Your
Destiny With BaZi*: checked 2026-09-07, does not state it. Not implemented.

## 4. Owed
Seven Indonesian strings (three P4 badges `p4_*`, four P5 labels `p5_*`) — Reyner. Spouse-star sources (Cowork). Unreachable quadrants from the
fixture, if any, recorded as fixture gaps.
