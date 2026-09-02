import type { Reproduction } from '../data/reproduction';
import { S } from '../copy/strings.id';
import './verification.css';

/**
 * PRD §10.3. The app opens at the statutory rules and states whether it
 * reproduces the official allocation. A failure is said plainly and the
 * instruments below are dimmed rather than hidden — DESIGN.md §7.
 */
export function Verification({ reproduction }: { reproduction: Reproduction }) {
  const { reproduced, notAttempted } = reproduction;
  const state = reproduced ? 'ok' : notAttempted ? 'unverified' : 'failed';

  return (
    <div className={`verification verification--${state}`}>
      <p className="verification__line">
        {reproduced
          ? S.verified(
              reproduction.seatsMatched,
              reproduction.seatsTotal,
              reproduction.dapilMatched,
              reproduction.dapilTotal,
            )
          : notAttempted
            ? `${S.notVerified} ${notAttempted}`
            : S.failed}
      </p>
      {!reproduced && (
        <details className="verification__detail">
          <summary className="small">Rincian pemeriksaan</summary>
          <ul className="small">
            {reproduction.checks.map((check) => (
              <li key={check.id}>
                <span className="verification__mark">
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
