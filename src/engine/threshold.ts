import type { Dapil, Party, PartyId, RuleSet } from './types';

export interface ThresholdOutcome {
  qualifying: PartyId[];
  eliminated: PartyId[];
  /**
   * Per-dapil qualifying sets. Under national and none scope every dapil shares
   * the national set; under dapil scope each is computed against that dapil's
   * own valid total.
   */
  byDapil: Map<string, Set<PartyId>>;
}

export function totalValidVotes(parties: readonly Party[]): number {
  let total = 0;
  for (const p of parties) total += p.nationalVotes;
  return total;
}

function dapilTotal(d: Dapil, parties: readonly Party[]): number {
  let total = 0;
  for (const p of parties) total += d.votes[p.id] ?? 0;
  return total;
}

/**
 * A party failing the national threshold is removed from every dapil, including
 * those it led. Its votes stay in the denominator; they are simply excluded from
 * the divisor step.
 */
export function applyThreshold(
  parties: readonly Party[],
  dapil: readonly Dapil[],
  rules: RuleSet,
): ThresholdOutcome {
  const national = totalValidVotes(parties);
  const byDapil = new Map<string, Set<PartyId>>();

  if (rules.thresholdScope === 'dapil') {
    const everQualifying = new Set<PartyId>();
    for (const d of dapil) {
      const total = dapilTotal(d, parties);
      const set = new Set<PartyId>();
      for (const p of parties) {
        const votes = d.votes[p.id] ?? 0;
        if (total > 0 && votes / total >= rules.threshold) {
          set.add(p.id);
          everQualifying.add(p.id);
        }
      }
      byDapil.set(d.code, set);
    }
    return {
      qualifying: parties.filter((p) => everQualifying.has(p.id)).map((p) => p.id),
      eliminated: parties.filter((p) => !everQualifying.has(p.id)).map((p) => p.id),
      byDapil,
    };
  }

  const passes = (p: Party): boolean =>
    rules.thresholdScope === 'none' || national === 0
      ? true
      : p.nationalVotes / national >= rules.threshold;

  const qualifying = parties.filter(passes).map((p) => p.id);
  const eliminated = parties.filter((p) => !passes(p)).map((p) => p.id);
  const shared = new Set(qualifying);
  for (const d of dapil) byDapil.set(d.code, shared);

  return { qualifying, eliminated, byDapil };
}
