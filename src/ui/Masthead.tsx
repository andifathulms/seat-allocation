import type { Reproduction } from '../data/reproduction';
import type { Dataset } from '../data/schema';
import { S } from '../copy/strings.id';
import { count, percent } from './format';
import { Verification } from './Verification';
import './masthead.css';

interface Props {
  data: Dataset;
  reproduction: Reproduction;
}

/**
 * The premise, stated once. Four figures from the official 2024 result frame
 * everything below: the chamber being filled, the field that contested it, the
 * part of that field the threshold admitted, and the votes that produced no
 * seat.
 *
 * These four are deliberately the baseline and not the live allocation. They are
 * the fixed thing the rest of the page is measured against, and a reader who
 * scrolls back up after moving the scrubber needs the anchor to still be here.
 */
export function Masthead({ data, reproduction }: Props) {
  const qualifying = reproduction.baseline.qualifying.length;
  const contesting = data.parties.parties.length;

  return (
    <header className="masthead" id="masthead">
      <div className="page masthead__inner">
        <h1 className="display masthead__title">{S.title}</h1>
        <p className="masthead__subtitle h3">{S.subtitle}</p>
        <p className="prose masthead__intro">{S.intro}</p>

        <div className="masthead__figures">
          <p className="masthead__figures-label micro">{S.officialResult}</p>
          <dl className="masthead__grid">
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
    </header>
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
    <div className={`masthead__figure${wide ? ' masthead__figure--wide' : ''}`}>
      <dt className="masthead__figure-label small">
        {label}
        {note && <span className="masthead__figure-note"> · {note}</span>}
      </dt>
      <dd className="masthead__figure-value figure-lg">{value}</dd>
    </div>
  );
}
