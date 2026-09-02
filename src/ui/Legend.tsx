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
 * The legend is split at the line the app is about. Parties holding seats are
 * read as a ranking; parties holding none are read as a set, and they keep their
 * hue at reduced chroma under a diagonal hatch so a specific party can be
 * watched sitting at zero. DESIGN.md §2.2 and §5.1.
 *
 * The split is not decoration. A single eighteen-row list makes the threshold's
 * effect something the reader has to reconstruct by scanning for zeroes; two
 * groups with their counts named state it.
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
      (seatsByParty[b.id] ?? 0) - (seatsByParty[a.id] ?? 0) || b.nationalVotes - a.nationalVotes,
  );
  const holding = ordered.filter((p) => (seatsByParty[p.id] ?? 0) > 0);
  const zero = ordered.filter((p) => (seatsByParty[p.id] ?? 0) === 0);

  return (
    <div className="legend">
      <Hatch />

      <div className="legend__group">
        <h3 className="legend__group-head small">
          {S.legend}
          <span className="legend__group-count">{holding.length}</span>
        </h3>
        <ul className="legend__list">
          {holding.map((party) => (
            <li key={party.id}>
              <Item
                party={party}
                seats={seatsByParty[party.id] ?? 0}
                baseline={baselineSeats[party.id] ?? 0}
                totalValidVotes={totalValidVotes}
                onSelect={onSelect}
                selected={selected === party.id}
              />
            </li>
          ))}
        </ul>
      </div>

      {zero.length > 0 && (
        <div className="legend__group">
          <h3 className="legend__group-head small">
            {S.legendZero}
            <span className="legend__group-count">{zero.length}</span>
          </h3>
          <ul className="legend__list legend__list--zero">
            {zero.map((party) => (
              <li key={party.id}>
                <Item
                  party={party}
                  seats={0}
                  baseline={baselineSeats[party.id] ?? 0}
                  totalValidVotes={totalValidVotes}
                  onSelect={onSelect}
                  selected={selected === party.id}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Item({
  party,
  seats,
  baseline,
  totalValidVotes,
  onSelect,
  selected,
}: {
  party: Party;
  seats: number;
  baseline: number;
  totalValidVotes: number;
  onSelect?: ((id: PartyId) => void) | undefined;
  selected: boolean;
}) {
  const changed = seats - baseline;
  const zero = seats === 0;

  return (
    <button
      type="button"
      className={`legend__item${selected ? ' legend__item--on' : ''}${
        zero ? ' legend__item--zero' : ''
      }`}
      aria-pressed={selected}
      onClick={() => onSelect?.(party.id)}
    >
      <span className="legend__swatch" aria-hidden="true">
        <svg viewBox="0 0 6 24" width="6" height="24" preserveAspectRatio="none">
          {/* DESIGN.md §6.4: when a party crosses back in, the hatch resolves to
              solid rather than disappearing. */}
          <rect
            className="legend__fill"
            width="6"
            height="24"
            fill={party.color}
            opacity={zero ? 0.45 : 1}
          />
          <rect
            className="legend__hatch"
            width="6"
            height="24"
            fill="url(#hatch)"
            opacity={zero ? 1 : 0}
          />
        </svg>
      </span>
      <span className="legend__name">{party.shortName}</span>
      <span className="legend__seats figure">{seats}</span>
      <span className="legend__share micro">{percent(party.nationalVotes / totalValidVotes, 2)}</span>
      {changed !== 0 && (
        <span className="legend__delta micro">
          {changed > 0 ? '↑' : '↓'}
          {Math.abs(changed)}
        </span>
      )}
      <span className="visually-hidden">
        {party.fullName}, {count(party.nationalVotes)} {S.votes}, {seats} {S.seats}
        {changed !== 0
          ? `, ${Math.abs(changed)} ${changed > 0 ? 'lebih' : 'kurang'} dari hasil 2024`
          : ''}
      </span>
    </button>
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
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--stage)" strokeWidth="1.4" />
        </pattern>
      </defs>
    </svg>
  );
}
