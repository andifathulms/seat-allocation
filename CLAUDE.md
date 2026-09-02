# CLAUDE.md — Suara ke Kursi

Build instructions for Claude Code. Read PRD.md for what this is and DESIGN.md for how it
looks. This file covers how it is built.

## Non-negotiables, up front

1. **The engine is pure.** `src/engine/` imports nothing — no React, no D3, no DOM, no
   dates, no randomness. If it cannot run under `node --test` unchanged, it is wrong.
2. **Reproduction gates everything.** `npm run verify` must reproduce the official 2024
   allocation exactly before any UI work is considered complete. If it fails, fix the
   data. Never tune the engine to match.
3. **No backend, ever.** No fetch to any origin at runtime except the app's own static
   JSON. No analytics. No fonts from a CDN — self-host.
4. **The counterfactual disclaimer ships in the UI.** See PRD §10.1. This is not
   optional and not a README line.
5. **No editorial language anywhere in the codebase**, including comments, commit
   messages, and variable names. `wastedVotes` is fine. `stolenSeats` is not.

## Stack

- Vite + React 18 + TypeScript, strict mode.
- No UI framework, no component library, no Tailwind. Plain CSS with custom properties.
  This app has five bespoke instruments and about a dozen controls; a utility framework
  costs more than it gives here.
- `d3-scale`, `d3-shape`, `d3-array` for layout mathematics only. D3 never touches the
  DOM — React renders all SVG.
- No charting library. Recharts cannot draw any of the five instruments.
- Animation: see §5. Do not reach for a general animation library before reading it.
- Vitest for tests.

Rationale for Vite over Next: this is a pure client-side app on GitHub Pages. Next's
export mode is friction with no payoff here.

## Repository layout

```
/
├─ public/
│  └─ data/
│     ├─ parties-2024.json
│     ├─ dapil-2024.json
│     ├─ official-2024.json
│     └─ rules-2024.json
├─ scripts/
│  ├─ verify.ts              # reproduction gate, runs in CI
│  └─ extract/               # PDF→JSON extraction, run once, kept for provenance
├─ src/
│  ├─ engine/
│  │  ├─ types.ts
│  │  ├─ threshold.ts
│  │  ├─ divisors.ts
│  │  ├─ allocate.ts         # the highest-averages loop + trace
│  │  ├─ quota.ts            # Hare + largest remainder
│  │  ├─ metrics.ts          # Gallagher, Loosemore-Hanby, ENP, unconverted
│  │  └─ index.ts
│  ├─ data/
│  │  └─ load.ts             # parse + validate JSON at boot, fail loudly
│  ├─ state/
│  │  └─ rules.ts            # the four knobs, URL-serialised
│  ├─ views/
│  │  ├─ Chamber/            # 9.1 hemicycle
│  │  ├─ Cascade/            # 9.2 divisor cascade
│  │  ├─ Archipelago/        # 9.3 84 small multiples
│  │  ├─ VoteBar/            # 9.4
│  │  └─ Proportionality/    # 9.5 scatter
│  ├─ ui/                    # controls, metric strip, citation popovers
│  └─ styles/
│     ├─ tokens.css
│     └─ base.css
└─ tests/
```

## Engine contract

```ts
type PartyId = string;                    // stable slug, e.g. "pdip"

interface Party {
  id: PartyId;
  ballotNumber: number;                   // 1..18, the nomor urut
  shortName: string;                      // "PDI-P"
  fullName: string;
  color: string;                          // hex, see DESIGN.md §2.2
  nationalVotes: number;
}

interface Dapil {
  code: string;                           // "JABAR-1"
  name: string;                           // "Jawa Barat I"
  province: string;
  magnitude: number;                      // seats, 3..10
  votes: Record<PartyId, number>;
}

interface RuleSet {
  threshold: number;                      // 0..0.10, fraction not percent
  thresholdScope: 'national' | 'dapil' | 'none';
  divisor: 'sainte-lague' | 'dhondt' | 'modified-sainte-lague' | 'hare-quota';
  geography: 'dapil' | 'national-pool';
}

interface SeatAward {
  ordinal: number;                        // 1..magnitude, order claimed
  winner: PartyId;
  quotient: number;
  table: Array<{ party: PartyId; quotient: number; divisor: number }>;  // full state
  tied: PartyId[] | null;
}

interface DapilResult {
  dapil: string;
  seats: Record<PartyId, number>;
  trace: SeatAward[];
}

interface Allocation {
  qualifying: PartyId[];
  eliminated: PartyId[];
  byDapil: DapilResult[];
  seatsByParty: Record<PartyId, number>;
  metrics: Metrics;
}

function allocate(parties: Party[], dapil: Dapil[], rules: RuleSet): Allocation;
```

`allocate` is the entire public surface. It is synchronous, deterministic, and pure.

### The trace matters

`SeatAward.table` captures the complete quotient state at the moment each seat was
awarded. The Cascade view renders this array; it never recomputes. This is what makes the
"show your work" view trustworthy — the display and the computation cannot drift apart
because they are the same object.

This costs memory: 84 dapil × up to 10 seats × up to 18 parties. That is under 15,000
small objects. Acceptable. Do not optimise it away.

### Performance

