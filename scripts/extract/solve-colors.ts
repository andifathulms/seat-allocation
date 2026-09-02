/**
 * One-time palette solve, committed for provenance.
 *
 * DESIGN.md §2.2 sets two constraints on the eighteen party colours:
 *
 *   1. parties sharing a hue family separate by at least 18 points of Lab
 *      lightness, adjusting lightness and never hue;
 *   2. every colour reaches 3:1 contrast against --panel.
 *
 * The first is enforced here. The second cannot be satisfied against a
 * mid-value panel — see DECISIONS.md — so this script reports each ratio
 * instead of forcing it, and the figure is auditable rather than assumed.
 *
 *   npx tsx scripts/extract/solve-colors.ts
 */

const PANEL = '#6E7370';
const PAPER = '#E8E9E6';

/**
 * Hue and chroma come from each party's logo. Lightness is solved below.
 *
 * `votes` is the 2024 national valid vote and is used only to decide which
 * member of a crowded hue family keeps its brand lightness: displacing the
 * colour a reader meets on two thirds of the screen costs more than displacing
 * one that appears in the legend at zero seats.
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

/** Two colours belong to the same hue family when their hues are this close. */
const FAMILY_ARC = 25;
const MIN_LIGHTNESS_GAP = 18;

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
 * far as the sRGB gamut requires. Hue is never touched: it is the recognisable
 * part.
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

// ---------- solve ----------

interface Solved {
  id: string;
  short: string;
  seed: string;
  votes: number;
  hue: number;
  seedLightness: number;
  lightness: number;
  hex: string;
}

const solved: Solved[] = SEEDS.map((s) => {
  const lab = rgbToLab(s.seed);
  return {
    id: s.id,
    short: s.short,
    seed: s.seed,
    votes: s.votes,
    hue: hueDegrees(lab),
    seedLightness: lab[0],
    lightness: lab[0],
    hex: s.seed,
  };
});

/**
 * Within each hue family, push lightness apart by the minimum that satisfies the
 * gap, then recentre the family on its original mean. Colours that already
 * separate do not move at all, so a party keeps its brand lightness unless
 * another party's hue forces it away — recognisability is the point of using
 * these colours in the first place.
 */
const families: Solved[][] = [];
for (const s of [...solved].sort((a, b) => a.hue - b.hue)) {
  const family = families.find((f) => f.some((m) => arc(m.hue, s.hue) < FAMILY_ARC));
  if (family) family.push(s);
  else families.push([s]);
}

/**
 * The band inside which a hue stays recognisably itself. Outside it a saturated
 * blue reads as white or as black, which defeats the purpose of separating it.
 */
const LIGHTNESS_BAND: [number, number] = [30, 82];

for (const family of families) {
  if (family.length < 2) continue;
  family.sort((a, b) => a.lightness - b.lightness);
  const anchor = family.reduce((a, m) => (m.votes > a.votes ? m : a), family[0] as Solved);

  // Five of the eighteen parties use a blue within a 40-degree arc. Holding the
  // full 18-point gap for all five would push the ends outside the band, so a
  // family too large for the gap takes the largest gap the band allows and the
  // shortfall is reported below rather than hidden.
  const gap = Math.min(
    MIN_LIGHTNESS_GAP,
    (LIGHTNESS_BAND[1] - LIGHTNESS_BAND[0]) / (family.length - 1),
  );

  for (let i = 1; i < family.length; i++) {
    const prev = family[i - 1] as Solved;
    const cur = family[i] as Solved;
    cur.lightness = Math.max(cur.lightness, prev.lightness + gap);
  }

  // Slide the whole family so the anchor lands back on its brand lightness.
  let shift = anchor.seedLightness - anchor.lightness;
  const lowest = (family[0] as Solved).lightness + shift;
  const highest = (family[family.length - 1] as Solved).lightness + shift;
  if (lowest < LIGHTNESS_BAND[0]) shift += LIGHTNESS_BAND[0] - lowest;
  if (highest > LIGHTNESS_BAND[1]) shift -= highest - LIGHTNESS_BAND[1];
  for (const m of family) m.lightness += shift;
}

for (const s of solved) {
  s.hex = atLightness(rgbToLab(s.seed), s.lightness);
}

// ---------- report ----------

const order = SEEDS.map((s) => solved.find((x) => x.id === s.id) as Solved);
console.log('party      seed     solved    L*    hue   vs panel  vs paper');
for (const s of order) {
  const lab = rgbToLab(s.hex);
  console.log(
    `${s.id.padEnd(10)} ${s.seed} ${s.hex} ${lab[0].toFixed(0).padStart(4)} ` +
      `${s.hue.toFixed(0).padStart(5)}  ${contrast(s.hex, PANEL).toFixed(2).padStart(7)}  ` +
      `${contrast(s.hex, PAPER).toFixed(2).padStart(7)}`,
  );
}

console.log('\nhue families and their lightness gaps');
for (const family of families) {
  if (family.length < 2) continue;
  const gaps = family
    .slice(1)
    .map((m, i) => m.lightness - (family[i] as Solved).lightness);
  const short = gaps.some((g) => g < MIN_LIGHTNESS_GAP - 0.5) ? '  (below 18)' : '';
  console.log(
    `  ${family.map((m) => m.id).join(' · ')}  →  ΔL* ` +
      `${gaps.map((g) => g.toFixed(0)).join(', ')}${short}`,
  );
}

console.log('\ncolors, ready to paste into parties-2024.json');
console.log(
  JSON.stringify(
    Object.fromEntries(order.map((s) => [s.id, s.hex])),
    null,
    2,
  ),
);
