import { describe, expect, it } from 'vitest';
import { allocate, RULES_2024 } from '../src/engine';
import { applyThreshold } from '../src/engine/threshold';
import { dapil, party } from './fixtures';

/**
 * The load-bearing case. `local` takes 60% of one district and would win seats
 * there under any divisor rule, but holds 2% nationally. A national threshold
 * removes it from that district anyway.
 */
const parties = [
  party('major', 1, 700),
  party('minor', 2, 280),
  party('local', 3, 20),
];
const districts = [
  dapil('A-1', 4, { major: 690, minor: 270, local: 4 }),
  dapil('A-2', 4, { major: 10, minor: 10, local: 16 }),
];

describe('national threshold', () => {
  it('eliminates a party below the line', () => {
    const t = applyThreshold(parties, districts, { ...RULES_2024, threshold: 0.04 });
    expect(t.qualifying).toEqual(['major', 'minor']);
    expect(t.eliminated).toEqual(['local']);
  });

  it('removes it from the district it leads', () => {
    const r = allocate(parties, districts, { ...RULES_2024, threshold: 0.04 });
    const a2 = r.byDapil.find((d) => d.dapil === 'A-2');
    expect(a2?.seats['local']).toBe(0);
    expect(a2?.eliminated).toContain('local');
    // The four seats it would have taken go to the qualifying parties.
    expect((a2?.seats['major'] ?? 0) + (a2?.seats['minor'] ?? 0)).toBe(4);
  });

  it('seats it once the threshold falls below its share', () => {
    const r = allocate(parties, districts, { ...RULES_2024, threshold: 0.01 });
    expect(r.seatsByParty['local']).toBeGreaterThan(0);
  });

  it('is inclusive at exactly the threshold', () => {
    // local holds 20 / 1000 = 2,0% exactly.
    const at = applyThreshold(parties, districts, { ...RULES_2024, threshold: 0.02 });
    expect(at.qualifying).toContain('local');
    const above = applyThreshold(parties, districts, {
      ...RULES_2024,
      threshold: 0.0201,
    });
    expect(above.qualifying).not.toContain('local');
  });

  it('keeps failing parties in the denominator', () => {
    // major holds 700 / 1000 = 70%, not 700 / 980.
    const t = applyThreshold(parties, districts, { ...RULES_2024, threshold: 0.7 });
    expect(t.qualifying).toEqual(['major']);
  });
});

describe('threshold scope', () => {
  it('per-dapil scope judges each district on its own total', () => {
    const t = applyThreshold(parties, districts, {
      ...RULES_2024,
      thresholdScope: 'dapil',
      threshold: 0.04,
    });
    expect(t.byDapil.get('A-1')?.has('local')).toBe(false);
    expect(t.byDapil.get('A-2')?.has('local')).toBe(true);
  });

  it('scope none admits every party', () => {
    const t = applyThreshold(parties, districts, {
      ...RULES_2024,
      thresholdScope: 'none',
      threshold: 0.5,
    });
    expect(t.eliminated).toEqual([]);
  });
});

describe('national-pool geography', () => {
  it('allocates every seat from one district of the summed magnitudes', () => {
    const r = allocate(parties, districts, {
      ...RULES_2024,
      threshold: 0,
      thresholdScope: 'none',
      geography: 'national-pool',
    });
    expect(r.byDapil).toHaveLength(1);
    expect(r.byDapil[0]?.dapil).toBe('NASIONAL');
    expect(r.metrics.totalSeats).toBe(8);
  });
});
