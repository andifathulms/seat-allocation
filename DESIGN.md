# DESIGN.md — Suara ke Kursi

Visual and motion specification. PRD.md defines what the app does; this defines what it
looks like and how it moves. Where the two conflict, PRD wins on substance and this file
wins on form.

Revised at the two-register rework. Where a decision reverses an earlier one, the reversal
is stated with its reason rather than quietly overwritten — the earlier reasoning was
sound given a premise that turned out to be wrong, and the record of which premise failed
is worth more than a clean document.

---

## 0. The design problem, stated honestly

This app has an unusual constraint: **it does not get to choose its palette.** Eighteen
Indonesian parties have known colours that voters read faster than they read names, and
the app must use them or become harder to understand. Roughly two thirds of the pixels
that matter are party-coloured.

That single fact drives almost every decision here. The design's job is to build a
surface those colours sit on well, and then get out of the way.

Two consequences:

1. **The interface has no colour of its own.** No brand accent, no gradient, no tinted
   surfaces. Every saturated pixel on screen is data. If a designer's colour appears
   anywhere, it competes with the only colours that carry meaning.
2. **Reading and data need different grounds.** Running copy wants a light page. Party
   colour wants a ground far enough from the middle of the range that every hue in the
   palette separates from it. One surface cannot be both.

### 0.1 The premise that failed

The first version of this document answered point 2 with a single mid-value grey ground —
dark enough for Golkar's yellow, light enough for NasDem's navy. It was the obvious
reading of the constraint and it was wrong, for a reason that only showed up once the
palette was actually solved against it.

A mid ground has usable range in both directions and not much of it in either. To keep
eighteen colours separable against it, the solve had to spread them across lightness both
ways, and five ended up somewhere their party is not: PKS became peach, Demokrat became
pale blue, PKB became mint. The ground was legible and the palette was no longer
recognisable, which trades away the entire reason for using these colours.

A deep ground has the whole upper range available and asks only that nothing be too dark.
Against `#16191D` every colour needs to clear one lightness floor and nothing else, so
hues keep their chroma, and seven parties — including the four largest — carry their logo
colour unchanged. The constraint that looked like it demanded a compromise ground
actually demanded a committed one.

---

## 1. Design plan

**Concept: the tally sheet and the stage.**

Two registers. Reading matter — headings, explanation, pasal text — sits on a light,
slightly warm paper ground, the tone of the recycled stock election forms are printed on.
Data sits on a deep stage, dark enough that every party colour separates from it and warm
enough in its neutrals not to read as a screen. The instruments are windows cut through
the page.

Structure encodes the arithmetic, not decoration. Numbers are set in a narrow face so that
figures stack in columns the way a tally does. The one moment of visual drama in the whole
app is a party re-entering parliament.

**Alignment:** everything left-aligned except numerals, which are right-aligned in their
columns so digits line up. The hemicycle is the only centred element on the page, and it
is centred because the chamber it depicts is symmetrical.

**One idea per section.** The page is a document read top to bottom, numbered 01 to 06, not
a dashboard scanned in any order. The numbered spine and the rail exist because a document
this tall has to say where the reader is.

---

## 2. Colour

### 2.1 Ground and chrome

Two registers, three values each. Recessed and raised surfaces are separated by value
alone — there are no shadows in the app except on the two surfaces that genuinely float
(§4.5).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#F2F1ED` | `#0B0D10` | Page ground, the reading register. |
| `--paper-sub` | `#E7E5DF` | `#14171B` | Recessed on paper: table heads, the colophon, the provenance line. |
| `--paper-raise` | `#FBFAF7` | `#1A1E23` | Raised off paper: the transport, popovers, table bodies. |
| `--ink` | `#16181B` | `#EDEEF0` | Primary text on paper. |
| `--ink-soft` | `#565A60` | `#A2A8B0` | Secondary text, notes, definitions. |
| `--ink-faint` | `#878C93` | `#6D737B` | Decoration and disabled states only. Below 4,5:1 by design and never load-bearing. |
| `--rule` | `#DAD7D0` | `#252A30` | Hairlines on paper. |
| `--rule-strong` | `#B9B5AC` | `#3B414A` | Hairlines that have to be seen: the slider rail, quote bars. |

