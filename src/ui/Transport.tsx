import { useId } from 'react';
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
import { percent } from './format';
import './transport.css';

interface Props {
  rules: RuleSet;
  onChange: (rules: RuleSet) => void;
  /** true while the scrubber is being dragged: continuous control, no easing */
  onScrub: (scrubbing: boolean) => void;
  averageMagnitude: number;
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
export function Transport({ rules, onChange, onScrub, averageMagnitude }: Props) {
  const sliderId = useId();
  const atDefault = isDefault(rules);

  const ticks = [
    ...SNAP_POINTS,
    {
      value: effectiveThreshold(averageMagnitude),
      label: percent(effectiveThreshold(averageMagnitude), 1),
      note: 'ambang efektif dapil',
    },
  ].sort((a, b) => a.value - b.value);

  return (
    <div className="transport" role="group" aria-label={S.controls}>
      <div className="transport__inner page">
        {/* PRD §10.1. Adjacent to the controls, in plain language, at all times
            when any knob is off its 2024 default. Never a dismissible modal. */}
        {!atDefault && (
          <p className="transport__counterfactual small">{S.counterfactual}</p>
        )}

        <div className="transport__scrub">
          <label className="transport__label small" htmlFor={sliderId}>
            {S.threshold}
          </label>
          <output className="transport__value figure" htmlFor={sliderId}>
            {percent(rules.threshold, 1)}
          </output>
          <div className="transport__track">
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
              onKeyDown={() => onScrub(false)}
              onChange={(e) =>
                onChange({ ...rules, threshold: Number(e.currentTarget.value) })
              }
              aria-valuetext={percent(rules.threshold, 1)}
            />
            <ul className="transport__ticks" aria-hidden="true">
              {ticks.map((tick) => (
                <li
                  key={tick.note}
                  style={{ left: `${(tick.value / THRESHOLD_MAX) * 100}%` }}
                  className={
                    Math.abs(rules.threshold - tick.value) < 0.0005
                      ? 'transport__tick transport__tick--on'
                      : 'transport__tick'
                  }
                >
                  <span className="micro">{tick.label}</span>
                  <span className="micro transport__tick-note">{tick.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="transport__rules">
          <Toggle
            label={S.thresholdScope}
            options={SCOPES}
            value={rules.thresholdScope}
            onSelect={(v) => onChange({ ...rules, thresholdScope: v })}
          />
          <Toggle
            label={S.divisor}
            options={DIVISORS}
            value={rules.divisor}
            onSelect={(v) => onChange({ ...rules, divisor: v })}
          />
          <Toggle
            label={S.geography}
            options={GEOGRAPHIES}
            value={rules.geography}
            onSelect={(v) => onChange({ ...rules, geography: v })}
          />
          <button
            type="button"
            className="transport__reset small"
            disabled={atDefault}
            onClick={() => onChange({ ...RULES_2024 })}
          >
            {S.reset}
          </button>
        </div>

        {rules.geography === 'national-pool' && (
          <p className="transport__note small">{S.geographyNationalNote}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline text toggles, not dropdowns and not segmented pills. DESIGN.md §4.2.
 */
function Toggle<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <fieldset className="toggle">
      <legend className="toggle__legend micro">{label}</legend>
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
    </fieldset>
  );
}
