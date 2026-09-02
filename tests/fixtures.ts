import type { Dapil, Party } from '../src/engine/types';

/**
 * Hand-computable fixtures. Small enough that every expected value in the tests
 * can be derived on paper.
 */
export function party(
  id: string,
  ballotNumber: number,
  nationalVotes: number,
): Party {
  return {
    id,
    ballotNumber,
    shortName: id.toUpperCase(),
    fullName: id,
    color: '#000000',
    nationalVotes,
  };
}

export function dapil(
  code: string,
  magnitude: number,
  votes: Record<string, number>,
): Dapil {
  return { code, name: code, province: code, magnitude, votes };
}

/**
 * Textbook district: 100.000 votes, 5 seats, four parties.
 *
 * Sainte-Laguë quotients
 *          /1        /3        /5       /7
 *   a   53.000    17.666,7   10.600   7.571,4
 *   b   24.000     8.000      4.800
 *   c   16.000     5.333,3
 *   d    7.000
 *
 * Descending: 53.000 a1 · 24.000 b1 · 17.666,7 a2 · 16.000 c1 · 10.600 a3
 * → a 3, b 1, c 1, d 0
 *
 * D'Hondt quotients
 *          /1        /2        /3
 *   a   53.000    26.500    17.666,7
 *   b   24.000    12.000
 *   c   16.000
 * Descending: 53.000 a1 · 26.500 a2 · 24.000 b1 · 17.666,7 a3 · 16.000 c1
 * → a 3, b 1, c 1, d 0
 *
 * Modified Sainte-Laguë, first divisor 1,4
 *   a 37.857,1 · b 17.142,9 · c 11.428,6 · d 5.000, then a/3 17.666,7 …
 * Descending: 37.857,1 a1 · 17.666,7 a2 · 17.142,9 b1 · 11.428,6 c1 · 10.600 a3
 * → a 3, b 1, c 1, d 0
 *
 * Hare quota = 100.000 / 5 = 20.000
 *   a 2,65 → 2 rem 0,65 · b 1,20 → 1 rem 0,20 · c 0,80 → 0 rem 0,80
 *   d 0,35 → 0 rem 0,35.  Three whole seats, two remainder seats to c and a.
 * → a 3, b 1, c 1, d 0
 */
export const TEXTBOOK_PARTIES = [
  party('a', 1, 53_000),
  party('b', 2, 24_000),
  party('c', 3, 16_000),
  party('d', 4, 7_000),
];

export const TEXTBOOK_DAPIL = [
  dapil('X-1', 5, { a: 53_000, b: 24_000, c: 16_000, d: 7_000 }),
];