| Token | Value | Use |
|---|---|---|
| `--stage` | `#16191D` (dark theme `#181B20`) | The data register. **The only ground a party colour is ever drawn on.** |
| `--stage-sub` | `#1E2228` | Recessed inside the stage: the empty seat arc, unclaimed quotient cards, the vote-bar breakdown. |
| `--stage-raise` | `#262B32` | A selected cell. |
| `--on-stage` | `#F4F5F6` | Text on the stage. |
| `--on-stage-soft` | `#A9AFB7` | Secondary text on the stage, 7,9:1 — secondary rank never comes from opacity here. |
| `--rule-stage` | `#333941` | Hairlines on the stage, including the ring that separates it from the page in the dark theme. |

Only two functional non-party colours exist in the entire app:

| Token | Value | Use |
|---|---|---|
| `--void` | `#6B717A` | Votes that converted to no seat. Near-neutral, deliberately not red — this is a category, not an alarm. |
| `--warn` | `#B23C22` / `#FF8C6B` | Reserved exclusively for the reproduction-failure state and for tie warnings. Never decorative. If this colour appears, something is wrong. |

Nothing else in the chrome is coloured. No hover tints, no selection blues, no gradients.
Selection is a ground change plus an inset ring in `--on-stage`, never a colour.

### 2.2 The dark theme

The stage does not move between themes: it is the ground the palette was solved against,
and moving it would invalidate every contrast figure in `parties-2024.json`. Only the
reading register flips. Because the stage no longer separates from the page by value in
the dark theme, it carries a `--rule-stage` hairline in both.

This is why the two-register split pays for itself twice. A single-ground design would
have needed a second palette solve for its second theme.

### 2.3 Party colours

Solved by `scripts/extract/solve-colors.ts` and stored in `parties-2024.json`, never in
CSS. The data owns them. Three constraints:

- **Hue is never touched.** It is the recognisable part.
- **Every colour clears 3,5:1 against `--stage`.** This is the only ground any party
  colour is drawn on, so it is the only ratio that has to hold.
- **Parties inside a 22° hue arc separate by at least 11 points of Lab lightness.**
  Within a family the largest party keeps its brand lightness exactly and the smaller
  members move around it, so fidelity tracks screen presence: the colour a reader meets on
  two thirds of the screen stays true, and the colour that appears once in a legend at zero
  seats is the one that moves. Where the band cannot hold a whole family at the full gap,
  the remaining member takes the position furthest from its neighbours and the shortfall is
  printed by the solve rather than hidden.

The eliminated state is not a different colour. An eliminated party keeps its hue at 45%
opacity under a fine diagonal hatch. It must stay identifiable in the legend at zero seats,
because watching a specific party sit at zero is the point.

### 2.4 What is forbidden

No colour scales, no heatmaps, no sequential ramps, no "primary/secondary/accent" system.
No colour indicates good or bad. No red for loss, no green for gain — deltas are indicated
by direction arrows and sign, in `--ink`.

---

## 3. Typography

Two families, three faces, one file each. Self-hosted, Latin subset.

**Archivo** — everything except pasal text. Grotesque, with true tabular lining figures and
a genuine narrow width on the same variable file. It has a civic, signage-adjacent
character that suits a document about electoral administration without costuming itself as
one.

- `Archivo` for interface text, labels, and running copy.
- `Archivo Narrow` for all large numerals: the seat total, seat counts, vote totals,
  quotients, metric values, tick labels. Narrow figures stack into columns the way tallies
  do, and at the sizes this app needs the width saving is structural, not cosmetic.

**Source Serif 4** — pasal text only, and nowhere else in the app.

Indonesian legislation is set in serif, and the app's central discipline is separating
*what the law says* from *what the computation produced*. Giving the law its own voice
makes that separation visible without a label. If it starts appearing in headings, delete
it.

### 3.1 Scale

Fluid where the element has to survive a 380 px viewport and a 1600 px one; fixed where
it does not. Base 16/17 px.

