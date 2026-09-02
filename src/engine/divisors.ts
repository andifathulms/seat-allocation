import type { DivisorRule } from './types';

/**
 * Divisor applied to a party that already holds `n` seats.
 *
 * Sainte-Laguë          2n + 1     1, 3, 5, 7, …   (UU 7/2017 Pasal 415 ayat 2)
 * D'Hondt               n + 1      1, 2, 3, 4, …
 * Modified Sainte-Laguë 1.4 then 2n + 1
 *
 * Hare quota is not a divisor sequence and is handled in quota.ts.
 */
export function divisorAt(rule: DivisorRule, n: number): number {
  switch (rule) {
    case 'sainte-lague':
      return 2 * n + 1;
    case 'dhondt':
      return n + 1;
    case 'modified-sainte-lague':
      return n === 0 ? 1.4 : 2 * n + 1;
    case 'hare-quota':
      throw new Error('hare-quota is not a divisor sequence');
  }
}

export function isDivisorRule(rule: DivisorRule): boolean {
  return rule !== 'hare-quota';
}
