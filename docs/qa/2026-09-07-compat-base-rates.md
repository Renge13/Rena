# Compat base rates — how often each ruled clause actually fires

**Measurement only. NOTHING HERE CHANGES A RULE.** The rule is
`docs/product/compat-p4-p5-rules.md` and it moves only by a ruling from Reyner. This file records
what the shipped modules do at population scale, so the "is this verdict actually a verdict"
conversation can happen against numbers instead of against intuition. Four findings are flagged at
the bottom **as findings**, with what each would imply if ruled on. None was acted on.

Every clause in tranche 1 and 2a was tested on ONE hand-derived pair. That proves the clause is
implemented. It says nothing about whether a clause fires for 2% of pairs or 95% of them, and a
verdict that lands on nearly everybody is not a verdict.

---

## THE COMMAND AND THE SEED

```
$ node scripts/compat-base-rates.mjs --charts 2000 --pairs 5000
```

- **Seed: `20260907`** — the script's default, in `DEFAULTS` at the top of
  `scripts/compat-base-rates.mjs`. Pass `--seed S` to change it.
- 2000 random birth datetimes, **1960-01-01 to 2005-12-31, hour known** (hour and minute both
  random). 5000 random ORDERED pairs of two different charts.
- PRNG is mulberry32, seeded, no dependency. `Math.random` was not used: the same seed has to give
  the same charts on any machine and any Node version, which `Math.random` cannot promise.
- Dates are generated with UTC arithmetic so the produced STRING is machine-independent. Nothing
  converts a birth time — the engine takes the naive wall-clock string exactly as generated
  (CLAUDE.md rule 3).

**Reproducibility, checked rather than assumed:** two consecutive runs of the command above are
**byte-identical** (`diff` clean). A different seed moves the numbers (`--seed 1` gives q1 64.9%
against 66.3%), so the seed is load-bearing and is recorded here for that reason.

Run on `main` at `a25ccf5` (the tranche-2a merge), 2026-09-07.

---

## THE TABLE

```
charts=2000 pairs=5000 seed=20260907

P5 QUADRANT                       count      rate
  q1                                3315     66.3%
  q2                                 428      8.6%
  q3                                1088     21.8%
  q4                                 169      3.4%
  pull high                        3743     74.9%
  fit high                         4403     88.1%

PULL CLAUSE (fired)               count      rate
  2.1.a                              404      8.1%
  2.1.b                              436      8.7%
  2.1.c                              478      9.6%
  2.1.d                             3607     72.1%

FIT CLAUSE                         held      rate     failed      rate
  2.2.a                            5000    100.0%          0      0.0%
  2.2.b                            4960     99.2%         40      0.8%
  2.2.c                            4440     88.8%        560     11.2%

P4 PATTERN                        count      rate
  matching                           526     10.5%
  related                            445      8.9%
  contrasting                       4029     80.6%
```

Pull clause rates sum past the pull-high rate because pull is a **disjunction** and clauses
co-fire — 2.1.a/b/c almost always bring 2.1.d with them, since a day-branch relation also shows up
in the palace scans. Fit clause rates are reported as held AND failed because fit is a
**conjunction**: what makes a pair fit-low is the clause that failed.

---

## WHY THIS INSTRUMENT IS TRUSTED — IT WAS SHOWN FAILING TWICE, ON PURPOSE

This repo has been burned repeatedly by measurements that could not fail: a ban-list sweep that
compiled zero patterns and printed CLEAN on all five drafts, a card probe a blank PNG passed. **A
frequency table is exactly that shape** — every number it prints looks plausible, and nothing on
screen shows a miscount. So both of its guards were driven red before the numbers above were
believed.

**1. The known-answer selftest.** `--selftest` re-runs six fixture pairs whose quadrants the
committed specs assert by hand, so the script's wiring is checked against an outside answer rather
than only against its own arithmetic. Corrupting one expected value from `q3` to `q1`:

```
$ node scripts/compat-base-rates.mjs --selftest
  ok   1989-09-13 x 1990-03-04  expected q1, got q1
  ok   1990-03-04 x 1989-03-03  expected q1, got q1
  ok   1989-09-13 x 1990-06-07  expected q2, got q2
  FAIL 1989-09-13 x 1992-04-20  expected q1, got q3
  ok   1990-03-04 x 1992-01-05  expected q4, got q4
  ok   1990-06-07 x 1989-03-03  expected q1, got q1
selftest: 1 of 6 FAILED
exit=1
```

Restored: `selftest: 6/6 known quadrants reproduced`.

**2. The invariant check.** The script asserts the arithmetic that must hold if the tally is real
and throws rather than printing. Dropping roughly one in 97 quadrant increments:

```
$ node scripts/compat-base-rates.mjs --charts 200 --pairs 500
Error: INVARIANT BREACH: quadrants sum to 494, not 500
    at assertInvariants (scripts/compat-base-rates.mjs:160:39)
```

The invariants are: quadrant / pattern / relation counts each sum to M; `q1+q2` equals the
pull-high count and `q1+q3` the fit-high count; pull-high never exceeds total clause hits and is
never zero while a clause fired; fit-high never exceeds the least-often-held clause; and each
pattern count equals its relation count.

---

## FINDINGS — FLAGGED, NOT ACTED ON

Each of these is a product question for Reyner. **No rule was changed and no code was touched in
response to any of them.**

**1. `2.2.a` NEVER FAILS — 0 of 5000, and this is stronger than the known fixture gap.** Tranche 1
recorded that no fixture chart lacks enough elements for both suppliers to come back null, and
tranche 2a recorded the clause's failing branch as unreachable from the fixture. At 5000 random
pairs it still never fails. **So 2.2.a is inert in practice**: it is a conjunct of FIT that is
always true, and removing it would not change a single quadrant in this sample. That is a real
finding about the RULE, not about the fixture. What it would imply if ruled on: either drop 2.2.a,
or tighten it — "a supplier for the receiver's FIRST-choice favourable element" (rank 0) would fire
far less often and would mean something. **Not a defect. Do not remove it without a ruling.**