| Token | Size / line-height | Use |
|---|---|---|
| `--t-hero` | `clamp(72, 13vw, 148)` / 0.82, Narrow 600 | **The seat total. One instance in the app**, set inside the hemicycle's own void. |
| `--t-display` | `clamp(38, 6.2vw, 68)` / 0.98, 600 | Page title. One instance. |
| `--t-figure-lg` | `clamp(32, 4.4vw, 46)` / 1, Narrow 600 | Metric values, masthead figures, vote-bar totals, changed-dapil count. |
| `--t-figure` | `clamp(26, 3vw, 33)` / 1, Narrow 600 | Legend seat counts, threshold value, cascade readout. |
| `--t-h2` | `clamp(23, 2.6vw, 31)` / 1.1, 600 | Instrument headings. |
| `--t-h3` | 19 / 1.25, 600 | Masthead subtitle, colophon headings. |
| `--t-body` | 17 / 1.6, 400 | Running copy. Max 64 characters. |
| `--t-small` | 13.5 / 1.5, 400 | Notes, definitions, table cells, controls. |
| `--t-micro` | 11 / 1.3, 500 | Dapil codes, quotient cards, tick labels, section numbers. |
| `--t-law` | 16 / 1.7, Source Serif 4 400 | Pasal text. Max 62 characters. |

All figures use `font-variant-numeric: tabular-nums lining-nums`. Non-negotiable — the app
animates numbers, and proportional figures will jitter.

Optical tracking: `-0.022em` on the display, `-0.018em` on h2, `-0.035em` on the hero.
Large text in this grotesque needs it; body text does not get it.

### 3.2 Typographic prohibitions

No all-caps labels. No tracked-out eyebrows above headings — the section spine is a
number in narrow figures, which does the same job without shouting. No monospace for data
labels; Archivo Narrow's tabular figures already do that better. No single word in a
heading given a different weight or colour. Sentence case throughout, including buttons.

---

## 4. Layout

### 4.1 Page structure

```
┌ rail (fixed, appears after the masthead) ────────────────────┐
│ Suara ke Kursi  4,0%      Ruang sidang · Angka · Suara · …   │
└──────────────────────────────────────────────────────────────┘

  Suara ke Kursi                                    ← display
  Bagaimana suara Pemilu 2024 menjadi 580 kursi DPR

  [intro, 64ch]
  ──────────────────────────────────────────────────
  Hasil resmi Pemilu 2024
  580        18        8         17.304.303
  kursi DPR  peserta   lolos     suara tak jadi kursi
  [ △ provenance line ]

  01  Ruang sidang                          Tampilkan tabel ↓
      ╭──────────── stage ─────────────╮
      │      ⌒ hemicycle · 580 ⌒       │
      │  legend: memperoleh kursi 8    │
      │          tanpa kursi 10        │
      ╰────────────────────────────────╯
  02  Angka ringkas      │ 4 readings across one subgrid
  03  Suara sah nasional │ stage: one bar, boundary marker
  04  Delapan puluh empat dapil │ stage: 84 cells
  05  Pembagian kursi langkah demi langkah │ stage: cascade
  06  Pangsa suara dan pangsa kursi │ stage: scatter

  ── colophon: legal standard │ sources ──

╔ transport (sticky, bottom) ══════════════════════════════════╗
║ Ambang batas 4,0%          Cakupan · Metode · Dapil · Setel  ║
║ ━━━━━━━●━━━━━━━━━━━━━━━                                      ║
╚══════════════════════════════════════════════════════════════╝
```

### 4.2 The section spine

Every instrument is a numbered section. The head is a three-column grid — number, heading
and note, instrument aside — collapsing to one column below 860 px. The number sits under
a short hairline, which is the only decoration on the page and exists to give the spine a
top edge to hang from.

The table toggle lives in the aside, beside the heading. It is offered before the
instrument is read rather than found after it.

### 4.3 The transport bar

The controls are pinned to the bottom of the viewport as a full-width bar, styled as a
scrubber rather than a form. This is deliberate: the app's entire interaction model is
*drag and watch*, and a transport bar is the interface vocabulary people already have for
that. It also solves the mobile problem for free — the control stays under the thumb while
the chamber stays at eye level.

