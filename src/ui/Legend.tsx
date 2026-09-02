import type { Party, PartyId } from '../engine/types';
import { S } from '../copy/strings.id';
import { count, percent } from './format';
import './legend.css';

interface Props {
  parties: readonly Party[];
  seatsByParty: Readonly<Record<PartyId, number>>;
  baselineSeats: Readonly<Record<PartyId, number>>;
  totalValidVotes: number;
  onSelect?: (id: PartyId) => void;
  selected?: PartyId | null;
}

/**
 * DESIGN.md §2.2: a party with no seats keeps its hue at reduced chroma and
 * gains a diagonal hatch. It must stay identifiable at zero seats, because
 * watching a specific party sit at zero is the point.
 */
export function Legend({
  parties,
  seatsByParty,
  baselineSeats,
  totalValidVotes,
  onSelect,
  selected,
}: Props) {
  const ordered = [...parties].sort(
    (a, b) =>
      (seatsByParty[b.id] ?? 0) - (seatsByParty[a.id] ?? 0) ||
      b.nationalVotes - a.nationalVotes,
  );

  return (
    <>
      <Hatch />
      <ul className="legend" aria-label={S.legend}>
        {ordered.map((party) => {
          const seats = seatsByParty[party.id] ?? 0;
          const baseline = baselineSeats[party.id] ?? 0;
          const changed = seats - baseline;
          const zero = seats === 0;
          return (
            <li key={party.id}>
              <button
                type="button"
                className={`legend__item${selected === party.id ? ' legend__item--on' : ''}`}
                aria-pressed={selected === party.id}
                onClick={() => onSelect?.(party.id)}
              >
                <span className="legend__swatch" aria-hidden="true">
                  <svg viewBox="0 0 12 12" width="12" height="12">
                    <rect
                      width="12"
                      height="12"
                      fill={party.color}
                      opacity={zero ? 0.4 : 1}
                    />
                    {zero && <rect width="12" height="12" fill="url(#hatch)" />}
                  </svg>
                </span>
                <span className="legend__name">{party.shortName}</span>
                <span className="legend__seats figure">{seats}</span>
                <span className="legend__share small">
                  {percent(party.nationalVotes / totalValidVotes, 2)}
                </span>
                {changed !== 0 && (
                  <span className="legend__delta small">
                    {changed > 0 ? '↑' : '↓'} {Math.abs(changed)}
                  </span>
                )}
                <span className="visually-hidden">
                  {party.fullName}, {count(party.nationalVotes)} {S.votes}, {seats} {S.seats}
                  {changed !== 0
                    ? `, ${Math.abs(changed)} ${changed > 0 ? 'lebih' : 'kurang'} dari hasil 2024`
                    : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** One hatch pattern, defined once and referenced by every eliminated mark. */
export function Hatch() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="hatch-def">
      <defs>
        <pattern
          id="hatch"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="4" height="4" fill="none" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--paper)" strokeWidth="1.2" />
        </pattern>
      </defs>
    </svg>
  );
}