**2. Pull is high for 3 in 4 pairs, and 2.1.d supplies almost all of it.** 2.1.d fires on 72.1%
against 74.9% pull-high overall, so the other three clauses add about three points between them.
The cause is structural rather than a bug: 2.1.d scans EIGHT branch pairings (four of B's branches
against A's day branch, plus the mirror) and asks only for harmony or clash, so at roughly 2 of 12
branches relating to any given branch, a hit is close to certain. What it would imply: if "there is
a charge between you" is meant to discriminate, 2.1.d is the clause to narrow — a weight, or
restricting it to the day and month palaces.

**3. 88% of pairs land in q1 or q3, and q4 is 3.4%.** With pull high at 74.9% and fit high at
88.1%, q1 alone is two thirds of all pairs. q2 (the addictive-hard one, the most interesting
content) is 8.6% and q4 ("little there") is 3.4%. What it would imply: the four quadrants are ruled
and the content for them is unwritten, so this is the moment to know that **two of the four will be
seen by about one reader in eight**, before that content is authored.

**4. `contrasting` is 80.6% of P4, and that one is arithmetic, not a defect.** There are five Ten
God groups, so two independent profiles share a group about 1 in 5 of the time; matching (10.5%)
plus related (8.9%) comes to 19.4%, which is what a uniform-ish distribution over five groups
predicts. The badge is doing what it was defined to do. Worth knowing only because
"contrasting" will be the badge most readers get, so its wording carries more weight than the
other two — and it is one of the seven unruled Indonesian strings owed to Reyner.

---

## THE CAVEAT THAT APPLIES TO ALL FOUR

**These are rates over RANDOM PAIRS, not over couples.** Real users will submit themselves and
someone they already have a relationship with, and there is no reason to assume that population
matches a uniform draw over 45 years of birthdates. Nothing here measures Katon's actual traffic,
because Katon has none for compat yet. Treat these as the shape of the CLAUSE SPACE — which is what
they are good for, and it is enough to see that 2.2.a is inert and that q2 and q4 are thin.

Re-run the command at the top of this file after any change to
`docs/product/compat-p4-p5-rules.md` or to `lib/compat/`, and add the new table here rather than
overwriting this one.

---

# SECOND RUN, 2026-09-07 — six rule sets on the same seed and the same 5000 pairs

**STILL MEASUREMENT ONLY. NOTHING IN `lib/` CHANGED AND NO RULE MOVED.** V0 is computed by the
shipped `compatPullFit`; V1 to V5 are computed inside the script, locally, from the same three fact
objects. They are hypotheticals for Reyner to rule on or discard.

## THE COMMAND AND THE SEED

```
$ node scripts/compat-base-rates.mjs --charts 2000 --pairs 5000 --variants
```

**Seed `20260907`, the same default as the first run**, and the same 2000 charts and 5000 ordered
pairs. The RNG is untouched by the variant code — charts and pair indices are drawn in exactly the
same order either way — so the first run's table above still reproduces byte-identically from this
version of the script (`diff` clean). **The columns are therefore comparable pair for pair, not
across two draws.** The variant run is itself reproducible: two consecutive runs are byte-identical.

## THE RULE SETS

| | rule |
|---|---|
| **V0** | current rule |
| **V1** | drop 2.1.d entirely |
| **V2** | 2.1.d restricted to the other person's MONTH branch only (`from.position === 'month'`, either direction) |
| **V3** | V1 + 2.2.c extended so palace 害/刑 also lower fit |
| **V4** | V3 + 2.2.a replaced by "a supplier exists for the receiver's RANK-0 favourable element, in at least one direction" |
| **V5** | V3 + 2.2.a replaced by "supply in BOTH directions" |

## THE TABLE

```
charts=2000 pairs=5000 seed=20260907

        q1              q2              q3              q4          pull hi   fit hi   rule
  V0   3315  66.3%     428   8.6%    1088  21.8%     169   3.4%    74.9%    88.1%   current rule
  V1   1136  22.7%     101   2.0%    3267  65.3%     496   9.9%    24.7%    88.1%   drop 2.1.d
  V2   2117  42.3%     241   4.8%    2286  45.7%     356   7.1%    47.2%    88.1%   2.1.d = month branch only
  V3    555  11.1%     682  13.6%    1566  31.3%    2197  43.9%    24.7%    42.4%   V1 + palace harm/punishment lower fit
  V4    555  11.1%     682  13.6%    1565  31.3%    2198  44.0%    24.7%    42.4%   V3 + 2.2.a = rank-0 supplier, either direction
  V5    555  11.1%     682  13.6%    1562  31.2%    2201  44.0%    24.7%    42.3%   V3 + 2.2.a = supply in BOTH directions

STANDALONE FIRE RATES              count      rate
  palace 害/刑 present                 2863     57.3%
  2.2.a ruled (either direction)     5000    100.0%
  2.2.a rank-0 (either direction)    4976     99.5%
  2.2.a both directions              4993     99.9%
  2.1.a alone                           0      0.0%
  2.1.b alone                           0      0.0%
  2.1.c alone                         136      2.7%
  2.1.d alone                        2506     50.1%
```

## FINDINGS — FLAGGED, NOT ACTED ON

**1. TIGHTENING 2.2.a DOES NOT RESCUE IT. Both proposed replacements are also inert.** This is the
answer to the first run's finding 1, and it is not the answer that finding invited. The ruled form
holds on 100.0% of pairs; "rank-0 supplier, either direction" holds on **99.5%**; "supply in BOTH
directions" holds on **99.9%**. V3, V4 and V5 differ by at most 4 pairs in 5000 — q1 is 555 in all
three. So 2.2.a cannot be fixed by tightening it in either of the two ways proposed: **it is not
that the threshold is too loose, it is that element presence across two whole charts is almost never
absent.** If FIT is to depend on supply at all it needs a different quantity, not a stricter cut on
this one. Dropping the clause is the other honest option. Reyner's call.

**2. 2.1.a AND 2.1.b NEVER FIRE ALONE — 0 of 5000 each.** So under V0, deleting either changes no
verdict at all: a day-branch 六合 or 冲 always also shows up in the palace scans, because the day
branch is one of the eight pairings 2.1.d reads. **This was found by accident and then measured on
purpose, which is the part worth recording.** A deliberate corruption of the script's local V0 that
removed 2.1.b produced NO guard failure even at 5000 pairs, and the honest reading of a silent
guard is either "the guard is broken" or "the perturbation is invisible". It was the second, and the
sole-clause counts now in the table prove it rather than leaving it inferred. The arithmetic closes
exactly: 2.1.d fires 3607, 2.1.c-alone is 136, and 3607 + 136 = 3743 = every pull-high pair.

The consequence is NOT "delete them". Under V1 and V3, where 2.1.d is gone, 2.1.a and 2.1.b become
the clauses carrying pull. **They are redundant only in the presence of 2.1.d**, which is itself the
clause under question.

**3. 2.1.d is the whole of pull, quantified.** Dropping it (V1) takes pull-high from 74.9% to 24.7%
and moves q1 from 66.3% to 22.7%. Restricting it to the other person's month branch (V2) lands in
between: pull-high 47.2%, q1 42.3%. So V2 is a real dial rather than a rounding of V0 — if the goal
is "pull should discriminate", V2 keeps a palace signal while halving its reach.

**4. EXTENDING 2.2.c IS BY FAR THE BIGGEST SINGLE LEVER, and it may be too big.** Palace 害/刑 is
present on **57.3%** of pairs, so folding it into 2.2.c (V3) takes fit-high from 88.1% to 42.4%.
Combined with V1's pull that puts **43.9% of pairs in q4** — "little there" — and q1 at 11.1%. That
is the mirror image of V0's problem rather than a fix for it: V0 tells two thirds of readers q1, V3
tells nearly half q4. **The distribution nobody has ruled on is the one where all four quadrants
carry real weight**, and V3 combined with V2's narrowed 2.1.d rather than V1's deletion is the
combination NOT measured here. It was not measured because it was not asked for; adding it is a
one-line variant.

## THE GUARDS, AND ALL FOUR WERE DRIVEN RED ON PURPOSE

Two guards were added for the variants and both were shown failing before the table was believed.

**A. The local V0 must equal the shipped module, pair for pair.** Without this, V1 to V5 would be
deltas off a V0 that was never the real rule. Removing 2.1.d from the script's local V0:

```
Error: INVARIANT BREACH: local V0 disagrees with lib/compat/pullFit.js on pair 2
  (1966-01-31 09:11 x 1968-12-30 23:24): local low/high/q3 vs module high/high/q1
```

**Its sensitivity limit is recorded rather than hidden:** the same guard did NOT fire when 2.1.b was
removed from local V0, even at 5000 pairs. That is finding 2 — the perturbation is genuinely
invisible — but it means this guard catches a drift only when the drifted clause changes some
verdict. **It is not a proof that the local V0 is textually identical to the module.**

**B. Monotonicity, asserted per pair rather than in aggregate** (an aggregate check can be satisfied
by two errors cancelling). Dropping or narrowing a pull clause can only remove pull; extending 2.2.c
or tightening 2.2.a can only remove fit. So V1.pull implies V2.pull implies V0.pull; V1, V3, V4 and
V5 must share one pull verdict; V3.fit implies V0.fit; V4.fit and V5.fit each imply V3.fit. Wiring
V3 with 2.1.d still in its pull list:

```
Error: INVARIANT BREACH on pair 2: V3 pull high != V1 pull low
```

**C and D** are the first run's two guards, unchanged and still passing: the known-answer selftest
(`selftest: 6/6 known quadrants reproduced`) and the arithmetic check, which now also runs per
variant for all six rule sets — quadrants summing to M, `q1+q2` equalling pull-high, `q1+q3`
equalling fit-high.

## THE CAVEAT, UNCHANGED AND STILL LOAD-BEARING

**These are rates over RANDOM pairs, not couples.** Every number above describes the shape of the
clause space, not Katon's traffic, which does not exist for compat yet. A variant that looks
balanced here could still land badly on real submissions. What the table is good for is exactly what
it shows: which clauses are inert, which one carries all the weight, and how far each dial actually
moves the distribution.

---

# RUN 2b, 2026-09-08 — V6, the combination run 2 named and did not measure

**STILL MEASUREMENT ONLY. NOTHING IN `lib/` CHANGED AND NO RULE MOVED.** V6 is computed inside the
script from the same fact objects as the rest, on the same seed and the same 5000 pairs.

Run 2's finding 4 ended: *"The distribution nobody has ruled on is the one where all four quadrants
carry real weight, and V3 plus a narrowed 2.1.d (V2's dial rather than V1's deletion) is the
combination not measured here. It was not measured because it was not asked for, and adding it is a
one-line variant."* This is that variant, plus the other half of run 2's finding 1 — **2.2.a
deleted rather than tightened**, since both proposed tightenings measured as inert.

## THE COMMAND

```
$ node scripts/compat-base-rates.mjs --charts 2000 --pairs 5000 --variants
```

**Same seed `20260907`, same 2000 charts, same 5000 ordered pairs as runs 1 and 2.** The V6 code
consumes no randomness, so run 1's table still reproduces byte-identically from this version of the
script and run 2's V0-V5 rows are unchanged to the digit — checked with `diff`, both clean. The
variant run is itself reproducible.

**V6 = V2's pull + V3's fit, with 2.2.a deleted:**

| | |
|---|---|
| pull | 2.1.a, 2.1.b, 2.1.c, **2.1.d restricted to the other person's MONTH branch** |
| fit | **2.2.b** and **2.2.c extended to palace 害/刑** — and that is all: 2.2.a is gone, so fit is a conjunction of TWO clauses, not three |

## THE TABLE

```
charts=2000 pairs=5000 seed=20260907

7 RULE SETS, SAME SEED AND SAME 5000 PAIRS

        q1              q2              q3              q4          pull hi   fit hi   rule
  V0   3315  66.3%     428   8.6%    1088  21.8%     169   3.4%    74.9%    88.1%   current rule
  V1   1136  22.7%     101   2.0%    3267  65.3%     496   9.9%    24.7%    88.1%   drop 2.1.d
  V2   2117  42.3%     241   4.8%    2286  45.7%     356   7.1%    47.2%    88.1%   2.1.d = month branch only
  V3    555  11.1%     682  13.6%    1566  31.3%    2197  43.9%    24.7%    42.4%   V1 + palace harm/punishment lower fit
  V4    555  11.1%     682  13.6%    1565  31.3%    2198  44.0%    24.7%    42.4%   V3 + 2.2.a = rank-0 supplier, either direction
  V5    555  11.1%     682  13.6%    1562  31.2%    2201  44.0%    24.7%    42.3%   V3 + 2.2.a = supply in BOTH directions
  V6   1074  21.5%    1284  25.7%    1047  20.9%    1595  31.9%    47.2%    42.4%   V2's pull + V3's fit, 2.2.a deleted
```

**THE V6 ROW:**

| | q1 | q2 | q3 | q4 | pull high | fit high |
|---|---|---|---|---|---|---|
| **V6** | 1074 (**21.5%**) | 1284 (**25.7%**) | 1047 (**20.9%**) | 1595 (**31.9%**) | 47.2% | 42.4% |

## WHAT THE ROW SAYS

**1. It is the only rule set in which all four quadrants carry real weight.** The spread runs
20.9% to 31.9% — no quadrant under a fifth of pairs, none over a third. Every other row has at least
one quadrant that is either dominant or vestigial: V0 puts 66.3% in q1 and 3.4% in q4; V1 puts
65.3% in q3 and 2.0% in q2; V3 puts 43.9% in q4 and 11.1% in q1. **If the four quadrants are each
to get authored content that a real share of readers will see, V6 is the only measured shape where
that investment pays off evenly.**

**2. q2 stops being a rounding error.** The addictive-hard quadrant — the one run 1 flagged as
carrying the most interesting content and reaching 8.6% of pairs under the current rule — reaches
**25.7%** here, a threefold move. That is the single largest change in the row and it is the one
most likely to matter to what gets written.

**3. Deleting 2.2.a changed NOTHING, which is the confirmation run 2 predicted.** V6's fit-high is
**42.4%**, identical to V3's 42.4% — V3 keeps the ruled 2.2.a and V6 has none at all. Across 5000
pairs the clause's presence moves fit on **zero** of them at this resolution. Combined with run 2's
finding that both proposed tightenings also land at 99.5% and 99.9%, the clause is inert in every
form measured. **Deleting it is therefore free of consequence in this sample** — which is an
argument that it costs nothing, not an argument that it should go. That remains Reyner's ruling.

**4. V6's pull is V2's exactly, by construction and by measurement.** 47.2% in both rows, and the
script asserts per pair that the two verdicts are IDENTICAL rather than merely ordered — so a V6
that had quietly kept the unrestricted 2.1.d could not print this row.

**WHAT THIS ROW IS NOT.** It is not a recommendation and no rule moved. It is also not evidence that
V6 is *correct* — an even spread is a property of the distribution, not of the reading being true,
and there is still **no oracle for a pair claim**. A rule set could distribute beautifully and
describe nothing. What the row supports is narrower and worth stating plainly: of the seven measured
shapes, V6 is the one where authoring four quadrants' worth of content is not mostly wasted.

## THE GUARDS, AND BOTH NEW ONES WERE DRIVEN RED ON PURPOSE

V6 adds two relations to the per-pair monotonicity check, and neither was trusted before it was
shown failing:

**A. `V6.pull === V2.pull`, identical rather than ordered.** They share a pull clause list, so a
one-sided implication would let a V6 that kept the unrestricted 2.1.d slip through. Giving V6
`pull_d` instead of `pull_d_month`:

```
Error: INVARIANT BREACH on pair 2: V6 pull high != V2 pull low
```

**B. `V3.fit => V6.fit`, the opposite direction from V4 and V5.** V6 DROPS a conjunct, so its fit is
a SUPERSET of V3's — dropping a conjunct can only add fit, where tightening one can only remove it.
Getting that direction backwards is the easy mistake. Re-adding 2.2.a to V6:

```
Error: INVARIANT BREACH on pair 1208: V3 fit high but V6 fit low
```

**Note where that one fired.** Pair 1208, not pair 2 — because re-adding 2.2.a differs on only about
four pairs in 5000, so the guard had to run most of the sample before it found one. That is a useful
thing to know about this guard's sensitivity: it catches a difference of a handful of pairs, but only
because the sample is large. A 500-pair run would very likely have missed it.

The four earlier guards are unchanged and still pass: the known-answer selftest (6/6), the arithmetic
invariants (now per variant, across all seven), the local-V0-equals-the-shipped-module check, and
the earlier monotonicity relations. The table heading is now self-counting (`7 RULE SETS`) so adding
an eighth variant cannot leave it saying "six" — it said "SIX RULE SETS" as a literal until this run.

## THE CAVEAT, UNCHANGED

**These are rates over RANDOM pairs, not couples.** Real submissions are two people who already have
a relationship, and there is no reason to assume that population matches a uniform draw over 45 years
of birthdates. V6's even spread is a property of the clause space, not a prediction about Katon's
traffic — which does not exist for compat yet.
