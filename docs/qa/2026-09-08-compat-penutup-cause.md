# The penutup, measured before and after — n=4, one attempt each

**The same four pairs, one Gemini attempt each, three times: baseline, after the gate scope,
after the prompt change. Stage 6 first-attempt passes went 0/4 to 3/4.**

This is not a floor rate. It is a four-draw cause check, run because the n=10 run's leading
rejection turned out to have its cause in the prompt rather than in the gate.

## THE COMMAND

```
$ node <probe> 2x6 13x11 12x6 1x2      # .env.local read explicitly
```

One attempt per pair through the shipped functions in the shipped order — `renderWithGemini` ->
`parseRenderResponse` -> `validateRendering`, which is `lib/render/index.js:406-436` with the retry
loop removed so a REJECTED attempt's blocks survive. `renderReading` discards them, which is why
the n=10 run could report a rate but not a cause.

Model `gemini-3.1-flash-lite`. Gate `1.21.0`. Pair prompt `9109d65d14b74e46` before,
`ceb898d80f52471c` after.

## THE THREE RUNS

| | baseline | + gate scope | + prompt change |
|---|---|---|---|
| **2 x 6** | reject (penutup) | reject (penutup) | **PASS** |
| **13 x 11** | reject (p5_q2 + penutup) | reject (p5_q2 + penutup) | **PASS** |
| **12 x 6** | reject (penutup) | reject (penutup) | reject (penutup, `tidak selaras`) |
| **1 x 2** | reject (penutup) | reject (penutup) | **PASS** |
| first-attempt passes | **0 / 4** | **0 / 4** | **3 / 4** |

Every hit, attributed to its surface:

```
BASELINE                          AFTER BOTH
  permitted_block  3                permitted_block  2
  scanned_block    1                scanned_block    0
  penutup          4                penutup          1
```

## THE GATE SCOPE ALONE CHANGED NOTHING, AND THAT WAS PREDICTED

All four pairs carry a tension fact — `p2_clash`, `p2_punishment`, `p2_harm`, `p5_q2`, `p5_q4` —
so under Reyner's ruling their closes stay SCANNED. The scope was still right to land: it is what
makes the close permitted for the 26 of 240 fixture pairs that carry no tension at all. It simply
was never going to move these four, and the commit said so before this run existed.

**The cause was upstream, in the prompt**, which is where Reyner ruled it belonged:

```
BEFORE  penutup closes with what this pairing IS, plainly, in two or three
        sentences. It describes the dynamic between them.

AFTER   penutup closes on WHAT THIS RELATIONSHIP ASKS OF EACH PERSON ... does
        NOT characterise the pairing as a whole ... restates nothing from P1 to P5.
```

The old instruction ASKED FOR the summarising sentence. Every baseline penutup begins
"Hubungan ini adalah pertemuan antara dua ..." — a characterisation of the pairing as a whole, which
is the sentence shape that reaches for `saling melengkapi`. Every new one begins
"Hubungan ini meminta kamu untuk ..." — an ask.

## THE ONE THAT STILL REJECTS, AND IT IS WORTH READING

```
12 x 6   style.tension_collapse   /\bselaras\b/ at "ian tidak selaras. Bagi dia, hubungan ini meminta"

  "Hubungan ini meminta kamu untuk melatih kesabaran saat ritme harian kalian
   TIDAK SELARAS. Bagi dia, hubungan ini meminta keterbukaan untuk menerima
   dorongan energi yang kamu berikan agar langkahnya lebih mantap."
```

**`tidak selaras` is "NOT in harmony".** The sentence names the friction and asks for patience with
it. It is the opposite of a tension collapse — it is the check's own purpose, stated — and the check
rejects it because `\bselaras\b` bans a TOKEN where the defect is a CONSTRUCTION.

This is a known shape in this repo, and its standing rule is that the presumption falls on the
check rather than on the words. **NOTHING WAS CHANGED HERE.** A negation carve-out is a change to
what Stage 6 accepts, which is Reyner's and needs its own isolated commit. The obvious form is the
one `hedge_construction` already uses for `bukan berarti`: a lookbehind that exempts `tidak `,
`belum ` and `kurang ` before the banned harmony word, on the same reasoning — negating a state is
not asserting it.

Left open deliberately. It is one draw of four and the carve-out would be a third gate change in
one day.

## WHAT THIS RUN DOES NOT ESTABLISH

**n=4 is four draws and this is a cause check, not a rate.** 3/4 first-attempt passes is not a 25%
floor rate: the floor rate counts readings that exhaust the regeneration budget, and none of these
four was given one. Two things it does establish, and both are what it was run for:

1. The penutup's summarising sentence was PRODUCED BY THE PROMPT, not by the model's taste. Change
   the instruction and every one of the four changes shape.
2. `style.tension_collapse` is no longer firing on the close in 3 of 4, where it fired in 4 of 4
   twice before.

**The n=20 replicate is not run.** Reyner decides it on these four.
