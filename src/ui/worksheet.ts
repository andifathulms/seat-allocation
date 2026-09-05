import type { Dapil, Party, RuleSet, SeatAward } from '../engine/types';
import { S } from '../copy/strings.id';

/** RFC 4180: quote every field, double any inner quote. */
function cell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

/**
 * The cascade's arithmetic as a file that can be checked in a spreadsheet.
 *
 * The provenance travels with it. A CSV leaves the app and loses the page's
 * reproduction notice, so a worksheet extracted while the per-dapil table is a
 * placeholder would circulate as though it were certified. The header carries
 * the same statement the page makes, the rules that produced the rows, and the
 * source document, so the file is answerable on its own.
 *
 * Every column is a number the reader can recompute: votes, the divisor applied,
 * and the quotient that resulted. Nothing here is rounded for display.
 */
export function cascadeWorksheet(
  dapil: Dapil,
  trace: readonly SeatAward[],
  parties: readonly Party[],
  rules: RuleSet,
  provenance: string,
): string {
  const name = new Map(parties.map((p) => [p.id, p.shortName]));
  const lines: string[] = [];

  const meta = (key: string, value: string | number) =>
    lines.push([cell(key), cell(value)].join(','));

  meta(S.wsTitle, `${S.title} — ${dapil.name}`);
  meta(S.dapil, `${dapil.name} (${dapil.code})`);
  meta(S.magnitude, dapil.magnitude);
  meta(S.threshold, `${(rules.threshold * 100).toFixed(1)}%`);
  meta(S.thresholdScope, rules.thresholdScope);
  meta(S.divisor, rules.divisor);
  meta(S.geography, rules.geography);
  meta(S.wsProvenance, provenance);
  meta(S.wsCounterfactual, S.counterfactual);
  lines.push('');

  lines.push(
    [S.wsOrdinal, S.party, S.wsVotes, S.wsDivisor, S.wsQuotient, S.wsAwarded]
      .map(cell)
      .join(','),
  );

  for (const award of trace) {
    for (const row of award.table) {
      lines.push(
        [
          cell(award.ordinal),
          cell(name.get(row.party) ?? row.party),
          cell(dapil.votes[row.party] ?? 0),
          cell(row.divisor),
          cell(row.quotient),
          cell(row.party === award.winner ? S.wsYes : ''),
        ].join(','),
      );
    }
  }

  // A trailing newline: without it the last row is not a record in some readers.
  return `${lines.join('\r\n')}\r\n`;
}
