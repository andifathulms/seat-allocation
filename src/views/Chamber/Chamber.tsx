import { useEffect, useMemo, useRef } from 'react';
import type { Party, PartyId } from '../../engine/types';
import { easeMigrate, mix, mixHex, useProgress } from '../../ui/motion';
import { blockCentroid, blockOrder, matchSeats, seatParties } from './assign';
import { S } from '../../copy/strings.id';
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
  /** true when this seat belongs to a party that held none before */
  arriving: boolean;
}

const MIGRATE = 420;
/**
 * DESIGN.md §6.4. A party crossing back into parliament gets more than the
 * standard treatment: its seats arrive after the other migrations have settled,
 * so the arrival reads as a separate event rather than as part of the same
 * shuffle. Nothing else in the app is emphasised this way, and the emphasis is
 * timing alone — no sound, no flash, no caption. The seats arriving is enough.
 *
 * The rule is general rather than written around one party: whichever party
 * crosses, it is the crossing that earns the beat.
 */
const ARRIVE = 300;

/**
 * Width of a block label's chip in viewBox units. The label is set at 0.048 and
 * the count beneath it at 0.062, so the count is never the wider of the two for
 * a short name; measuring the name at its own size with a per-character advance
 * that suits Archivo's caps is close enough at this scale and costs no layout.
 */
