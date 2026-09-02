import type { PartyId } from '../../engine/types';

/**
 * DESIGN.md §5.1: parties are ordered around the arc by seat count, largest at
 * the left. Ordering by size rather than by any political axis keeps block
 * boundaries stable as counts change, and the app has no business asserting a
 * left-right axis.
 *
 * Ties on seat count fall back to national vote and then to ballot number, so
 * the order is total and does not flicker.
 */
export function blockOrder(
  seatsByParty: Readonly<Record<PartyId, number>>,
  parties: ReadonlyArray<{ id: PartyId; nationalVotes: number; ballotNumber: number }>,
): PartyId[] {
  return parties
    .filter((p) => (seatsByParty[p.id] ?? 0) > 0)
    .sort(
      (a, b) =>
        (seatsByParty[b.id] ?? 0) - (seatsByParty[a.id] ?? 0) ||
        b.nationalVotes - a.nationalVotes ||
        a.ballotNumber - b.ballotNumber,
    )
    .map((p) => p.id);
}

/** The party filling each seat position, left to right. */
export function seatParties(
  order: readonly PartyId[],
  seatsByParty: Readonly<Record<PartyId, number>>,
  total: number,
): PartyId[] {
  const out: PartyId[] = [];
  for (const id of order) {
    const n = seatsByParty[id] ?? 0;
    for (let i = 0; i < n && out.length < total; i++) out.push(id);
  }
  while (out.length < total) out.push('');
  return out;
}

/**
 * Matches the seats already on screen to the positions they should occupy next.
 *
 * A seat whose party is unchanged is matched to a position held by that same
 * party, in order, so it barely moves. The seats left over are the ones whose
 * party lost them, and they fill the positions left over, which are the ones the
 * gaining party won. Those are the seats that travel, and they carry their old
 * colour across the journey — DESIGN.md §6.3.
 *
 * Returns, for each seat currently on screen, the index of the position it
 * should move to.
 */
export function matchSeats(current: readonly PartyId[], next: readonly PartyId[]): number[] {
  const total = next.length;
  const targets = new Array<number>(current.length).fill(-1);

  const freePositionsByParty = new Map<PartyId, number[]>();
  for (let p = total - 1; p >= 0; p--) {
    const id = next[p] as PartyId;
    const list = freePositionsByParty.get(id);
    if (list) list.push(p);
    else freePositionsByParty.set(id, [p]);
  }

  const unmatchedSeats: number[] = [];
  for (let s = 0; s < current.length; s++) {
    const list = freePositionsByParty.get(current[s] as PartyId);
    const position = list?.pop();
    if (position === undefined) unmatchedSeats.push(s);
    else targets[s] = position;
  }

  const leftoverPositions: number[] = [];
  for (const list of freePositionsByParty.values()) {
    while (list.length > 0) leftoverPositions.push(list.pop() as number);
  }
  leftoverPositions.sort((a, b) => a - b);

  for (let i = 0; i < unmatchedSeats.length; i++) {
    const seat = unmatchedSeats[i] as number;
    const position = leftoverPositions[i];
    if (position !== undefined) targets[seat] = position;
  }

  return targets;
}

/** Centroid of a party's block, used to place its label. */
export function blockCentroid(
  positions: ReadonlyArray<{ x: number; y: number }>,
  from: number,
  count: number,
): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (let i = from; i < from + count; i++) {
    const p = positions[i];
    if (!p) continue;
    x += p.x;
    y += p.y;
  }
  return { x: x / count, y: y / count };
}
