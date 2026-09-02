/**
 * Hemicycle geometry. Pure, and independent of React: given a seat total it
 * returns positions in a unit half-annulus, ordered left to right so that a
 * party block occupies a contiguous wedge.
 *
 * Angles run from π (left) to 0 (right). Seats are sorted by angle first and
 * radius second, which is what keeps a block reading as one wedge rather than as
 * a set of arcs.
 */

export interface SeatPoint {
  x: number;
  y: number;
  angle: number;
  row: number;
  /** seat radius in the same units as x and y */
  r: number;
}

export interface Hemicycle {
  seats: SeatPoint[];
  rows: number;
  /** outer radius; the viewBox is 2 wide and 1 + seatRadius tall */
  outerRadius: number;
  seatRadius: number;
}

const INNER_RATIO = 0.42;

/**
 * Chooses the row count whose seat spacing along the arc comes closest to the
 * spacing between rows, which is what makes the arc read as a regular grid
 * rather than as rings.
 */
function chooseRows(total: number): number {
  let best = 1;
  let bestError = Infinity;
  for (let rows = 2; rows <= 24; rows++) {
    const ringWidth = (1 - INNER_RATIO) / rows;
    // Total arc length available across all rows, at the mid-radius of each ring.
    let arc = 0;
    for (let i = 0; i < rows; i++) {
      arc += Math.PI * (INNER_RATIO + ringWidth * (i + 0.5));
    }
    const along = arc / total;
    const error = Math.abs(along - ringWidth) / ringWidth;
    if (error < bestError) {
      bestError = error;
      best = rows;
    }
  }
  return best;
}

export function hemicycle(total: number): Hemicycle {
  if (total <= 0) {
    return { seats: [], rows: 0, outerRadius: 1, seatRadius: 0 };
  }

  const rows = chooseRows(total);
  const ringWidth = (1 - INNER_RATIO) / rows;
  const radii: number[] = [];
  for (let i = 0; i < rows; i++) radii.push(INNER_RATIO + ringWidth * (i + 0.5));

  // Seats per row in proportion to that row's arc length, by largest remainder
  // so the counts sum to the total exactly.
  const weight = radii.reduce((a, b) => a + b, 0);
  const exact = radii.map((r) => (r / weight) * total);
  const counts = exact.map(Math.floor);
  let left = total - counts.reduce((a, b) => a + b, 0);
  for (const { i } of exact
    .map((v, i) => ({ i, rem: v - Math.floor(v) }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i)) {
    if (left <= 0) break;
    counts[i] = (counts[i] as number) + 1;
    left--;
  }

  const smallestGap = Math.min(
    ringWidth,
    ...radii.map((r, i) => (Math.PI * r) / Math.max(counts[i] as number, 1)),
  );
  const seatRadius = (smallestGap / 2) * 0.82;

  const seats: SeatPoint[] = [];
  for (let row = 0; row < rows; row++) {
    const n = counts[row] as number;
    const r = radii[row] as number;
    for (let i = 0; i < n; i++) {
      // Half-step inset at both ends so the outermost seats are not on the axis.
      const t = n === 1 ? 0.5 : (i + 0.5) / n;
      const angle = Math.PI * (1 - t);
      seats.push({
        x: Math.cos(angle) * r,
        y: -Math.sin(angle) * r,
        angle,
        row,
        r: seatRadius,
      });
    }
  }

  // Left to right; within a column the inner rows come first so a block's
  // boundary is a clean radial line.
  seats.sort((a, b) => b.angle - a.angle || a.row - b.row);

  return { seats, rows, outerRadius: 1, seatRadius };
}
