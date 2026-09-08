<!--
STATUS: RULED. Reyner, 2026-09-08. Cowork drafted (worksheet in the Claude project), Reyner rewrote all
24 cells, Cowork swept, four one-word amendments confirmed by Reyner (cenderung x3, "Kondisi ini" x1,
all on the blocklist's hedging / essay_connectives rules).
This file lands on main ALONE, before the PR that applies it (the #28 ruling).

APPLIES TO: `glossary.json#kompatibilitas`, the 24 keys X-b2 commit 1 adds as PENDING() placeholders.
  node scripts/apply-rulings.mjs docs/content/compat-glossary-rulings.md --expect 46
46 = 19 cells x (name_id + label_meaning) + 3 x name_en + 5 text-only cells as label_meaning.
Apply AFTER X-b2 commit 1 has created the keys; the script refuses an unknown block.

VERBATIM MEANS VERBATIM. Reyner is the sole authority on register. Do not adjust punctuation,
capitalisation or spacing to match a neighbouring string.

RULINGS THAT TRAVEL WITH THE STRINGS:
- Form of address: "kamu" = the buyer (A), "dia" = the other person (B), "kalian" = both.
- P4 badge names and P5 quadrant labels are the seven strings owed since 2026-09-07; they close here.
- `p2_reframe` is required whenever p2_clash / p2_harm / p2_punishment fires (safety_flags.p2_reframe_required).
- `p2_palace_frame` is a frame; the renderer names the pillar and reuses p2_* names for the relation.
- `p3_supplies` and `p1_produces` / `p1_controls` are direction-neutral; the renderer names who.

SWEEP (Cowork, 2026-09-08, `Claude outputs/sweep-drafts.mjs` on these 24 strings, compiled as
lib/validate/style.js:63 compiles it): PATTERNS 65, falsifiers 5/5 fired, DRAFT HITS 0, OVERLAPS 0.
-->

# glossary.json#kompatibilitas - 24 cells, RULED


## kompatibilitas.p1_same

- name_id: "Inti Sejenis"
- label_meaning: "Inti diri kalian dibangun dari unsur yang sama. Sangat mudah saling paham, tapi juga rawan berbenturan di titik yang persis sama."

## kompatibilitas.p1_produces

- name_id: "Inti Menghidupi"
- label_meaning: "Unsur salah satu dari kalian memberi energi ke yang lain. Ada dinamika pengayom dan yang diayomi dengan alur yang konsisten."

## kompatibilitas.p1_controls

- name_id: "Inti Menekan"
- label_meaning: "Salah satu elemen membatasi atau mengarahkan yang lain. Bisa menghadirkan struktur, tapi juga tekanan, tergantung dinamika kendali di antara kalian."

## kompatibilitas.p1_combination

- name_id: "Pasangan Inti"
- label_meaning: "Inti diri kalian membentuk pasangan klasik dalam BaZi. Hubungan terasa alami sejak awal tanpa hambatan komunikasi yang berarti."

## kompatibilitas.p2_harmony

- name_id: "Kursi Terikat"
- label_meaning: "Kursi pasangan kalian saling mengunci. Tercipta daya tarik alami sejak awal yang bekerja secara spontan."

## kompatibilitas.p2_clash

- name_id: "Kursi Berbenturan"
- label_meaning: "Kursi pasangan kalian saling bertolak belakang. Dinamika berjalan intens, di mana gesekan kecil bisa terasa jauh lebih tajam."

## kompatibilitas.p2_harm

- name_id: "Kursi Bergesekan"
- label_meaning: "Terjadi gesekan halus antar kursi pasangan. Gesekan ini bekerja perlahan lewat detail kecil yang menumpuk, bukan lewat konflik besar."

## kompatibilitas.p2_punishment

- name_id: "Kursi Bersimpul"
- label_meaning: "Kursi pasangan kalian terikat pada pola masa lalu. Pola lama ini berulang di tahap berbeda jika tidak disadari bersama."

## kompatibilitas.p2_reframe

- label_meaning: "Ini bukan penentu kegagalan. Gesekan pada kursi pasangan menandakan hubungan yang membutuhkan perhatian ekstra dan kesadaran penuh."

## kompatibilitas.p2_none

- name_id: "Kursi Independen"
- label_meaning: "Kursi pasangan kalian berjalan terpisah tanpa tarik-menarik khusus. Dinamika utama kalian berasal dari aspek bagan lainnya."

## kompatibilitas.p2_palace_frame

- label_meaning: "Salah satu pilar di bagan dia terhubung langsung dengan kursi pasanganmu. Elemen hidupnya memengaruhi ranah terdekatmu."

## kompatibilitas.p3_supplies

- name_id: "Penyeimbang Unsur"
- label_meaning: "Dia membawa elemen yang tidak dominan di baganmu. Kehadirannya secara alami memberi keseimbangan yang kamu butuhkan."

## kompatibilitas.p3_same_imbalance

- name_id: "Tantangan Serupa"
- label_meaning: "Bagan kalian sama-sama minim elemen tertentu. Karena tidak ada penyeimbang otomatis di area ini, dukungan perlu dicari dari luar."

## kompatibilitas.p3_no_supply

- name_id: "Mandiri Elementar"
- label_meaning: "Tidak ada aliran elemen khusus yang saling mengisi. Hubungan berjalan mandiri tanpa rasa saling tergantung secara energi."

## kompatibilitas.p4_matching

- name_id: "Pola Cermin"
- name_en: "Matching Pattern"
- label_meaning: "Aspek dominan di bagan kalian identik. Saling memahami terjadi cepat, namun hal yang memicu kekesalan biasanya adalah refleksi diri sendiri."

## kompatibilitas.p4_related

- name_id: "Pola Serumpun"
- name_en: "Related Pattern"
- label_meaning: "Karakter dominan kalian berakar dari rumpun yang sama dengan pendekatan berbeda. Tujuan akhir serupa, meski dieksekusi lewat cara berbeda."

## kompatibilitas.p4_contrasting

- name_id: "Pola Kontras"
- name_en: "Contrasting Pattern"
- label_meaning: "Karakter dominan kalian berasal dari kelompok berbeda. Cara pandang yang berbeda bisa memperluas perspektif jika dikomunikasikan terbuka."

## kompatibilitas.p5_q1

- name_id: "Tarikan Kuat, Ritme Seirama"
- label_meaning: "Chemistry terasa kuat dan rutinitas harian saling menopang. Kuncinya adalah menjaga keterbukaan agar kenyamanan tidak dianggap biasa."

## kompatibilitas.p5_q2

- name_id: "Tarikan Kuat, Ritme Bergesek"
- label_meaning: "Magnet hubungan sangat kuat, namun pola keseharian sering bersimpangan. Dinamika terasa pekat dan menuntut kompromi jelas dalam rutinitas."

## kompatibilitas.p5_q3

- name_id: "Tarikan Tenang, Ritme Seirama"
- label_meaning: "Rutinitas harian mengalir stabil meski tarikan emosional tumbuh bertahap. Hubungan berjalan tenang tanpa banyak gejolak luar."

## kompatibilitas.p5_q4

- name_id: "Tarikan Tenang, Ritme Bergesek"
- label_meaning: "Tarikan alami minim dan ritme harian membutuhkan penyesuaian. Kelangsungan hubungan murni digerakkan oleh komitmen dan keputusan sadar."

## kompatibilitas.p7_strengths_lead

- label_meaning: "Poin yang saling menguatkan"

## kompatibilitas.p7_frictions_lead

- label_meaning: "Area yang membutuhkan tenggang rasa"

## kompatibilitas.p7_asks_lead

- label_meaning: "Komitmen yang dituntut dari masing-masing pihak"
