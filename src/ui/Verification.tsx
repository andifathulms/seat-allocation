import type { Reproduction } from '../data/reproduction';
import { S } from '../copy/strings.id';
import './verification.css';

/**
 * PRD §10.3. The app opens at the statutory rules and states whether it
 * reproduces the official allocation.
 *
 * Until this revision a failure also drained the colour out of every instrument
 * below. That cost more than it bought: two thirds of the pixels that matter are
 * party-coloured, so desaturating the page degraded the data itself in order to
 * say something the sentence already says. The claim now carries its own weight
 * — a marker, a headline clause and the full list of checks — and the
 * instruments render at full strength. DESIGN.md §7.
 */
export function Verification({ reproduction }: { reproduction: Reproduction }) {
  const { reproduced, notAttempted } = reproduction;
  const state = reproduced ? 'ok' : notAttempted ? 'unverified' : 'failed';

  return (
    <div className={`verification verification--${state}`}>
      <p className="verification__line">
        <span className="verification__glyph" aria-hidden="true">
          {reproduced ? '✓' : '△'}
        </span>
        <span>
          <span className="verification__what">
            {reproduced ? S.verifiedHead : notAttempted ? S.notVerified : S.failed}
          </span>{' '}
          {reproduced
            ? S.verifiedDetail(
                reproduction.seatsMatched,
                reproduction.seatsTotal,
                reproduction.dapilMatched,
                reproduction.dapilTotal,
              )
            : (notAttempted ?? S.failedDetail)}
        </span>
      </p>
      {!reproduced && (
        <details className="verification__detail small">
          <summary>{S.checkDetail}</summary>
          <ul>
            {reproduction.checks.map((check) => (
              <li key={check.id}>
                <span
                  className={`verification__mark${
                    check.passed === false ? ' verification__mark--failed' : ''
                  }`}
                >
                  {check.passed === true ? 'lulus' : check.passed === false ? 'gagal' : 'lewat'}
                </span>
                <span>
                  {check.label}. {check.detail}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
