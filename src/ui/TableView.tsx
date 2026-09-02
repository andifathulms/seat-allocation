import { useId, useState } from 'react';
import { S } from '../copy/strings.id';
import './table-view.css';

interface Props {
  caption: string;
  columns: Array<{ key: string; label: string; numeric?: boolean }>;
  rows: Array<Record<string, string | number>>;
}

/**
 * PRD §11.7 and DESIGN.md §8: every instrument has a table equivalent reachable
 * by keyboard. The hemicycle is beautiful and it is not the only way to get the
 * numbers.
 *
 * The table is collapsed rather than hidden, so it is one keystroke away and
 * always in the accessibility tree.
 */
export function TableView({ caption, columns, rows }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="table-view">
      <button
        type="button"
        className="table-view__toggle small"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? S.hideTable : S.showTable}
      </button>
      <div id={id} hidden={!open} className="table-view__scroll">
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={c.numeric ? 'numeric' : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c, j) => {
                  const value = row[c.key] ?? '';
                  return j === 0 ? (
                    <th key={c.key} scope="row">
                      {value}
                    </th>
                  ) : (
                    <td key={c.key} className={c.numeric ? 'numeric' : undefined}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
