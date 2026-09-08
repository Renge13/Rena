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

---

# THE RULING, AND WHAT MEASURING IT FOUND (2026-09-08, same day)

**Reyner took option 1** of the three above: narrow the patterns so they fire on a tension fact and
not on a supply fact. Implemented as a per-block SCOPE rather than as a change to the patterns
themselves, because the words are not the problem - where they sit is.

    banned in     p2_clash, p2_harm, p2_punishment, p3_same_imbalance, p1_controls, p5_q2, p5_q4
    permitted in  p3_supplies, p2_harmony, p1_combination, p5_q1, p5_q3
    mirror        untouched; `kind !== 'pair'` scans the whole reading as before

Ruled sets live in `lib/validate/blocklist.json#style._pair_scope`, not in code, and
`tests/pair-semantic.spec.mjs` asserts every key in them is a real `kompatibilitas` cell.

## THE RED RUN: FOUR REAL RENDERS, RE-GATED BYTE-FOR-BYTE

Four pairs, ONE Gemini attempt each, through the shipped functions in the shipped order
(`renderWithGemini` -> `parseRenderResponse` -> `validateRendering`, which is
`lib/render/index.js:406-436` with the retry loop removed so a REJECTED attempt's blocks survive -
`renderReading` discards them). The blocks were saved and re-gated after the change, so **the only
variable between the two runs is the gate.**

Every hit, attributed to the surface it sits on:

| pair | p3_supply block | tension block | penutup |
|---|---|---|---|
| 2 x 6 | `saling melengkapi` (heading) | `selaras` in p5_q2 | `saling melengkapi` |
| 13 x 11 | `saling melengkapi` (heading) | - | `saling melengkapi` |
| 12 x 6 | `saling melengkapi` (heading) | `selaras` in p5_q2 | `saling melengkapi` |
| 1 x 2 | `saling melengkapi` (heading) | - | `saling melengkapi` |

    permitted_block 4    scanned_block 2    penutup 4

**THE COLLISION IS IN THE HEADING, WHICH THE n=10 TABLE COULD NOT SHOW.** All four renders title
the P3 block "Saling Melengkapi ..." - the model is naming the section after the fact it states.
The scope covers headings for that reason.

**BEFORE:** 4 of 4 rejected. **AFTER:** the P3 exemption fires on 4 of 4, the two p5_q2 blocks still
reject, and the ruled scope is doing exactly what it was ruled to do.

## AND THE PART THAT IS NOT FIXED: THE PENUTUP

**ALL FOUR STILL REJECT.** Not because the scope failed - because the closing paragraph carries
`saling melengkapi` in 4 of 4, and **the penutup has no fact and therefore no variant, so it matches
neither list and is scanned.** That is the ruled default applied faithfully, and on this sample it
means the change moves the floor rate by ZERO.

    Hubungan ini adalah pertemuan antara dua sosok ... Kalian saling melengkapi melalui elemen ...

This is reported rather than fixed. Exempting the closing paragraph is a SECOND ruling and not
obviously the right one: the penutup is the last thing a reader sees and the place where harmony
vocabulary would read most like the overall verdict rule doc 2.4 forbids. Three ways it could go,
for Reyner:

1. **Exempt the penutup too.** Simplest, and it is where the phrase actually lives. Costs the one
   surface where a collapse would read as a verdict.
2. **Scope it by the reading's own quadrant** - permitted when the pair is q1/q3, scanned when q2/q4.
   Keeps the check where a tension exists to be collapsed.
3. **Leave it.** Then this scope buys nothing measurable and the 20% stands; the honest move would
   then be option 3 of the original three - accept a higher floor rate for compat and say so.

**Nothing was loosened to reach a nicer number, and no n=20 replicate should be paid for until this
is ruled** - it will move the rate more than sampling noise will, which is the same argument the
n=10 run made about the scope itself.
