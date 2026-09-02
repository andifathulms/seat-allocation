import { describe, expect, it } from 'vitest';
import { divisorAt } from '../src/engine/divisors';

describe('divisor sequences', () => {
  it('Sainte-Laguë runs 1, 3, 5, 7', () => {
    expect([0, 1, 2, 3].map((n) => divisorAt('sainte-lague', n))).toEqual([1, 3, 5, 7]);
  });

  it("D'Hondt runs 1, 2, 3, 4", () => {
    expect([0, 1, 2, 3].map((n) => divisorAt('dhondt', n))).toEqual([1, 2, 3, 4]);
  });

  it('modified Sainte-Laguë runs 1,4 then 3, 5, 7', () => {
    expect([0, 1, 2, 3].map((n) => divisorAt('modified-sainte-lague', n))).toEqual([
      1.4, 3, 5, 7,
    ]);
  });

  it('refuses to treat Hare quota as a divisor sequence', () => {
    expect(() => divisorAt('hare-quota', 0)).toThrow();
  });
});
