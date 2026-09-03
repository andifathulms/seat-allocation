import { useEffect, useId, useRef } from 'react';
import { RULES_2024 } from '../engine';
import type { DivisorRule, Geography, RuleSet, ThresholdScope } from '../engine/types';
import { S } from '../copy/strings.id';
import {
  effectiveThreshold,
  isDefault,
  SNAP_POINTS,
  THRESHOLD_MAX,
  THRESHOLD_STEP,
} from '../state/rules';
import { Cite } from './Cite';
import { percent } from './format';
import type { RulesFile } from '../data/schema';
import './transport.css';

interface Props {
  rules: RuleSet;
  onChange: (rules: RuleSet) => void;
  /** true while the scrubber is being dragged: continuous control, no easing */
  onScrub: (scrubbing: boolean) => void;
  averageMagnitude: number;
  citations: RulesFile;
}

const SCOPES: Array<{ value: ThresholdScope; label: string }> = [
  { value: 'national', label: S.scopeNational },
  { value: 'dapil', label: S.scopeDapil },
  { value: 'none', label: S.scopeNone },
];

const DIVISORS: Array<{ value: DivisorRule; label: string }> = [
  { value: 'sainte-lague', label: S.divisorSainteLague },
  { value: 'dhondt', label: S.divisorDhondt },
  { value: 'modified-sainte-lague', label: S.divisorModified },
  { value: 'hare-quota', label: S.divisorHare },
];

const GEOGRAPHIES: Array<{ value: Geography; label: string }> = [
  { value: 'dapil', label: S.geographyDapil },
  { value: 'national-pool', label: S.geographyNational },
];

/**
 * DESIGN.md §4.2. The controls are a transport bar rather than a form, because
 * the app's whole interaction model is drag and watch, and a transport is the
 * vocabulary people already have for that. It also keeps the control under the
 * thumb on a phone while the chamber stays at eye level.
 */
export function Transport({ rules, onChange, onScrub, averageMagnitude, citations }: Props) {
  const sliderId = useId();
  const atDefault = isDefault(rules);
  const bar = useRef<HTMLElement>(null);

  /**
   * The bar floats over the instruments and grows when the counterfactual
   * statement appears, so the clearance the page needs beneath it is not a
   * constant. Publishing the measured height lets the last instrument scroll
   * clear of it instead of ending under it.
   */
  useEffect(() => {
    const node = bar.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight;
      document.documentElement.style.setProperty('--transport-h', `${Math.round(height)}px`);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--transport-h');
    };
  }, []);

  const ticks = [
    ...SNAP_POINTS,
    {
      value: effectiveThreshold(averageMagnitude),
      label: percent(effectiveThreshold(averageMagnitude), 1),
      note: 'ambang efektif dapil',
    },
  ].sort((a, b) => a.value - b.value);

  return (
    <section className="transport" aria-label={S.controls} ref={bar}>
      <div className="transport__inner page">
        {/* PRD §10.1. Adjacent to the controls, in plain language, at all times
            when any knob is off its 2024 default. Never a dismissible modal. */}
        {!atDefault && <p className="transport__counterfactual small">{S.counterfactual}</p>}

        <div className="transport__console">
          <div className="transport__scrub">
            <span className="transport__label small">
              <label htmlFor={sliderId}>{S.threshold}</label>
              <Cite rules={citations} of="threshold" />
            </span>
            <output className="transport__value figure" htmlFor={sliderId}>
              {percent(rules.threshold, 1)}
            </output>
            <div className="transport__track">
              <div
                className="transport__fill"
                style={{ width: `${(rules.threshold / THRESHOLD_MAX) * 100}%` }}
                aria-hidden="true"
              />
              <input
                id={sliderId}
                type="range"
                min={0}
                max={THRESHOLD_MAX}
                step={THRESHOLD_STEP}
                value={rules.threshold}
                disabled={rules.thresholdScope === 'none'}
                onPointerDown={() => onScrub(true)}
                onPointerUp={() => onScrub(false)}
                onPointerCancel={() => onScrub(false)}
                onKeyDown={() => onScrub(true)}
                onKeyUp={() => onScrub(false)}
                onChange={(e) => onChange({ ...rules, threshold: Number(e.currentTarget.value) })}
                aria-valuetext={percent(rules.threshold, 1)}
              />
              <ul className="transport__ticks" aria-hidden="true">
                {ticks.map((tick) => {
                  const at = tick.value / THRESHOLD_MAX;
                  // A tick near either end would centre its label off the page,
                  // so the label hangs inward from the mark instead.
                  const edge =
                    at > 0.85
                      ? ' transport__tick--right'
                      : at < 0.15
                        ? ' transport__tick--left'
                        : '';
                  const on =
                    Math.abs(rules.threshold - tick.value) < 0.0005 ? ' transport__tick--on' : '';
                  return (
                    <li
                      key={tick.note}
                      style={{ left: `${at * 100}%` }}
                      className={`transport__tick${on}${edge}`}
                    >
                      <span className="micro">{tick.label}</span>
                      <span className="micro transport__tick-note">{tick.note}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* DESIGN.md §4.4: below 860 px the scrubber keeps the full width and
              the three discrete controls collapse behind one sheet, so the
              chamber stays at eye level while the control stays under the
              thumb. */}
          <details className="transport__sheet">
            <summary className="small">{S.moreRules}</summary>
          </details>

          <div className="transport__rules">
            <Toggle
              label={S.thresholdScope}
              cite={<Cite rules={citations} of="threshold" />}
              options={SCOPES}
              value={rules.thresholdScope}
              onSelect={(v) => onChange({ ...rules, thresholdScope: v })}
            />
            <Toggle
              label={S.divisor}
              cite={<Cite rules={citations} of="divisor" />}
              options={DIVISORS}
              value={rules.divisor}
              onSelect={(v) => onChange({ ...rules, divisor: v })}
            />
            <Toggle
              label={S.geography}
              cite={<Cite rules={citations} of="dapil" />}
              options={GEOGRAPHIES}
              value={rules.geography}
              onSelect={(v) => onChange({ ...rules, geography: v })}
            />
            <button
              type="button"
              className="transport__reset small link"
              disabled={atDefault}
              onClick={() => onChange({ ...RULES_2024 })}
            >
              {S.reset}
            </button>
          </div>
        </div>

        {rules.geography === 'national-pool' && (
          <p className="transport__note small">{S.geographyNationalNote}</p>
        )}
      </div>
    </section>
  );
}

/**
 * Inline text toggles, not dropdowns and not segmented pills. DESIGN.md §4.2.
 */
function Toggle<T extends string>({
  label,
  cite,
  options,
  value,
  onSelect,
}: {
  label: string;
  cite?: React.ReactNode;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <fieldset className="toggle">
      {/* A fieldset's rendered legend is taken out of its own formatting context
          in WebKit, so a legend styled as a grid item is silently dropped from
          the grid and the options collapse into the label's column. The legend
          stays for the group's accessible name and the visible label is a
          sibling that the grid can actually place. The visible text is hidden
          from assistive technology so the name is not announced twice; the
          citation is not, because it is a real control. */}
      <legend className="visually-hidden">{label}</legend>
      <span className="toggle__label micro">
        <span aria-hidden="true">{label}</span>
        {cite}
      </span>
      <span className="toggle__options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`toggle__option small${value === option.value ? ' toggle__option--on' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </span>
    </fieldset>
  );
}
