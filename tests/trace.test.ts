import { describe, expect, it } from 'vitest';
import { allocate, RULES_2024 } from '../src/engine';
import { dapil, party, TEXTBOOK_DAPIL, TEXTBOOK_PARTIES } from './fixtures';
import type { RuleSet } from '../src/engine/types';

const open: RuleSet = { ...RULES_2024, threshold: 0, thresholdScope: 'none' };

describe('the trace', () => {
  const result = allocate(TEXTBOOK_PARTIES, TEXTBOOK_DAPIL, open);
  const trace = result.byDapil[0]?.trace ?? [];

  it('records one award per seat, in claim order', () => {
    expect(trace).toHaveLength(5);
    expect(trace.map((t) => t.ordinal)).toEqual([1, 2, 3, 4, 5]);
  });

  it('names the winners in the order the seats were claimed', () => {
    expect(trace.map((t) => t.winner)).toEqual(['a', 'b', 'a', 'c', 'a']);
  });

  it('records the winning quotient', () => {
    expect(trace[0]?.quotient).toBeCloseTo(53_000, 6);
    expect(trace[2]?.quotient).toBeCloseTo(53_000 / 3, 6);
    expect(trace[4]?.quotient).toBeCloseTo(53_000 / 5, 6);
  });

  it('captures every party in every table, not only the winner', () => {
    for (const award of trace) {
      expect(award.table.map((c) => c.party)).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('captures the state before the award, so the winner is the table maximum', () => {
    for (const award of trace) {
      const max = Math.max(...award.table.map((c) => c.quotient));
      expect(award.quotient).toBeCloseTo(max, 6);
      const cell = award.table.find((c) => c.party === award.winner);
      expect(cell?.quotient).toBeCloseTo(award.quotient, 6);
    }
  });

  it('advances the winner divisor between consecutive awards', () => {
    // a wins seats 1, 3 and 5, so its divisor runs 1, 3, 5.
    const aDivisors = [0, 2, 4].map(
      (i) => trace[i]?.table.find((c) => c.party === 'a')?.divisor,
    );
    expect(aDivisors).toEqual([1, 3, 5]);
  });

  it('is omitted when the caller asks for no trace', () => {
    const lean = allocate(TEXTBOOK_PARTIES, TEXTBOOK_DAPIL, open, { trace: false });
    expect(lean.byDapil[0]?.trace).toEqual([]);
    expect(lean.seatsByParty).toEqual(result.seatsByParty);
  });

  it('labels the two Hare quota phases', () => {
    const q = allocate(TEXTBOOK_PARTIES, TEXTBOOK_DAPIL, {
      ...open,
      divisor: 'hare-quota',
    });
    const phases = (q.byDapil[0]?.trace ?? []).map((t) => t.phase);
    expect(phases.filter((p) => p === 'quota')).toHaveLength(3);
    expect(phases.filter((p) => p === 'remainder')).toHaveLength(2);
  });
});

describe('ties', () => {
  /**
   * Two parties on identical votes, one seat. The quotients are exactly equal,
   * so the ballot number decides and the tie is reported.
   */
  const parties = [party('first', 1, 500), party('second', 2, 500)];
  const district = [dapil('T-1', 1, { first: 500, second: 500 })];

  it('resolves on the lower ballot number when raw votes are equal', () => {
    const r = allocate(parties, district, open);
    expect(r.seatsByParty).toEqual({ first: 1, second: 0 });
  });

  it('surfaces the tie rather than resolving it silently', () => {
    const r = allocate(parties, district, open);
    expect(r.ties).toEqual([
      { dapil: 'T-1', ordinal: 1, parties: ['first', 'second'] },
    ]);
    expect(r.byDapil[0]?.trace[0]?.tied).toEqual(['first', 'second']);
  });

  it('reports no tie when quotients differ', () => {
    const r = allocate(TEXTBOOK_PARTIES, TEXTBOOK_DAPIL, open);
    expect(r.ties).toEqual([]);
  });
});
