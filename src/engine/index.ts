import { allocateDistrict, type DistrictInput } from './allocate';
import { computeMetrics } from './metrics';
import { applyThreshold, totalValidVotes } from './threshold';
import type {
  Allocation,
  AllocateOptions,
  Dapil,
  DapilResult,
  Party,
  PartyId,
  RuleSet,
} from './types';

export * from './types';
export { divisorAt } from './divisors';
export { applyThreshold, totalValidVotes } from './threshold';
export { computeMetrics } from './metrics';
export { allocateDistrict } from './allocate';

/** The 2024 statutory rules: UU 7/2017 Pasal 414 ayat (1) and Pasal 415 ayat (2). */
export const RULES_2024: RuleSet = {
  threshold: 0.04,
  thresholdScope: 'national',
  divisor: 'sainte-lague',
  geography: 'dapil',
};

/**
 * The whole public surface. Synchronous, deterministic, pure.
 *
 * Votes are moved into typed arrays indexed by party ordinal before the loop and
 * converted back to the Record shape only at the boundary, so a full 84-dapil
 * recomputation stays inside a frame.
 */
export function allocate(
  parties: readonly Party[],
  dapil: readonly Dapil[],
  rules: RuleSet,
  options: AllocateOptions = {},
): Allocation {
  const wantTrace = options.trace !== false;
  const threshold = applyThreshold(parties, dapil, rules);

  const seatsByParty: Record<PartyId, number> = {};
  const byId = new Map<PartyId, Party>();
  for (const p of parties) {
    seatsByParty[p.id] = 0;
    byId.set(p.id, p);
  }

  const byDapil: DapilResult[] = [];
  const ties: Allocation['ties'] = [];

  const districts =
    rules.geography === 'national-pool' ? [nationalPool(parties, dapil)] : dapil;

  for (const d of districts) {
    const qualifying =
      rules.geography === 'national-pool'
        ? new Set(threshold.qualifying)
        : (threshold.byDapil.get(d.code) ?? new Set<PartyId>());

    const ids: PartyId[] = [];
    const eliminated: PartyId[] = [];
    for (const p of parties) {
      if (qualifying.has(p.id)) ids.push(p.id);
      else eliminated.push(p.id);
    }

    const votes = new Float64Array(ids.length);
    const ballotNumbers = new Int32Array(ids.length);
    for (let i = 0; i < ids.length; i++) {
      const party = byId.get(ids[i] as PartyId) as Party;
      votes[i] = d.votes[party.id] ?? 0;
      ballotNumbers[i] = party.ballotNumber;
    }

    const input: DistrictInput = { ids, votes, ballotNumbers, magnitude: d.magnitude };
    const outcome = allocateDistrict(input, rules.divisor, wantTrace);

    const seats: Record<PartyId, number> = {};
    for (const p of parties) seats[p.id] = 0;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i] as PartyId;
      const won = outcome.seats[i] as number;
      seats[id] = won;
      seatsByParty[id] = (seatsByParty[id] ?? 0) + won;
    }

    byDapil.push({ dapil: d.code, seats, trace: outcome.trace, eliminated });
    for (const t of outcome.ties) {
      ties.push({ dapil: d.code, ordinal: t.ordinal, parties: t.parties });
    }
  }

  return {
    qualifying: threshold.qualifying,
    eliminated: threshold.eliminated,
    byDapil,
    seatsByParty,
    metrics: computeMetrics(parties, seatsByParty),
    ties,
  };
}

/**
 * The benchmark geography of PRD §7.4: all seats allocated in one pool from
 * national totals. Not a proposal — it isolates how much disproportionality
 * comes from district magnitude rather than from the threshold.
 */
function nationalPool(parties: readonly Party[], dapil: readonly Dapil[]): Dapil {
  let magnitude = 0;
  for (const d of dapil) magnitude += d.magnitude;
  const votes: Record<PartyId, number> = {};
  for (const p of parties) votes[p.id] = p.nationalVotes;
  return {
    code: 'NASIONAL',
    name: 'Satu daerah pemilihan nasional',
    province: 'Nasional',
    magnitude,
    votes,
  };
}

export { totalValidVotes as sumNationalVotes };
