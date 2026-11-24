import './Badges.scss';

export type RiskLevel = 'High' | 'Medium' | 'Low';

/**
 * Risk marker. Shape + label, never color alone: triangle = High,
 * diamond = Medium, circle = Low, square = not assessed.
 */
export function RiskBadge({ level }: { level: RiskLevel | null }) {
  if (!level) {
    return (
      <span className="risk risk--none">
        <i aria-hidden="true" />
        <span className="risk__muted">Not assessed</span>
      </span>
    );
  }
  return (
    <span className={`risk risk--${level.toLowerCase()}`}>
      <i aria-hidden="true" />
      {level}
    </span>
  );
}

export function TierBadge({ tier }: { tier: 1 | 2 | null | undefined }) {
  if (!tier) return null;
  return <span className={`tier tier--${tier}`}>Tier {tier}</span>;
}

/** Question / record code, e.g. OB-05. */
export function CodeTag({ code }: { code: string }) {
  return (
    <span className="code-tag" title={`Question ID ${code}`}>
      {code}
    </span>
  );
}