Full recomputation must land under 16 ms so the threshold slider recomputes on every
frame. Achieve this by:

- Precomputing `party.nationalVotes / totalValid` once at load.
- Keeping votes in typed arrays indexed by party ordinal inside the hot loop; convert to
  the `Record` shape only at the boundary.
- Not allocating the trace when the caller does not need it. `allocate(..., { trace:
  false })` for slider-driven recomputes; full trace only for the selected dapil.

No debounce. No `requestIdleCallback`. No web worker. If you find yourself reaching for
one, the loop is wrong.

## Data pipeline

`scripts/extract/` holds the one-time PDF→JSON work. It is committed for provenance even
though it will never run again in CI. Each extracted dapil records the source document
and page it came from.

`scripts/verify.ts` is the gate:

```
1. Load all four JSON files.
2. Assert: each party's dapil votes sum to its national total.
3. Assert: all national totals sum to 151,796,631.
4. Run allocate() with the 2024 statutory RuleSet.
5. Assert: computed seats match official-2024.json for every party in every dapil.
6. Assert: total = 580.
7. Print the unconverted-vote figure and the three disproportionality indices.
```

Exit non-zero on any failure. Wire into CI and into `npm run build` as a pre-step.

Step 7 prints rather than asserts because the unconverted figure is a computed result, not
an input. If it does not land near 17.3 million, that is a signal worth investigating, but
report the computed number rather than forcing agreement.

## State and URLs

The four knobs live in a single `RuleSet` in React state, serialised to the URL query
string on change (debounced for history, not for computation). Every configuration is
therefore linkable — someone arguing about a 2% threshold can send the link.

`?t=2.0&scope=national&d=sainte-lague&geo=dapil`

Default state produces a bare URL. Reset clears the query string.

## Rendering

All five instruments are SVG rendered by React. Reasons: 580 elements is well within
SVG's comfortable range, SVG gives free accessibility and keyboard focus, and the
animations are transform interpolations rather than pixel work.

Exception: if the Archipelago's 84 small multiples measurably drop frames during a slider
drag, that one view may move to a single canvas. Measure before doing it.

### Never do this

Do not mount 580 independently animated components. The Chamber holds one array of seat
records; a single animation loop interpolates positions and colours and writes them to the
DOM in one pass. Component-per-seat with individual springs will drop frames on a phone
and is the single most likely way to fail requirement 3 in PRD §11.

## Animation

Hand-rolled, not a library. The requirements are narrow: interpolate a set of positions
and colours over a fixed duration with an easing curve, cancellable mid-flight when the
slider moves again.

```
useTransition(targets, duration, easing) → current values, driven by one rAF loop
```

Framer Motion is permitted for the small stuff — control affordances, popovers, the
cascade's step reveal — but never for the Chamber or the Archipelago.

`prefers-reduced-motion: reduce` short-circuits every interpolation to an immediate state
write. Test this; do not assume it.

## Citations

Rules and figures both cite. Build one `<Cite>` component used for both:

- Rule citations resolve against `rules-2024.json`, which holds pasal number, the relevant
  text, the source document title, and a URL.
- Figure citations name the KPU document and link to it.

Citations render as a quiet inline marker that opens a popover. They are not footnotes at
the bottom of the page, and they are not tooltips that vanish on mouse-out — the popover
is dismissible and keyboard-reachable, because people will want to read the pasal text.

## Copy

Indonesian first. English as a second locale if time allows, but do not build an i18n
framework for two locales — a flat `strings.id.ts` / `strings.en.ts` pair is enough.

Tone rules, enforced in review:

- Describe the arithmetic, never the outcome. "Sepuluh partai tidak memperoleh kursi" is
  correct. "Sepuluh partai kehilangan haknya" is not.
- No exclamation marks, no rhetorical questions, no second-person exhortation.
- Numbers in Indonesian formatting: `151.796.631`, `4,0%`.
- Party names exactly as KPU writes them.

## Accessibility

- Every instrument has a table equivalent reachable by keyboard. The hemicycle is
  beautiful and it is not the only way to get the numbers.
- Colour is never the only channel. Party blocks in the Chamber carry labels at their
  centroids; the Archipelago's changed-dapil marker is a shape, not a tint.
- Focus is visible and never removed.
- Target Lighthouse accessibility ≥ 95.

## Build order

Do these in order. Do not start the UI before step 3 passes.

1. Engine + tests against hand-computed examples. No data yet — fixtures only.
2. Data extraction and the three consistency assertions.
3. `npm run verify` reproducing 580/580. **Gate.**
4. Design tokens and the shell layout.
5. Chamber, static, at 2024 defaults.
6. Threshold slider wired to the Chamber, with migration animation. This is the app's
   core moment; get it right before building anything else.
7. Metric strip.
8. Archipelago.
9. Cascade.
10. Vote bar and proportionality plot.
11. Citations, copy pass, reduced-motion, keyboard, mobile.
12. Lighthouse and bundle budget.

## Deployment

GitHub Pages via Actions. `base` in `vite.config.ts` set to the repo path. A `404.html`
copy of `index.html` for client-side routing if routing is added — currently the app is a
single page with URL query state, so this may not be needed.

CI runs: typecheck → lint → test → verify → build. Deploy only on green.
