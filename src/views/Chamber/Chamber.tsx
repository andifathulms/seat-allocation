import { useEffect, useMemo, useRef } from 'react';
import type { Party, PartyId } from '../../engine/types';
import { easeMigrate, mix, mixHex, useProgress } from '../../ui/motion';
import { blockCentroid, blockOrder, matchSeats, seatParties } from './assign';
import { hemicycle } from './layout';
import './chamber.css';

interface Props {
  parties: readonly Party[];
  seatsByParty: Readonly<Record<PartyId, number>>;
  total: number;
  /**
   * DESIGN.md §6.1. A continuous control maps directly with no easing; a
   * discrete one animates so the user can see what moved.
   */
  animate: boolean;
}

interface SeatState {
  party: PartyId;
  fromX: number;
  fromY: number;
  fromColor: string;
  toX: number;
  toY: number;
  toColor: string;
}

/**
 * 580 seats, one array of records, one rAF loop writing transforms in a single
 * pass. Never one animated component per seat: CLAUDE.md is explicit that
 * component-per-seat with individual springs is the likeliest way to drop frames
 * on a phone.
 */
export function Chamber({ parties, seatsByParty, total, animate }: Props) {
  const geometry = useMemo(() => hemicycle(total), [total]);
  const colors = useMemo(() => {
    const map = new Map<PartyId, string>();
    for (const p of parties) map.set(p.id, p.color);
    return map;
  }, [parties]);

  const order = useMemo(
    () => blockOrder(seatsByParty, parties),
    [seatsByParty, parties],
  );
  const nextParties = useMemo(
    () => seatParties(order, seatsByParty, total),
    [order, seatsByParty, total],
  );

  const circles = useRef<(SVGCircleElement | null)[]>([]);

  /**
   * A stable set of 580 tokens. Token i is the same seat from one rule change to
   * the next; what changes is the party it belongs to and the position it
   * occupies. Holding identity this way is what lets a seat travel rather than
   * cross-fade.
   *
   * The committed state is read during render and written in an effect. Writing
   * it inside the useMemo would be a side effect in render: StrictMode renders
   * twice, the second pass would read back what the first had just written, and
   * every migration would collapse to no movement at all.
   */
  const commit = useRef<{ parties: PartyId[]; positions: number[] } | null>(null);
  const committed = commit.current;

  const { plan, positions } = useMemo(() => {
    const points = geometry.seats;
    const usable = committed !== null && committed.parties.length === total;
    const previousParties = usable ? committed.parties : nextParties;
    const previousPositions = usable
      ? committed.positions
      : Array.from({ length: total }, (_, i) => i);

    const targets = matchSeats(previousParties, nextParties);
    const built: SeatState[] = new Array(total);

    for (let i = 0; i < total; i++) {
      const to = targets[i] ?? i;
      const from = previousPositions[i] ?? i;
      const fromPoint = points[from];
      const toPoint = points[to];
      const fromParty = previousParties[i] as PartyId;
      const toParty = nextParties[to] as PartyId;
      built[i] = {
        party: toParty,
        fromX: fromPoint?.x ?? 0,
        fromY: fromPoint?.y ?? 0,
        fromColor: colors.get(fromParty) ?? '#000000',
        toX: toPoint?.x ?? 0,
        toY: toPoint?.y ?? 0,
        toColor: colors.get(toParty) ?? '#000000',
      };
    }
    return { plan: built, positions: targets };
  }, [committed, nextParties, geometry, colors, total]);

  useEffect(() => {
    commit.current = { parties: plan.map((seat) => seat.party), positions };
  }, [plan, positions]);

  const duration = animate ? 420 : 0;

  useProgress(plan, duration, (raw) => {
    const eased = easeMigrate(raw);
    const nodes = circles.current;
    for (let i = 0; i < plan.length; i++) {
      const seat = plan[i] as SeatState;
      const node = nodes[i];
      if (!node) continue;
      node.setAttribute('cx', String(mix(seat.fromX, seat.toX, eased)));
      node.setAttribute('cy', String(mix(seat.fromY, seat.toY, eased)));
      if (seat.fromColor !== seat.toColor) {
        // The colour crosses over the middle third of the journey, so the seat
        // is legibly leaving one block before it is legibly joining the next.
        const t = Math.min(Math.max((raw - 1 / 3) * 3, 0), 1);
        node.setAttribute('fill', mixHex(seat.fromColor, seat.toColor, t));
      } else if (node.getAttribute('fill') !== seat.toColor) {
        node.setAttribute('fill', seat.toColor);
      }
    }
  });

  // Labels sit at block centroids and are laid out from the final positions, so
  // they do not travel with the seats.
  const labels = useMemo(() => {
    let from = 0;
    return order.map((id) => {
      const count = seatsByParty[id] ?? 0;
      const centroid = blockCentroid(geometry.seats, from, count);
      const party = parties.find((p) => p.id === id);
      from += count;
      return { id, count, centroid, short: party?.shortName ?? id, share: count / total };
    });
  }, [order, seatsByParty, geometry, parties, total]);

  // Room for the seat stroke on every side, plus enough below the axis for a
  // block label whose centroid sits in the innermost row.
  const pad = geometry.seatRadius * 2;
  const below = 0.09;
  const viewBox = `${-1 - pad} ${-1 - pad} ${2 + pad * 2} ${1 + pad + below}`;

  return (
    <figure className="chamber">
      <svg
        className="chamber__svg"
        viewBox={viewBox}
        role="img"
        aria-label={`Hemisiklus ${total} kursi DPR. ${labels
          .map((l) => `${l.short} ${l.count}`)
          .join(', ')}.`}
      >
        {plan.map((seat, i) => (
          <circle
            // The key is the position, never the party: React must not unmount
            // and remount a seat when it changes hands.
            key={i}
            ref={(node) => {
              circles.current[i] = node;
            }}
            cx={seat.fromX}
            cy={seat.fromY}
            r={geometry.seatRadius}
            fill={seat.fromColor}
            stroke="var(--panel-deep)"
            strokeWidth={geometry.seatRadius * 0.14}
          />
        ))}
        {labels
          .filter((l) => l.share >= 0.045)
          .map((l) => (
            <g key={l.id} className="chamber__label">
              <text x={l.centroid.x} y={l.centroid.y - 0.012} textAnchor="middle">
                {l.short}
              </text>
              <text
                x={l.centroid.x}
                y={l.centroid.y + 0.062}
                textAnchor="middle"
                className="chamber__count"
              >
                {l.count}
              </text>
            </g>
          ))}
      </svg>
    </figure>
  );
}
