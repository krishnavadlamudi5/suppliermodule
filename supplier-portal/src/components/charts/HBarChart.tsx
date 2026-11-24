import { C, hBarPath, tip } from './chartKit';

export interface HBarRow {
  label: string;
  value: number;
  /** Text shown at the bar end (defaults to value) */
  valueLabel?: string | number;
  /** Fill; defaults to inactive gray. Pass C.series1 for the row(s) the story is about. */
  color?: string;
  /** Reference tick on this row (e.g. tier average) */
  mark?: number | null;
  tip?: string;
}

interface Props {
  rows: HBarRow[];
  max?: number;
  width?: number;
  labelWidth?: number;
  markLabel?: string;
  /** Dashed reference lines across all rows */
  refs?: { value: number; label: string }[];
  ariaLabel?: string;
}

/** Ranked horizontal bars. Gray by default; color only what the headline is about. */
export function HBarChart({ rows, max, width = 560, labelWidth = 190, markLabel = 'Average', refs, ariaLabel = 'Bar chart' }: Props) {
  const rowH = 30;
  const barH = 16;
  const maxW = width - labelWidth - 50;
  const top = Math.max(1, max ?? Math.max(...rows.map((r) => r.value)));
  const plotH = rows.length * rowH;
  const H = plotH + (refs ? 20 : 2);
  const X = (v: number) => labelWidth + (v / top) * maxW;

  return (
    <svg viewBox={`0 0 ${width} ${H}`} className="chart" role="img" aria-label={ariaLabel}>
      {refs?.map((rf, i) => (
        <g key={rf.label}>
          <line x1={X(rf.value)} y1={0} x2={X(rf.value)} y2={plotH} className="ref" />
          {/* first label sits left of its line, the rest to the right, so neighbours don't collide */}
          <text x={X(rf.value) + (i === 0 && refs.length > 1 ? -4 : 4)} y={plotH + 14} textAnchor={i === 0 && refs.length > 1 ? 'end' : 'start'} className="ax">
            {rf.label}
          </text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = i * rowH + (rowH - barH) / 2;
        const w = (r.value / top) * maxW;
        return (
          <g key={`${r.label}-${i}`}>
            <text x={0} y={y + 12} className="lab">
              {r.label}
            </text>
            {w > 0 ? (
              <path d={hBarPath(labelWidth, y, Math.max(w, 3), barH)} fill={r.color ?? C.inactive} {...tip(r.tip ?? `${r.label}: ${r.valueLabel ?? r.value}`)} />
            ) : (
              <rect x={labelWidth} y={y} width={2} height={barH} fill={C.axis} />
            )}
            {r.mark != null && (
              <line
                x1={X(r.mark)}
                y1={y - 4}
                x2={X(r.mark)}
                y2={y + barH + 4}
                stroke={C.ink}
                strokeWidth={2}
                {...tip(`${markLabel}: ${Math.round(r.mark)}`)}
              />
            )}
            <text x={Math.max(labelWidth + Math.max(w, 3), r.mark != null ? X(r.mark) : 0) + 8} y={y + 13} className="val">
              {r.valueLabel ?? r.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
