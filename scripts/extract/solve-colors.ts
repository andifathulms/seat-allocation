/**
 * Palette solve, committed for provenance.
 *
 *   npx tsx scripts/extract/solve-colors.ts --write
 *
 * DESIGN.md §2 sets three constraints on the eighteen party colours:
 *
 *   1. hue is never touched — it is the recognisable part;
 *   2. every colour reaches 3,5:1 against `--stage`, the one ground any party
 *      colour is ever drawn on;
 *   3. parties sharing a hue family separate by at least MIN_LIGHTNESS_GAP
 *      points of Lab lightness.
 *
 * The 2024 revision moved the instrument ground from a mid-value grey to a deep
 * one. That single change is what makes this solve tractable: against a mid
 * ground the gamut had to be spread in both directions, which forced five of the
 * eighteen into pastels that no longer read as the party. Against a deep ground
 * the whole usable band sits above L* 48, where hues stay saturated, so the
 * contrast floor and the family separation can both be met without draining
 * chroma. See DESIGN.md §2.2 and DECISIONS.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';

/** The only ground a party colour is ever drawn on. DESIGN.md §2.1. */
const STAGE = '#16191D';
/** Reading ground. No party colour is drawn on it; reported for audit only. */
const PAPER = '#F2F1ED';

const MIN_CONTRAST = 3.5;
/** Two colours belong to the same hue family when their hues are this close. */
const FAMILY_ARC = 22;
const MIN_LIGHTNESS_GAP = 11;
/** Outside this band a saturated hue reads as grey or as white. */
const LIGHTNESS_BAND: [number, number] = [48, 90];

/**
 * Hue and chroma come from each party's logo. Lightness is solved below.
 *
 * `votes` is the 2024 national valid vote and decides which member of a crowded
 * hue family keeps its brand lightness: displacing the colour a reader meets on
 * two thirds of the screen costs more than displacing one that appears in the
 * legend at zero seats.
 */
const SEEDS: Array<{ id: string; short: string; seed: string; votes: number }> = [
  { id: 'pkb', short: 'PKB', seed: '#00A651', votes: 16_115_655 },
  { id: 'gerindra', short: 'Gerindra', seed: '#C39B3E', votes: 20_071_708 },
  { id: 'pdip', short: 'PDI-P', seed: '#E1251B', votes: 25_387_279 },
  { id: 'golkar', short: 'Golkar', seed: '#F5C400', votes: 23_208_654 },
  { id: 'nasdem', short: 'NasDem', seed: '#10357F', votes: 14_660_516 },
  { id: 'buruh', short: 'Buruh', seed: '#F26522', votes: 972_910 },
  { id: 'gelora', short: 'Gelora', seed: '#00A0DF', votes: 1_281_991 },
  { id: 'pks', short: 'PKS', seed: '#EE7203', votes: 12_781_353 },
  { id: 'pkn', short: 'PKN', seed: '#2E5FA3', votes: 326_800 },
  { id: 'hanura', short: 'Hanura', seed: '#D6202A', votes: 1_094_588 },
  { id: 'garuda', short: 'Garuda', seed: '#B08A1E', votes: 406_883 },
  { id: 'pan', short: 'PAN', seed: '#005CA9', votes: 10_984_003 },
  { id: 'pbb', short: 'PBB', seed: '#00733E', votes: 484_486 },
  { id: 'demokrat', short: 'Demokrat', seed: '#1C6FC4', votes: 11_283_160 },
  { id: 'psi', short: 'PSI', seed: '#E5007D', votes: 4_260_169 },
  { id: 'perindo', short: 'Perindo', seed: '#0F4C9E', votes: 1_955_154 },
  { id: 'ppp', short: 'PPP', seed: '#009444', votes: 5_878_777 },
  { id: 'ummat', short: 'Ummat', seed: '#0E7C5A', votes: 642_545 },
];

// ---------- colour space ----------

type Rgb = [number, number, number];
type Lab = [number, number, number];

function hexToRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex([r, g, b]: Rgb): string {
  const c = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const fromLinear = (c: number): number =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => toLinear(v / 255)) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const D65: Rgb = [0.95047, 1.0, 1.08883];

function rgbToLab(hex: string): Lab {
  const [r, g, b] = hexToRgb(hex).map((v) => toLinear(v / 255)) as Rgb;
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / D65[0];
  const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / D65[1];
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / D65[2];
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labToHex([L, a, bb]: Lab): string {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - bb / 200;
  const g = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (108 / 841) * (t - 4 / 29));
  const x = g(fx) * D65[0];
  const y = g(fy) * D65[1];
  const z = g(fz) * D65[2];
  const r = 3.2406 * x - 1.5372 * y - 0.4986 * z;
  const gr = -0.9689 * x + 1.8758 * y + 0.0415 * z;
  const b = 0.0557 * x - 0.204 * y + 1.057 * z;
  return rgbToHex([fromLinear(r) * 255, fromLinear(gr) * 255, fromLinear(b) * 255] as Rgb);
}

/**
 * Re-lightens a colour to a target L*, holding hue and shrinking chroma only as
 * far as the sRGB gamut requires.
 */
function atLightness(lab: Lab, targetL: number): string {
  const [, a, b] = lab;
  const chroma = Math.hypot(a, b);
  const hue = Math.atan2(b, a);
  for (let scale = 1; scale >= 0; scale -= 0.01) {
    const c = chroma * scale;
    const candidate: Lab = [targetL, Math.cos(hue) * c, Math.sin(hue) * c];
    const hex = labToHex(candidate);
    const back = rgbToLab(hex);
    if (Math.abs(back[0] - targetL) < 1 && Math.hypot(back[1], back[2]) >= c - 1.5) {
      return hex;
    }
  }
  return labToHex([targetL, 0, 0]);
}

