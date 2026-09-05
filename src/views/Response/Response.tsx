import { useMemo } from 'react';
import type { Response as ResponseData } from '../../engine/response';
import { regimeAt } from '../../engine/response';
import type { Party, PartyId } from '../../engine/types';
import { S } from '../../copy/strings.id';
import { percent } from '../../ui/format';
import './response.css';

interface Props {
  parties: readonly Party[];
  response: ResponseData;
  threshold: number;
  onPick: (threshold: number) => void;
}

const W = 100;
const H = 42;

/**
 * The whole range of the threshold at once, as a stacked step area.
 *
 * Every other instrument shows one threshold. This shows all of them, which is
 * what makes the shape of the rule legible: the response is piecewise constant,
 * the steps are unevenly spaced, and the statutory 4% sits in the middle of a
 * wide plateau rather than at a boundary. That last observation is only
 * available if the plateaus are drawn.
 *
 * Party order within the stack is fixed by ballot number rather than by seat
 * count, so a band keeps its vertical position across the whole width and the
 * eye can follow one party along the axis. Ordering by size — as the chamber
 * does — would make blocks swap places at every step and destroy that.
 */
export function Response({ parties, response, threshold, onPick }: Props) {
  const ordered = useMemo(
    () => [...parties].sort((a, b) => a.ballotNumber - b.ballotNumber),
    [parties],
  );

  const bands = useMemo(() => {
    const out: Array<{ id: PartyId; color: string; d: string }> = [];
    for (const party of ordered) {
      const segments: string[] = [];
      for (const regime of response.regimes) {
        const seats = regime.seatsByParty[party.id] ?? 0;
        if (seats === 0) continue;
        let below = 0;
        for (const other of ordered) {
          if (other.id === party.id) break;
          below += regime.seatsByParty[other.id] ?? 0;
        }
        const x0 = (regime.from / response.max) * W;
        const x1 = (regime.to / response.max) * W;
        const y0 = H - ((below + seats) / 580) * H;
        const y1 = H - (below / 580) * H;
        segments.push(`M${x0} ${y0}H${x1}V${y1}H${x0}Z`);
      }
      if (segments.length) out.push({ id: party.id, color: party.color, d: segments.join('') });
    }
    return out;
  }, [ordered, response]);

  const here = regimeAt(response, threshold);
  const x = (threshold / response.max) * W;

  return (
    <figure className="response stage">
      <svg
        className="response__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={S.responseAria}
      >
        {bands.map((b) => (
          <path key={b.id} d={b.d} fill={b.color} />
        ))}
        <line
          className="response__cursor"
          x1={x}
          x2={x}
          y1={0}
          y2={H}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* The axis is separate from the plot so its labels are not stretched by
          preserveAspectRatio="none". */}
      <ul className="response__axis" aria-hidden="true">
        {[0, 0.02, 0.04, 0.06, 0.08, 0.1].map((t) => (
          <li
            key={t}
            className="response__axis-tick micro"
            style={{ left: `${(t / response.max) * 100}%` }}
          >
            {percent(t, 0)}
          </li>
        ))}
      </ul>

      <figcaption className="response__caption">
        <p className="small">
          {S.responseReading(
            here ? here.partiesWithSeats : 0,
            here ? percent(here.from, 1) : '',
            here ? percent(here.to, 1) : '',
          )}
        </p>
      </figcaption>

      {/* The plot is a second face of the threshold control, so it is operable:
          clicking a band jumps to it. The slider remains the keyboard path —
          duplicating a range input here would put two controls for one value in
          the tab order, and the regime table below carries the same content. */}
      <div className="response__jumps">
        <p className="response__jumps-label micro">{S.responseJumps}</p>
        <ol className="response__jump-list">
          {response.regimes.map((r) => (
            <li key={r.from}>
              <button
                type="button"
                className={`response__jump micro${
                  here && here.from === r.from ? ' response__jump--on' : ''
                }`}
                onClick={() => onPick(r.to)}
              >
                {/* Two decimals: several of the smallest parties round to the
                    same tenth, and a row of identical-looking buttons that jump
                    to different values is worse than a longer label. */}
                {percent(r.to, 2)}
                <span className="visually-hidden">
                  {' '}
                  — {r.partiesWithSeats} {S.partiesWithSeats}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