The console splits 1 : 1,3 — scrubber left, the three discrete rules right. The scrubber
gets the smaller share and still dominates, because it is one control against nine.

The threshold track is a 6 px rail with the travelled portion filled in `--ink` and a
20 px thumb ringed in the bar's own ground. Ticks sit at 2,5% · 3,5% · 4,0% and at the
effective threshold implied by Laakso–Taagepera, labelled with the year the figure applied.
Those first three sit inside the first fifth of a ten-point scale, so their labels overlap
at every width the app supports: ticks step down three rows in turn and grow their marks
back up to the track as leaders. The stagger does not depend on the viewport, because one
that did would change the bar's height as the window is resized.

The three discrete controls are inline text toggles, not dropdowns or segmented pills, each
with its label in a fixed left column so the three read as one table of settings. Reset is
a text link, disabled at defaults.

**The counterfactual statement (PRD §10.1) lives in this bar**, appearing directly above
the scrubber the moment any control leaves its default and staying until reset. The bar
grows to accommodate it rather than the text overlaying anything.

### 4.4 The rail

Fixed, not sticky — a sticky rail is still in flow and would reserve 3,5 rem above the
masthead for a bar that is not shown yet. It drops in once the masthead leaves the
viewport, carries the section list and the threshold currently applied, and marks the
active section from an observer over the upper third of the viewport. Its list scrolls
sideways on a narrow viewport rather than wrapping, so its height never changes and the
content below never shifts.

### 4.5 Grid, rhythm and depth

78 rem max width, fluid `clamp(20px, 4.5vw, 56px)` gutters. Running copy never exceeds 64
characters. Instruments use `.bleed`, which is the page width plus its gutters, so the
stage panels read as windows through the page rather than as cards on it.

Spacing scale: 2 · 4 · 8 · 12 · 16 · 24 · 40 · 64 · 104 · 160. Sections separated by 104,
elements within an instrument by 12 to 24.

Radius: 3 px on small controls, 8 px on inset blocks, 16 px on stage panels. Depth is
value, not elevation — with one exception. The transport and the citation popover carry a
soft shadow because they genuinely float over content and cannot read as being in front of
it by value alone against a ground that is nearly their own. Nothing else in the app has a
shadow.

### 4.6 Responsive

Below 1100 px the archipelago drops to 8 columns; below 720 px to 4, with vertical scroll.
Below 960 px the transport console stacks. Below 860 px the section head collapses to one
column and the colophon to one. Below 720 px the transport's three discrete controls
collapse behind one "Aturan lain" sheet, the tick year notes are dropped, the chamber's
in-arc block labels are dropped — the legend directly beneath names every block with its
count, and the arc's accessible description still lists them all — and the cascade shows
four party columns at a time with horizontal scroll and snap points.

---

## 5. The five instruments

### 5.1 Chamber — the hero

580 seats in a hemicycle: concentric arcs, seats sized so the outermost row reads clearly
at 380 px. Parties are ordered around the arc by seat count, largest at the left, which
keeps block boundaries stable as counts change and avoids implying a left-right political
axis the app has no business asserting.

Each seat is a circle. **The seat total sits in the hemicycle's own void**, at `--t-hero`
with its unit beneath — the number and the thing it counts read as one object, and the
inner radius of the arc is exactly the room it needs.

Party blocks carry their short name and seat count at the block centroid, on a chip in
`--stage` at 90% opacity. A chip and not a stroked halo: the label sits on top of its own
party's colour, and against eighteen hues of every lightness an outline holds at some and
fails at others, while a chip in the ground colour holds against all of them and reads as
a tag pinned to the block. Blocks too small to hold a label keep it on a leader line drawn
outward along the block's own radius. Dropping it instead would hide exactly the parties
the app is about.

The legend is part of this instrument, on the same stage, **split at the line the app is
about**: parties holding seats, then parties holding none, each group with its count named.
A single eighteen-row list makes the threshold's effect something the reader has to
reconstruct by scanning for zeroes; two groups state it.

Empty state has no meaning here — all 580 seats are always filled. What changes is who
fills them.

### 5.2 Cascade — the divisor arithmetic

