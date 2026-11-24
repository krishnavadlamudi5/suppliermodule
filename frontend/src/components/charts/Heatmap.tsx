import { palette } from '../../theme/tokens';
import { heatColor } from './scales';
import { C, linkAttrs, tip, truncate } from './chartKit';

export interface HeatRow {
  id: string;
  name: string;
  /** One score per column; null = not scored */
  scores: (number | null)[];
}

interface Props {
  rows: HeatRow[];
  /** Short column labels for the header */
  columns: readonly string[];
  /** Full column names for tooltips */
  columnNames?: readonly string[];
  /** Tooltip text for an empty cell */
  emptyNote?: string;
  onSelect?: (id: string) => void;
}

/** Supplier × area score grid. Diverging: red (weak) → gray (mid) → brand green (strong). */
export function Heatmap({ rows, columns, columnNames = columns, emptyNote = 'Not scored', onSelect }: Props) {
  const lab = 150;
  const cw = 56;
  const ch = 28;
  const gap = 2;
  const top = 26;
  const W = lab + columns.length * (cw + gap);
  const H = top + rows.length * (ch + gap);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role={onSelect ? 'group' : 'img'} aria-label="Supplier by area score heatmap">
      {columns.map((c, i) => (
        <text key={c} x={lab + i * (cw + gap) + cw / 2} y={14} textAnchor="middle" className="ax">
          {c}
        </text>
      ))}
      {rows.map((r, ri) => {
        const y = top + ri * (ch + gap);
        return (
          <g key={r.id}>
            <g {...(onSelect ? { ...linkAttrs(() => onSelect(r.id)), 'aria-label': `Open ${r.name}` } : {})}>
              <text x={0} y={y + 18} className="lab">
                {truncate(r.name, 20)}
              </text>
            </g>
            {r.scores.map((v, c) => {
              const x = lab + c * (cw + gap);
              if (v == null) {
                return (
                  <rect
                    key={c}
                    x={x + 0.5}
                    y={y + 0.5}
                    width={cw - 1}
                    height={ch - 1}
                    rx={4}
                    fill={palette['neutral-50']}
                    stroke={C.axis}
                    strokeDasharray="3 2"
                    {...tip(`${r.name} · ${columnNames[c]}\n${emptyNote}`)}
                  />
                );
              }
              const h = heatColor(v);
              return (
                <g key={c}>
                  <rect x={x} y={y} width={cw} height={ch} rx={4} fill={h.fill} {...tip(`${r.name} · ${columnNames[c]}\nScore ${v}/100`)} />
                  <text x={x + cw / 2} y={y + 18} textAnchor="middle" style={{ fill: h.ink, fontSize: 11.5, fontWeight: 600, pointerEvents: 'none' }}>
                    {v}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
