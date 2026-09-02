import { useMemo, useRef } from 'react';
import type { Party, PartyId } from '../../engine/types';
import { S } from '../../copy/strings.id';
import { count, percent } from '../../ui/format';
import { easeMigrate, mix, useCommitted, useProgress } from '../../ui/motion';
import './vote-bar.css';

interface Props {
  parties: readonly Party[];
  seatsByParty: Readonly<Record<PartyId, number>>;
  totalValidVotes: number;
  animate: boolean;
}

interface Segment {
  id: PartyId;
  short: string;
  color: string;
  votes: number;
  converted: boolean;
  from: number;
  width: number;
}

/**
 * One bar for all 151.796.631 valid votes. Converted votes are segmented by
 * party in party colour; unconverted votes are one --void segment at the right,
 * subdivided by hairlines into the individual parties that make it up.
 *
 * The boundary between the two is the only element in the app that moves
 * horizontally across the full page width, which makes it the clearest reading
 * of what the threshold costs.
 */
export function VoteBar({ parties, seatsByParty, totalValidVotes, animate }: Props) {
  const segments = useMemo<Segment[]>(() => {
    const converted = parties
      .filter((p) => (seatsByParty[p.id] ?? 0) > 0)
      .sort((a, b) => b.nationalVotes - a.nationalVotes);
    const unconverted = parties
      .filter((p) => (seatsByParty[p.id] ?? 0) === 0)
      .sort((a, b) => b.nationalVotes - a.nationalVotes);

    const out: Segment[] = [];
    let cursor = 0;
    for (const p of [...converted, ...unconverted]) {
      const width = p.nationalVotes / totalValidVotes;
      out.push({
        id: p.id,
        short: p.shortName,
        color: p.color,
        votes: p.nationalVotes,
        converted: (seatsByParty[p.id] ?? 0) > 0,
        from: cursor,
        width,
      });
      cursor += width;
    }
    return out;
  }, [parties, seatsByParty, totalValidVotes]);

  const boundary = segments.find((s) => !s.converted)?.from ?? 1;
  const unconvertedVotes = segments
    .filter((s) => !s.converted)
    .reduce((t, s) => t + s.votes, 0);

  const nodes = useRef<(SVGRectElement | null)[]>([]);
  const marker = useRef<SVGLineElement>(null);

  const layout = useMemo(
    () => new Map<PartyId, number>(segments.map((s) => [s.id, s.from])),
    [segments],
  );
  const before = useCommitted(layout, layout);
  const boundaryFrom = useCommitted(boundary, boundary);

  const plan = useMemo(
    () =>
      segments.map((segment) => ({
        segment,
        fromX: before.get(segment.id) ?? segment.from,
        toX: segment.from,
      })),
    [segments, before],
  );

  useProgress(plan, animate ? 420 : 0, (raw) => {
    const eased = easeMigrate(raw);
    for (let i = 0; i < plan.length; i++) {
      const node = nodes.current[i];
      const step = plan[i];
      if (!node || !step) continue;
      node.setAttribute('x', String(mix(step.fromX, step.toX, eased) * 100));
    }
    if (marker.current) {
      const x = mix(boundaryFrom, boundary, eased) * 100;
      marker.current.setAttribute('x1', String(x));
      marker.current.setAttribute('x2', String(x));
    }
  });

  return (
    <figure className="vote-bar">
      <svg
        className="vote-bar__svg"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${count(totalValidVotes)} ${S.ofVotes}. ${count(
          totalValidVotes - unconvertedVotes,
        )} ${S.converted}, ${count(unconvertedVotes)} ${S.notConverted}.`}
      >
        {plan.map((step, i) => (
          <rect
            key={step.segment.id}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            x={step.fromX * 100}
            y={0}
            width={step.segment.width * 100}
            height={8}
            fill={step.segment.converted ? step.segment.color : 'var(--void)'}
            stroke={step.segment.converted ? 'none' : 'var(--rule-stage)'}
            strokeWidth={step.segment.converted ? 0 : 0.08}
            vectorEffect="non-scaling-stroke"
          >
            <title>
              {step.segment.short}: {count(step.segment.votes)} {S.votes},{' '}
              {step.segment.converted ? S.converted : S.notConverted}
            </title>
          </rect>
        ))}
        <line
          ref={marker}
          x1={boundaryFrom * 100}
          x2={boundaryFrom * 100}
          y1={-0.6}
          y2={8.6}
          stroke="var(--ink)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <figcaption className="vote-bar__caption">
        <span className="vote-bar__side">
          <span className="small">{S.converted}</span>
          <span className="vote-bar__figure figure">
            {count(totalValidVotes - unconvertedVotes)}
          </span>
          <span className="small">{percent(1 - unconvertedVotes / totalValidVotes, 2)}</span>
        </span>
        <span className="vote-bar__side vote-bar__side--right">
          <span className="small">{S.notConverted}</span>
          <span className="vote-bar__figure figure">{count(unconvertedVotes)}</span>
          <span className="small">{percent(unconvertedVotes / totalValidVotes, 2)}</span>
        </span>
      </figcaption>

      {/* The unconverted segment is not one undifferentiated mass. */}
      <ul className="vote-bar__parties">
        {segments
          .filter((s) => !s.converted)
          .map((s) => (
            <li key={s.id} className="small">
              <span className="vote-bar__party-name">{s.short}</span>{' '}
              <span className="vote-bar__party-votes">{count(s.votes)}</span>
            </li>
          ))}
      </ul>
    </figure>
  );
}
