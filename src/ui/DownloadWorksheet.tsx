import { useCallback } from 'react';
import type { Dapil, Party, RuleSet, SeatAward } from '../engine/types';
import { S } from '../copy/strings.id';
import { cascadeWorksheet } from './worksheet';

interface Props {
  dapil: Dapil;
  trace: readonly SeatAward[];
  parties: readonly Party[];
  rules: RuleSet;
  /** The page's own reproduction statement, carried into the file. */
  provenance: string;
}

/**
 * Builds the worksheet in the browser and hands it over as a Blob. No backend
 * and no dependency: the file is a string this app already has every number for.
 * The object URL is revoked on the next frame, after the click has been taken.
 */
export function DownloadWorksheet({ dapil, trace, parties, rules, provenance }: Props) {
  const download = useCallback(() => {
    const csv = cascadeWorksheet(dapil, trace, parties, rules, provenance);
    // The BOM is what makes Excel read UTF-8 rather than the system codepage,
    // which otherwise mangles every party name with a diacritic.
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suara-ke-kursi-${dapil.code.toLowerCase()}.csv`;
    a.click();
    requestAnimationFrame(() => URL.revokeObjectURL(url));
  }, [dapil, trace, parties, rules, provenance]);

  if (trace.length === 0) return null;

  return (
    <button type="button" className="link small" onClick={download}>
      {S.wsDownload}
    </button>
  );
}
