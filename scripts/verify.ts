/**
 * The reproduction gate. Runs in CI and as a pre-step of npm run build.
 *
 *   1. Load all four JSON files.
 *   2. Assert each party's dapil votes sum to its national total.
 *   3. Assert all national totals sum to 151.796.631.
 *   4. Run allocate() with the 2024 statutory RuleSet.
 *   5. Assert computed seats match official-2024.json for every party in every dapil.
 *   6. Assert the total is 580.
 *   7. Print the unconverted-vote figure and the three disproportionality indices.
 *
 * Step 7 prints rather than asserts: the unconverted figure is a computed result,
 * not an input. If it does not land near 17,3 million that is worth investigating,
 * and the computed number is reported rather than forced into agreement.
 *
 * Exits non-zero on any failure, and on step 5 being unattemptable.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reproduce } from '../src/data/reproduction';
import type { Dataset } from '../src/data/schema';

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data');
const read = (name: string): unknown =>
  JSON.parse(readFileSync(resolve(dataDir, name), 'utf8'));

const data = {
  parties: read('parties-2024.json'),
  dapil: read('dapil-2024.json'),
  official: read('official-2024.json'),
  rules: read('rules-2024.json'),
} as Dataset;

const id = (n: number, digits = 0): string =>
  n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const started = performance.now();
const result = reproduce(data);
const elapsed = performance.now() - started;

console.log('Suara ke Kursi — gerbang reproduksi\n');

console.log(`  provenance  partai ${data.parties.provenance} · dapil ${data.dapil.provenance} · resmi ${data.official.provenance}`);
console.log(`  aturan      ambang 4,0% nasional · Sainte-Laguë · 84 dapil`);
console.log(`  waktu       ${elapsed.toFixed(1)} ms untuk satu alokasi penuh\n`);

let failed = false;
for (const check of result.checks) {
  const mark = check.passed === true ? '  lulus ' : check.passed === false ? '  GAGAL ' : '  lewat ';
  if (check.passed === false) failed = true;
  console.log(`${mark} ${check.label}`);
  console.log(`         ${check.detail}`);
}

console.log('\n  kursi per partai');
const parties = [...data.parties.parties].sort(
  (a, b) => (result.baseline.seatsByParty[b.id] ?? 0) - (result.baseline.seatsByParty[a.id] ?? 0),
);
for (const p of parties) {
  const got = result.baseline.seatsByParty[p.id] ?? 0;
  const want = data.official.seatsByParty[p.id] ?? 0;
  const mark = got === want ? ' ' : '≠';
  console.log(
    `  ${mark} ${p.shortName.padEnd(9)} ${String(got).padStart(3)} dihitung   ${String(want).padStart(3)} resmi   ` +
      `${id((p.nationalVotes / data.parties.totalValidVotes) * 100, 3).padStart(6)}% suara`,
  );
}

const m = result.baseline.metrics;
console.log('\n  angka yang dihitung, bukan diasumsikan');
console.log(`  suara tidak menjadi kursi   ${id(m.unconvertedVotes).padStart(12)}  (${id(m.unconvertedShare * 100, 2)}%)`);
console.log(`  Perludem mencatat           ${id(17_304_303).padStart(12)}  selisih ${id(m.unconvertedVotes - 17_304_303)}`);
console.log(`  indeks Gallagher            ${id(m.gallagher, 2).padStart(12)}`);
console.log(`  indeks Loosemore–Hanby      ${id(m.loosemoreHanby, 2).padStart(12)}`);
console.log(`  ENP suara → kursi           ${id(m.enpVotes, 2).padStart(12)} → ${id(m.enpSeats, 2)}`);
if (result.baseline.ties.length > 0) {
  console.log(`\n  ${result.baseline.ties.length} hasil bagi seri ditemukan:`);
  for (const t of result.baseline.ties) {
    console.log(`    ${t.dapil} kursi ke-${t.ordinal}: ${t.parties.join(', ')}`);
  }
}

console.log('');
if (result.reproduced) {
  console.log(`  REPRODUKSI COCOK — ${result.seatsMatched} dari ${result.seatsTotal} kursi, ${result.dapilMatched} dari ${result.dapilTotal} dapil.`);
  process.exit(0);
}

if (result.notAttempted) {
  console.log('  REPRODUKSI TIDAK DAPAT DIUJI');
  console.log(`  ${result.notAttempted}`);
  console.log('  Lihat DECISIONS.md butir 1. Ganti public/data/dapil-2024.json dengan');
  console.log('  rekapitulasi bersertifikat, lalu jalankan ulang perintah ini.');
} else {
  console.log('  REPRODUKSI GAGAL. Datanya yang salah, bukan mesinnya.');
}
process.exit(1);
