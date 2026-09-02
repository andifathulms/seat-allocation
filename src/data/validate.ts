import type { Dataset } from './schema';

export interface Check {
  id: string;
  label: string;
  /** null when the check could not be attempted on this data */
  passed: boolean | null;
  detail: string;
}

/**
 * The three consistency assertions of PRD §5.3, run at boot as well as in
 * scripts/verify.ts. Failing loudly at boot is the point: the app's licence to
 * be believed about anything else is that it says so when reproduction fails.
 */
export function runChecks(data: Dataset): Check[] {
  const checks: Check[] = [];
  const { parties, dapil, official } = data;

  // 1 — each party's dapil votes sum to its national total
  const mismatched: string[] = [];
  for (const p of parties.parties) {
    let sum = 0;
    for (const d of dapil.dapil) sum += d.votes[p.id] ?? 0;
    if (sum !== p.nationalVotes) mismatched.push(`${p.shortName} ${sum} ≠ ${p.nationalVotes}`);
  }
  checks.push({
    id: 'dapil-sums',
    label: 'Suara tiap partai per dapil berjumlah sama dengan total nasionalnya',
    passed: mismatched.length === 0,
    detail:
      mismatched.length === 0
        ? `${parties.parties.length} partai cocok`
        : mismatched.join('; '),
  });

  // 2 — national totals sum to the certified valid vote
  const national = parties.parties.reduce((t, p) => t + p.nationalVotes, 0);
  checks.push({
    id: 'national-total',
    label: 'Total suara sah nasional',
    passed: national === parties.totalValidVotes,
    detail: `${national.toLocaleString('id-ID')} dari ${parties.totalValidVotes.toLocaleString('id-ID')}`,
  });

  // 3 — 84 dapil, 580 seats, magnitudes within bounds
  const seats = dapil.dapil.reduce((t, d) => t + d.magnitude, 0);
  const outOfRange = dapil.dapil.filter((d) => d.magnitude < 3 || d.magnitude > 10);
  checks.push({
    id: 'composition',
    label: 'Jumlah dapil dan alokasi kursi',
    passed:
      dapil.dapil.length === 84 && seats === official.totalSeats && outOfRange.length === 0,
    detail: `${dapil.dapil.length} dapil, ${seats} kursi, magnitudo ${Math.min(
      ...dapil.dapil.map((d) => d.magnitude),
    )}–${Math.max(...dapil.dapil.map((d) => d.magnitude))}`,
  });

  // 4 — official seat totals sum to 580
  const officialSeats = Object.values(official.seatsByParty).reduce((a, b) => a + b, 0);
  checks.push({
    id: 'official-total',
    label: 'Total kursi pada hasil resmi',
    passed: officialSeats === official.totalSeats,
    detail: `${officialSeats} dari ${official.totalSeats}`,
  });

  return checks;
}

export function isCertified(data: Dataset): boolean {
  return (
    data.parties.provenance === 'certified' &&
    data.dapil.provenance === 'certified' &&
    data.official.provenance === 'certified'
  );
}
