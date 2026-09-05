import { describe, expect, it } from 'vitest';
import { regimeAt, thresholdResponse } from '../src/engine/response';
import { allocate, RULES_2024 } from '../src/engine';
import type { Dapil, Party, RuleSet } from '../src/engine/types';

/** Three parties on 60 / 30 / 10 of 100 votes, one 5-seat district. */
const parties: Party[] = [
  { id: 'a', ballotNumber: 1, shortName: 'A', fullName: 'A', color: '#000', nationalVotes: 60 },
  { id: 'b', ballotNumber: 2, shortName: 'B', fullName: 'B', color: '#000', nationalVotes: 30 },
  { id: 'c', ballotNumber: 3, shortName: 'C', fullName: 'C', color: '#000', nationalVotes: 10 },
];
const dapil: Dapil[] = [
  { code: 'X', name: 'X', province: 'P', magnitude: 5, votes: { a: 60, b: 30, c: 10 } },
];
const rules: RuleSet = { ...RULES_2024, threshold: 0 };

describe('threshold response', () => {
  it('is undefined for any scope but national', () => {
    expect(thresholdResponse(parties, dapil, { ...rules, thresholdScope: 'dapil' }, 0.5))
      .toBeNull();
    expect(thresholdResponse(parties, dapil, { ...rules, thresholdScope: 'none' }, 0.5))
      .toBeNull();
  });

  it('opens one band per party share inside the range, plus the band from zero', () => {
    const r = thresholdResponse(parties, dapil, rules, 0.5)!;
    // shares are 0.10 and 0.30 inside 0..0.5; 0.60 is outside.
    expect(r.regimes.map((x) => [x.from, x.to])).toEqual([
      [0, 0.1],
      [0.1, 0.3],
      [0.3, 0.5],
    ]);
    expect(r.regimes.map((x) => x.lostHere)).toEqual([null, 'c', 'b']);
  });

  it('covers the range with contiguous bands ending at max', () => {
    const r = thresholdResponse(parties, dapil, rules, 0.5)!;
    for (let i = 0; i + 1 < r.regimes.length; i++) {
      expect(r.regimes[i]!.to).toBe(r.regimes[i + 1]!.from);
    }
    expect(r.regimes[r.regimes.length - 1]!.to).toBe(0.5);
  });

  it('agrees with a direct allocation everywhere inside each band', () => {
    const r = thresholdResponse(parties, dapil, rules, 0.5)!;
    for (const regime of r.regimes) {
      // The upper bound is inside the band; the lower bound is not.
      for (const t of [regime.to, (regime.from + regime.to) / 2]) {
        const direct = allocate(parties, dapil, { ...rules, threshold: t }, { trace: false });
        expect(direct.seatsByParty).toEqual(regime.seatsByParty);
      }
    }
  });

  it('samples above the lower bound, where the excluded party is actually out', () => {
    const r = thresholdResponse(parties, dapil, rules, 0.5)!;
    // Band (0.10, 0.30] exists to exclude C. At exactly 0.10 C is still seated,
    // so a band sampled at its lower bound would report the previous regime.
    const band = r.regimes[1]!;
    expect(band.qualifying).not.toContain('c');
    const atLowerBound = allocate(parties, dapil, { ...rules, threshold: 0.1 }, { trace: false });
    expect(atLowerBound.qualifying).toContain('c');
  });

  it('drops a party exactly at its own share, because the rule is >=', () => {
    const r = thresholdResponse(parties, dapil, rules, 0.5)!;
    // At t = 0.10 party C still qualifies; just above it does not.
    const atShare = allocate(parties, dapil, { ...rules, threshold: 0.1 }, { trace: false });
    expect(atShare.qualifying).toContain('c');
    const justAbove = allocate(parties, dapil, { ...rules, threshold: 0.1001 }, { trace: false });
    expect(justAbove.qualifying).not.toContain('c');
    expect(regimeAt(r, 0.1)!.to).toBe(0.1);
  });

  it('locates the regime containing a threshold, including at the top of the range', () => {
    const r = thresholdResponse(parties, dapil, rules, 0.5)!;
    expect(regimeAt(r, 0)!.to).toBe(0.1);
    expect(regimeAt(r, 0.05)!.to).toBe(0.1);
    expect(regimeAt(r, 0.2)!.to).toBe(0.3);
    expect(regimeAt(r, 0.5)!.to).toBe(0.5);
  });

  it('allocates every seat in every regime', () => {
    const r = thresholdResponse(parties, dapil, rules, 0.5)!;
    for (const regime of r.regimes) {
      const total = Object.values(regime.seatsByParty).reduce((a, b) => a + b, 0);
      expect(total).toBe(5);
    }
  });
});
