import type { Cell, Decomposition as Data } from '../engine/decompose';
import { S } from '../copy/strings.id';
import { count, decimal, percent } from './format';
import './decomposition.css';

interface Props {
  data: Data;
  /** Fixed across all four cells: the rules move, the votes do not. */
  totalValidVotes: number;
}

/**
 * The 2x2 of PRD §7, read as a table rather than assembled by hand.
 *
 * Reading down a column isolates the threshold; reading across a row isolates
 * district magnitude. No cell is called better than another and no share is
 * attributed to either rule — see the note in engine/decompose.ts for why a
 * single attribution figure would be an artefact rather than a finding.
 */
export function Decomposition({ data, totalValidVotes }: Props) {
  return (
    <div className="decomp">
      <table className="decomp__table">
        <caption className="visually-hidden">{S.decompositionNote}</caption>
        <thead>
          <tr>
            <td />
            <th scope="col" className="small">
              {S.geo84}
            </th>
            <th scope="col" className="small">
              {S.geoPool}
            </th>
          </tr>
        </thead>
        <tbody>
          <Row
            label={S.withThreshold}
            left={data.applied}
            right={data.onePool}
            total={totalValidVotes}
          />
          <Row
            label={S.withoutThreshold}
            left={data.noThreshold}
            right={data.neither}
            total={totalValidVotes}
          />
        </tbody>
      </table>
      <p className="decomp__caveat micro">{S.decompositionCaveat}</p>
    </div>
  );
}

function Row({
  label,
  left,
  right,
  total,
}: {
  label: string;
  left: Cell;
  right: Cell;
  total: number;
}) {
  return (
    <tr>
      <th scope="row" className="small decomp__label">
        {label}
      </th>
      <Value cell={left} total={total} />
      <Value cell={right} total={total} />
    </tr>
  );
}

function Value({ cell, total }: { cell: Cell; total: number }) {
  return (
    <td className="decomp__cell">
      <span className="decomp__gallagher figure">{decimal(cell.gallagher, 2)}</span>
      <span className="decomp__detail micro">
        {cell.partiesWithSeats} {S.partiesWithSeats}
      </span>
      <span className="decomp__detail micro">
        {count(cell.unconvertedVotes)} · {percent(cell.unconvertedVotes / total, 2)}
      </span>
    </td>
  );
}