function chipWidth(short: string): number {
  return Math.max(0.13, short.length * 0.031 + 0.028);
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

  const { plan, positions, arriving } = useMemo(() => {
    const points = geometry.seats;
    const usable = committed !== null && committed.parties.length === total;
    const previousParties = usable ? committed.parties : nextParties;
    const previousPositions = usable
      ? committed.positions
      : Array.from({ length: total }, (_, i) => i);

    const targets = matchSeats(previousParties, nextParties);

    const held = new Set(previousParties);
    const entering = new Set<PartyId>();
    for (const id of nextParties) {
      if (id && !held.has(id)) entering.add(id);
    }

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
        arriving: entering.has(toParty),
      };
    }
    return { plan: built, positions: targets, arriving: entering.size > 0 };
  }, [committed, nextParties, geometry, colors, total]);

  useEffect(() => {
    commit.current = { parties: plan.map((seat) => seat.party), positions };
  }, [plan, positions]);

  const span = MIGRATE + (arriving ? ARRIVE : 0);
  const duration = animate ? span : 0;

  useProgress(plan, duration, (raw) => {
    const elapsed = raw * span;
    const nodes = circles.current;

    for (let i = 0; i < plan.length; i++) {
      const seat = plan[i] as SeatState;
      const node = nodes[i];
      if (!node) continue;

      // Seats of an entering party hold their old place until the rest of the
      // chamber has finished moving, then travel.
      const local = seat.arriving
        ? Math.min(Math.max((elapsed - MIGRATE) / ARRIVE, 0), 1)
        : Math.min(elapsed / MIGRATE, 1);
      const eased = easeMigrate(local);

      node.setAttribute('cx', String(mix(seat.fromX, seat.toX, eased)));
      node.setAttribute('cy', String(mix(seat.fromY, seat.toY, eased)));

      if (seat.fromColor !== seat.toColor) {
        // The colour crosses over the middle third of the journey, so the seat
        // is legibly leaving one block before it is legibly joining the next.
        const t = Math.min(Math.max((local - 1 / 3) * 3, 0), 1);
        node.setAttribute('fill', mixHex(seat.fromColor, seat.toColor, t));
      } else if (node.getAttribute('fill') !== seat.toColor) {
        node.setAttribute('fill', seat.toColor);
      }
    }
  });

  // Labels sit at block centroids and are laid out from the final positions, so
  // they do not travel with the seats.
  //
  // A block too small to hold its label keeps it, on a leader line drawn outward
  // along the block's own radius — DESIGN.md §5.1. Dropping the label instead
  // would hide exactly the parties the app is about.
  const labels = useMemo(() => {
    let from = 0;
    const out = order.map((id) => {
      const count = seatsByParty[id] ?? 0;
      const centroid = blockCentroid(geometry.seats, from, count);
      const party = parties.find((p) => p.id === id);
      from += count;
      const angle = Math.atan2(-centroid.y, centroid.x);
      return {
        id,
        count,
        centroid,
        angle,
        short: party?.shortName ?? id,
        share: count / total,
        inside: count / total >= 0.045,
      };
    });

    // Outside labels are pushed out to successive radii so two small
    // neighbouring blocks do not land on the same spot.
    let rank = 0;
    for (const label of out) {
      if (label.inside) continue;
      const radius = 1.09 + (rank % 2) * 0.1;
      rank++;
      (label as typeof label & { anchor: { x: number; y: number } }).anchor = {
        x: Math.cos(label.angle) * radius,
        y: -Math.sin(label.angle) * radius,
      };
    }
    return out as Array<
      (typeof out)[number] & { anchor?: { x: number; y: number } }
    >;
  }, [order, seatsByParty, geometry, parties, total]);

  // Room for the seat stroke on every side, plus enough below the axis for a
  // block label whose centroid sits in the innermost row.
  const pad = geometry.seatRadius * 2;
  const below = 0.09;
  // Room outside the arc for the leader-line labels of blocks too small to
  // carry one inside.
  const outside = labels.some((l) => !l.inside) ? 0.34 : 0;
  const viewBox = `${-1 - pad - outside} ${-1 - pad - outside * 0.5} ${
    2 + pad * 2 + outside * 2
  } ${1 + pad + below + outside * 0.5}`;

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
            stroke="var(--stage)"
            strokeWidth={geometry.seatRadius * 0.14}
          />
        ))}
        {/* The seat total sits in the hemicycle's own void. DESIGN.md §3.1
            reserves the hero size for this figure and gives it one instance;
            this is it, and putting it inside the arc means the number and the
            thing it counts are read as one object. */}
        <g className="chamber__total" aria-hidden="true">
          <text x={0} y={-0.035} textAnchor="middle" className="chamber__total-value">
            {total}
          </text>
          <text x={0} y={0.055} textAnchor="middle" className="chamber__total-label">
            {S.seats}
          </text>
        </g>
        {labels.map((l) =>
          l.inside ? (
            <g key={l.id} className="chamber__label">
              {/* A chip, not a halo. The label sits on top of its own party's
                  colour, and against eighteen hues of every lightness a stroked
                  outline holds at some and fails at others. A chip in the stage
                  colour holds against all of them, and reads as a tag pinned to
                  the block rather than as text floating over it. */}
              <rect
                className="chamber__chip"
                x={l.centroid.x - chipWidth(l.short) / 2}
                y={l.centroid.y - 0.058}
                width={chipWidth(l.short)}
                height={0.098}
                rx={0.014}
              />
              <text x={l.centroid.x} y={l.centroid.y - 0.014} textAnchor="middle">
                {l.short}
              </text>
              <text
                x={l.centroid.x}
                y={l.centroid.y + 0.052}
                textAnchor="middle"
                className="chamber__count"
              >
                {l.count}
              </text>
            </g>
          ) : (
            l.anchor && (
              <g key={l.id} className="chamber__label chamber__label--out">
                <line
                  x1={l.centroid.x}
                  y1={l.centroid.y}
                  x2={l.anchor.x}
                  y2={l.anchor.y}
                  className="chamber__leader"
                />
                <text
                  x={l.anchor.x + (l.anchor.x < 0 ? -0.014 : 0.014)}
                  y={l.anchor.y + 0.016}
                  textAnchor={l.anchor.x < 0 ? 'end' : 'start'}
                >
                  {l.short} {l.count}
                </text>
              </g>
            )
          ),
        )}
      </svg>
    </figure>
  );
}
