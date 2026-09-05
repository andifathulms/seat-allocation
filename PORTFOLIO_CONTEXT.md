# Portfolio Context — Suara ke Kursi

Raw material for a client-facing case study. Factual, drawn from the repository as of
commit `3491ee5` (3 September 2026). Nothing here is aspirational: where a claim is
measured, the measurement is named; where the build falls short of its own spec, that is
recorded rather than smoothed over.

---

## 1. One-line summary

An interactive web app that shows how 151,8 million Indonesian votes turned into 580
parliamentary seats — and lets anyone change the election rules and watch the parliament
recompose in front of them.

---

## 2. The problem

Indonesia elects its national parliament (DPR) through two rules that almost nobody can
actually perform by hand:

- a **4% national threshold** — a party below it converts none of its votes to seats
  anywhere in the country, including in districts where it came first;
- **Sainte-Laguë highest averages** — each of 84 electoral districts (*dapil*) awards its
  3–10 seats by repeatedly dividing party votes by 1, 3, 5, 7 …

In 2024, 18 parties contested, 8 cleared the threshold, and **17.304.303 valid votes
produced no seat at all**. PPP — an incumbent parliamentary party with 5,88 million votes
— missed by roughly 0,13 percentage points and took zero seats.

This matters right now because the Constitutional Court (Putusan MK 116/PUU-XXI/2023)
held the 4% figure constitutional *for 2024 only*, and ordered the legislature to
reformulate it before 2029 under conditions that include minimising votes that convert to
nothing. The RUU Pemilu is in active deliberation. The Court, in effect, ordered a
calculation — and nobody had shipped a public instrument that performs it.

**Audience:** a literate non-specialist — a journalist, a student, a legislator's
staffer, a civil servant reading the bill. No political-science background assumed, and
no reading required before touching a control.

---

## 3. My role

Sole author. 42 commits, all by one committer, covering specification, data pipeline,
allocation engine, design system, five custom visualisations, accessibility audit, brand
mark and CI/CD. Every commit is co-authored with Claude Code — the work was
specification-led and AI-paired, and the repository is explicit about it. Frame this
however suits the audience; the honest version is *directed and specified end-to-end by
me, executed in a tight loop with an AI pair*.

**Built from scratch:**
- The allocation engine (`src/engine/`, 621 lines) — threshold logic, four divisor rules,
  Hare quota with largest remainder, tie resolution, the trace object, and all five
  disproportionality metrics. Zero dependencies.
- All five visualisations, hand-rolled in SVG. No charting library was used, because none
  can draw a hemicycle, a divisor cascade, or 84 geographic small multiples.
- The animation system (`src/ui/motion.ts`) — a cubic-Bézier solver and a single rAF
  interpolation loop, written by hand rather than pulled from a library.
- The design system: 413 lines of CSS custom properties, and a colour solver
  (`scripts/extract/solve-colors.ts`) that derives the 18-party palette against a measured
  contrast floor.
- The reproduction gate, the data validators, and both GitHub Actions workflows.

**Inherited / used as-is:** React 18, Vite, TypeScript, three `d3-*` maths modules (used
for scale and shape mathematics only — D3 never touches the DOM), and two open-source
typefaces (Archivo, Source Serif 4), self-hosted.

**Not mine:** the underlying election data, which comes from KPU decisions and PKPU
regulations and is cited document-by-document in the interface.

---

## 4. Technical approach

**A pure engine, isolated from everything.** `src/engine/` imports nothing — no React, no
DOM, no dates, no randomness. `allocate(parties, dapil, rules)` is one synchronous,
deterministic function and the module's entire public surface. It runs unchanged in a
Node script, which is what makes the results independently checkable rather than a claim
the UI makes about itself.

**The computation and its display are the same object.** Each seat award records the
complete quotient table at the moment it was claimed. The "show your work" cascade view
*renders* that array; it never recomputes. The display and the arithmetic therefore cannot
drift apart — a common failure mode in explainer visualisations, where the picture
gradually stops describing the code.

**Fast enough that no async machinery is needed.** Full 84-district recomputation runs at
**0,23 ms median**, against a 16 ms budget. Votes live in typed arrays indexed by party
ordinal inside the hot loop, converted to object shapes only at the boundary; the trace is
skipped for slider-driven recomputes. The consequence is a threshold slider that
recalculates the entire parliament on every animation frame — no debounce, no
`requestIdleCallback`, no web worker.

**One animation loop, not 580 components.** The chamber holds a single array of seat
records; one loop interpolates all positions and colours and writes them in one pass.
Mounting 580 independently animated components is the obvious approach and it drops frames
on a phone.

**No backend, by design.** Four static JSON files, no API, no analytics, no CDN fonts.
Every rule configuration serialises to the query string
(`?t=2.0&scope=national&d=sainte-lague&geo=dapil`), so an argument about a 2% threshold
can be sent as a link.

