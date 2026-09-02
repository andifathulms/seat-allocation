# DESIGN.md — Suara ke Kursi

Visual and motion specification. PRD.md defines what the app does; this defines what it
looks like and how it moves. Where the two conflict, PRD wins on substance and this file
wins on form.

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
2. **The background cannot be white or black.** Golkar's yellow is the second-largest
   block on screen and disappears on white. NasDem's navy disappears on black. The ground
   has to sit in the middle so that both ends of the party palette hold. This is a real
   legibility constraint, not a stylistic preference, and it produces a surface treatment
   that would be wrong for almost any other app.

---

## 1. Design plan

**Concept: the tally sheet and the chamber.**

Two surfaces, two registers. Reading matter — headings, explanation, pasal text — sits on
a light, slightly cool paper ground, the tone of the recycled stock election forms are
printed on. Data sits inset on a mid-value grey panel, dark enough that yellow reads and
light enough that navy reads. The instruments are windows cut into the page.

Structure encodes the arithmetic, not decoration. Numbers are set in a narrow face so that
figures stack in columns the way a tally does. The one moment of visual drama in the whole
app is a party re-entering parliament.

**Alignment:** everything left-aligned except numerals, which are right-aligned in their
columns so digits line up. The hemicycle is the only centred element on the page, and it
is centred because the chamber it depicts is symmetrical.

---

## 2. Colour

### 2.1 Ground and chrome

| Token | Value | Use |
|---|---|---|
| `--paper` | `#E8E9E6` | Page ground. Cool light grey, the tone of election-form stock. |
| `--panel` | `#6E7370` | Instrument panels. Mid-value neutral so the full party gamut holds against it. |
| `--panel-deep` | `#585D5A` | Recessed areas inside panels: the empty seat arc, unclaimed quotient slots. |
| `--ink` | `#16191A` | Primary text on paper. |
| `--ink-soft` | `#4A4F4E` | Secondary text, axis labels, definitions. |
| `--ink-panel` | `#F2F3F1` | Text on panels. |
| `--rule` | `#C3C6C1` | Hairlines on paper. |
| `--rule-panel` | `#8A8F8C` | Hairlines on panels. |

Only two functional non-party colours exist in the entire app:

| Token | Value | Use |
|---|---|---|
| `--void` | `#2B2E2D` | Votes that converted to no seat. Near-neutral, deliberately not red — this is a category, not an alarm. |
| `--warn` | `#B4472E` | Reserved exclusively for the reproduction-failure state and for tie warnings. Never decorative. If this colour appears, something is wrong. |

Nothing else in the chrome is coloured. No hover tints, no selection blues, no gradients.
Selection is indicated by a 2 px `--ink` outline and a small offset, not by colour.

### 2.2 Party colours

Source each party's colour from its official logo or AD/ART. Verify before shipping — the
table below is a starting point, not a reference.

Disambiguation rules, applied after sourcing:

- Where two parties share a hue family (there are several greens and several blues),
  separate them on lightness by at least 18 points in Lab, keeping each recognisable.
- Every party colour must reach 3:1 contrast against `--panel`. Adjust lightness, never
  hue — hue is the recognisable part.
- The eliminated state is not a different colour. An eliminated party keeps its hue at
  40% chroma and gains a fine diagonal hatch. It must stay identifiable in the legend at
  zero seats, because watching a specific party sit at zero is the point.

Store colours in `parties-2024.json`, never in CSS. The data owns them.

### 2.3 What is forbidden

No colour scales, no heatmaps, no sequential ramps, no "primary/secondary/accent" system.
No colour indicates good or bad. No red for loss, no green for gain — deltas are indicated
by direction arrows and sign, in `--ink`.

---

## 3. Typography

Two families. Self-hosted, subset to Latin plus the Indonesian diacritics actually used.

**Archivo** — everything except pasal text. Grotesque, slightly condensed by default, with
true tabular lining figures and a genuine narrow width. It has a civic, signage-adjacent
character that suits a document about electoral administration without costuming itself as
one.

- `Archivo` for interface text, labels, and running copy.
- `Archivo Narrow` for all large numerals: seat counts, vote totals, quotients, metric
  values. Narrow figures stack into columns the way tallies do, and at the sizes this app
  needs — a 580 rendered large, quotients in eighteen parallel columns — the width saving
  is structural, not cosmetic.

