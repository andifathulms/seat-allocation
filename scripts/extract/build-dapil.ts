/**
 * Builds public/data/dapil-2024.json.
 *
 * THIS FILE PRODUCES A PLACEHOLDER. It is not the certified recapitulation and
 * the file it writes says so at its root. See DECISIONS.md §1.
 *
 * Two things it does not know:
 *
 *   1. The dapil composition of PKPU 6/2023 — which kabupaten sit in which
 *      dapil, and each dapil's seat magnitude.
 *   2. The certified dapil x party votes from the Berita Acara and Sertifikat
 *      Rekapitulasi PDFs.
 *
 * Two things it holds exactly, because they come from certified national
 * figures:
 *
 *   - every party's national vote total, to the vote;
 *   - 580 seats across 84 dapil, none below 3 or above 10.
 *
 * Everything the app computes from national figures — the threshold, the
 * unconverted vote total, all three disproportionality indices — is therefore
 * computed on real numbers. Everything it computes per dapil is not.
 *
 * Replacing this means writing the certified file in place with
 * "provenance": "certified". Nothing else changes.
 *
 *   npm run data:build
 */

import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '../../public/data');

const TARGET_DAPIL = 84;
const TARGET_SEATS = 580;
const MAX_MAGNITUDE = 10;
const MIN_MAGNITUDE = 3;

/**
 * DPR seats per province for 2024, west to east. The five provinces created in
 * 2022 carry the minimum magnitude; Papua's ten seats in 2019 became three for
 * Papua plus three each for Papua Selatan, Papua Tengah and Papua Pegunungan,
 * and Papua Barat's three became three each for Papua Barat and Papua Barat
 * Daya. Verify against PKPU 6/2023 before treating any of this as certified.
 */
const PROVINCES: Array<{ code: string; name: string; seats: number }> = [
  { code: 'ACEH', name: 'Aceh', seats: 13 },
  { code: 'SUMUT', name: 'Sumatera Utara', seats: 30 },
  { code: 'SUMBAR', name: 'Sumatera Barat', seats: 14 },
  { code: 'RIAU', name: 'Riau', seats: 13 },
  { code: 'JAMBI', name: 'Jambi', seats: 8 },
  { code: 'SUMSEL', name: 'Sumatera Selatan', seats: 17 },
  { code: 'BENGKULU', name: 'Bengkulu', seats: 4 },
  { code: 'LAMPUNG', name: 'Lampung', seats: 19 },
  { code: 'BABEL', name: 'Kepulauan Bangka Belitung', seats: 3 },
  { code: 'KEPRI', name: 'Kepulauan Riau', seats: 4 },
  { code: 'DKI', name: 'DKI Jakarta', seats: 21 },
  { code: 'JABAR', name: 'Jawa Barat', seats: 91 },
  { code: 'BANTEN', name: 'Banten', seats: 22 },
  { code: 'JATENG', name: 'Jawa Tengah', seats: 78 },
  { code: 'DIY', name: 'DI Yogyakarta', seats: 8 },
  { code: 'JATIM', name: 'Jawa Timur', seats: 87 },
  { code: 'BALI', name: 'Bali', seats: 9 },
  { code: 'NTB', name: 'Nusa Tenggara Barat', seats: 10 },
  { code: 'NTT', name: 'Nusa Tenggara Timur', seats: 13 },
  { code: 'KALBAR', name: 'Kalimantan Barat', seats: 10 },
  { code: 'KALTENG', name: 'Kalimantan Tengah', seats: 6 },
  { code: 'KALSEL', name: 'Kalimantan Selatan', seats: 11 },
  { code: 'KALTIM', name: 'Kalimantan Timur', seats: 8 },
  { code: 'KALTARA', name: 'Kalimantan Utara', seats: 3 },
  { code: 'SULUT', name: 'Sulawesi Utara', seats: 6 },
  { code: 'GORONTALO', name: 'Gorontalo', seats: 3 },
  { code: 'SULTENG', name: 'Sulawesi Tengah', seats: 7 },
  { code: 'SULBAR', name: 'Sulawesi Barat', seats: 4 },
  { code: 'SULSEL', name: 'Sulawesi Selatan', seats: 27 },
  { code: 'SULTRA', name: 'Sulawesi Tenggara', seats: 6 },
  { code: 'MALUT', name: 'Maluku Utara', seats: 3 },
  { code: 'MALUKU', name: 'Maluku', seats: 4 },
  { code: 'PAPBARDAYA', name: 'Papua Barat Daya', seats: 3 },
  { code: 'PAPBAR', name: 'Papua Barat', seats: 3 },
  { code: 'PAPTENGAH', name: 'Papua Tengah', seats: 3 },
  { code: 'PAPPEG', name: 'Papua Pegunungan', seats: 3 },
  { code: 'PAPUA', name: 'Papua', seats: 3 },
  { code: 'PAPSEL', name: 'Papua Selatan', seats: 3 },
];

const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
];

// ---------- dapil composition ----------

/**
 * Splits each province into the fewest dapil that keep every magnitude at or
 * below ten, then adds dapil to the provinces with the largest average until the
 * national count reaches 84 — the same highest-averages idea the engine uses,
 * applied to districts rather than seats.
 */
