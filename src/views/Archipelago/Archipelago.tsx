import { useMemo, useRef } from 'react';
import type { DapilResult, Party, PartyId } from '../../engine/types';
import type { Dapil } from '../../engine/types';
import { S } from '../../copy/strings.id';
import { easeMigrate, mix, useCommitted, useProgress } from '../../ui/motion';
import './archipelago.css';

interface Props {
  parties: readonly Party[];
  dapil: readonly Dapil[];
  results: readonly DapilResult[];
  baseline: readonly DapilResult[];
  selected: string | null;
  onSelect: (code: string) => void;
  animate: boolean;
}

const CELL_W = 100;
const CELL_H = 12;

/**
 * 84 small multiples, one per dapil, each a compact stacked bar of its seat
 * composition. The grid follows Indonesian geography loosely — the dapil arrive
 * from the data already ordered west to east — and it is a grid with a
 * geographic ordering, not a map, and does not pretend to be one.
 *
 * A dapil whose composition differs from the 2024 baseline carries a filled
 * triangle in its upper-left corner. Shape, not colour: DESIGN.md §5.3.
 */
export function Archipelago({
  parties,
  dapil,
  results,
  baseline,
  selected,
  onSelect,
  animate,
}: Props) {
  const colors = useMemo(() => {
    const map = new Map<PartyId, string>();
    for (const p of parties) map.set(p.id, p.color);
    return map;
  }, [parties]);

  const order = useMemo(() => parties.map((p) => p.id), [parties]);

  const cells = useMemo(() => {
    const byCode = new Map(results.map((r) => [r.dapil, r]));
    const baseByCode = new Map(baseline.map((r) => [r.dapil, r]));
    return dapil.map((d) => {
      const result = byCode.get(d.code);
      const base = baseByCode.get(d.code);
      const changed =
        base !== undefined &&
        result !== undefined &&
        order.some((id) => (result.seats[id] ?? 0) !== (base.seats[id] ?? 0));

      let cursor = 0;
      const bars = order
        .map((id) => {
          const seats = result?.seats[id] ?? 0;
          const from = cursor;
          cursor += seats;
          return { id, seats, from, color: colors.get(id) ?? '#000' };
        })
        .filter((b) => b.seats > 0);

      return { dapil: d, changed, bars, magnitude: d.magnitude, seats: cursor };
    });
  }, [dapil, results, baseline, order, colors]);

  // Provinces are grouped by a thin gap rather than by a border. DESIGN.md §5.3.
  const firstOfProvince = useMemo(() => {
    const seen = new Set<string>();
    return new Set(
      dapil
        .filter((d) => (seen.has(d.province) ? false : (seen.add(d.province), true)))
        .map((d) => d.code),
    );
  }, [dapil]);

  const changedCount = cells.filter((c) => c.changed).length;

  // One rAF loop drives the whole grid. The stagger runs west to east at 3 ms
  // per cell, so the wash completes in about 250 ms and reads as one gesture
  // rather than as a sequence.
  const groups = useRef<(SVGGElement | null)[]>([]);

  const layout = useMemo(
    () =>
      new Map<string, Map<PartyId, { from: number; seats: number }>>(
        cells.map((c) => [
          c.dapil.code,
          new Map(c.bars.map((b) => [b.id, { from: b.from, seats: b.seats }])),
        ]),
      ),
    [cells],
  );
  const before = useCommitted(layout, layout);

  const plan = useMemo(
    () =>
      cells.map((cell) => {
        const was = before.get(cell.dapil.code);
        return {
          cell,
          bars: cell.bars.map((bar) => {
            const previous = was?.get(bar.id);
            return {
              ...bar,
              fromFrom: previous?.from ?? bar.from,
              fromSeats: previous?.seats ?? 0,
            };
          }),
        };
      }),
    [cells, before],
  );

  useProgress(plan, animate ? 420 + 84 * 3 : 0, (raw) => {
    const total = 420 + plan.length * 3;
    for (let i = 0; i < plan.length; i++) {
      const group = groups.current[i];
      const step = plan[i];
      if (!group || !step) continue;
      const start = (i * 3) / total;
      const local = Math.min(Math.max((raw - start) / (420 / total), 0), 1);
      const eased = easeMigrate(local);
      const rects = group.querySelectorAll('rect[data-bar]');
      for (let b = 0; b < step.bars.length; b++) {
        const bar = step.bars[b];
        const rect = rects[b];
        if (!bar || !rect) continue;
        const unit = CELL_W / Math.max(step.cell.magnitude, 1);
        rect.setAttribute('x', String(mix(bar.fromFrom, bar.from, eased) * unit));
        rect.setAttribute('width', String(mix(bar.fromSeats, bar.seats, eased) * unit));
      }
    }
  });

  return (
    <div className="archipelago">
      <p className="archipelago__count">
        <span className="figure">{changedCount}</span>{' '}
        <span className="small">{S.changedDapil}</span>
      </p>

      <ul className="archipelago__grid">
        {plan.map((step, i) => {
          const { cell } = step;
          const unit = CELL_W / Math.max(cell.magnitude, 1);
          return (
            <li key={cell.dapil.code}>
              <button
                type="button"
                className={`archipelago__cell${
                  selected === cell.dapil.code ? ' archipelago__cell--on' : ''
                }${firstOfProvince.has(cell.dapil.code) ? ' archipelago__cell--province' : ''}`}
                onClick={() => onSelect(cell.dapil.code)}
                aria-pressed={selected === cell.dapil.code}
              >
                <svg
                  viewBox={`0 0 ${CELL_W} ${CELL_H}`}
                  preserveAspectRatio="none"
                  className="archipelago__bar"
                  aria-hidden="true"
                >
                  <g
                    ref={(node) => {
                      groups.current[i] = node;
                    }}
                  >
                    <rect width={CELL_W} height={CELL_H} fill="var(--stage-sub)" />
                    {step.bars.map((bar) => (
                      <rect
                        key={bar.id}
                        data-bar=""
                        x={bar.fromFrom * unit}
                        y={0}
                        width={bar.fromSeats * unit}
                        height={CELL_H}
                        fill={bar.color}
                      />
                    ))}
                  </g>
                  {cell.changed && (
                    <polygon points="0,0 7,0 0,7" fill="var(--on-stage)" />
                  )}
                </svg>
                <span className="archipelago__code micro">{cell.dapil.code}</span>
                <span className="visually-hidden">
                  {cell.dapil.name}, {cell.magnitude} {S.seats}.{' '}
                  {cell.bars
                    .map(
                      (b) =>
                        `${parties.find((p) => p.id === b.id)?.shortName ?? b.id} ${b.seats}`,
                    )
                    .join(', ')}
                  .{cell.changed ? ' Berbeda dari hasil 2024.' : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
