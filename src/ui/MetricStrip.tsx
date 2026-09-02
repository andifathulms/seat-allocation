import { useRef } from 'react';
import type { Metrics } from '../engine/types';
import type { RulesFile } from '../data/schema';
import { S } from '../copy/strings.id';
import { easeMigrate, useProgress } from './motion';
import { count, decimal, delta, deltaCount, percent } from './format';
import { Cite } from './Cite';
import './metric-strip.css';

interface Props {
  metrics: Metrics;
  baseline: Metrics;
  rules: RulesFile;
  animate: boolean;
}

/**
 * Every metric shows its current value and its value under the 2024 statutory
 * rules, so the delta is always visible. Each carries a one-sentence definition
 * beside it rather than behind a question mark, and no metric appears without
 * one — PRD §8.
 */
export function MetricStrip({ metrics, baseline, rules, animate }: Props) {
  return (
    <div className="metrics">
      <Metric
        label={S.unconverted}
        definition={S.unconvertedDef}
        value={metrics.unconvertedVotes}
        baseline={baseline.unconvertedVotes}
        format={count}
        formatDelta={deltaCount}
        note={percent(metrics.unconvertedShare, 2)}
        animate={animate}
        cite={<Cite rules={rules} of="suara-sah-nasional" />}
      />
      <Metric
        label={S.gallagher}
        definition={S.gallagherDef}
        value={metrics.gallagher}
        baseline={baseline.gallagher}
        format={(n) => decimal(n, 2)}
        formatDelta={(a, b) => delta(a, b, 2)}
        animate={animate}
      />
      <Metric
        label={S.loosemoreHanby}
        definition={S.loosemoreHanbyDef}
        value={metrics.loosemoreHanby}
        baseline={baseline.loosemoreHanby}
        format={(n) => decimal(n, 2)}
        formatDelta={(a, b) => delta(a, b, 2)}
        animate={animate}
      />
      <div className="metric">
        <p className="metric__label small">{S.enp}</p>
        <p className="metric__value figure-lg">
          <Counted value={metrics.enpVotes} format={(n) => decimal(n, 2)} animate={animate} />
          <span className="metric__arrow" aria-hidden="true"> → </span>
          <Counted value={metrics.enpSeats} format={(n) => decimal(n, 2)} animate={animate} />
        </p>
        <p className="metric__note small">{S.votesToSeats}</p>
        <p className="metric__baseline small">
          <span>{S.under2024}</span>
          <span className="metric__baseline-value">
            {decimal(baseline.enpVotes, 2)} → {decimal(baseline.enpSeats, 2)}
          </span>
        </p>
        <p className="metric__definition micro">{S.enpDef}</p>
      </div>
    </div>
  );
}

function Metric({
  label,
  definition,
  value,
  baseline,
  format,
  formatDelta,
  note,
  animate,
  cite,
}: {
  label: string;
  definition: string;
  value: number;
  baseline: number;
  format: (n: number) => string;
  formatDelta: (a: number, b: number) => string | null;
  note?: string;
  animate: boolean;
  cite?: React.ReactNode;
}) {
  const change = formatDelta(value, baseline);
  return (
    <div className="metric">
      <p className="metric__label small">
        {label}
        {cite}
      </p>
      <p className="metric__value figure-lg">
        <Counted value={value} format={format} animate={animate} />
      </p>
      {/* Always rendered, so the five rows line up across all four columns
          through the subgrid in metric-strip.css. */}
      <p className="metric__note small">{note ?? ''}</p>
      <p className="metric__baseline small">
        <span>{S.under2024}</span>
        <span className="metric__baseline-value">{format(baseline)}</span>
        {change && <span className="metric__delta">· {change}</span>}
      </p>
      <p className="metric__definition micro">{definition}</p>
    </div>
  );
}

/**
 * Counts to a new value over the same 420 ms as the seats, on the same curve, so
 * the strip and the chamber read as one movement. Writes text directly rather
 * than through state: this runs once per frame.
 */
function Counted({
  value,
  format,
  animate,
}: {
  value: number;
  format: (n: number) => string;
  animate: boolean;
}) {
  const node = useRef<HTMLSpanElement>(null);
  const from = useRef(value);
  const to = useRef(value);

  if (to.current !== value) {
    from.current = to.current;
    to.current = value;
  }

  useProgress(value, animate ? 420 : 0, (raw) => {
    const eased = easeMigrate(raw);
    const current = from.current + (to.current - from.current) * eased;
    if (node.current) node.current.textContent = format(current);
  });

  return <span ref={node}>{format(value)}</span>;
}
