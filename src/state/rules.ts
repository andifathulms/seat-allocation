import { RULES_2024 } from '../engine';
import type { DivisorRule, Geography, RuleSet, ThresholdScope } from '../engine/types';

/**
 * The four knobs, serialised to the query string so that every configuration is
 * linkable. Default state produces a bare URL.
 *
 *   ?t=2.0&scope=national&d=sainte-lague&geo=dapil
 */

const DIVISORS: DivisorRule[] = [
  'sainte-lague',
  'dhondt',
  'modified-sainte-lague',
  'hare-quota',
];
const SCOPES: ThresholdScope[] = ['national', 'dapil', 'none'];
const GEOGRAPHIES: Geography[] = ['dapil', 'national-pool'];

export const THRESHOLD_STEP = 0.001;
export const THRESHOLD_MAX = 0.1;

export function isDefault(rules: RuleSet): boolean {
  return (
    rules.threshold === RULES_2024.threshold &&
    rules.thresholdScope === RULES_2024.thresholdScope &&
    rules.divisor === RULES_2024.divisor &&
    rules.geography === RULES_2024.geography
  );
}

/** Threshold is carried as a percentage with one decimal, which is how it is read. */
function parseThreshold(raw: string | null): number {
  if (raw === null) return RULES_2024.threshold;
  const percent = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(percent)) return RULES_2024.threshold;
  return Math.min(Math.max(percent / 100, 0), THRESHOLD_MAX);
}

function pick<T extends string>(raw: string | null, allowed: T[], fallback: T): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function rulesFromSearch(search: string): RuleSet {
  const q = new URLSearchParams(search);
  return {
    threshold: parseThreshold(q.get('t')),
    thresholdScope: pick(q.get('scope'), SCOPES, RULES_2024.thresholdScope),
    divisor: pick(q.get('d'), DIVISORS, RULES_2024.divisor),
    geography: pick(q.get('geo'), GEOGRAPHIES, RULES_2024.geography),
  };
}

export function searchFromRules(rules: RuleSet): string {
  if (isDefault(rules)) return '';
  const q = new URLSearchParams();
  if (rules.threshold !== RULES_2024.threshold) {
    q.set('t', (rules.threshold * 100).toFixed(1));
  }
  if (rules.thresholdScope !== RULES_2024.thresholdScope) q.set('scope', rules.thresholdScope);
  if (rules.divisor !== RULES_2024.divisor) q.set('d', rules.divisor);
  if (rules.geography !== RULES_2024.geography) q.set('geo', rules.geography);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * Snap points on the scrubber.
 *
 * The effective threshold uses Taagepera's approximation T = 75% / (M + 1),
 * which is a per-district figure: at Indonesia's average magnitude of about 6,9
 * it lands near 9,5%, not the ~1% PRD §7.1 expects. The tick therefore carries
 * the computed value and says which district it applies to. See DECISIONS.md §6.
 */
export const SNAP_POINTS: Array<{ value: number; label: string; note: string }> = [
  { value: 0.025, label: '2,5%', note: '2009' },
  { value: 0.035, label: '3,5%', note: '2014' },
  { value: 0.04, label: '4,0%', note: '2019 · 2024' },
];

export function effectiveThreshold(averageMagnitude: number): number {
  return 0.75 / (averageMagnitude + 1);
}
