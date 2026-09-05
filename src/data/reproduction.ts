import { allocate, RULES_2024 } from '../engine';
import type { Allocation } from '../engine/types';
import type { Dataset } from './schema';
import { isCertified, runChecks, type Check } from './validate';

export interface Reproduction {
  checks: Check[];
  /** true only when every check passed and the per-dapil comparison was made */
  reproduced: boolean;
  seatsMatched: number;
  seatsTotal: number;
  dapilMatched: number;
  dapilTotal: number;
  /** why the per-dapil comparison could not be made, when it could not */
  notAttempted: string | null;
  baseline: Allocation;
}

/**
 * Runs the engine at the 2024 statutory rules and compares it to the official
 * allocation. When the certified per-dapil allocation is absent the comparison
 * is reported as not attempted rather than as passing.
 */
export function reproduce(data: Dataset): Reproduction {
  const baseline = allocate(data.parties.parties, data.dapil.dapil, RULES_2024, {
    trace: false,
  });
  const checks = runChecks(data);

  const seatsTotal = data.official.totalSeats;
  const dapilTotal = data.dapil.dapil.length;

  let notAttempted: string | null = null;
  if (!isCertified(data)) {
    notAttempted =
      'Total suara tiap partai dan susunan 580 kursi pada 84 dapil sesuai angka ' +
      'resmi. Tabel suara per dapil masih placeholder, jadi reproduksi hasil ' +
      'resmi belum dapat diuji.';
  } else if (data.official.byDapil === null) {
    notAttempted =
      'Total suara tiap partai dan susunan 580 kursi pada 84 dapil sesuai angka ' +
      'resmi. Alokasi kursi per dapil pada Keputusan KPU 1206/2024 belum ' +
      'diekstraksi, jadi reproduksi belum dapat diuji.';
  }

  let seatsMatched = 0;
  let dapilMatched = 0;

  if (notAttempted === null && data.official.byDapil) {
    for (const result of baseline.byDapil) {
      const expected = data.official.byDapil[result.dapil];
      if (!expected) continue;
      let allMatch = true;
      for (const party of data.parties.parties) {
        const got = result.seats[party.id] ?? 0;
        const want = expected[party.id] ?? 0;
        seatsMatched += Math.min(got, want);
        if (got !== want) allMatch = false;
      }
      if (allMatch) dapilMatched++;
    }
  }

  // The national seat totals are checkable whatever the dapil provenance, so
  // they are reported separately from the per-dapil comparison.
  const nationalMatches = data.parties.parties.every(
    (p) => (baseline.seatsByParty[p.id] ?? 0) === (data.official.seatsByParty[p.id] ?? 0),
  );
  checks.push({
    id: 'national-seats',
    label: 'Kursi per partai secara nasional sama dengan hasil resmi',
    passed: notAttempted === null ? nationalMatches : nationalMatches ? true : false,
    detail: data.parties.parties
      .filter((p) => (baseline.seatsByParty[p.id] ?? 0) !== (data.official.seatsByParty[p.id] ?? 0))
      .map(
        (p) =>
          `${p.shortName} ${baseline.seatsByParty[p.id] ?? 0} ≠ ${data.official.seatsByParty[p.id] ?? 0}`,
      )
      .join('; ') || 'seluruh partai cocok',
  });

  checks.push({
    id: 'per-dapil',
    label: 'Alokasi kursi per dapil sama dengan hasil resmi',
    passed: notAttempted === null ? dapilMatched === dapilTotal : null,
    detail: notAttempted ?? `${dapilMatched} dari ${dapilTotal} dapil`,
  });

  const reproduced =
    notAttempted === null && checks.every((c) => c.passed === true);

  return {
    checks,
    reproduced,
    seatsMatched,
    seatsTotal,
    dapilMatched,
    dapilTotal,
    notAttempted,
    baseline,
  };
}
