import { C, tip } from './chartKit';
import { isMaterial, isDoubleMaterial } from './scales';

export interface MaterialityTopic {
  n: number;
  title: string;
  /** Impact materiality, 1–5 */
  impact: number;
  /** Financial materiality, 1–5 */
  financial: number;
}

interface Props {
  topics: MaterialityTopic[];
  threshold?: number;
  /** Larger version for the Materiality page */
  large?: boolean;
}

/** Double-materiality matrix. Numbered dots match the topic list beside it. */
export function MaterialityMatrix({ topics, threshold = 3.5, large }: Props) {
  const W = 560;
  const H = large ? 440 : 300;
  const l = 44;
  const r = 16;
  const t = 12;
  const b = 40;
  const pw = W - l - r;
  const ph = H - t - b;
  const X = (v: number) => l + ((v - 1) / 4) * pw;
  const Y = (v: number) => t + ph - ((v - 1) / 4) * ph;
  const rr = large ? 11 : 9;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Materiality matrix: impact against financial materiality">
      <rect x={X(threshold)} y={t} width={l + pw - X(threshold)} height={Y(threshold) - t} fill={C.zone} />
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={X(v)} y1={t} x2={X(v)} y2={t + ph} className="grid" />
          <line x1={l} y1={Y(v)} x2={l + pw} y2={Y(v)} className="grid" />
          <text x={X(v)} y={t + ph + 16} textAnchor="middle" className="ax">
            {v}
          </text>
          <text x={l - 8} y={Y(v) + 4} textAnchor="end" className="ax">
            {v}
          </text>
        </g>
      ))}
      <line x1={X(threshold)} y1={t} x2={X(threshold)} y2={t + ph} className="ref" />
      <line x1={l} y1={Y(threshold)} x2={l + pw} y2={Y(threshold)} className="ref" />
      <text x={l + pw - 8} y={t + 16} textAnchor="end" className="zone-title">
        Double material
      </text>
      <text x={l + 8} y={t + 16} className="sub">
        Impact material
      </text>
      <text x={l + pw - 8} y={t + ph - 8} textAnchor="end" className="sub">
        Financially material
      </text>
      <text x={l + 8} y={t + ph - 8} className="sub">
        Monitor
      </text>
      <text x={l + pw / 2} y={H - 4} textAnchor="middle" className="ax">
        Financial materiality (1–5) →
      </text>
      <text transform={`translate(12 ${t + ph / 2}) rotate(-90)`} textAnchor="middle" className="ax">
        Impact materiality (1–5) →
      </text>

      {topics.map((tp) => {
        const m = isMaterial(tp, threshold);
        return (
          <g key={tp.n}>
            <circle
              cx={X(tp.financial)}
              cy={Y(tp.impact)}
              r={rr}
              fill={m ? C.series1 : C.inactive}
              stroke={C.surface}
              strokeWidth={2}
              {...tip(`${tp.n}. ${tp.title}\nImpact ${tp.impact} · Financial ${tp.financial}\n${isDoubleMaterial(tp, threshold) ? 'Double material' : m ? 'Material' : 'Not material'}`)}
            />
            <text
              x={X(tp.financial)}
              y={Y(tp.impact) + 4}
              textAnchor="middle"
              style={{ fill: C.ink, fontSize: large ? 11 : 10, fontWeight: 700, pointerEvents: 'none' }}
            >
              {tp.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
