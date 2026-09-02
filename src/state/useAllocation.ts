import { useEffect, useMemo, useRef, useState } from 'react';
import { allocate } from '../engine';
import type { Allocation, RuleSet } from '../engine/types';
import type { Dataset } from '../data/schema';
import { rulesFromSearch, searchFromRules } from './rules';

/**
 * The four knobs and the allocation they produce.
 *
 * Recomputation is synchronous on every change: PRD §6.5 forbids a debounce and
 * a worker, and the engine lands a full 84-dapil pass in well under a
 * millisecond. Only the URL is debounced, and only so the history stack does not
 * fill with one entry per slider frame.
 */
export function useAllocation(data: Dataset) {
  const [rules, setRules] = useState<RuleSet>(() =>
    rulesFromSearch(window.location.search),
  );

  const allocation: Allocation = useMemo(
    () => allocate(data.parties.parties, data.dapil.dapil, rules, { trace: false }),
    [data, rules],
  );

  const timer = useRef<number>(0);
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const search = searchFromRules(rules);
      window.history.replaceState(null, '', `${window.location.pathname}${search}`);
    }, 200);
    return () => window.clearTimeout(timer.current);
  }, [rules]);

  useEffect(() => {
    const onPop = () => setRules(rulesFromSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return { rules, setRules, allocation };
}
