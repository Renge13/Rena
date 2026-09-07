<!--
STATUS: RELEASED 2026-09-07 by Reyner (product model rulings, same day). Written by Cowork.
Cowork wrote this into the working tree; Claude Code commits it FIRST, alone, on `feat/compat-2b1`.
Supersedes the X-b architecture note of 2026-09-07 (Claude project) and the compat spec's P0 tease.
-->

# Prompt X-b1 — Compat tranche 2b1: the standalone paid product's spine (no UI, no LLM)

Branch `feat/compat-2b1`. Five ordered commits. Server-verifiable end to end with curl before any UI
exists. Prompts X-b2 (prose) and X-b3 (surface) follow; their outlines are at the end.

Read `CLAUDE.md`, `docs/NEXT.md`, `docs/prompts/W-compat-1.md`, `docs/prompts/X-compat-2a.md`,
`docs/product/compatibility-reading-spec.md`, `app/api/pay/[id]/route.js`,
`app/api/webhook/xendit/route.js`, `lib/deliver/handlers.js`, `supabase/migrations/0001_reading.sql`.

## THE PRODUCT MODEL, ruled by Reyner 2026-09-07 (verbatim where quoted)

1. **Person B gets nothing.** "Compatibility is a single product that Person A purchases using two
   people's birth data. The output is one Compatibility Reading about the relationship. Person B
   gets: no mirror, no individual reading, no link, no notification, no account, no information sent
   to them. Her birth data is used only as the second input to the compatibility calculation. Do not
   expose or create a user-facing B mirror flow."
   **Consequence for the data model:** a `reading` row IS a reachable `/r/<token>` URL, so person B
   must NEVER become a `reading` row. The pair stores both birth inputs itself.
2. **Compatibility is a first-class entry point.** "The Katon front door should have two clear product
   paths: Mirror — understand yourself. Compatibility — understand the dynamic between two people.
   A user who only wants Compatibility should not have to generate or pay for a Mirror reading first.
   The Compat pre-payment flow must not require an AI Mirror render. Give Compatibility its own
   route/entry point now. Do not create it as a secondary 'Upcoming' item under Mirror."
3. **No free Compat result.** "No free P0 reading, no named relation tease, and no Gemini render
   before payment. The pre-payment Compat flow should be deterministic/static and cheap. The AI
   compatibility report is generated only after successful payment. This supersedes the previous P0
   idea entirely."
   **The only pre-payment computation** is the solar-term boundary check (`/api/season-check`), run
   for BOTH people, because a boundary birth changes the chart and the buyer must answer it before
   paying for a reading of the wrong chart.
4. Ruling C (earlier today) stands: email-only identity at compat checkout; no passwords, no
   sessions. **Katon has no email sender.** v1 stores the email and shows the report link on screen
   after payment; email is the recovery record. Automated sending is X-b3's decision, Reyner's.

## Commit 0 — this file, alone
`docs/prompts/X-compat-2b1.md`. Nothing else staged.

## Commit 1 — the model lands in the docs, nothing else changes
- `docs/product/compatibility-reading-spec.md`: header note dated 2026-09-07 with the three rulings
  above verbatim. P0 marked **SUPERSEDED — no free tease, no comparison card pre-payment.** "Account +
  email" wording already changed by W. The P1–P5, P7 journey stands; P6 descoped; P8 later.
- `docs/PROGRESS.md`: `## RULED 2026-09-07 (night) — compat product model` with the three rulings
  verbatim. LIVE STATE's Compatibility row: unchanged wording (still "a name, a price and a tap"),
  plus one sentence: "the Upcoming tap is scheduled for deletion in X-b3 when the standalone entry
  point ships." Deferred register: P0 comparison card row struck with the ruling cited.
- `docs/NEXT.md`: CURRENT WORK = this prompt. Owed list carries: P5 V6 ruling (Reyner), seven
  labels (Reyner), email sender decision (Reyner), `/privasi` wording (Reyner), spouse-star sources
  (Cowork), X-b2 and X-b3 (Cowork to write).

## Commit 2 — the `pair` object
`supabase/migrations/0010_pair.sql` (Reyner applies it in the Supabase SQL editor BEFORE the code
deploys — say so in the PR description in bold):
```
create table if not exists public.pair (
  id            text primary key,           -- CSPRNG bearer token (nanoid), same generator as reading.id
  a_reading_id  text references public.reading(id),  -- nullable: set when A arrives from her mirror
  a_birth_date  date not null, a_birth_time time, a_gender text, a_term_side text,
  b_birth_date  date not null, b_birth_time time, b_gender text, b_term_side text,
  email         text,                        -- ruling C; null until checkout
  sku           text not null default 'compat',
  paid          boolean not null default false,  -- ONLY the verified webhook sets true
  paid_at       timestamptz,
  invoice_id    text, invoice_url text,
  cache_key     text,                        -- set by X-b2 when the pair's semantic JSON is built
  created_at    timestamptz not null default now()
);
alter table public.pair enable row level security;
```
Mirror `reading`'s columns for gender/term_side exactly (read `0003_term_side.sql`, `0004_gender.sql`
for names and check constraints; copy, do not invent). **No `b_*` field ever leaves the server
except inside the paid reading.**

