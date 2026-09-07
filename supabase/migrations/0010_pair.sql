-- Katon — 0010: the `pair` object, for the standalone paid Compatibility product.
-- Run in the Supabase SQL editor (or via the Supabase CLI) AFTER 0009.
--
-- ══ WHY PERSON B IS NOT A `reading` ROW ══════════════════
-- Ruled by Reyner 2026-09-07 (night), verbatim in docs/prompts/X-compat-2b1.md:
--
--   "Person B gets: no mirror, no individual reading, no link, no notification,
--    no account, no information sent to them. Her birth data is used only as the
--    second input to the compatibility calculation."
--
-- THAT IS A CONSTRAINT ON THIS TABLE, not a UI preference. A `reading` row IS a
-- reachable URL: its `id` is a CSPRNG bearer token and `GET /api/mirror/[token]`
-- serves the reading to anyone holding it. So creating a `reading` row for person
-- B would create an openable reading OF person B, whether or not any UI ever links
-- to it. The convenient implementation — two readings joined by a pair — is the one
-- thing the ruling forbids.
--
-- Hence: this table holds BOTH people's birth inputs itself, and both charts are
-- computed IN MEMORY at serve time from these columns. `tests/pair-route.spec.mjs`
-- asserts the `reading` row count is unchanged across a pair create, so the
-- shortcut cannot be reintroduced by a session that does not know why.
--
-- ══ WHY a_reading_id IS NULLABLE ═════════════════════════
-- Ruling 2 the same night: compat is a FIRST-CLASS ENTRY POINT, and "a user who
-- only wants Compatibility should not have to generate or pay for a Mirror reading
-- first". So A may arrive from her own mirror (the column is set) or straight off
-- the front door with no reading at all (null). A NOT NULL here would quietly
-- restore the funnel shape that ruling reversed.
--
-- ══ THE GENDER AND TERM_SIDE COLUMNS ARE COPIED, NOT INVENTED ══
-- Names and check constraints are taken from 0003_term_side.sql and
-- 0004_gender.sql so a pair's inputs validate identically to a reading's. Read
-- those two files for WHY each exists — term_side resolves the MONTH pillar on the
-- ~12 days a year a 節 falls inside the birth day, and gender affects only
-- luck-pillar direction, which nothing builds yet.
--
-- ══ paid ═════════════════════════════════════════════════
-- Same rule 18 shape as `reading.paid`: ONLY the verified Xendit webhook sets it
-- true. No client path, ever.

create table if not exists public.pair (
  id            text primary key,          -- CSPRNG bearer token (nanoid), same generator as reading.id

  -- Nullable BY DESIGN — see the header. Set only when A arrives from her mirror.
  a_reading_id  text references public.reading(id),

  -- Person A's birth input. SERVER-ONLY, like reading.birth_date/birth_time.
  a_birth_date  date not null,
  a_birth_time  time,
  a_gender      text,
  a_term_side   text,

  -- Person B's birth input. SERVER-ONLY AND STRICTER: no `b_*` value ever leaves
  -- the server except as a derived fact inside the paid reading. B has no row, no
  -- token and no URL anywhere in this system.
  b_birth_date  date not null,
  b_birth_time  time,
  b_gender      text,
  b_term_side   text,

  email         text,                      -- ruling C; null until checkout. No password, no session.
  sku           text not null default 'compat',
  paid          boolean not null default false,  -- ONLY the verified webhook sets true
  paid_at       timestamptz,
  invoice_id    text,
  invoice_url   text,
  cache_key     text,                      -- set by X-b2 when the pair's semantic JSON is built
  created_at    timestamptz not null default now()
);

create index if not exists pair_created_at_idx on public.pair (created_at);

-- Constraints copied from 0003_term_side.sql and 0004_gender.sql, one per person.
alter table public.pair drop constraint if exists pair_a_term_side_chk;
alter table public.pair add constraint pair_a_term_side_chk
  check (a_term_side is null or a_term_side in ('before', 'after'));

alter table public.pair drop constraint if exists pair_b_term_side_chk;
alter table public.pair add constraint pair_b_term_side_chk
  check (b_term_side is null or b_term_side in ('before', 'after'));

alter table public.pair drop constraint if exists pair_a_gender_chk;
alter table public.pair add constraint pair_a_gender_chk
  check (a_gender is null or a_gender in ('male', 'female'));

alter table public.pair drop constraint if exists pair_b_gender_chk;
alter table public.pair add constraint pair_b_gender_chk
  check (b_gender is null or b_gender in ('male', 'female'));

-- SECURITY: identical posture to `reading` (0001). All access is server-side via
-- the service role key, which bypasses RLS. RLS is enabled with NO policies so
-- anon/authenticated clients are fully locked out — there is no client-side table
-- access in this app, and a pair row contains two people's birth data.
alter table public.pair enable row level security;
