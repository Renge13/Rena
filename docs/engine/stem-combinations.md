<!--
STATUS: LIVE. Written 2026-09-07 as part a of prompt W's commit 4, under ruling B
(Reyner, 2026-09-07). This file is the SOURCE RECORD for 天干五合. The machine-readable
copy is `stem-combinations.json` beside it, and `lib/compat/stemRelation.js` reads that
JSON rather than carrying a table of its own, so there is one source of truth and this
prose is its provenance.

RULE 4 APPLIES AND IS THE REASON THIS FILE EXISTS. A table handed to a session inside a
prompt is INPUT, not a source. Prompt W carries a copy of the five pairs; that copy was
NOT implemented from. Both sources below were fetched in the session that wrote this
file, on 2026-09-07, and the fetch is recorded per source including the one that failed.
-->

# 天干五合 — the five Heavenly Stem combinations

**What this is:** the five canonical pairings of Heavenly Stems, and the element each
pairing is traditionally said to transform into.

**What it is NOT, and this is ruling B's constraint, not a hedge:** an instruction to
transform anything. Katon's engine detects the pair and records the traditional
transformation TARGET as metadata. It does not transform a Day Master, does not
recalculate any element, and does not decide whether 合 actually transforms in a given
chart. That question (合化 proper — whether the combination completes) is **outside this
MVP engine**.

> **B — YES, with one important constraint.** Implement the canonical 天干五合 pairs
> (甲己→土, 乙庚→金, 丙辛→水, 丁壬→木, 戊癸→火) but treat this as 五合 detection +
> traditional transformation-target metadata, not as an instruction to transform either
> Day Master or recalculate its element. Whether 合 actually transforms is outside this
> MVP engine. Source it properly before implementation: Joey Yap's material as one
> authority plus an independent source that explicitly gives both the five pairs and the
> five target elements. If authoritative sources conflict, stop P1 rather than inventing
> a resolution.
>
> — Reyner, 2026-09-07

## The table

| Stems | Pinyin | Transformation target |
|---|---|---|
| 甲 己 | Jia + Ji | 土 Earth |
| 乙 庚 | Yi + Geng | 金 Metal |
| 丙 辛 | Bing + Xin | 水 Water |
| 丁 壬 | Ding + Ren | 木 Wood |
| 戊 癸 | Wu + Gui | 火 Fire |

**THE TWO SOURCES AGREE, PAIR FOR PAIR AND TARGET FOR TARGET.** That agreement is what
ruling B required before implementation, and it is the whole reason the table above is
allowed to exist in this repo.

---

## Source 1 — Joey Yap, *Hack Your Destiny With BaZi*, p.11

- **URL:** https://www.joeyyap.com/notes/hydb/Hack_Your_Destiny_With_BaZi.pdf
- **Publisher:** Joey Yap Research International Sdn. Bhd., copyright 2016
- **Section:** "Heavenly Stems Combination and Transformation" — page 11, immediately
  above "Heavenly Stems Clashes/Controlling"
- **Fetched:** 2026-09-07, this session. 3,289,100 bytes, `%PDF-1.7`, 19 pages.
  Text extracted with `pdftotext -layout`; the section begins at line 487 of the
  extraction.

The page pairs each combination with its resulting element. Verbatim, the section
heading and the five rows as printed (stem names, their stem polarity glosses, and the
element after the `=`):

> Heavenly Stems Combination and Transformation
>
> Jia (Yang Wood) + Ji (Yin Earth) = Earth
> Yi (Yin Wood) + Geng (Yang Metal) = Metal
> Bing (Yang Fire) + Xin (Yin Metal) = Water
> Ding (Yin Fire) + Ren (Yang Water) = Wood
> Wu (Yang Earth) + Gui (Yin Water) = Fire

**ON THE FORM OF THAT QUOTE, because the difference matters for whether it is
evidence.** The page is a two-column graphic: stem pairs down the left, a glyph column,
then the result element. `pdftotext` interleaves the columns, so the lines above are the
factual content re-set in reading order — the pairing, the polarity gloss and the
target element are each verbatim, the LAYOUT is not reproduced. Joey Yap's page carries
an explicit notice that its charts, designs and layouts are protected literary
expression; the five pairings themselves are a classical table roughly two thousand
years old, as source 2 shows, and it is the pairings this file records. Nothing else
from the PDF is copied here.