**Reproduction as the licence to be believed.** The app must reproduce the certified 2024
result exactly before it is allowed to offer any counterfactual. The gate runs in CI and
blocks the build. When it cannot pass, the interface says so in its header rather than
presenting a working-looking screen. (See §7 — this is currently the live state.)

---

## 5. Actual tech stack

Verified against `package.json`, not the spec.

| Layer | What is actually used |
|---|---|
| Build | Vite 6, TypeScript 5.7 (strict), `tsx` for Node scripts |
| UI | React 18.3 + React DOM. No UI framework, no component library, no Tailwind |
| Styling | Plain CSS with custom properties — 413 lines of tokens/base, plus per-component sheets |
| Maths | `d3-array`, `d3-scale`, `d3-shape` — layout mathematics only |
| Charting | **None.** All five instruments are hand-written SVG rendered by React |
| Animation | **None.** Hand-rolled cubic-Bézier solver + one rAF loop (`src/ui/motion.ts`) |
| Fonts | Archivo Variable + Source Serif 4 Variable, self-hosted as two `.woff2` files (141 KB) |
| Tests | Vitest 2.1 — 40 tests, node environment, no DOM |
| CI/CD | GitHub Actions → GitHub Pages |
| Backend / DB / analytics | **None** |

Total runtime dependencies: **5**.

---

## 6. Notable features

- **A 580-seat hemicycle where seats migrate.** Drag the threshold from 4,0% toward zero
  and individual seats travel along paths from one party block to another. It is never a
  redraw or a crossfade. The moment the slider passes 3,87% and PPP enters the chamber is
  the app's entire argument, in one gesture.
- **Four rule knobs, all reproducible from the URL.** Threshold (0–10%, continuous),
  threshold scope (national / per-district / none), divisor method (Sainte-Laguë /
  D'Hondt / modified Sainte-Laguë / Hare quota), and geography (84 districts as drawn, or
  a single national pool used as an honest benchmark).
- **A step-through divisor cascade.** For any district, every quotient is laid out as a
  column of cards and the seats are claimed one at a time, in order, with the arithmetic
  readable. Playable, scrubbable, keyboard-steppable.
- **84 small multiples arranged west-to-east.** All districts recompose at once when a
  rule changes; those whose composition differs from the certified 2024 result are marked
  with a *shape*, not a tint, and the count of changed districts is itself a headline
  figure.
- **Every rule cites its pasal; every figure cites its KPU document.** One `<Cite>`
  component opens a dismissible, keyboard-reachable popover carrying the actual statutory
  text — not a tooltip that vanishes on mouse-out, because people want to read the law.
- **A visible honesty layer.** A persistent verification state in the header; a
  counterfactual disclaimer that appears next to the controls whenever any knob is off its
  2024 default; and an editorial-language ban enforced through the copy, the comments and
  the commit messages ("ten parties won no seats", never "ten parties were robbed").

---

## 7. Challenges and tradeoffs

**The data is the honest failure, and it is documented rather than hidden.** The certified
district × party vote table exists only inside per-district KPU recapitulation PDFs, and
extracting it — the one-to-two days of human work the spec budgets for — was not completed
in this build. `public/data/dapil-2024.json` is a synthetic placeholder that carries
`"provenance": "synthetic"` at its root. Rather than fake a result, the project wired the
honesty through the whole stack: `npm run verify` exits non-zero, CI reports the gate as
*not testable*, and the app header states plainly that the official result has **not** been
reproduced. Dropping the certified file in with `"provenance": "certified"` flips all of it
green with **no code change**. Three of the four data files hold real certified figures, so
everything computed from national totals is real — including the unconverted-vote figure,
which lands at 17.304.303, matching Perludem's independent count *to the vote*. This is the
most interesting thing to talk about in a case study: an engineer who built the failure
state before he needed it.

**A colour requirement that was mathematically unsatisfiable.** The design spec fixed the
instrument background at a mid grey and required all 18 party colours to clear 3:1 against
it. That grey has a relative luminance of 0,167, so 3:1 demands a colour either pastel or
near-black — every saturated mid-lightness hue is excluded *by construction*. The first
repair was to drop the constraint and print the real ratios; that was wrong, because the
mid ground was also pushing five parties to colours their party does not own (PKS peach,
Demokrat pale blue, PKB mint) — legible, and no longer recognisable. The real fix was to
move the ground to near-black, which removes the two-sided squeeze entirely: hues are now
untouched, every colour clears 3,5:1, and seven parties including the four largest carry
their exact logo colour. Recorded in `DECISIONS.md` §2.

