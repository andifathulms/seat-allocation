import type { Reproduction } from '../data/reproduction';
import type { Dataset } from '../data/schema';
import { S } from '../copy/strings.id';
import { count, percent } from './format';
import { Verification } from './Verification';
import './premise.css';

interface Props {
  data: Dataset;
  reproduction: Reproduction;
}

/**
 * The four figures the rest of the page is measured against, and the statement
 * of how far the app reproduces the official result.
 *
 * These sit below the chamber rather than above it. Both are calibration: they
 * tell a reader how much to trust what they are looking at, and that question
 * only exists once there is something to look at. Placed above, the provenance
 * notice was the second most prominent element on the page and led with a
 * failure, so a visitor's first act was to discount output they had not seen.
 *
 * The figures are deliberately the baseline and not the live allocation. They
 * are the fixed thing the instruments are read against, and a reader who has
 * moved the scrubber needs the anchor to still say 2024.
 */
export function Premise({ data, reproduction }: Props) {
  const qualifying = reproduction.baseline.qualifying.length;
  const contesting = data.parties.parties.length;

  return (
    <section className="premise" aria-labelledby="premise-head">
      <div className="page premise__inner">
        <p className="premise__intro prose">{S.intro}</p>

        <div className="premise__figures">
          <h2 className="premise__figures-label micro" id="premise-head">
            {S.officialResult}
          </h2>
          <dl className="premise__grid">
            <Figure value={String(data.official.totalSeats)} label={S.seatsInPlay} />
            <Figure value={String(contesting)} label={S.contesting} />
            <Figure value={String(qualifying)} label={S.qualified} />
            <Figure
              value={count(reproduction.baseline.metrics.unconvertedVotes)}
              label={S.unconverted}
              note={percent(reproduction.baseline.metrics.unconvertedShare, 2)}
              wide
            />
          </dl>
        </div>

        <Verification reproduction={reproduction} />
      </div>
    </section>
  );
}

function Figure({
  value,
  label,
  note,
  wide,
}: {
  value: string;
  label: string;
  note?: string;
  wide?: boolean;
}) {
  return (
    <div className={`premise__figure${wide ? ' premise__figure--wide' : ''}`}>
      <dt className="premise__figure-label small">
        {label}
        {note && <span className="premise__figure-note"> · {note}</span>}
      </dt>
      <dd className="premise__figure-value figure-lg">{value}</dd>
    </div>
  );
}