function splitProvinces(): Array<{ province: string; code: string; magnitude: number }> {
  const counts = new Map(
    PROVINCES.map((p) => [p.code, Math.ceil(p.seats / MAX_MAGNITUDE)] as const),
  );
  let total = [...counts.values()].reduce((a, b) => a + b, 0);

  while (total < TARGET_DAPIL) {
    let bestCode = '';
    let bestAverage = -Infinity;
    for (const p of PROVINCES) {
      const next = (counts.get(p.code) as number) + 1;
      if (p.seats / next < MIN_MAGNITUDE) continue;
      const average = p.seats / (counts.get(p.code) as number);
      if (average > bestAverage) {
        bestAverage = average;
        bestCode = p.code;
      }
    }
    if (!bestCode) throw new Error('cannot reach 84 dapil within the magnitude bounds');
    counts.set(bestCode, (counts.get(bestCode) as number) + 1);
    total++;
  }

  const out: Array<{ province: string; code: string; magnitude: number }> = [];
  for (const p of PROVINCES) {
    const k = counts.get(p.code) as number;
    // Distribute the province's seats as evenly as the count allows, the larger
    // remainder going to the lower-numbered dapil.
    const base = Math.floor(p.seats / k);
    const extra = p.seats % k;
    for (let i = 0; i < k; i++) {
      const magnitude = base + (i < extra ? 1 : 0);
      if (magnitude < MIN_MAGNITUDE || magnitude > MAX_MAGNITUDE) {
        throw new Error(`${p.code} produced a magnitude of ${magnitude}`);
      }
      out.push({
        province: p.name,
        code: k === 1 ? p.code : `${p.code}-${i + 1}`,
        magnitude,
      });
    }
  }
  return out;
}

// ---------- synthetic votes ----------

/**
 * A small deterministic hash. The engine is pure and so is this script: there is
 * no Math.random anywhere, and re-running the build reproduces the file byte for
 * byte.
 */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Spreads a party's national vote across the dapil in proportion to magnitude,
 * modulated by a per-party per-dapil factor so that parties are regionally
 * uneven rather than uniform. Rounding is by largest remainder, so the dapil
 * figures sum back to the national total exactly.
 */
function spread(
  partyId: string,
  nationalVotes: number,
  dapil: Array<{ code: string; magnitude: number }>,
): number[] {
  const weights = dapil.map((d) => {
    // 0,35 to 1,65 of the district's proportional share.
    const swing = 0.35 + hash(`${partyId}|${d.code}`) * 1.3;
    return d.magnitude * swing;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const exact = weights.map((w) => (w / totalWeight) * nationalVotes);
  const floors = exact.map(Math.floor);
  let remaining = nationalVotes - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of order) {
    if (remaining <= 0) break;
    floors[i] = (floors[i] as number) + 1;
    remaining--;
  }
  return floors;
}

// ---------- build ----------

interface PartyRecord {
  id: string;
  nationalVotes: number;
}

const parties: PartyRecord[] = JSON.parse(
  readFileSync(resolve(dataDir, 'parties-2024.json'), 'utf8'),
).parties;

const composition = splitProvinces();
const totalSeats = composition.reduce((a, d) => a + d.magnitude, 0);
if (composition.length !== TARGET_DAPIL) {
  throw new Error(`built ${composition.length} dapil, expected ${TARGET_DAPIL}`);
}
if (totalSeats !== TARGET_SEATS) {
  throw new Error(`built ${totalSeats} seats, expected ${TARGET_SEATS}`);
}

const votesByParty = new Map<string, number[]>(
  parties.map((p) => [p.id, spread(p.id, p.nationalVotes, composition)]),
);

// Number the dapil within each province once the composition is final.
const seenInProvince = new Map<string, number>();
const provinceSize = new Map<string, number>();
for (const d of composition) {
  provinceSize.set(d.province, (provinceSize.get(d.province) ?? 0) + 1);
}

const dapil = composition.map((d, index) => {
  const n = (seenInProvince.get(d.province) ?? 0) + 1;
  seenInProvince.set(d.province, n);
  const multiple = (provinceSize.get(d.province) as number) > 1;
  const votes: Record<string, number> = {};
  for (const p of parties) {
    votes[p.id] = (votesByParty.get(p.id) as number[])[index] as number;
  }
  return {
    code: d.code,
    name: multiple ? `${d.province} ${ROMAN[n - 1]}` : d.province,
    province: d.province,
    magnitude: d.magnitude,
    votes,
  };
});

const doc = {
  election: '2024',
  provenance: 'synthetic',
  provenanceNote:
    'Komposisi dapil dan suara per dapil pada berkas ini adalah placeholder yang ' +
    'dibangun oleh scripts/extract/build-dapil.ts, bukan hasil rekapitulasi ' +
    'bersertifikat KPU. Total suara nasional tiap partai dan total 580 kursi pada ' +
    '84 dapil sesuai angka resmi; angka per dapil tidak. Lihat DECISIONS.md butir 1.',
  totalSeats: TARGET_SEATS,
  dapil,
};

writeFileSync(resolve(dataDir, 'dapil-2024.json'), `${JSON.stringify(doc, null, 2)}\n`);

console.log(`${dapil.length} dapil, ${totalSeats} seats`);
const magnitudes = dapil.map((d) => d.magnitude);
console.log(
  `magnitudes ${Math.min(...magnitudes)}..${Math.max(...magnitudes)}, ` +
    `mean ${(totalSeats / dapil.length).toFixed(2)}`,
);
for (const p of parties) {
  const sum = (votesByParty.get(p.id) as number[]).reduce((a, b) => a + b, 0);
  if (sum !== p.nationalVotes) {
    throw new Error(`${p.id}: dapil votes sum to ${sum}, national total ${p.nationalVotes}`);
  }
}
console.log('every party’s dapil votes sum to its national total');