**A spec figure that was simply wrong.** The PRD asked for a slider tick at "the ~1%
effective threshold implied by the Laakso–Taagepera formula". Worked through, that formula
(T = 75%/(M+1)) at Indonesia's average district magnitude of 6,90 gives **9,5%**, not 1%.
The tick ships with the computed value, derived from the loaded data rather than
hardcoded, and relabelled to say which district it applies to. Contradicting your own
specification with arithmetic, in writing, is the pattern worth showing.

**A visible mid-project design pivot.** Commits between 2 and 3 September show the token
layer, the palette and all five instruments being torn down and rebuilt on a two-register
design (`Rebuild the token layer on two registers`, `Re-solve the party palette against a
deep instrument ground`, `Rebuild the five instruments and the transport console`, then
`Rewrite DESIGN.md for the two-register design`). Reading matter sits on paper; every
instrument sits on a near-black stage. The interface chrome carries no colour of its own —
every saturated pixel on screen is data.

**Explicitly not built:** candidate-level allocation (Indonesia's open list would need a
dataset an order of magnitude larger and adds nothing to an argument about rules), 2019
and 2014 rule packs, malapportionment, and any forecast of a future election. The English
locale contemplated in the build notes was also dropped — Indonesian only.

---

## 8. Status

- **Live and public.** Deployed to GitHub Pages at
  <https://andifathulms.github.io/seat-allocation/>, from the public repository
  <https://github.com/andifathulms/seat-allocation>.
- **Shipping quality, with one open data gap.** Complete and polished across code, design,
  accessibility, brand and documentation. The interface is truthful about the one thing it
  cannot yet claim (§7) rather than being a prototype in disguise.
- **CI/CD is real.** Two GitHub Actions workflows. CI runs typecheck → tests →
  reproduction gate → build → a bundle-size assertion that fails the run above 1 MB.
  Deploy runs the same checks and publishes only on green.

---

## 9. Metrics

| | |
|---|---|
| Commits | 42, all by one committer |
| Time span | 2–3 September 2026 — roughly **28 hours** from first to last commit |
| Source | ~8.000 lines across `src/`, `scripts/`, `tests/` |
| Engine | 621 lines, **zero** imports |
| Views | 2.163 lines across five instruments |
| UI + design system | 2.641 lines |
| Tests | **40**, every expected value hand-computed on paper in a comment above it |
| Runtime dependencies | **5** |
| Recomputation speed | **0,23 ms** median full 84-district pass, against a 16 ms budget |
| Frame rate | 60 fps median dragging the threshold 4,0% → 0 on the production build; p95 frame 17,6 ms |
| Shipped payload | **~440 KB** total — 228 KB JS, 31 KB CSS, 141 KB fonts, 58 KB data — against a 1 MB budget |
| Accessibility | **Zero** axe-core violations against WCAG 2.1 A and AA, at 380/720/1400 px, in both colour schemes, with every table, disclosure and popover expanded |
| Scale of the domain modelled | 580 seats · 84 districts · 18 parties · 4 rule knobs · 5 metrics · 5 instruments |

---

## 10. Suggested screenshots

1. **The chamber at 2024 defaults, then mid-drag.** The hero: a 580-seat hemicycle with
   the threshold scrubber below it, ideally captured as a pair — 4,0% with ten party
   blocks at zero in the legend, and ~3,8% with PPP's seats present. This is the app's
   argument in two frames.
   → [Chamber.tsx](src/views/Chamber/Chamber.tsx), [layout.ts](src/views/Chamber/layout.ts),
   [assign.ts](src/views/Chamber/assign.ts), [Transport.tsx](src/ui/Transport.tsx)

2. **The divisor cascade, mid-step.** The "show your work" view — quotient cards at
   heights proportional to their values, seats claimed in order with ordinal markers.
   Capture it stepped partway through a district so both claimed and unclaimed quotients
   are visible.
   → [Cascade.tsx](src/views/Cascade/Cascade.tsx)

3. **The archipelago.** All 84 districts as small multiples, west to east, with the
   changed-district shape markers visible — the clearest single image of *a national rule
   having local consequences everywhere*. Best captured at a non-default threshold so the
   markers are dense.
   → [Archipelago.tsx](src/views/Archipelago/Archipelago.tsx)

4. **A citation popover open over the metric strip.** Shows the pasal text of UU 7/2017
   alongside live Gallagher / Loosemore–Hanby / ENP figures — the verifiability story that
   is the project's actual differentiator, in one frame.
   → [Cite.tsx](src/ui/Cite.tsx), [MetricStrip.tsx](src/ui/MetricStrip.tsx),
   [Verification.tsx](src/ui/Verification.tsx)

*Optional fifth:* the vote bar — one horizontal bar of all 151.796.631 valid votes,
partitioned into what converted and what did not, with the ten zero-seat parties named
inside the unconverted segment.
→ [VoteBar.tsx](src/views/VoteBar/VoteBar.tsx)
