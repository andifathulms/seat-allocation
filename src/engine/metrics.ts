import type { Metrics, Party, PartyId } from './types';

/**
 * All indices run over all parties that contested, not only those that won
 * seats. A party with votes and no seats contributes its full vote share to the
 * disproportionality figures; that is the point of measuring them.
 */
export function computeMetrics(
  parties: readonly Party[],
  seatsByParty: Readonly<Record<PartyId, number>>,
): Metrics {
  let totalValidVotes = 0;
  let totalSeats = 0;
  for (const p of parties) totalValidVotes += p.nationalVotes;
  for (const p of parties) totalSeats += seatsByParty[p.id] ?? 0;

  const shares: Record<PartyId, { voteShare: number; seatShare: number }> = {};
  let sumSquares = 0;
  let sumAbs = 0;
  let voteConc = 0;
  let seatConc = 0;
  let unconvertedVotes = 0;

  for (const p of parties) {
    const seats = seatsByParty[p.id] ?? 0;
    const voteShare = totalValidVotes > 0 ? p.nationalVotes / totalValidVotes : 0;
    const seatShare = totalSeats > 0 ? seats / totalSeats : 0;
    shares[p.id] = { voteShare, seatShare };

    const d = voteShare - seatShare;
    sumSquares += d * d;
    sumAbs += Math.abs(d);
    voteConc += voteShare * voteShare;
    seatConc += seatShare * seatShare;
    if (seats === 0) unconvertedVotes += p.nationalVotes;
  }

  return {
    totalSeats,
    totalValidVotes,
    unconvertedVotes,
    unconvertedShare: totalValidVotes > 0 ? unconvertedVotes / totalValidVotes : 0,
    // Reported in percentage points, the convention for both indices.
    gallagher: Math.sqrt(0.5 * sumSquares) * 100,
    loosemoreHanby: 0.5 * sumAbs * 100,
    enpVotes: voteConc > 0 ? 1 / voteConc : 0,
    enpSeats: seatConc > 0 ? 1 / seatConc : 0,
    shares,
  };
}
