import { useEffect, useMemo, useState } from 'react';
import { allocate, divisorAt } from '../../engine';
import type { Dapil, Party, RuleSet, SeatAward } from '../../engine/types';
import { S } from '../../copy/strings.id';
import { count, decimal } from '../../ui/format';
import { useReducedMotion } from '../../ui/motion';
import { TableView } from '../../ui/TableView';
import './cascade.css';

interface Props {
  parties: readonly Party[];
  dapil: readonly Dapil[];
  code: string;
  rules: RuleSet;
  onSelect: (code: string) => void;
}

/**
 * The show-your-work view. Renders the trace the engine recorded; it never
 * recomputes a quotient for display, so the arithmetic on screen and the
 * arithmetic that produced the seats are the same object.
 */
export function Cascade({ parties, dapil, code, rules, onSelect }: Props) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const selected = dapil.find((d) => d.code === code) ?? dapil[0];

  // Only the selected dapil is traced. A full trace of all 84 is what
  // CLAUDE.md's trace: false option exists to avoid.
  const trace = useMemo<SeatAward[]>(() => {
    if (!selected) return [];
    const one = allocate(parties, [selected], rules, { trace: true });
    return one.byDapil[0]?.trace ?? [];
  }, [parties, selected, rules]);

  const eliminated = useMemo(() => {
    if (!selected) return [];
    const one = allocate(parties, [selected], rules, { trace: false });
    return one.byDapil[0]?.eliminated ?? [];
  }, [parties, selected, rules]);

  useEffect(() => setStep(0), [code, rules]);

  useEffect(() => {
    if (!playing || reduced) return;
    if (step >= trace.length) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((s) => s + 1), 520);
    return () => window.clearTimeout(timer);
  }, [playing, step, trace.length, reduced]);

  const isQuota = rules.divisor === 'hare-quota';

  const columns = useMemo(() => {
    if (trace.length === 0 || isQuota) return [];
    const first = trace[0] as SeatAward;
    const claimedBy = new Map<string, number>();
    trace.forEach((award, i) => {
      const cell = award.table.find((c) => c.party === award.winner);
      if (cell) claimedBy.set(`${award.winner}|${cell.divisor}`, i + 1);
    });

    // Cards below this cannot compete for the last seat, and drawing them only
    // crushes the small parties' columns into an unreadable stack.
    const floor = (trace[trace.length - 1] as SeatAward).quotient * 0.5;

    return first.table
      .map((cell) => {
        const party = parties.find((p) => p.id === cell.party);
        const votes = selected?.votes[cell.party] ?? 0;
        // Cards run V/1, V/3, V/5, V/7 as DESIGN.md §5.2 draws them. Beyond the
        // seats a party actually won plus one contender, the quotients collapse
        // into an unreadable stack at the foot of the column and say nothing:
        // they lost by more than the card below them already shows.
        const won = trace.filter((a) => a.winner === cell.party).length;
        const depth = Math.min(Math.max(won + 1, 4), selected?.magnitude ?? 4);
        const cards = [];
        for (let n = 0; n < depth; n++) {
          const divisor = divisorAt(rules.divisor, n);
          cards.push({
            divisor,
            quotient: votes / divisor,
            ordinal: claimedBy.get(`${cell.party}|${divisor}`) ?? null,
          });
        }
        return {
          id: cell.party,
          short: party?.shortName ?? cell.party,
          color: party?.color ?? '#000',
          votes,
          // The first card always stays: a column with no card at all would
          // read as an eliminated party, and this one simply lost.
          cards: cards.filter((c, i) => i === 0 || c.quotient >= floor),
        };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [trace, parties, selected, rules, isQuota]);

  if (!selected || trace.length === 0) {
    return <p className="small">Tidak ada kursi untuk ditampilkan pada dapil ini.</p>;
  }

  const current = step > 0 ? (trace[step - 1] as SeatAward) : null;
  const maxQuotient = Math.max(
    ...columns.flatMap((c) => c.cards.map((card) => card.quotient)),
  );
  // The sweep line rests at the last winning quotient. Every card above it won a
  // seat and every card below it did not; the line is the mechanism made visible.
  const sweep = current ? current.quotient : maxQuotient * 1.04;

  return (
    <div className="cascade">
      <div className="cascade__head">
        <label className="small">
          {S.chooseDapil}{' '}
          <select value={code} onChange={(e) => onSelect(e.currentTarget.value)}>
            {dapil.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name} · {d.magnitude} {S.seats}
              </option>
            ))}
          </select>
        </label>

        <div className="cascade__transport">
          <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
            ← <span className="visually-hidden">{S.stepBack}</span>
          </button>
          {!reduced && (
            <button type="button" onClick={() => setPlaying((p) => !p)}>
              {playing ? S.pause : S.play}
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, trace.length))}
            disabled={step === trace.length}
          >
            → <span className="visually-hidden">{S.stepForward}</span>
          </button>
          <input
            type="range"
            min={0}
            max={trace.length}
            value={step}
            onChange={(e) => {
              setPlaying(false);
              setStep(Number(e.currentTarget.value));
            }}
            aria-label={S.step}
            aria-valuetext={`${step} dari ${trace.length}`}
          />
          <span className="cascade__step small">
            {S.step} {step}/{trace.length}
          </span>
        </div>
      </div>

      <div className="cascade__board panel">
        {/* The ghost list scrolls sideways below 720 px, so it must be focusable
            or a keyboard user cannot reach the parties past the edge. */}
        {eliminated.length > 0 && (
          <div
            className="cascade__ghosts"
            tabIndex={0}
            role="group"
            aria-label={S.eliminated}
          >
            <p className="micro cascade__ghost-label">{S.eliminated}</p>
            {eliminated
              .map((id) => parties.find((p) => p.id === id))
              .filter((p): p is Party => p !== undefined)
              .filter((p) => (selected.votes[p.id] ?? 0) > 0)
              .sort((a, b) => (selected.votes[b.id] ?? 0) - (selected.votes[a.id] ?? 0))
              .slice(0, 6)
              .map((p) => (
                <div key={p.id} className="cascade__ghost">
                  <span className="cascade__ghost-swatch" style={{ background: p.color }} />
                  <span className="micro">{p.shortName}</span>
                  <span className="micro cascade__ghost-votes">
                    {count(selected.votes[p.id] ?? 0)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {isQuota ? (
          <ol className="cascade__quota">
            {trace.slice(0, Math.max(step, 1)).map((award) => (
              <li key={award.ordinal} className="small">
                <span className="cascade__quota-ordinal micro">{award.ordinal}</span>
                <span>{parties.find((p) => p.id === award.winner)?.shortName}</span>
                <span className="cascade__quota-phase micro">
                  {award.phase === 'quota' ? 'kuota penuh' : 'sisa terbesar'}
                </span>
                <span className="cascade__quota-value">{decimal(award.quotient, 4)}</span>
              </li>
            ))}
          </ol>
        ) : (
        <div
          className="cascade__columns"
          tabIndex={0}
          role="group"
          aria-label={S.cascade}
          style={{ '--sweep': `${(1 - sweep / (maxQuotient * 1.08)) * 100}%` } as React.CSSProperties}
        >
          <div className="cascade__sweep" aria-hidden="true" />
          {columns.map((column) => (
            <div key={column.id} className="cascade__column">
              {column.cards.map((card) => {
                const claimed = card.ordinal !== null && card.ordinal <= step;
                return (
                  <div
                    key={card.divisor}
                    className={`cascade__card${claimed ? ' cascade__card--claimed' : ''}`}
                    style={{
                      top: `${(1 - card.quotient / (maxQuotient * 1.08)) * 100}%`,
                      borderColor: column.color,
                      background: claimed ? column.color : 'transparent',
                    }}
                  >
                    <span className="micro cascade__divisor">÷{decimal(card.divisor, card.divisor % 1 === 0 ? 0 : 1)}</span>
                    <span className="micro cascade__quotient">{count(Math.round(card.quotient))}</span>
                    {claimed && <span className="micro cascade__ordinal">{card.ordinal}</span>}
                  </div>
                );
              })}
              <span className="micro cascade__column-name">{column.short}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      <TableView
        caption={`${S.cascade}: ${selected.name}`}
        columns={[
          { key: 'ordinal', label: S.step, numeric: true },
          { key: 'party', label: S.party },
          { key: 'votes', label: S.votes, numeric: true },
          { key: 'divisor', label: 'pembagi', numeric: true },
          { key: 'quotient', label: 'hasil bagi', numeric: true },
        ]}
        rows={trace.map((award) => ({
          ordinal: award.ordinal,
          party: parties.find((p) => p.id === award.winner)?.shortName ?? award.winner,
          votes: count(selected.votes[award.winner] ?? 0),
          divisor: decimal(
            award.table.find((c) => c.party === award.winner)?.divisor ?? 1,
            isQuota ? 0 : 1,
          ),
          quotient: isQuota
            ? decimal(award.quotient, 4)
            : count(Math.round(award.quotient)),
        }))}
      />

      {/* The arithmetic for the current step, printed in full so it can be
          checked by hand. DESIGN.md §5.2. */}
      <p className="cascade__arithmetic">
        {current ? (
          <>
            <strong>{parties.find((p) => p.id === current.winner)?.shortName}</strong>{' '}
            {count(selected.votes[current.winner] ?? 0)} ÷{' '}
            {count(
              Math.round(current.table.find((c) => c.party === current.winner)?.divisor ?? 1),
            )}{' '}
            = {isQuota ? decimal(current.quotient, 4) : count(Math.round(current.quotient))}
            {current.tied && (
              <span className="cascade__tie"> · {S.tie}: {current.tied.join(', ')}</span>
            )}
          </>
        ) : (
          <span className="small">{S.cascadeNote}</span>
        )}
      </p>
    </div>
  );
}