One dapil. Each qualifying party is a vertical column. Within a column, quotient cards
sit at heights proportional to their values: V/1 at the top, then V/3, V/5, V/7 below it.
A horizontal line sweeps down from the top; each time it touches a card, that card is
claimed, receives an ordinal marker, and its party's column registers a seat.

The sweep line is the mechanism made visible — every card above the final line position
won a seat, every card below did not, and the line's resting position *is* the last
winning quotient. That single line explains highest-averages allocation better than any
paragraph.

Transport: play, pause, step forward, step back, scrub. Steps are also arrow-key
navigable. The quotient arithmetic for the current step is printed in full beneath the
columns and **inside the stage** — `Gerindra 229.174 ÷ 3 = 76.391` — because it is the
readout of the sweep line, not a caption on the section. At step zero it says what to
press rather than repeating the section note.

Eliminated parties appear as ghost columns at the left, hatched, with their dapil vote
shown and no cards. This is where a national threshold's local consequence becomes
concrete: a party with real votes here, holding no cards.

### 5.3 Archipelago — 84 small multiples

Each dapil is a cell: a compact horizontal stacked bar of its seat composition, with the
dapil code in `--t-micro` beneath. Cells are arranged in a grid that follows Indonesian
geography loosely — Sumatra top-left running down, Java as a dense band, Kalimantan and
Sulawesi to the right, Nusa Tenggara, Maluku and Papua at the far right. Not a map, and it
should not pretend to be one; it is a grid with geographic ordering, and provinces are
grouped by a thin gap rather than a border.

Dapil whose composition differs from the 2024 baseline carry a small filled triangle in
the upper-left corner. Shape, not colour. The count of changed dapil sits above the grid
as a figure over a rule, and it is one of the more arresting numbers in the app.

### 5.4 Vote bar

One horizontal bar, full width, representing 151.796.631 valid votes. Converted votes are
segmented by party in party colour; unconverted votes are one `--void` segment at the
right, subdivided by hairlines into the individual parties that make it up. The names and
figures for that right-hand segment sit in a recessed block below the bar rather than
crowding the bar itself.

The boundary between converted and unconverted is the only element in the app that moves
horizontally across the full page width, which makes it the clearest reading of the
threshold's cost. It is marked by a 2 px line in `--on-stage` that overhangs the bar top
and bottom.

The track's ends are rounded by its container, not by the rects: the bar uses
`preserveAspectRatio="none"`, so an `rx` on a rect would arrive on screen as an ellipse.

### 5.5 Proportionality plot

Vote share on x, seat share on y, one dot per party at its colour, sized by votes. A 45°
line in `--on-stage-soft`, dashed, no label — the geometry explains itself. Dots above are
over-represented, below under-represented. Eliminated parties sit on the x-axis at y = 0,
which is where the threshold's effect is geometrically obvious.

Labels are knocked out against the stage with a `--stage` stroke under `paint-order:
stroke`, for the same reason the chamber's labels use a chip.

Axis ticks every 5 percentage points, `--on-stage-soft`.

---

## 6. Motion

Motion in this app is functional. Every animation answers a user action and shows what
changed. There is exactly one non-user-triggered sequence (§6.4).

### 6.1 The core distinction

**Continuous control → direct mapping.** While the threshold scrubber is being dragged,
the chamber, vote bar and metrics follow the pointer with zero easing and zero delay. The
recomputation budget in CLAUDE.md exists precisely so this can be true. Easing here would
feel like lag.

**Discrete control → timed transition.** Changing the divisor rule, the scope, or the
geography animates over a duration, because the user needs to see what moved.

Getting this distinction right is most of what makes the app feel like an instrument
rather than a website.

### 6.2 Durations and curves

| Event | Duration | Curve |
|---|---|---|
| Seat migration (discrete rule change) | 420 ms | `cubic-bezier(.32,.72,0,1)` |
| Metric value counting | 420 ms, synchronised with seats | same |
| Archipelago recomposition | 420 ms, staggered 3 ms per cell west → east | same |
| Cascade step advance | 260 ms | `cubic-bezier(.4,0,.2,1)` |
| Cascade sweep line (play mode) | 520 ms per seat | linear |
| Rail entrance | 260 ms | `cubic-bezier(.4,0,.2,1)` |
| Popover open | 140 ms | `cubic-bezier(.4,0,.2,1)` |
| Control state change | 120 ms | linear |

