import type { DistrictInput, DistrictOutcome } from './allocate';
import type { PartyId, QuotientCell, SeatAward } from './types';

/**
 * Hare quota with largest remainder.
 *
 * quota = valid votes of qualifying parties in the district / magnitude.
 * Each party takes the whole part of its quota, then the seats still unclaimed
 * go to the largest remainders. Ties on a remainder resolve the same way as in
 * the divisor loop: higher raw district vote, then lower ballot number.
 */
export function allocateHareQuota(
  input: DistrictInput,
  wantTrace: boolean,
): DistrictOutcome {
  const n = input.ids.length;
  const seats = new Int32Array(n);
  const trace: SeatAward[] = [];
  const ties: Array<{ ordinal: number; parties: PartyId[] }> = [];
  if (n === 0) return { seats, trace, ties };

  let total = 0;
  for (let i = 0; i < n; i++) total += input.votes[i] as number;
  if (total <= 0) return { seats, trace, ties };

  const quota = total / input.magnitude;
  const remainders = new Float64Array(n);
  let awarded = 0;
  let ordinal = 0;

  for (let i = 0; i < n; i++) {
    const exact = (input.votes[i] as number) / quota;
    const whole = Math.floor(exact);
    seats[i] = whole;
    remainders[i] = exact - whole;
    awarded += whole;
  }

  if (wantTrace) {
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < (seats[i] as number); k++) {
        trace.push({
          ordinal: ++ordinal,
          winner: input.ids[i] as PartyId,
          quotient: (input.votes[i] as number) / quota,
          table: quotaTable(input, remainders, quota),
          tied: null,
          phase: 'quota',
        });
      }
    }
  } else {
    ordinal = awarded;
  }

  const claimed = new Uint8Array(n);
  while (awarded < input.magnitude) {
    let best = -1;
    let bestR = -Infinity;
    for (let i = 0; i < n; i++) {
      if (claimed[i]) continue;
      const r = remainders[i] as number;
      if (r > bestR) {
        bestR = r;
        best = i;
      } else if (r === bestR && best >= 0 && beats(input, i, best)) {
        best = i;
      }
    }
    if (best < 0) break;

    const shared: PartyId[] = [];
    for (let i = 0; i < n; i++) {
      if (!claimed[i] && remainders[i] === bestR) shared.push(input.ids[i] as PartyId);
    }
    const tied = shared.length > 1 ? shared : null;
    if (tied) ties.push({ ordinal: ordinal + 1, parties: tied });

    if (wantTrace) {
      trace.push({
        ordinal: ++ordinal,
        winner: input.ids[best] as PartyId,
        quotient: bestR,
        table: quotaTable(input, remainders, quota),
        tied,
        phase: 'remainder',
      });
    }

    seats[best] = (seats[best] as number) + 1;
    claimed[best] = 1;
    awarded++;
  }

  return { seats, trace, ties };
}

function beats(input: DistrictInput, candidate: number, incumbent: number): boolean {
  const vc = input.votes[candidate] as number;
  const vi = input.votes[incumbent] as number;
  if (vc !== vi) return vc > vi;
  return (
    (input.ballotNumbers[candidate] as number) <
    (input.ballotNumbers[incumbent] as number)
  );
}

function quotaTable(
  input: DistrictInput,
  remainders: Float64Array,
  quota: number,
): QuotientCell[] {
  const table: QuotientCell[] = new Array(input.ids.length);
  for (let i = 0; i < input.ids.length; i++) {
    table[i] = {
      party: input.ids[i] as PartyId,
      quotient: remainders[i] as number,
      divisor: quota,
    };
  }
  return table;
}
