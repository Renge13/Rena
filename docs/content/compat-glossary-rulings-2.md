<!--
STATUS: RULED. Reyner, 2026-09-08 (evening). One cell. Lands on main ALONE per the #28 ruling, then
applied on the fix branch with:
  node scripts/apply-rulings.mjs docs/content/compat-glossary-rulings-2.md --expect 1
Closes the gap recorded in lib/validate/pair.js:57-77 (the floor names neither person). When applied,
the `both_named` floor exemption is REMOVED and tests/compat-stage6-pair.spec.mjs:85 inverts by design.

TEMPLATE NOTE (Cowork): `{A}` and `{B}` are substituted by the engine with the two archetype
`name_id` values at fact-build time. Braces trip `style.code_leak` in the glossary sweep; mark the cell
`template: true` (or equivalent) so the sweep and Stage 6 see the SUBSTITUTED text, never the template.
The template itself is never served.
-->

# glossary.json#kompatibilitas - p0_opening, RULED

## kompatibilitas.p0_opening

- label_meaning: "Bacaan ini tentang kamu, {A}, dan {B}."
