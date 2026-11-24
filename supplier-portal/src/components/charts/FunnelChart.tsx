import { C, GAP, hBarPath, tip } from './chartKit';

export interface FunnelStage {
  name: string;
  tier1: number;
  tier2: number;
}

interface Props {
  stages: FunnelStage[];
  /** One series (single tier or single assessment) instead of Tier 1 / Tier 2 split */
  single?: boolean;
  /** A step that keeps less than this share is called out (default 80%) */
  alertBelow?: number;
}

/** "Where are suppliers stuck?" — horizontal funnel with carry-on rate per step. */
export function FunnelChart({ stages, single, alertBelow = 0.8 }: Props) {
  const W = 560;
  const rowH = 36;
  const barH = 20;
  const lab = 86;
  const maxW = 320;
  const H = stages.length * rowH;
  const max = Math.max(1, ...stages.map((s) => s.tier1 + s.tier2));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Assessment progress funnel">
      {stages.map((s, i) => {
        const y = i * rowH + (rowH - barH) / 2;
        const total = s.tier1 + s.tier2;
        const w1 = single ? (total / max) * maxW : (s.tier1 / max) * maxW;
        const w2 = single ? 0 : (s.tier2 / max) * maxW;
        const both = w1 > 0 && w2 > 0;
        const prev = i > 0 ? stages[i - 1].tier1 + stages[i - 1].tier2 : null;
        const pct = prev ? Math.round((total / prev) * 100) : 0;
        const drop = prev != null ? prev - total : 0;
        const alert = prev != null && drop > 0 && total / (prev || 1) < alertBelow;
        const end = lab + w1 + w2 + (both ? GAP : 0);

        return (
          <g key={s.name}>
            <text x={0} y={y + 14} className="lab">
              {s.name}
            </text>
            {total === 0 && <rect x={lab} y={y} width={2} height={barH} fill={C.axis} />}
            {w1 > 0 && (
              <path
                d={hBarPath(lab, y, Math.max(w1, 3), barH, !both)}
                fill={C.series1}
                {...tip(single ? `${s.name}: ${total}` : `${s.name}\nTier 1: ${s.tier1}`)}
              />
            )}
            {w2 > 0 && (
              <path
                d={hBarPath(lab + w1 + (both ? GAP : 0), y, Math.max(w2, 3), barH)}
                fill={C.series2}
                {...tip(`${s.name}\nTier 2: ${s.tier2}`)}
              />
            )}
            <text x={end + 8} y={y + 15} className="val">
              {total}
            </text>
            {prev != null && (
              <text x={W} y={y + 15} textAnchor="end" className={alert ? 'alert' : 'sub'}>
                {drop > 0 ? `−${drop} · ` : ''}
                {pct}% carry on
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