The extraction is unambiguous about which target belongs to which pair — each pair label
appears on the same extracted line as its element (`Jia Ji ... Earth`), and the two
sequences run in the same order.

## Source 2 — 《黄帝内经·素问·五运行大论》 (Huangdi Neijing, Suwen, ch. 67)

The independent authority. It is not a BaZi text and does not derive from Joey Yap,
which is exactly what makes it independent: it states the same five stem-to-element
governances as classical medical cosmology, in the words of 鬼臾區.

> 鬼臾區曰：土主甲己，金主乙庚，水主丙辛，木主丁壬，火主戊癸。

Read as the table above: Earth governs 甲 and 己; Metal governs 乙 and 庚; Water governs
丙 and 辛; Wood governs 丁 and 壬; Fire governs 戊 and 癸.

**THE URL RULING B NAMED COULD NOT BE REACHED FROM THIS SESSION, AND THAT IS RECORDED
RATHER THAN GLOSSED.**

- `https://ctext.org/huangdi-neijing/wu-yun-xing-da-lun` — **FAILED, 2026-09-07.**
  It returned ctext.org's human-verification (CAPTCHA) interstitial, not the text.
  Completing a CAPTCHA is not something this session will do. Reyner read this URL
  himself on 2026-09-07 and an earlier Cowork session got a 403 from it, so the failure
  is the server's access control and not a claim about the text.
- The same chapter was therefore fetched from two other hosts, both 2026-09-07, and
  they agree with each other character for character on the passage:
  - https://www.donglishuzhai.net/chapter/5138.html — 《黃帝內經素問集註》, chapter
    titled 五運行大論篇第六十七. Returns the passage with its lead-in:
    「首甲定運。余因論之。鬼臾區曰。土主甲己。金主乙庚。水主丙辛。木主丁壬。火主戊癸。」
  - https://acupun.site/huangdineijing/suwen67.html — 黃帝內經•素問第六十七•五運行大論.
    Returns 「鬼臾區曰：土主甲己，金主乙庚，水主丙辛，木主丁壬，火主戊癸。」

**WHY SUBSTITUTING THE HOST IS NOT SUBSTITUTING THE SOURCE.** Ruling B asks for "an
independent source that explicitly gives both the five pairs and the five target
elements". The source is the Neijing passage; ctext.org is one host of it. Two further
hosts, one of them a printed commentary edition, return the identical sentence. What
would have justified stopping is the two AUTHORITIES disagreeing, or the passage not
containing both halves. Neither happened. Had only the prompt's own copy of the table
been available, commit 4 would have stopped, which is what prompt W instructs.

---

## What the engine does with this, precisely

`lib/compat/stemRelation.js` reads `stem-combinations.json` and, when two Day Master
stems form one of the five pairs, emits:

```js
combination: { pair: ['甲', '己'], transformTarget: 'Earth' }
```

and when they do not, **omits the field entirely** rather than setting it to null.
Absence means "not a pair". The module's docblock says so, and its spec asserts the
field is absent rather than null across all 90 non-pair orderings.

- `transformTarget` is METADATA. Nothing reads it to change an element. There is no
  合化 logic anywhere in `lib/compat/`.
- Elements are the engine's own English keys, not Indonesian. `elementId()`
  (`lib/semantic/glossary.js:35`) returns an Indonesian display name and prompt W bars
  Indonesian strings from `lib/compat/`; the mapping belongs to the semantic layer.
- **NO ORACLE VERIFIES A PAIR CLAIM.** Joey's plotter is single-chart (probed
  2026-08-12). What the spec asserts is that the module reads this file's table exactly,
  which is the only thing that can be asserted and is what ruling A scopes detection to.

## If this table is ever edited

Edit `stem-combinations.json` and this file together, and re-derive from the sources
above rather than from either copy. `tests/compat-stem-relation.spec.mjs` asserts the
JSON against an enumeration of all 100 ordered stem pairs, so a typo in one entry fails
on count as well as on content — but a WRONG TABLE that is internally consistent would
still pass, which is why the sources are recorded here and not just the result.
