# Suara ke Kursi — Product Requirements

**Working name:** Suara ke Kursi
**English descriptor:** How Indonesian votes become parliamentary seats
**Type:** Static single-page application. No backend, no API, no database.
**Deploy target:** GitHub Pages.

> Naming note. "Suara ke Kursi" names the transformation the app performs and needs no
> explanation to an Indonesian reader. If an English-first name is preferred later,
> "Seat Allocation" is the fallback. Do not rename to an evocative single word.

---

## 1. The question

Indonesia elects 580 members of the DPR across 84 electoral districts (*daerah
pemilihan*, dapil). Votes become seats through two rules that almost nobody can
actually perform:

1. **A national threshold.** UU 7/2017 Pasal 414 ayat (1) requires a party to reach 4%
   of the national valid vote before any of its votes convert to seats — anywhere,
   including in dapil where it came first.
2. **Sainte-Laguë divisors.** UU 7/2017 Pasal 415 ayat (2) allocates each dapil's seats
   by repeatedly dividing each qualifying party's dapil vote by 1, 3, 5, 7, … and taking
   the highest quotients.

In 2024, 18 parties contested, 8 cleared the threshold, and roughly 17.3 million valid
votes converted to nothing (Perludem's count: 17,304,303, from a national valid total of
151,796,631).

This app does one thing: **it reproduces the official 2024 allocation exactly, then lets
you change the rules and watch the parliament recompose.**

## 2. Why this is worth building now

Mahkamah Konstitusi Putusan 116/PUU-XXI/2023 (29 February 2024) held the 4% threshold
constitutional *for the 2024 election only*, and conditionally constitutional thereafter:
the legislature must reformulate it before the 2029 electoral stages begin, and the Court
attached conditions — among them that any new figure be designed for continued use, that
it preserve the proportionality of a proportional system, and that it minimise votes that
cannot be converted into seats.

The RUU Pemilu is in active deliberation at Komisi II. Perludem appeared before it in an
RDPU in February 2026 arguing that a higher threshold buys party simplification at the
cost of disproportionality.

The Court has, in effect, ordered a calculation. This app performs that calculation on
real certified data, transparently, and lets anyone else perform it.

## 3. Scope

### In scope for v1

- 2024 rules and 2024 certified results only.
- Party-level seat allocation across all 84 dapil.
- Four rule knobs (§7) and five metrics (§8).
- Five visual instruments (§9), heavily animated — this is a visual-first app.
- Full citation of every rule to its pasal, and every number to its KPU source.

### Explicitly out of scope for v1

- **Candidate-level allocation.** Indonesia uses an open list; the seat goes to the
  highest-polling caleg within the party in that dapil. Correct, but it needs a caleg
  dataset an order of magnitude larger and adds nothing to an argument about rules.
- **2019 and 2014 rule packs.** Deferred. The data model must not make them hard to add
  (see §5.4), but do not extract that data now.
- **Malapportionment** (population per seat by dapil). Needs a dapil→BPS population join.
  Deferred to v2.
- **DPD, DPRD Provinsi, DPRD Kabupaten/Kota.** Different rules, different data. Not now.
- **Any forecast of a future election.** The app computes counterfactuals on fixed
  historical votes. It never predicts.

## 4. Who this is for

A literate non-specialist: a journalist, a student, a caleg's staffer, a civil servant
reading the RUU. Someone who knows the 4% threshold exists and has never seen what it
does. The app must be understandable with no political science background and must not
require reading anything before touching a control.

## 5. Data

### 5.1 Files

All data ships as static JSON under `public/data/`. Nothing is fetched from a live API.

| File | Contents |
|---|---|
| `parties-2024.json` | 18 parties: ballot number, short name, full name, colour, national valid vote |
| `dapil-2024.json` | 84 dapil: code, name, province, seat magnitude, and the 18 party vote counts |
| `official-2024.json` | Golden result: seats per party per dapil as certified by KPU |
| `rules-2024.json` | Rule citations: pasal text, source document, URL, date |

Target total size under 400 KB uncompressed. This is roughly 1,500 vote figures. It is a
small dataset; treat it as precious rather than large.

### 5.2 Sources, in order of authority

