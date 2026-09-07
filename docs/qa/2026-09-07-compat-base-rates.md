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