function hueDegrees(lab: Lab): number {
  const d = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  return (d + 360) % 360;
}

function arc(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Lowest L* at which this hue clears MIN_CONTRAST against the stage. */
function floorFor(lab: Lab): number {
  for (let L = LIGHTNESS_BAND[0]; L <= LIGHTNESS_BAND[1]; L += 0.5) {
    if (contrast(atLightness(lab, L), STAGE) >= MIN_CONTRAST) return L;
  }
  return LIGHTNESS_BAND[1];
}

// ---------- solve ----------

interface Solved {
  id: string;
  short: string;
  seed: string;
  votes: number;
  hue: number;
  seedLightness: number;
  floor: number;
  lightness: number;
  hex: string;
}

const solved: Solved[] = SEEDS.map((s) => {
  const lab = rgbToLab(s.seed);
  const floor = Math.max(LIGHTNESS_BAND[0], floorFor(lab));
  return {
    id: s.id,
    short: s.short,
    seed: s.seed,
    votes: s.votes,
    hue: hueDegrees(lab),
    seedLightness: lab[0],
    floor,
    // A colour already light enough keeps its brand lightness exactly.
    lightness: Math.min(LIGHTNESS_BAND[1], Math.max(lab[0], floor)),
    hex: s.seed,
  };
});

/**
 * Within each hue family, walk upward from the darkest member and push each
 * successor to at least MIN_LIGHTNESS_GAP above its predecessor. Upward only:
 * the contrast floor already fixes the bottom of the band, so there is nowhere
 * below to go, and pushing up keeps every member inside the saturated range.
 */
const families: Solved[][] = [];
for (const s of [...solved].sort((a, b) => a.hue - b.hue)) {
  const family = families.find((f) => f.some((m) => arc(m.hue, s.hue) < FAMILY_ARC));
  if (family) family.push(s);
  else families.push([s]);
}

/**
 * Within each family the largest party keeps its brand lightness exactly, and
 * the others take the slot nearest their own brand lightness that clears the gap
 * from every party already placed. Fidelity therefore tracks screen presence:
 * the colour a reader meets on two thirds of the screen is the one that stays
 * true, and the colour that appears once in a legend at zero seats is the one
 * that moves. Where the band cannot hold the whole family at the full gap, the
 * remaining member takes the position furthest from its neighbours and the
 * shortfall is printed rather than hidden.
 */
for (const family of families) {
  if (family.length < 2) continue;
  family.sort((a, b) => b.votes - a.votes);

  const placed: number[] = [];
  for (const member of family) {
    const low = Math.max(LIGHTNESS_BAND[0], member.floor);
    const high = LIGHTNESS_BAND[1];
    const want = Math.min(high, Math.max(low, member.lightness));

    if (placed.length === 0) {
      member.lightness = want;
      placed.push(want);
      continue;
    }

    let best = want;
    let bestScore = -Infinity;
    for (let L = low; L <= high; L += 0.5) {
      const nearest = Math.min(...placed.map((q) => Math.abs(q - L)));
      // Clearing the gap is worth more than brand fidelity; among the slots
      // that clear it, the one nearest the brand lightness wins.
      const score = Math.min(nearest, MIN_LIGHTNESS_GAP) * 1000 - Math.abs(L - want);
      if (score > bestScore) {
        bestScore = score;
        best = L;
      }
    }
    member.lightness = best;
    placed.push(best);
  }
}

for (const s of solved) {
  s.hex = atLightness(rgbToLab(s.seed), s.lightness);
}

// ---------- report ----------

const order = SEEDS.map((s) => solved.find((x) => x.id === s.id) as Solved);
let failures = 0;

console.log(`stage ${STAGE}   paper ${PAPER}   floor ${MIN_CONTRAST}:1\n`);
console.log('party      seed     solved     L*   hue   vs stage  vs paper');
for (const s of order) {
  const lab = rgbToLab(s.hex);
  const vsStage = contrast(s.hex, STAGE);
  if (vsStage < MIN_CONTRAST - 0.01) failures++;
  console.log(
    `${s.id.padEnd(10)} ${s.seed} ${s.hex} ${lab[0].toFixed(0).padStart(4)} ` +
      `${s.hue.toFixed(0).padStart(5)}  ${vsStage.toFixed(2).padStart(8)}  ` +
      `${contrast(s.hex, PAPER).toFixed(2).padStart(8)}`,
  );
}

console.log('\nhue families');
for (const family of families) {
  if (family.length < 2) continue;
  const members = [...family].sort((a, b) => a.lightness - b.lightness);
  const gaps = members
    .slice(1)
    .map((m, i) => (m.lightness - (members[i] as Solved).lightness).toFixed(0));
  console.log(
    `  ${members.map((m) => m.short).join(' · ')}  L* ` +
      `${members.map((m) => m.lightness.toFixed(0)).join(' ')}  gaps ${gaps.join(' ')}`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} colour(s) below ${MIN_CONTRAST}:1 against the stage.`);
  process.exitCode = 1;
}

// ---------- write ----------

if (process.argv.includes('--write')) {
  const path = new URL('../../public/data/parties-2024.json', import.meta.url);
  const file = readFileSync(path, 'utf8');
  const data = JSON.parse(file) as { parties: Array<{ id: string; color: string }> };
  for (const party of data.parties) {
    const match = solved.find((s) => s.id === party.id);
    if (match) party.color = match.hex;
  }
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`\nwrote ${data.parties.length} colours to public/data/parties-2024.json`);
}
