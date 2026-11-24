import { maturityRamp, maturityInk } from '../../theme/tokens';
import { GAP, hBarPath, tip } from './chartKit';

import { MATURITY_LEVELS } from './scales';

export interface MaturityRow {
  label: string;
  /** Supplier count per maturity level, Nascent → Transformative */
  current: number[];
  /** Same, previous period (drawn as a thin bar underneath) */
  previous?: number[];
  previousLabel?: string;
}

/** 100% stacked bars by maturity level, with last period as a thin comparison bar. */
export function MaturityBars({ rows }: { rows: MaturityRow[] }) {
  const W = 560;
  const lab = 70;
  const bw = W - lab - 10;
  const rowH = 60;
  const H = rows.length * rowH - 8;

  const segments = (counts: number[], y: number, h: number, rowLabel: string, period: string, faded: boolean) => {
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const nonEmpty = counts.map((n, i) => ({ n, i })).filter((s) => s.n > 0);
    let x = lab;
    return nonEmpty.map(({ n, i }, k) => {
      const last = k === nonEmpty.length - 1;
      const full = (n / total) * bw;
      const w = Math.max(full - (last ? 0 : GAP), 2);
      const seg = (
        <g key={`${period}-${i}`}>
          <path
            d={hBarPath(x, y, w, h, last)}
            fill={maturityRamp[i]}
            fillOpacity={faded ? 0.55 : 1}
            {...tip(`${rowLabel} · ${period} · ${MATURITY_LEVELS[i]}\n${n} supplier${n > 1 ? 's' : ''} (${Math.round((n / total) * 100)}%)`)}
          />
          {!faded && w > 26 && (
            <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" style={{ fill: maturityInk[i], fontSize: 11.5, fontWeight: 600, pointerEvents: 'none' }}>
              {n}
            </text>
          )}
        </g>
      );
      x += full;
      return seg;
    });
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Maturity by tier">
      {rows.map((r, ri) => {
        const y = ri * rowH;
        return (
          <g key={r.label}>
            <text x={0} y={y + 17} className="lab">
              {r.label}
            </text>
            {segments(r.current, y + 2, 22, r.label, '2026', false)}
            {r.previous && (
              <>
                <text x={0} y={y + 38} className="sub">
                  {r.previousLabel ?? 'Last year'}
                </text>
                {segments(r.previous, y + 31, 8, r.label, r.previousLabel ?? 'Last year', true)}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
