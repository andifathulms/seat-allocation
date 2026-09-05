import type { Allocation, Dapil, Party, PartyId } from './types';

export interface Transfer {
  dapil: string;
  dapilName: string;
  from: PartyId;
  to: PartyId;
  seats: number;
}

export interface Ledger {
  transfers: Transfer[];
  /** Total seats that changed hands, counted once each. */
  seatsMoved: number;
  dapilChanged: number;
  /** Net seats gained or lost per party across every dapil. */
  net: Array<{ party: PartyId; delta: number }>;
}

/**
 * What actually moved between two allocations, dapil by dapil.
 *
 * The archipelago already computes this comparison and renders it as an
 * anonymous marker: a triangle on a cell, and a count above the grid. The app
 * knew which party lost which seat to which party in which dapil and discarded
 * it at the moment of display, which left its central claim — that a national
 * rule has local consequences — asserted rather than itemised.
 *
 * Pairing is by size, not by adjacency: within a dapil the losers and gainers
 * are matched largest-first. No claim is made that a particular seat travelled
 * between a particular pair. Highest-averages allocation has no such notion —
 * a seat is not owned and then taken, it is awarded to whoever holds the top
 * quotient at that step — so the pairing is a way to read the net change, and
 * `seatsMoved` rather than the pairing is the figure to quote.
 */
export function ledger(
  current: Allocation,
  baseline: Allocation,
  parties: readonly Party[],
  dapil: readonly Dapil[],
): Ledger {
  const names = new Map(dapil.map((d) => [d.code, d.name]));
  const baseByCode = new Map(baseline.byDapil.map((r) => [r.dapil, r]));

  const transfers: Transfer[] = [];
  const net = new Map<PartyId, number>();
  let seatsMoved = 0;
  let dapilChanged = 0;

  for (const result of current.byDapil) {
    const before = baseByCode.get(result.dapil);
    if (!before) continue;

    const losers: Array<{ party: PartyId; n: number }> = [];
    const gainers: Array<{ party: PartyId; n: number }> = [];
    for (const p of parties) {
      const delta = (result.seats[p.id] ?? 0) - (before.seats[p.id] ?? 0);
      if (delta === 0) continue;
      net.set(p.id, (net.get(p.id) ?? 0) + delta);
      if (delta < 0) losers.push({ party: p.id, n: -delta });
      else gainers.push({ party: p.id, n: delta });
    }
    if (losers.length === 0 && gainers.length === 0) continue;

    dapilChanged++;
    losers.sort((a, b) => b.n - a.n);
    gainers.sort((a, b) => b.n - a.n);

    let li = 0;
    let gi = 0;
    while (li < losers.length && gi < gainers.length) {
      const loser = losers[li] as { party: PartyId; n: number };
      const gainer = gainers[gi] as { party: PartyId; n: number };
      const n = Math.min(loser.n, gainer.n);
      transfers.push({
        dapil: result.dapil,
        dapilName: names.get(result.dapil) ?? result.dapil,
        from: loser.party,
        to: gainer.party,
        seats: n,
      });
      seatsMoved += n;
      loser.n -= n;
      gainer.n -= n;
      if (loser.n === 0) li++;
      if (gainer.n === 0) gi++;
    }
  }

  // Two parties with the same net movement would otherwise be ordered by
  // whichever dapil happened to mention them first, which makes a displayed
  // table depend on iteration order. Ballot number breaks the tie, as it does
  // for quotient ties in §6.4.
  const ballot = new Map(parties.map((p) => [p.id, p.ballotNumber]));

  return {
    transfers,
    seatsMoved,
    dapilChanged,
    net: [...net.entries()]
      .map(([party, delta]) => ({ party, delta }))
      .filter((e) => e.delta !== 0)
      .sort(
        (a, b) =>
          b.delta - a.delta || (ballot.get(a.party) ?? 0) - (ballot.get(b.party) ?? 0),
      ),
  };
}
