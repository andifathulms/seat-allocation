import { allocate, RULES_2024 } from '../engine';
import type { Dapil, Party } from '../engine/types';

/**
 * PRD §9.2: the cascade opens on a dapil where the threshold visibly changed the
 * outcome. Picked from the data rather than hardcoded, so it stays right when the
 * data is replaced.
 *
 * The comparison is the statutory rules against the same rules with no
 * threshold: the dapil that differs by the most seats is the one where a
 * reader can see the threshold doing something. Ties go to the larger dapil,
 * because more seats means more of the cascade is worth stepping through, and
 * then to the code so the choice is deterministic.
 */
export function pickDefaultDapil(parties: readonly Party[], dapil: readonly Dapil[]): string {
  const withThreshold = allocate(parties, dapil, RULES_2024, { trace: false });
  const without = allocate(
    parties,
    dapil,
    { ...RULES_2024, threshold: 0, thresholdScope: 'none' },
    { trace: false },
  );

  const baseline = new Map(without.byDapil.map((r) => [r.dapil, r.seats]));
  let best = dapil[0]?.code ?? '';
  let bestChanged = -1;
  let bestMagnitude = -1;

  for (const result of withThreshold.byDapil) {
    const other = baseline.get(result.dapil);
    if (!other) continue;
    let changed = 0;
    for (const party of parties) {
      changed += Math.abs((result.seats[party.id] ?? 0) - (other[party.id] ?? 0));
    }
    const magnitude = dapil.find((d) => d.code === result.dapil)?.magnitude ?? 0;
    if (
      changed > bestChanged ||
      (changed === bestChanged && magnitude > bestMagnitude) ||
      (changed === bestChanged && magnitude === bestMagnitude && result.dapil < best)
    ) {
      best = result.dapil;
      bestChanged = changed;
      bestMagnitude = magnitude;
    }
  }

  return best;
}
