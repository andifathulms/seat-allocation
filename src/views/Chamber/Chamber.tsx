import { useMemo, useRef } from 'react';
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
  const seats = useRef<SeatState[]>([]);
  const current = useRef<PartyId[]>([]);

  // Rebuild the migration plan whenever the target assignment changes. The seats
  // that keep their party barely move; the ones left over are the seats that
  // changed hands, and they travel.
  const plan = useMemo(() => {
    const previous = current.current;
    const points = geometry.seats;
    const built: SeatState[] = [];

    if (previous.length !== total) {
      for (let i = 0; i < total; i++) {
        const point = points[i];
        const party = nextParties[i] as PartyId;
        const color = colors.get(party) ?? '#000000';
        built.push({
          party,
          fromX: point?.x ?? 0,
          fromY: point?.y ?? 0,
          fromColor: color,
          toX: point?.x ?? 0,
          toY: point?.y ?? 0,
          toColor: color,
        });
      }
    } else {
      const targets = matchSeats(previous, nextParties);
      const existing = seats.current;
      for (let s = 0; s < total; s++) {
        const target = targets[s] as number;
        const point = points[target];
        const previousSeat = existing[s];
        const fromParty = previous[s] as PartyId;
        const toParty = nextParties[target] as PartyId;
        built.push({
          party: toParty,
          fromX: previousSeat?.toX ?? point?.x ?? 0,
          fromY: previousSeat?.toY ?? point?.y ?? 0,
          fromColor: colors.get(fromParty) ?? '#000000',
          toX: point?.x ?? 0,
          toY: point?.y ?? 0,
          toColor: colors.get(toParty) ?? '#000000',
        });
      }
      // Keep the token order aligned with the positions so the next diff starts
      // from where this one landed.
      built.sort((a, b) => a.toX - b.toX || a.toY - b.toY);
    }

    seats.current = built;
    current.current = built.map((s) => s.party);
    return built;
  }, [nextParties, geometry, colors, total]);

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