1. **Seat magnitudes and dapil composition** — PKPU 6/2023 on dapil and DPR seat
   allocation. Also published as XLSX on data.go.id ("Jumlah alokasi kursi daerah
   pemilihan Pemilu 2024", "Data Wilayah Penyusunan Daerah Pemilihan Pemilu 2024").
2. **Dapil × party votes** — the certified national recapitulation (Berita Acara and
   Sertifikat Rekapitulasi), published per dapil across the provincial KPU sites, and the
   KPU decision establishing the national result (20 March 2024).
3. **Official seat allocation** — Keputusan KPU RI Nomor 1206 Tahun 2024 on the
   determination of elected DPR members (25 August 2024), which yields 580 seats across 8
   parties.

**Do not use Sirekap scrapes.** Community GitHub mirrors of the Sirekap API exist and are
tempting, but they mirror the live count at TPS level, not the certified recapitulation.
Wrong source, wrong granularity, and they will not reproduce the official allocation.

### 5.3 Extraction

The vote table comes out of PDFs. Expect one to two days. Extract, then verify against
three independent checks:

1. Each party's dapil votes must sum to its published national total.
2. All parties' national totals must sum to 151,796,631 valid votes.
3. The engine, run on the extracted table under the 2024 rules, must reproduce
   `official-2024.json` exactly — 580 of 580 seats, in every one of the 84 dapil.

If check 3 fails, the data is wrong, not the engine. Do not "fix" the engine to match.

### 5.4 Schema forward-compatibility

Every data file carries an `election: "2024"` key and every rule value lives in
`rules-2024.json` rather than in code. Adding 2019 later must mean adding files, never
editing the engine.

### 5.5 Anchors for verification

These figures are recorded here so the build can be checked against something. **Verify
each against the KPU source before shipping; do not treat this table as authoritative.**

National valid votes: 151,796,631.

| Party | National votes | Expected seats |
|---|---|---|
| PDI-P | 25,387,279 | 110 |
| Golkar | 23,208,654 | 102 |
| Gerindra | 20,071,708 | 86 |
| PKB | 16,115,655 | 68 |
| NasDem | ~14.66 million | 69 |
| PKS | — | 53 |
| PAN | — | 48 |
| Demokrat | — | 44 |
| PPP | 5,878,777 (3.87%) | 0 |

The seat column must sum to 580. The remaining nine parties took zero seats.

PPP is the load-bearing case in this app: an incumbent parliamentary party, 5.88 million
votes, eliminated by a margin of about 0.13 percentage points. Every view should make it
easy to find PPP.

## 6. The engine

Pure TypeScript, zero dependencies, no DOM, no React. Lives in `src/engine/`. It must be
possible to import the engine into a Node script and get identical results.

### 6.1 Pipeline

```
votes (84 dapil × 18 parties)
  → apply threshold rule            → qualifying party set
  → for each dapil, apply divisor rule with that dapil's magnitude
  → seats (84 dapil × qualifying parties)
  → metrics
```

### 6.2 Threshold

```
qualifies(party) = party.nationalVotes / totalNationalValidVotes >= threshold
```

A party that fails is removed from **every** dapil before allocation. Its votes remain in
the denominator for the threshold calculation but are excluded from the divisor step.
This is the whole mechanism, and it is the thing people get wrong: failing nationally
kills a party in dapil where it placed first.

### 6.3 Divisor allocation

Generic highest-averages loop, parameterised by a divisor sequence:

```
for seat in 1..magnitude:
    for each qualifying party p:
        quotient[p] = p.dapilVotes / divisor(seatsWon[p])
    winner = argmax(quotient)
    seatsWon[winner] += 1
```

Divisor sequences, indexed by seats already won (n = 0, 1, 2, …):

| Rule | Divisor at n | Sequence |
|---|---|---|
| Sainte-Laguë (2024 statutory) | 2n + 1 | 1, 3, 5, 7, … |
| D'Hondt | n + 1 | 1, 2, 3, 4, … |
| Modified Sainte-Laguë | 1.4 if n = 0, else 2n + 1 | 1.4, 3, 5, 7, … |

Hare quota with largest remainder is implemented separately (quota = dapil valid votes
of qualifying parties ÷ magnitude; allocate floor of each party's quota, then remaining
seats to largest remainders).

The loop must record every step. Each seat award produces a trace record: seat ordinal,
the full quotient table at that moment, the winner, and the winning quotient. The
step-by-step view (§9.2) renders this trace; it is not recomputed for display.

### 6.4 Ties

Exact quotient ties are effectively impossible at these vote magnitudes but must be
handled deterministically. Resolve by higher raw dapil vote, then by lower ballot number.
Any tie encountered must be surfaced in the UI, not silently resolved.

### 6.5 Performance

A full 84-dapil recomputation must complete in under 16 ms so a slider drag can
recompute on every frame. This is achievable: it is roughly 580 iterations over at most
18 parties. Do not add a debounce or a web worker. If it is slow, the implementation is
wrong.

## 7. Controls

Four knobs, and no more. Each has a default that reproduces 2024.

1. **Threshold** — continuous slider, 0.0% to 10.0%, step 0.1%. Default 4.0%.
   Snap points marked at 2.5% (2009), 3.5% (2014), 4.0% (2019 and 2024), and at the
   ~1% effective threshold implied by the Laakso–Taagepera formula for Indonesia's
   average district magnitude.
2. **Threshold scope** — national (statutory) / per-dapil / none. Per-dapil is included
   because tiered and district-level thresholds are live proposals in the RUU debate.
3. **Divisor rule** — Sainte-Laguë / D'Hondt / Modified Sainte-Laguë / Hare quota.
   Default Sainte-Laguë.
4. **District geography** — "84 dapil as drawn" (default) or "single national district".
   The second is a benchmark, not a proposal: allocating all 580 seats from national
   totals in one pool isolates how much disproportionality comes from district magnitude
   rather than from the threshold. Label it as a benchmark in the interface.

**Deliberately excluded:** a district magnitude slider. Changing magnitudes without
redrawing dapil boundaries is not a coherent counterfactual, and it would produce numbers
that look authoritative and are not. The national-pool benchmark answers the same
question honestly.

A prominent **Reset to 2024 rules** control returns every knob to statutory values.

## 8. Metrics

Computed live, displayed as a persistent strip. Every metric shows its current value and
its value under the 2024 statutory rules, so the delta is always visible.

1. **Seats per party** — the primary output.
2. **Unconverted votes** — total valid votes cast for parties that won zero seats, in
   absolute terms and as a share. Under the 2024 defaults this must read 17,304,303
   (verify against the extracted data; if it differs, report the computed figure and note
   the discrepancy rather than hardcoding Perludem's).
3. **Gallagher index** — least-squares disproportionality:
   `sqrt(0.5 × Σ(voteShare_i − seatShare_i)²)`, over all 18 parties, percentage points.
4. **Loosemore–Hanby index** — `0.5 × Σ|voteShare_i − seatShare_i|`. Cheaper to explain
   than Gallagher; show both.
5. **Effective number of parties** (Laakso–Taagepera) — `1 / Σ(share²)`, computed twice:
   on vote shares and on seat shares. The gap between the two is the compression the
   electoral system performs, and it is the honest way to discuss "party simplification".

Each metric has a one-sentence plain-language definition available on demand. No metric
appears without one.

## 9. Views

This is a visual-first app. The rules are simple; the point is to make their consequences
legible at a glance. Five instruments, in this order down the page. Full visual and
motion specification is in DESIGN.md.

### 9.1 The chamber (hero)

580 seats drawn as a hemicycle, the standard parliamentary seating arc, coloured by
party. This is the first thing on the page and it is where the boldness is spent.

Dragging the threshold slider animates seats **migrating** between parties — each seat
that changes hands moves along a path from its old block to its new one. It must never
be a redraw or a crossfade. The user must be able to watch seats leave the large parties
and arrive at the small ones as the threshold falls.

At 4.0%, ten party blocks in the legend sit at zero. As the slider falls past 3.87%, PPP
enters. That single moment is the app's argument, and it should be impossible to miss.

### 9.2 The divisor cascade (per-dapil drill-down)

For one selected dapil: each qualifying party is a column of quotient cards — V/1, V/3,
V/5, V/7 — laid out at heights proportional to their values. Seats are claimed one at a
time in descending quotient order, each with an ordinal marker.

Playable, scrubbable, and steppable. The user should be able to step one seat at a time
and read the arithmetic. This is the "show your work" view; it is the same instinct as
the trace views in Rinci and the Myers Visualizer, and it is what makes the app credible
rather than merely persuasive.

Default dapil on open: one where the threshold visibly changed the outcome. Pick it from
the data at build time rather than hardcoding a guess.

### 9.3 The archipelago

84 small multiples, one per dapil, each a compact stacked bar of its seat composition,
arranged in a grid that roughly follows Indonesian geography west to east. When a rule
changes, all 84 recompose at once.

This is the wide shot: it shows that a national threshold has local consequences
everywhere, including in dapil where the eliminated party was strong. Dapil where the
composition changed from the 2024 baseline are marked; the count of changed dapil is
itself a headline number.

Clicking any dapil opens it in the cascade view (§9.2).

### 9.4 The vote bar

A single horizontal bar representing all 151,796,631 valid votes, partitioned into votes
that converted to seats and votes that did not. The unconverted segment grows and shrinks
with the threshold.

Annotated with the party boundaries inside the unconverted segment, so it is visible that
the segment is not one undifferentiated mass but ten specific parties, the largest of
which is PPP.

### 9.5 The disproportionality plot

Vote share against seat share, one point per party, with the 45° line of perfect
proportionality. Points above the line are over-represented, below are under-represented.
Gallagher is the aggregate of these distances; showing the scatter makes the index mean
something.

Points move as rules change. The 45° line makes the direction of movement instantly
readable without any label.

## 10. Non-negotiable commitments

These are product requirements, not documentation. They must be enforced in the interface
itself.

### 10.1 The counterfactual is mechanical, not predictive

Changing the threshold recomputes seats **on fixed 2024 votes**. It does not predict what
would have happened. Voters behave strategically: some people did not vote for a small
party precisely because they expected it to fail, and some parties would have campaigned
differently. A 0% run is arithmetic on a counterfactual rule, not a simulation of a
counterfactual election.

This must appear **in the interface, adjacent to the controls**, in plain language, at all
times when any knob is off its 2024 default. Not in a README, not in a modal the user
dismisses once, not in a footnote. If this is buried, the app becomes quotable as
propaganda and should not ship.

### 10.2 No editorial verdict

The app never says a result is unfair, never says a party was cheated, never recommends a
threshold. It reports what the arithmetic produces. Every number is sourced; every rule is
cited to its pasal; the user drives every counterfactual. Adjectives about outcomes are
prohibited in copy.

The Court's five conditions from Putusan 116/PUU-XXI/2023 may be quoted as context because
they are the legal standard the calculation serves. They are presented as what the Court
required, not as what the app endorses.

### 10.3 Reproduction before exploration

The app opens at the 2024 statutory rules and displays a persistent verification state:
the computed allocation matches the official allocation, 580 of 580 seats, 84 of 84 dapil.
If reproduction fails, the app says so prominently and does not hide the failure behind a
working-looking interface.

This is the app's licence to be believed about anything else.

### 10.4 Party colours are the data's, not the designer's

Parties have known colours and users read them faster than labels. The interface's own
chrome therefore carries no colour of its own. See DESIGN.md §2.

## 11. Acceptance criteria

The build is done when:

1. `npm run verify` runs the engine against the certified data and reports exact
   reproduction of all 580 seats across all 84 dapil. This runs in CI and blocks deploy.
2. Engine unit tests cover: all four allocation rules against hand-computed small
   examples; threshold elimination including the case where an eliminated party led a
   dapil; tie resolution; the trace record's completeness.
3. Dragging the threshold from 4.0% to 0% animates continuously at 60 fps on a mid-range
   laptop, with no recomputation stall.
4. Every displayed rule links to its pasal. Every displayed figure links to its KPU
   source.
5. The counterfactual statement (§10.1) is visible whenever any control is off default.
6. The app works with JavaScript's `prefers-reduced-motion` respected: all transitions
   become instant state changes, and the cascade view becomes steppable-only.
7. Keyboard operable throughout, including the cascade stepper and the dapil grid.
8. Total bundle plus data under 1 MB.
9. Lighthouse accessibility score at or above 95.
10. It works on a phone. The hemicycle is legible at 380 px.
