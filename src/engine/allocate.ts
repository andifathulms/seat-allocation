import { divisorAt } from './divisors';
import { allocateHareQuota } from './quota';
import type { DivisorRule, PartyId, QuotientCell, SeatAward } from './types';

export interface DistrictInput {
  /** party ids in a stable order; the hot loop works on ordinals into this */
  ids: readonly PartyId[];
  /** votes[i] is the district vote of ids[i]; already filtered to qualifiers */
  votes: Float64Array;
  /** ballotNumbers[i] is the nomor urut of ids[i], used only to break ties */
  ballotNumbers: Int32Array;
  magnitude: number;
}

export interface DistrictOutcome {
  /** seats[i] is the seat count of ids[i] */
  seats: Int32Array;
  trace: SeatAward[];
  ties: Array<{ ordinal: number; parties: PartyId[] }>;
}

/**
 * Highest-averages loop, parameterised by a divisor sequence, or Hare quota with
 * largest remainder. Both return the same outcome shape.
 *
 * Ties are exact-equality only. At Indonesian vote magnitudes they are all but
 * impossible, but they must resolve deterministically and must be reported:
 * higher raw district vote first, then lower ballot number.
 */
export function allocateDistrict(
  input: DistrictInput,
  rule: DivisorRule,
  wantTrace: boolean,
): DistrictOutcome {
  if (rule === 'hare-quota') return allocateHareQuota(input, wantTrace);

  const n = input.ids.length;
  const seats = new Int32Array(n);
  const trace: SeatAward[] = [];
  const ties: Array<{ ordinal: number; parties: PartyId[] }> = [];

  if (n === 0) return { seats, trace, ties };

  const quotients = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    quotients[i] = (input.votes[i] as number) / divisorAt(rule, 0);
  }

  for (let ordinal = 1; ordinal <= input.magnitude; ordinal++) {
    let best = -1;
    let bestQ = -Infinity;
    for (let i = 0; i < n; i++) {
      const q = quotients[i] as number;
      if (q > bestQ) {
        bestQ = q;
        best = i;
      } else if (q === bestQ && best >= 0 && breaksTieAgainst(input, i, best)) {
        best = i;
      }
    }
    if (best < 0 || bestQ <= 0) break;

    const shared: PartyId[] = [];
    for (let i = 0; i < n; i++) {
      if (quotients[i] === bestQ) shared.push(input.ids[i] as PartyId);
    }
    const tied = shared.length > 1 ? shared : null;
    if (tied) ties.push({ ordinal, parties: tied });

    if (wantTrace) {
      trace.push({
        ordinal,
        winner: input.ids[best] as PartyId,
        quotient: bestQ,
        table: snapshot(input, quotients, rule, seats),
        tied,
        phase: 'divisor',
      });
    }

    seats[best] = (seats[best] as number) + 1;
    quotients[best] =
      (input.votes[best] as number) / divisorAt(rule, seats[best] as number);
  }

  return { seats, trace, ties };
}

function breaksTieAgainst(
  input: DistrictInput,
  candidate: number,
  incumbent: number,
): boolean {
  const vc = input.votes[candidate] as number;
  const vi = input.votes[incumbent] as number;
  if (vc !== vi) return vc > vi;
  return (
    (input.ballotNumbers[candidate] as number) <
    (input.ballotNumbers[incumbent] as number)
  );
}

function snapshot(
  input: DistrictInput,
  quotients: Float64Array,
  rule: DivisorRule,
  seats: Int32Array,
): QuotientCell[] {
  const table: QuotientCell[] = new Array(input.ids.length);
  for (let i = 0; i < input.ids.length; i++) {
    table[i] = {
      party: input.ids[i] as PartyId,
      quotient: quotients[i] as number,
      divisor: divisorAt(rule, seats[i] as number),
    };
  }
  return table;
}
