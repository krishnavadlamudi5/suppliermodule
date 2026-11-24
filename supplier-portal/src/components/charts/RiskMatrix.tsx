import { formatInr } from '../../lib/format';
import { C, linkAttrs, tip } from './chartKit';

export interface RiskPoint {
  id: string;
  name: string;
  tier: number;
  score: number;
  /** Annual spend, ₹ lakh */
  spend: number;
  confidence?: number | null;
}

interface Props {
  points: RiskPoint[];
  /** Spend at or above this (₹ lakh) counts as high spend */
  highSpend: number;
  /** Score below this counts as weak */
  scoreThreshold?: number;
  onSelect?: (id: string) => void;
}

/** Spend × ESG score. Top-left quadrant = engage first; only those points are colored and named. */
export function RiskMatrix({ points, highSpend, scoreThreshold = 60, onSelect }: Props) {
  const W = 560;
  const H = 330;
  const l = 58;
  const r = 14;
  const t = 10;
  const b = 44;
  const pw = W - l - r;
  const ph = H - t - b;
  const maxS = Math.max(400, Math.ceil(Math.max(0, ...points.map((p) => p.spend)) / 100) * 100);
  const X = (v: number) => l + (v / 100) * pw;
  const Y = (v: number) => t + ph - (v / maxS) * ph;
  const xTicks = [0, 20, 40, 60, 80, 100];
  const yTicks = Array.from({ length: maxS / 100 + 1 }, (_, i) => i * 100);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role={onSelect ? 'group' : 'img'} aria-label="Risk matrix: annual spend against ESG score">
      <rect x={l} y={t} width={X(scoreThreshold) - l} height={Y(highSpend) - t} fill={C.zone} />
      {xTicks.map((v) => (
        <g key={`x${v}`}>
          <line x1={X(v)} y1={t} x2={X(v)} y2={t + ph} className="grid" />
          <text x={X(v)} y={t + ph + 16} textAnchor="middle" className="ax">
            {v}
          </text>
        </g>
      ))}
      {yTicks.map((v) => (
        <g key={`y${v}`}>
          <line x1={l} y1={Y(v)} x2={l + pw} y2={Y(v)} className="grid" />
          <text x={l - 8} y={Y(v) + 4} textAnchor="end" className="ax">
            {v ? formatInr(v) : '0'}
          </text>
        </g>
      ))}
      <line x1={X(scoreThreshold)} y1={t} x2={X(scoreThreshold)} y2={t + ph} className="ref" />
      <line x1={l} y1={Y(highSpend)} x2={l + pw} y2={Y(highSpend)} className="ref" />

      <text x={l + 8} y={t + 18} className="zone-title">
        Priority engagement
      </text>
      <text x={l + 8} y={t + 33} className="sub">
        high spend · score below {scoreThreshold}
      </text>
      <text x={l + pw - 8} y={t + 18} textAnchor="end" className="sub">
        Strategic partners
      </text>
      <text x={l + 8} y={t + ph - 8} className="sub">
        Capability building
      </text>
      <text x={l + pw - 8} y={t + ph - 8} textAnchor="end" className="sub">
        Monitor
      </text>
      <text x={l + pw / 2} y={H - 4} textAnchor="middle" className="ax">
        ESG performance score (0–100) →
      </text>
      <text transform={`translate(12 ${t + ph / 2}) rotate(-90)`} textAnchor="middle" className="ax">
        Annual spend →
      </text>

      {points.map((p) => {
        const engage = p.spend >= highSpend && p.score < scoreThreshold;
        const cx = X(p.score);
        const cy = Y(p.spend);
        return (
          <g key={p.id} {...(onSelect ? { ...linkAttrs(() => onSelect(p.id)), 'aria-label': `${p.name}: score ${p.score}, spend ${formatInr(p.spend)}` } : {})}>
            <circle
              cx={cx}
              cy={cy}
              r={7}
              fill={engage ? C.series1 : C.inactive}
              stroke={C.surface}
              strokeWidth={2}
              {...tip(`${p.name} · Tier ${p.tier}\nScore ${p.score} · Spend ${formatInr(p.spend)}${p.confidence != null ? `\nData confidence ${p.confidence}%` : ''}`)}
            />
            {engage && (
              <text x={cx + 11} y={cy + 4} className="lab" style={{ fontWeight: 600 }}>
                {p.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