**Source Serif 4** — pasal text only, and nowhere else in the app.

Indonesian legislation is set in serif, and the app's central discipline is separating
*what the law says* from *what the computation produced*. Giving the law its own voice
makes that separation visible without a label. Because it appears only inside citation
popovers, the serif reads as a quotation from another document rather than as decoration.
If it starts appearing in headings, delete it.

### 3.1 Scale

Modular, ratio 1.25, base 16 px.

| Token | Size / line-height | Use |
|---|---|---|
| `--t-hero` | 76 / 0.9, Narrow, 600 | The seat total. One instance on the page. |
| `--t-figure` | 39 / 1.0, Narrow, 600 | Metric values, party seat counts in the legend. |
| `--t-h1` | 31 / 1.15, 600 | Page title. |
| `--t-h2` | 25 / 1.2, 600 | Instrument headings. |
| `--t-body` | 16 / 1.55, 400 | Running copy. Max 68 characters. |
| `--t-small` | 13 / 1.45, 400 | Definitions, axis labels, citation markers. |
| `--t-micro` | 11 / 1.3, 500 | Dapil codes in the archipelago grid, seat ordinals. |
| `--t-law` | 15 / 1.7, Source Serif 4 400 | Pasal text in popovers. Max 62 characters. |

All figures use `font-variant-numeric: tabular-nums lining-nums`. Non-negotiable — the app
animates numbers, and proportional figures will jitter.

### 3.2 Typographic prohibitions

No all-caps labels. No tracked-out eyebrows above headings. No monospace for data labels —
Archivo Narrow's tabular figures already do that job better. No single word in a heading
given a different weight or colour. Sentence case throughout, including buttons.

---

## 4. Layout

### 4.1 Page structure

```
┌──────────────────────────────────────────────────────────┐
│ Suara ke Kursi            ✓ 580/580 · 84/84 dapil        │  ← verification, always
├──────────────────────────────────────────────────────────┤
│                                                          │
│                      ╭─────────────╮                     │
│                   ╭──╯   CHAMBER   ╰──╮                  │  ← hero, centred
│                ╭──╯   580 hemicycle   ╰──╮               │
│                                                          │
│   PDI-P 110  Golkar 102  Gerindra 86  …  PPP 0           │  ← legend, left-aligned
├──────────────────────────────────────────────────────────┤
│  17.304.303        6,2         2,8        8,4 → 6,1      │  ← metric strip
│  suara tak jadi    Gallagher   L–H        ENP suara→kursi│
├──────────────────────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░  VOTE BAR      │
├──────────────────────────────────────────────────────────┤
│  ▪▪▪▪▪▪▪▪▪▪▪▪  ARCHIPELAGO, 84 cells, west → east        │
│  ▪▪▪▪▪▪▪▪▪▪▪▪                                            │
├──────────────────────────────────────────────────────────┤
│  CASCADE — selected dapil, steppable                     │
├──────────────────────────────────────────────────────────┤
│  PROPORTIONALITY — vote share × seat share               │
└──────────────────────────────────────────────────────────┘
╔══════════════════════════════════════════════════════════╗
║ 0%────┃2,5────3,5──[4,0]──────────────────────────10%    ║  ← sticky transport
║ Ambang nasional · Sainte-Laguë · 84 dapil · Setel ulang  ║
╚══════════════════════════════════════════════════════════╝
```

### 4.2 The transport bar

The controls are pinned to the bottom of the viewport as a full-width bar, styled as a
scrubber rather than a form. This is deliberate: the app's entire interaction model is
*drag and watch*, and a transport bar is the interface vocabulary people already have for
that. It also solves the mobile problem for free — the control stays under the thumb while
the chamber stays at eye level.

The threshold scrubber runs the full width with tick marks at 2,5% · 3,5% · 4,0% and at
the effective threshold implied by Laakso–Taagepera. Ticks are labelled with the year the
figure applied, so the historical range is legible without a separate view.

The three discrete controls sit below the scrubber as inline text toggles, not dropdowns
or segmented pills. Reset is a text link at the right, disabled at defaults.

