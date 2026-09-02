import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allocate, RULES_2024 } from '../src/engine';
import type { Dapil, Party } from '../src/engine/types';

const parties: Party[] = JSON.parse(
  readFileSync('public/data/parties-2024.json', 'utf8'),
).parties;
const dapil: Dapil[] = JSON.parse(
  readFileSync('public/data/dapil-2024.json', 'utf8'),
).dapil;

/**
 * PRD §6.5: a full recomputation must fit inside a frame so the threshold
 * scrubber can recompute on every one. The trace is what costs; a slider drag
 * asks for none.
 */
function median(run: () => void, samples: number): number {
  const times: number[] = [];
  for (let i = 0; i < samples; i++) {
    const t = performance.now();
    run();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)] as number;
}

describe('performance', () => {
  it('recomputes all 84 dapil without a trace inside a frame', () => {
    const warm = () => allocate(parties, dapil, RULES_2024, { trace: false });
    for (let i = 0; i < 20; i++) warm();
    const ms = median(warm, 50);
    expect(ms, `${ms.toFixed(2)} ms`).toBeLessThan(16);
  });

  it('recomputes across the whole threshold range inside a frame', () => {
    const run = (t: number) =>
      allocate(parties, dapil, { ...RULES_2024, threshold: t }, { trace: false });
    for (let i = 0; i < 20; i++) run(0.02);
    // A low threshold is the worst case: every party qualifies in every dapil.
    const ms = median(() => run(0), 50);
    expect(ms, `${ms.toFixed(2)} ms`).toBeLessThan(16);
  });

  it('costs more with the trace, which is why the trace is optional', () => {
    const lean = median(
      () => allocate(parties, dapil, RULES_2024, { trace: false }),
      20,
    );
    const full = median(() => allocate(parties, dapil, RULES_2024), 20);
    expect(full).toBeGreaterThan(lean);
  });
});
