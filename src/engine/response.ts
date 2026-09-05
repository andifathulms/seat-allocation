import { allocate } from './index';
import { totalValidVotes } from './threshold';
import type { Dapil, Party, PartyId, RuleSet } from './types';

export interface Regime {
  /**
   * Exclusive lower bound of the band, inclusive only for the first band, which
   * starts at zero. See the note on half-openness in `thresholdResponse`.
   */
  from: number;
  /** Inclusive upper bound. */
  to: number;
  /** Parties admitted throughout the band. */
  qualifying: PartyId[];
  seatsByParty: Record<PartyId, number>;
  partiesWithSeats: number;
  unconvertedVotes: number;
  gallagher: number;
  /** The party dropped on entering this band, i.e. the one whose share is `from`. */
  lostHere: PartyId | null;
}

export interface Response {
  regimes: Regime[];
  max: number;
}

/**
 * Every parliament the threshold can produce across the slider's whole range.
 *
 * The app's primary control is continuous but its output is not. Under a
 * national threshold the admitted set changes only where the threshold crosses
 * a party's national vote share, so the response is a step function with one
 * breakpoint per party and the allocation is identical everywhere in between.
 * Eighteen parties therefore give at most eighteen breakpoints, and the app can
 * enumerate the entire range exactly rather than sampling it.
 *
 * The bands are half-open on the LEFT — (from, to] — and getting this backwards
 * is the natural mistake. The statutory rule admits a party whose share is
 * greater than *or equal to* the threshold, so a party is still seated at a
 * threshold exactly equal to its own share and is dropped only just above it.
 * A band is therefore sampled at its upper bound, never its lower one: at the
 * lower bound the party that the band exists to exclude is still in.
 *
 * Only defined for a national threshold. Under per-dapil scope the breakpoints
 * are per-dapil shares — up to 84 x 18 of them — and under 'none' there is no
 * response at all; both cases return null and the view says so rather than
 * drawing a curve whose premise does not hold.
 */
export function thresholdResponse(
  parties: readonly Party[],
  dapil: readonly Dapil[],
  rules: RuleSet,
  max: number,
): Response | null {
  if (rules.thresholdScope !== 'national') return null;

  const total = totalValidVotes(parties);
  if (total <= 0) return null;

  const shares = parties
    .map((p) => ({ id: p.id, share: p.nationalVotes / total }))
    .filter((s) => s.share > 0 && s.share <= max)
    .sort((a, b) => a.share - b.share);

  // Bands run (previous share, this share]. The first starts at zero; the last
  // runs from the largest share inside the range up to the slider's maximum,
  // and is omitted when a party sits exactly on that maximum.
  const bands: Array<{ from: number; to: number; lostHere: PartyId | null }> = [];
  let from = 0;
  let lostHere: PartyId | null = null;
  for (const s of shares) {
    // Parties on identical shares open one band, not two.
    if (s.share - from < 1e-12) {
      lostHere = s.id;
      continue;
    }
    bands.push({ from, to: s.share, lostHere });
    from = s.share;
    lostHere = s.id;
  }
  if (max - from > 1e-12) bands.push({ from, to: max, lostHere });

  const regimes: Regime[] = bands.map((band) => {
    // Sampled at the upper bound, which is inside the band under the >= rule.
    const result = allocate(
      parties,
      dapil,
      { ...rules, threshold: band.to },
      { trace: false },
    );
    let partiesWithSeats = 0;
    for (const p of parties) if ((result.seatsByParty[p.id] ?? 0) > 0) partiesWithSeats++;
    return {
      from: band.from,
      to: band.to,
      qualifying: result.qualifying,
      seatsByParty: result.seatsByParty,
      partiesWithSeats,
      unconvertedVotes: result.metrics.unconvertedVotes,
      gallagher: result.metrics.gallagher,
      lostHere: band.lostHere,
    };
  });

  return { regimes, max };
}

/** The regime a given threshold falls in, or null if it falls outside the range. */
export function regimeAt(response: Response, threshold: number): Regime | null {
  for (const r of response.regimes) {
    const aboveFloor = r.from === 0 ? threshold >= 0 : threshold > r.from;
    if (aboveFloor && threshold <= r.to) return r;
  }
  return null;
}
