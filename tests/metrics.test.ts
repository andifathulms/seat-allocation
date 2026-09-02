import { describe, expect, it } from 'vitest';
import { computeMetrics } from '../src/engine/metrics';
import { party } from './fixtures';

/**
 * Four parties, 10 seats, hand-computed.
 *
 *          votes   share    seats  share   d = v − s
 *   a      500     50,0%      6    60,0%   −10,0
 *   b      300     30,0%      4    40,0%   −10,0
 *   c      150     15,0%      0     0,0%   +15,0
 *   d       50      5,0%      0     0,0%    +5,0
 *
 *   Gallagher       sqrt(0,5 × (100 + 100 + 225 + 25)) = sqrt(225) = 15,0
 *   Loosemore–Hanby 0,5 × (10 + 10 + 15 + 5) = 20,0
 *   ENP votes       1 / (0,25 + 0,09 + 0,0225 + 0,0025) = 1 / 0,365 = 2,7397
 *   ENP seats       1 / (0,36 + 0,16) = 1 / 0,52 = 1,9231
 *   unconverted     150 + 50 = 200, i.e. 20,0%
 */
const parties = [
  party('a', 1, 500),
  party('b', 2, 300),
  party('c', 3, 150),
  party('d', 4, 50),
];
const seats = { a: 6, b: 4, c: 0, d: 0 };
const m = computeMetrics(parties, seats);

describe('metrics', () => {
  it('counts seats and valid votes', () => {
    expect(m.totalSeats).toBe(10);
    expect(m.totalValidVotes).toBe(1000);
  });

  it('sums the votes of every party holding no seat', () => {
    expect(m.unconvertedVotes).toBe(200);
    expect(m.unconvertedShare).toBeCloseTo(0.2, 12);
  });

  it('computes Gallagher in percentage points', () => {
    expect(m.gallagher).toBeCloseTo(15.0, 9);
  });

  it('computes Loosemore–Hanby in percentage points', () => {
    expect(m.loosemoreHanby).toBeCloseTo(20.0, 9);
  });

  it('computes the effective number of parties on both shares', () => {
    expect(m.enpVotes).toBeCloseTo(2.739726, 6);
    expect(m.enpSeats).toBeCloseTo(1.923077, 6);
  });

  it('keeps eliminated parties in the share table', () => {
    expect(m.shares['c']).toEqual({ voteShare: 0.15, seatShare: 0 });
  });

  it('reports zero disproportionality on an exactly proportional result', () => {
    const even = [party('x', 1, 500), party('y', 2, 500)];
    const r = computeMetrics(even, { x: 5, y: 5 });
    expect(r.gallagher).toBeCloseTo(0, 12);
    expect(r.loosemoreHanby).toBeCloseTo(0, 12);
    expect(r.enpVotes).toBeCloseTo(r.enpSeats, 12);
  });
});
