# Compat renders, n=10 — the first floor rate for the pair pipeline

**POOLED FLOOR RATE: 2/10 = 20%. The mirror's ruled bar is 10% pooled. This run is ABOVE it.**

No check was loosened to move that number, and none should be until the finding below is ruled on.
Prompt X-b2's commit 5 says so in its own words: *"If above, stop and report which check rejects
most - do not loosen a check to pass."*

## THE COMMAND

```
$ node --conditions=react-server <probe>   # .env.local read explicitly; plain node does not load it
```

Ten fixture pairs, one draw each, on `feat/compat-2b2` at the commit that added the pair Stage 6
checks. Engine and gate as shipped: `STAGE6_VERSION 1.18.0`, pair prompt `9109d65d14b74e46`, model
`gemini-3.1-flash-lite`.

**All four quadrants are covered and four pairs raise `p2_reframe_required`** — the prompt asked for
at least one.

## THE TABLE

```
pair      quadrant  reframe  served_from      attempts  ms     rejections
2 x 6     q1        true     gemini           2         6649   style.tension_collapse
1 x 2     q2        false    gemini           3         8951   style.hedge_construction, style.tension_collapse x2
13 x 11   q2        false    module_assembly  3         8635   style.tension_collapse x3, style.essay_connectives
12 x 6    q2        false    module_assembly  3         9152   style.tension_collapse x3
1 x 12    q2        true     gemini           2         5957   style.tension_collapse
3 x 7     q3        false    gemini           2         4625   style.tension_collapse
1 x 3     q4        false    gemini           3         8432   style.tension_collapse x2
2 x 8     q4        true     gemini           2         6886   style.tension_collapse
1 x 101   q4        false    gemini           2         5446   style.tension_collapse
9 x 11    q4        true     gemini           2         5768   style.tension_collapse

POOLED FLOOR RATE   2/10 = 20%
quadrants           q1, q2, q3, q4
reframe pairs       4
rejections          style.tension_collapse 16 · style.hedge_construction 1 · style.essay_connectives 1
```

**Every one of the ten needed at least one regeneration.** Not a single pair passed Stage 6 on the
first attempt.

## WHICH CHECK REJECTS MOST, AND WHY IT IS NOT A MODEL FAILURE

**`style.tension_collapse` is 16 of the 18 rejections — 89%.** It is not close. Removing it entirely
would leave two rejections across ten renders.

What it bans, from `blocklist.json`:

| pattern | its recorded reason |
|---|---|
| `\bselaras\b` | *"Harmony vocabulary applied to a tension is the tension deleted."* |
| `\bsaling melengkapi\b` | renderer-prompt HOLD THE TENSION |
| `\bmenyatu\b` | *"A tension resolved into a compliment"* |
| `\bberpadu\b\|\bperpaduan\b` | collapses tensions |

**Those bans are correct for the MIRROR and they collide with what a compat reading is about.** P3 is
literally *"what each person's chart holds that the other's needs"* — the ruled cell `p3_supplies`
describes complementarity as a fact of the pairing. A model asked to render that fact reaches for
`saling melengkapi` and `selaras` because they are the ordinary Indonesian for it, and the gate,
written to stop a MIRROR reading dissolving one person's internal tension into a compliment, rejects
it.

Observed verbatim in the rejections:

```
style.tension_collapse: /\bselaras\b/ at "eda namun selaras. Tarikan Kuat, Ritme Bergesek"
style.tension_collapse: /\bsaling melengkapi\b/ at "ian untuk saling melengkapi kebutuhan elemen yang"
```

The second is a sentence about two charts supplying each other's favourable elements. That is the
fact. There is no tension being collapsed.

**THIS IS A RULING, NOT A FIX.** The obvious move — scope `tension_collapse` off `kind === 'pair'`,
or off the `p3_supply` block — is exactly the loosening the prompt forbids, and it should not be made
on my judgement. It is also not obviously right: a pair reading absolutely can collapse a real
tension into harmony vocabulary, which is what the P2 reframe exists to prevent. The honest options,
for Reyner:

1. Narrow the patterns so they fire on a TENSION fact and not on a supply fact.
2. Rule replacement wording for P3 so the model has an approved way to say it.
3. Accept a higher floor rate for compat than for the mirror, and say so.

## WHAT THIS RUN DOES NOT ESTABLISH

**n=10 is ten DRAWS, and the mirror's 10% bar was measured over forty.** The 2026-08-22 run that set
it was pooled 4/40. A two-in-ten result has a binomial 95% interval of roughly 3% to 56%: it does
**not** establish that the compat pipeline is worse than the mirror, and it would be wrong to quote
20% as a settled rate. What it does establish is the direction and the cause, and the cause is
specific enough to act on.

A replicate at 40 draws is what would settle the number. It is not worth spending until the
`tension_collapse` question is ruled, because that ruling will move the rate more than sampling
noise will.

## THE PRECONDITION FOR X-b3

**NOT MET.** Prompt X-b2: *"Precondition for X-b3: pooled floor rate at or below the mirror's ruled
10%."* At 20% it is not, and nothing here was adjusted to make it look otherwise.

## ONE THING THAT WORKED

The two pair checks added at `1.18.0` — `both_named` and `reframe_present` — **rejected nothing
across all ten renders**, including the four with a difficult seat. The model names both people in
the opening and carries the reframe when asked to. Neither check contributed to the floor rate, and
each was shown red on a real render before it was trusted, so their silence here is evidence rather
than absence.
