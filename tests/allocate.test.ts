import { describe, expect, it } from 'vitest';
import { allocate, RULES_2024 } from '../src/engine';
import type { DivisorRule, RuleSet } from '../src/engine/types';
import { dapil, party, TEXTBOOK_DAPIL, TEXTBOOK_PARTIES } from './fixtures';

const noThreshold: RuleSet = { ...RULES_2024, threshold: 0, thresholdScope: 'none' };

function seatsUnder(rule: DivisorRule): Record<string, number> {
  return allocate(TEXTBOOK_PARTIES, TEXTBOOK_DAPIL, { ...noThreshold, divisor: rule })
    .seatsByParty;
}

describe('the four allocation rules on the hand-computed district', () => {
  it('Sainte-Laguë gives a 3, b 1, c 1, d 0', () => {
    expect(seatsUnder('sainte-lague')).toEqual({ a: 3, b: 1, c: 1, d: 0 });
  });

  it("D'Hondt gives a 3, b 1, c 1, d 0", () => {
    expect(seatsUnder('dhondt')).toEqual({ a: 3, b: 1, c: 1, d: 0 });
  });

  it('modified Sainte-Laguë gives a 3, b 1, c 1, d 0', () => {
    expect(seatsUnder('modified-sainte-lague')).toEqual({ a: 3, b: 1, c: 1, d: 0 });
  });

  it('Hare quota gives a 3, b 1, c 1, d 0', () => {
    expect(seatsUnder('hare-quota')).toEqual({ a: 3, b: 1, c: 1, d: 0 });
  });

  it('always awards exactly the district magnitude', () => {
    for (const rule of [
      'sainte-lague',
      'dhondt',
      'modified-sainte-lague',
      'hare-quota',
    ] as const) {
      const total = Object.values(seatsUnder(rule)).reduce((s, n) => s + n, 0);
      expect(total, rule).toBe(5);
    }
  });
});

describe('the rules diverge where they should', () => {
  /**
   * 3 seats, votes 100 / 80 / 39. This is the smallest case that separates the
   * two rules, and it is the reason the choice of divisor is contested.
   *
   * Sainte-Laguë   big 100 · 33,3   mid 80 · 26,7   small 39
   *   top three: 100 big · 80 mid · 39 small        → 1 / 1 / 1
   *
   * D'Hondt        big 100 · 50 · 33,3   mid 80 · 40   small 39
   *   top three: 100 big · 80 mid · 50 big          → 2 / 1 / 0
   */
  const parties = [party('big', 1, 100), party('mid', 2, 80), party('small', 3, 39)];
  const district = [dapil('Y-1', 3, { big: 100, mid: 80, small: 39 })];

  it('Sainte-Laguë seats all three parties', () => {
    const r = allocate(parties, district, { ...noThreshold, divisor: 'sainte-lague' });
    expect(r.seatsByParty).toEqual({ big: 1, mid: 1, small: 1 });
  });

  it("D'Hondt gives the third seat to the largest party instead", () => {
    const r = allocate(parties, district, { ...noThreshold, divisor: 'dhondt' });
    expect(r.seatsByParty).toEqual({ big: 2, mid: 1, small: 0 });
  });
});