The archipelago stagger runs west to east — a rule change washing across the country. It
is 3 ms per cell, so the whole wash completes in about 250 ms and reads as a single
gesture rather than a sequence.

### 6.3 Seat migration

When a seat changes party, it travels. It does not crossfade, and the blocks do not
redraw. The seat's circle moves along a short arc from its old position to its new one,
carrying its old colour, and cross-fades to its new colour over the middle third of the
journey.

Seats that do not change party do not move except as needed to keep blocks contiguous,
and that adjustment uses the same curve so the whole chamber reads as one motion.

With 580 seats and up to a few dozen changing at once, this is a single rAF loop writing
transforms, as specified in CLAUDE.md.

### 6.4 The one orchestrated moment

As the threshold scrubber descends past 3,87%, PPP crosses back into parliament.

That transition gets more than the standard treatment. The hatch on PPP's legend block
resolves to solid, and its seats arrive last, after the other migrations have settled, so
the arrival is legible as a separate event. The dapil in the archipelago that PPP enters
light their change markers in the same beat.

Nothing else in the app is emphasised this way. The reason it earns emphasis is that this
is the app's entire argument compressed into one crossing: an incumbent party with 5,88
million votes, roughly 0,13 percentage points short, holding zero seats on one side of
that line and dozens on the other.

The rule is written generally rather than around one party: whichever party crosses, it is
the crossing that earns the beat.

Do not add a sound, a flash, a particle effect, or a caption. The seats arriving is
enough.

### 6.5 Reduced motion

`prefers-reduced-motion: reduce` replaces every transition with an immediate state write,
and turns off smooth scrolling. The cascade's play mode is disabled and the view becomes
step-only. Nothing is lost except the animation; every number remains reachable.

---

## 7. Copy

Indonesian, sentence case, plain verbs.

Labels name what the user sees: "Suara yang tidak menjadi kursi", not "Wasted votes
index". Controls name what happens: "Setel ulang ke aturan 2024", not "Reset".

Definitions are one sentence and sit adjacent to the number they define, not behind a
question-mark icon.

The verification line reads as a fact, not a badge, and carries a marker in the margin so
its state is legible before the sentence is read. The marker is a shape as well as a
colour. If reproduction fails it reads as a plain statement of what failed, in `--warn`,
with the full list of checks one disclosure away.

**Reversal.** An earlier version also desaturated every instrument on a reproduction
failure. That cost more than it bought. Two thirds of the pixels that matter are
party-coloured, so draining the colour degraded the data itself in order to say something
the sentence already says, and it did so on the exact build a reader is most likely to be
scrutinising. The claim now carries its own weight and the instruments render at full
strength.

No exclamation marks. No rhetorical questions. No adjectives about outcomes.

---

## 8. Quality floor

Assumed, not announced: responsive to 380 px, visible keyboard focus on every interactive
element including the scrubber and each archipelago cell, reduced motion honoured, both
colour schemes shipped, all colour pairings at 4,5:1 for text and 3:1 for graphical
objects, every instrument duplicated as a keyboard-reachable table, a skip link to the
first instrument, no layout shift on rule change.

`--ink-faint` is the one token deliberately below 4,5:1. It is used for decoration and
disabled states and never carries information that is not also stated elsewhere.

## 9. Relationship to the house layer

This app takes the shared spacing scale, the motion curve family, the citation-line
pattern and the type floor from the house layer. It contributes back two things:

- the **continuous-versus-discrete motion rule** from §6.1, useful in any app with a
  live-driving control;
- the **two-register ground** from §0.1 and §2.1 — the observation that when a palette is
  given rather than chosen, a committed ground beats a compromise one, and that splitting
  reading from data along that line makes a second colour scheme nearly free.

It departs from the house layer in exactly one place: instruments sit on a near-black
stage inside an otherwise light document. Every other app in the family uses one surface
throughout. This one cannot, for the reason in §0, and the departure should be documented
rather than quietly normalised.