`lib/pairStore.js`: `createPair`, `getPair`, `setPairInvoice`, `markPairPaid` — mirror the shape of
`lib/readingStore.js` (grep its exports and copy the signatures). `POST /api/pair`
(`app/api/pair/route.js`): body `{ a: {...birth}, b: {...birth}, a_reading_id? }`; validates both
births the way `POST /api/mirror` validates one (reuse its validator — grep for it, name it); runs the
season check for BOTH and returns `{ needs_term_side: ['a'|'b'...] }` with 409 when either is on a
boundary and unanswered, exactly as the mirror flow does for one; on success returns `{ id }` only.
Rate-limited through the same `consume()` dimensions as the mirror POST. **Computes NOTHING about the
relationship. Calls no renderer.** Tests red first: both-valid creates; B on a boundary → 409 naming
`b`; a `reading` row is NOT created for B (assert the reading table count is unchanged).

## Commit 3 — checkout and the paid flip
- `lib/pricing.js`: `SELLABLE_SKUS = ['artifact', 'compat']`. Update the docblock above it — it
  currently says compat is unsellable because nothing is delivered; after this prompt something is.
  `annual` stays unsellable. The existing test "PRICING A THING IS NOT SELLING IT" changes from
  asserting compat unsellable to asserting `annual` unsellable and `compat` sellable; show it red
  against the old list first.
- `POST /api/pay/[id]/route.js`: today it resolves `id` as a reading. It must resolve a pair when
  `sku === 'compat'` (look up `pair` first for that sku; a reading id with `sku=compat` is a 400).
  Requires `email` in the body for compat (400 `email_required` without; basic shape check only, no
  verification). Stores it via `setPairInvoice` alongside the invoice. Invoice description string for
  compat is USER-FACING (statement line, rule 20): ship it as `@@UNRULED: compat_invoice_desc@@`
  — it is Reyner's, and the prebuild check must see it, so put the string in `lib/site/copy.js`
  and import it, like the artifact description.
- `app/api/webhook/xendit/route.js`: one branch. When the invoice's external id resolves to a pair,
  `amountMatchesSku(settledAmount, 'compat')` then `markPairPaid`. **Same fail-closed shape as the
  reading path; do not restructure the existing branch.** Tests red first: compat checkout without
  email → 400; with email → invoice created with pair id; webhook with wrong amount → not paid;
  right amount → `pair.paid = true`; a compat invoice can never flip a `reading.paid`.

## Commit 4 — the gated facts endpoint (the seam X-b2 renders through)
`GET /api/pair/[id]` (`app/api/pair/[id]/route.js`):
- unpaid → `{ status: 'not_paid', sku, price }` and NOTHING about either chart (not even archetype
  names — ruling 3). Mirror `lib/deliver/handlers.js#NOT_PAID`'s shape.
- paid → both charts computed IN MEMORY from the pair's birth inputs via `calculateBaziChart`
  (never via a reading row), then the five `lib/compat/*` modules, returned as
  `{ status: 'paid', facts: { a: {archetype, main_profile}, b: {...}, branchRelations,
  complementarity, stemRelation, temperament, pullFit } }`. **No prose. This is the deterministic
  floor of the compat report and X-b2 will hang the renderer off it.**
- Never returns `b_*` birth data to the client; only derived facts.
Tests red first: unpaid returns no chart facts (assert the response has no `facts` key and no hanzi);
paid returns all five fact kinds; B's birth data absent from the paid body.
`npm run check:unruled-copy` on a production build must FAIL on `compat_invoice_desc` — run it and
paste the red, then confirm preview/local builds pass. That failure is the intended state until
Reyner rules the string.

## Not to do
No UI (no page, no Funnel change, no Home change). No renderer prompt, no Stage 6 change, no
`STAGE6_VERSION` bump. No P5 rule change here — that is its own PR after Reyner's V6 ruling. No
email sending. No `reading` row for B, ever. No Indonesian strings except as `@@UNRULED@@` slots.
At the end: suite green, PR open with the migration instruction in bold, `NEXT.md` owed list as in
commit 1 plus "X-b2 unblocked".

---

## OUTLINE — X-b2, prose (Cowork writes after b1 merges)
Relational semantic JSON builder (`lib/semantic/pair.js`) emitting the SAME contract shape
`renderReading` consumes (facts, hierarchy, required_points, safety_flags) so the mirror's pipeline
renders it unchanged; compat master prompt in `docs/content/` (P1, P2, P3, P4 badge, P5 quadrant, P7
map; no verdict, no score; P2 reframe mandatory); compat Stage 6 checks in an ISOLATED commit with a
`STAGE6_VERSION` bump; cache on the pair semantic hash (rule 16, floors never persisted); floor rate
at n=10 before merge; `GET /api/pair/[id]/reading` serving prose + facts when paid.

## OUTLINE — X-b3, surface (Cowork writes after b2 merges)
Home: two product paths (Mirror / Compatibility), copy Reyner's. `/pasangan` (route name is
Reyner's — placeholder) with the two-person form, the static product block (description, price
from `lib/pricing.js`, inclusions), dual season gate, checkout with email, the pending state, the
report page at `/pasangan/[id]`, link shown on screen post-payment. Upcoming block's compat tap
DELETED; annual stays. Seven labels + every string through `copy.js`. `/privasi`: email collected,
second person's birth data processed, Reyner's wording. Email sender: Reyner's decision.
