import { useMemo, useRef } from 'react';
import { scaleLinear } from 'd3-scale';
import type { Metrics, Party } from '../../engine/types';
import { S } from '../../copy/strings.id';
import { percent } from '../../ui/format';
import { easeMigrate, mix, useCommitted, useProgress } from '../../ui/motion';
import './proportionality.css';

interface Props {
  parties: readonly Party[];
  metrics: Metrics;
  animate: boolean;
}

const W = 100;
const H = 100;
const MAX = 0.2;

/**
 * Vote share on x, seat share on y, one dot per party at its colour, sized by
 * votes. The 45 degree line carries no label: dots above it hold a larger share
 * of the chamber than of the vote, dots below a smaller one, and the geometry
 * explains itself.
 *
 * Eliminated parties sit on the x-axis at y = 0, which is where the threshold's
 * effect is geometrically obvious.
 *
 * d3-scale is used for the layout mathematics only. It never touches the DOM.
 */
export function Proportionality({ parties, metrics, animate }: Props) {
  const x = useMemo(() => scaleLinear().domain([0, MAX]).range([0, W]), []);
  const y = useMemo(() => scaleLinear().domain([0, MAX]).range([H, 0]), []);

  const points = useMemo(
    () =>
      parties.map((p) => {
        const share = metrics.shares[p.id] ?? { voteShare: 0, seatShare: 0 };
        return {
          id: p.id,
          short: p.shortName,
          color: p.color,
          voteShare: share.voteShare,
          seatShare: share.seatShare,
          r: 1.1 + Math.sqrt(share.voteShare) * 6,
        };
      }),
    [parties, metrics],
  );

  const nodes = useRef<(SVGGElement | null)[]>([]);

  const layout = useMemo(
    () =>
      new Map<string, { x: number; y: number }>(
        points.map((p) => [p.id, { x: x(p.voteShare), y: y(p.seatShare) }]),
      ),
    [points, x, y],
  );
  const before = useCommitted(layout, layout);

  const plan = useMemo(
    () =>
      points.map((p) => {
        const was = before.get(p.id);
        return {
          point: p,
          fromX: was?.x ?? x(p.voteShare),
          fromY: was?.y ?? y(p.seatShare),
          toX: x(p.voteShare),
          toY: y(p.seatShare),
        };
      }),
    [points, before, x, y],
  );

  useProgress(plan, animate ? 420 : 0, (raw) => {
    const eased = easeMigrate(raw);
    for (let i = 0; i < plan.length; i++) {
      const node = nodes.current[i];
      const step = plan[i];
      if (!node || !step) continue;
      node.setAttribute(
        'transform',
        `translate(${mix(step.fromX, step.toX, eased)} ${mix(step.fromY, step.toY, eased)})`,
      );
    }
  });

  const ticks = [0, 0.05, 0.1, 0.15, 0.2];

  /**
   * Labels sit above their dot. Fixed tiers still collide — PAN and Demokrat are
   * two tenths of a point apart, PPP and PSI both sit on the axis — so each
   * label takes the lowest tier whose box clears every label already placed.
   * Larger parties are placed first and therefore sit closest to their dot.
   */
  const labelled = useMemo(() => {
    const CHAR = 2.05;
    // One and a half times the label's own size, so two stacked labels have
    // clear air between them rather than touching strokes.
    const TIER = 5.2;
    const placed: Array<{ x1: number; x2: number; tier: number }> = [];
    const out = new Map<string, number>();

    for (const point of [...points]
      .filter((p) => p.voteShare > 0.02)
      .sort((a, b) => b.voteShare - a.voteShare)) {
      const width = point.short.length * CHAR;
      const cx = x(point.voteShare);
      const anchor =
        point.voteShare > MAX * 0.8 ? 'end' : point.voteShare < MAX * 0.12 ? 'start' : 'middle';
      const x1 = anchor === 'end' ? cx - width : anchor === 'start' ? cx : cx - width / 2;
      const box = { x1: x1 - 0.6, x2: x1 + width + 0.6 };

      let tier = 0;
      while (
        placed.some(
          (other) => other.tier === tier && other.x1 < box.x2 && box.x1 < other.x2,
        )
      ) {
        tier++;
      }
      placed.push({ ...box, tier });
      out.set(point.id, tier * TIER);
    }
    return out;
  }, [points, x]);

  return (
    <figure className="proportionality">
      <svg
        className="proportionality__svg"
        viewBox={`-16 -14 ${W + 26} ${H + 34}`}
        role="img"
        aria-label={`${S.proportionality}. ${points
          .map((p) => `${p.short}: ${percent(p.voteShare, 1)} ${S.voteShare}, ${percent(p.seatShare, 1)} ${S.seatShare}`)
          .join('. ')}`}
      >
        <g className="proportionality__axes" aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={0} y2={H} className="proportionality__grid" />
              <line x1={0} x2={W} y1={y(t)} y2={y(t)} className="proportionality__grid" />
              <text x={x(t)} y={H + 7} textAnchor="middle" className="proportionality__tick">
                {percent(t, 0)}
              </text>
              <text x={-3} y={y(t) + 2} textAnchor="end" className="proportionality__tick">
                {percent(t, 0)}
              </text>
            </g>
          ))}
          {/* Perfect proportionality. No label — the geometry explains itself. */}
          <line x1={x(0)} y1={y(0)} x2={x(MAX)} y2={y(MAX)} className="proportionality__parity" />
        </g>

        {plan.map((step, i) => (
          <g
            key={step.point.id}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            transform={`translate(${step.fromX} ${step.fromY})`}
          >
            <circle
              r={step.point.r}
              fill={step.point.color}
              fillOpacity={step.point.seatShare === 0 ? 0.45 : 1}
              stroke="var(--stage-sub)"
              strokeWidth={0.3}
            />
            {labelled.has(step.point.id) && (
              <text
                y={-step.point.r - 1.8 - (labelled.get(step.point.id) as number)}
                textAnchor={
                  step.point.voteShare > MAX * 0.8
                    ? 'end'
                    : step.point.voteShare < MAX * 0.12
                      ? 'start'
                      : 'middle'
                }
                className="proportionality__label"
              >
                {step.point.short}
              </text>
            )}
            <title>
              {step.point.short}: {percent(step.point.voteShare, 2)} {S.voteShare},{' '}
              {percent(step.point.seatShare, 2)} {S.seatShare}
            </title>
          </g>
        ))}

        <text x={W / 2} y={H + 16} textAnchor="middle" className="proportionality__axis-name">
          {S.voteShare}
        </text>
        <text
          transform={`translate(-13 ${H / 2}) rotate(-90)`}
          textAnchor="middle"
          className="proportionality__axis-name"
        >
          {S.seatShare}
        </text>
      </svg>
    </figure>
  );
}
