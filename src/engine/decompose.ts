import { allocate } from './index';
import { computeMetrics } from './metrics';
import type { Dapil, Party, RuleSet } from './types';

export interface Cell {
  threshold: number;
  geography: RuleSet['geography'];
  gallagher: number;
  loosemoreHanby: number;
  unconvertedVotes: number;
  partiesWithSeats: number;
}

export interface Decomposition {
  /** The rules as the user currently has them. */
  applied: Cell;
  /** The same rules with the threshold removed. */
  noThreshold: Cell;
  /** The same rules with all seats drawn from one national pool. */
  onePool: Cell;
  /** Neither rule in force: the floor this pair of rules is measured against. */
  neither: Cell;
}

/**
 * The four corners of PRD §7.
 *
 * The single-national-district control exists, in the PRD's own words, "to
 * isolate how much disproportionality comes from district magnitude rather than
 * from the threshold". Shipping the control without performing that isolation
 * left the reader to flip two switches, write four numbers on paper and flip
 * back. This runs the four combinations at once.
 *
 * Deliberately not a single "the threshold is responsible for X%" figure. The
 * two rules interact — removing one changes what the other does — so a share
 * attributed to either would be an artefact of the order they were removed in.
 * Four measurements, stated as four measurements.
 *
 * The divisor stays wherever the user set it: this answers "of the rules you
 * are looking at, what is each one doing", not a question about 2024 alone.
 */
export function decompose(
  parties: readonly Party[],
  dapil: readonly Dapil[],
  rules: RuleSet,
): Decomposition {
  const at = (threshold: number, geography: RuleSet['geography']): Cell => {
    const variant: RuleSet = {
      ...rules,
      threshold,
      // A zero threshold under any scope admits every party; naming the scope
      // 'none' says so in the one place the value is read.
      thresholdScope: threshold === 0 ? 'none' : rules.thresholdScope,
      geography,
    };
    const result = allocate(parties, dapil, variant, { trace: false });
    const metrics = computeMetrics(parties, result.seatsByParty);
    let partiesWithSeats = 0;
    for (const p of parties) if ((result.seatsByParty[p.id] ?? 0) > 0) partiesWithSeats++;
    return {
      threshold,
      geography,
      gallagher: metrics.gallagher,
      loosemoreHanby: metrics.loosemoreHanby,
      unconvertedVotes: metrics.unconvertedVotes,
      partiesWithSeats,
    };
  };

  return {
    applied: at(rules.threshold, rules.geography),
    noThreshold: at(0, rules.geography),
    onePool: at(rules.threshold, 'national-pool'),
    neither: at(0, 'national-pool'),
  };
}
