import { describe, expect, it } from 'vitest';
import { ledger } from '../src/engine/transfers';
import type { Allocation, Dapil, Party } from '../src/engine/types';

const parties = [
  { id: 'a', ballotNumber: 1, shortName: 'A', fullName: 'A', color: '#000', nationalVotes: 0 },
  { id: 'b', ballotNumber: 2, shortName: 'B', fullName: 'B', color: '#000', nationalVotes: 0 },
  { id: 'c', ballotNumber: 3, shortName: 'C', fullName: 'C', color: '#000', nationalVotes: 0 },
] as Party[];

const dapil = [
  { code: 'X', name: 'Dapil X', province: 'P', magnitude: 3, votes: {} },
  { code: 'Y', name: 'Dapil Y', province: 'P', magnitude: 3, votes: {} },
] as Dapil[];

function alloc(byDapil: Array<{ dapil: string; seats: Record<string, number> }>): Allocation {
  return { byDapil, qualifying: [], eliminated: [], seatsByParty: {}, ties: [] } as unknown as Allocation;
}

describe('transfer ledger', () => {
  it('reports nothing when the two allocations agree', () => {
    const a = alloc([{ dapil: 'X', seats: { a: 2, b: 1, c: 0 } }]);
    const l = ledger(a, a, parties, dapil);
    expect(l.seatsMoved).toBe(0);
    expect(l.dapilChanged).toBe(0);
    expect(l.transfers).toEqual([]);
  });

  it('counts a seat moved once, not once per side', () => {
    const before = alloc([{ dapil: 'X', seats: { a: 2, b: 1, c: 0 } }]);
    const after = alloc([{ dapil: 'X', seats: { a: 1, b: 1, c: 1 } }]);
    const l = ledger(after, before, parties, dapil);
    expect(l.seatsMoved).toBe(1);
    expect(l.dapilChanged).toBe(1);
    expect(l.transfers).toEqual([
      { dapil: 'X', dapilName: 'Dapil X', from: 'a', to: 'c', seats: 1 },
    ]);
  });

  it('pairs multiple losers and gainers largest first', () => {
    const before = alloc([{ dapil: 'X', seats: { a: 3, b: 2, c: 0 } }]);
    const after = alloc([{ dapil: 'X', seats: { a: 1, b: 1, c: 3 } }]);
    const l = ledger(after, before, parties, dapil);
    expect(l.seatsMoved).toBe(3);
    expect(l.transfers).toEqual([
      { dapil: 'X', dapilName: 'Dapil X', from: 'a', to: 'c', seats: 2 },
      { dapil: 'X', dapilName: 'Dapil X', from: 'b', to: 'c', seats: 1 },
    ]);
  });

  it('accumulates net movement across dapil, breaking ties by ballot number', () => {
    const before = alloc([
      { dapil: 'X', seats: { a: 2, b: 1, c: 0 } },
      { dapil: 'Y', seats: { a: 2, b: 1, c: 0 } },
    ]);
    const after = alloc([
      { dapil: 'X', seats: { a: 1, b: 1, c: 1 } },
      { dapil: 'Y', seats: { a: 1, b: 2, c: 0 } },
    ]);
    const l = ledger(after, before, parties, dapil);
    expect(l.dapilChanged).toBe(2);
    expect(l.seatsMoved).toBe(2);
    expect(l.net).toEqual([
      { party: 'b', delta: 1 },
      { party: 'c', delta: 1 },
      { party: 'a', delta: -2 },
    ]);
  });

  it('ignores a dapil missing from the baseline rather than inventing a transfer', () => {
    const before = alloc([{ dapil: 'X', seats: { a: 2, b: 1, c: 0 } }]);
    const after = alloc([
      { dapil: 'X', seats: { a: 2, b: 1, c: 0 } },
      { dapil: 'Y', seats: { a: 3, b: 0, c: 0 } },
    ]);
    const l = ledger(after, before, parties, dapil);
    expect(l.seatsMoved).toBe(0);
  });
});