**The counterfactual statement (PRD §10.1) lives in this bar**, appearing directly above
the scrubber the moment any control leaves its default and staying until reset. It is set
in `--t-small` on paper ground, and the bar grows to accommodate it rather than the text
overlaying anything.

### 4.3 Grid and rhythm

12-column grid, 72 rem max width, 24 px gutters. Instruments span full width; running copy
never exceeds 68 characters and sits in the left seven columns.

Spacing scale: 4 · 8 · 12 · 16 · 24 · 40 · 64 · 104. Sections separated by 64, elements
within an instrument by 12 or 16.

Panels have a 2 px radius — effectively square, because these are windows onto data, not
cards. No shadows anywhere. Panels are distinguished from paper by value alone.

### 4.4 Mobile

Below 720 px the hemicycle scales to a 380 px-wide arc and remains the hero. The
archipelago becomes 6 columns and gains vertical scroll. The cascade shows four party
columns at a time with horizontal scroll and snap points. The transport bar keeps the
scrubber full width and collapses the three discrete controls behind one "Aturan" sheet.

---

## 5. The five instruments

### 5.1 Chamber — the hero

580 seats in a hemicycle: concentric arcs, seats sized so the outermost row reads clearly
at 380 px. Parties are ordered around the arc by seat count, largest at the left, which
keeps block boundaries stable as counts change and avoids implying a left-right political
axis the app has no business asserting.

Each seat is a circle. Party blocks carry their short name and seat count at the block
centroid, in `--ink-panel`, dropping to a leader line when a block is too small.

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
navigable. The quotient arithmetic for the current step is printed beneath in full —
`Gerindra 229.174 ÷ 3 = 76.391` — so the numbers can be checked by hand.

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
as a figure, and it is one of the more arresting numbers in the app.

### 5.4 Vote bar

One horizontal bar, full width, representing 151.796.631 valid votes. Converted votes are
segmented by party in party colour; unconverted votes are one `--void` segment at the
right, subdivided by hairlines into the individual parties that make it up, each labelled
where it fits.

The boundary between converted and unconverted is the only element in the app that moves
horizontally across the full page width, which makes it the clearest reading of the
threshold's cost.

### 5.5 Proportionality plot

Vote share on x, seat share on y, one dot per party at its colour, sized by votes. A 45°
line, `--rule-panel`, 1 px, no label — the geometry explains itself. Dots above are
over-represented, below under-represented. Eliminated parties sit on the x-axis at y = 0,
which is where the threshold's effect is geometrically obvious.

Axis ticks every 5 percentage points, `--t-small`, `--ink-soft`.

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

Do not add a sound, a flash, a particle effect, or a caption. The seats arriving is
enough.

### 6.5 Reduced motion

`prefers-reduced-motion: reduce` replaces every transition with an immediate state write.
The cascade's play mode is disabled and the view becomes step-only. Nothing is lost except
the animation; every number remains reachable.

---

## 7. Copy

Indonesian, sentence case, plain verbs.

Labels name what the user sees: "Suara yang tidak menjadi kursi", not "Wasted votes
index". Controls name what happens: "Setel ulang ke aturan 2024", not "Reset".

Definitions are one sentence and sit adjacent to the number they define, not behind a
question-mark icon.

The verification line reads as a fact, not a badge: `Hasil resmi 2024 direproduksi: 580
dari 580 kursi, 84 dari 84 dapil.` If reproduction fails it reads as a plain statement of
what failed, in `--warn`, and the instruments below it are dimmed rather than hidden.

No exclamation marks. No rhetorical questions. No adjectives about outcomes.

---

## 8. Quality floor

Assumed, not announced: responsive to 380 px, visible keyboard focus on every interactive
element including the scrubber and each archipelago cell, reduced motion honoured, all
colour pairings at 4.5:1 for text and 3:1 for graphical objects, every instrument
duplicated as a keyboard-reachable table, no layout shift on rule change.

## 9. Relationship to the house layer

This app takes the shared spacing scale, the motion curve family, the citation-line
pattern and the type floor from the house layer. It contributes back the
continuous-versus-discrete motion rule from §6.1, which is likely to be useful in any
other app with a live-driving control.

It departs from the house layer in exactly one place: the mid-value panel ground. Every
other app in the family uses a light or dark surface. This one cannot, for the reason in
§0, and the departure should be documented rather than quietly normalised.
