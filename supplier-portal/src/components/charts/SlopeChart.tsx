import { C, tip } from './chartKit';

export interface SlopeItem {
  label: string;
  previous: number;
  current: number;
}

interface Props {
  items: SlopeItem[];
  previousLabel?: string;
  currentLabel?: string;
  /** Index to emphasise; defaults to the biggest improvement */
  highlight?: number;
}

/** Year-on-year slope: one line per item, the biggest mover in color, the rest gray. */
export function SlopeChart({ items, previousLabel = 'Last year', currentLabel = 'This year', highlight }: Props) {
  const W = 560;
  const H = 280;
  const xl = 120;
  const xr = 330;
  const t = 30;
  const b = 16;
  const vals = items.flatMap((i) => [i.previous, i.current]);
  const mn = Math.floor(Math.min(...vals) / 10) * 10;
  const mx = Math.ceil(Math.max(...vals) / 10) * 10;
  const Y = (v: number) => t + ((mx - v) / (mx - mn || 1)) * (H - t - b);

  const best =
    highlight ??
    items.reduce((bi, it, i) => (it.current - it.previous > items[bi].current - items[bi].previous ? i : bi), 0);

  // Right-hand labels, pushed apart so they never overlap
  const labels = items.map((it, i) => ({ i, y: Y(it.current) })).sort((a, b2) => a.y - b2.y);
  for (let k = 1; k < labels.length; k++) {
    if (labels[k].y - labels[k - 1].y < 15) labels[k].y = labels[k - 1].y + 15;
  }

  // Draw gray first so the highlighted line sits on top
  const order = items.map((_, i) => i).sort((a, b2) => (a === best ? 1 : b2 === best ? -1 : 0));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Change from ${previousLabel} to ${currentLabel}`}>
      <text x={xl} y={14} textAnchor="middle" className="ax">
        {previousLabel}
      </text>
      <text x={xr} y={14} textAnchor="middle" className="ax">
        {currentLabel}
      </text>
      <line x1={xl} y1={t - 6} x2={xl} y2={H - b} className="base" />
      <line x1={xr} y1={t - 6} x2={xr} y2={H - b} className="base" />
      <text x={xl - 10} y={Y(mx) + 4} textAnchor="end" className="ax">
        {mx}
      </text>
      <text x={xl - 10} y={Y(mn) + 4} textAnchor="end" className="ax">
        {mn}
      </text>

      {order.map((i) => {
        const it = items[i];
        const on = i === best;
        const col = on ? C.series1 : C.inactive;
        const d = it.current - it.previous;
        return (
          <g key={it.label}>
            {/* wide invisible hit line for an easy hover target */}
            <line
              x1={xl}
              y1={Y(it.previous)}
              x2={xr}
              y2={Y(it.current)}
              stroke="transparent"
              strokeWidth={12}
              {...tip(`${it.label}\n${previousLabel}: ${it.previous} → ${currentLabel}: ${it.current} (${d >= 0 ? '+' : ''}${d})`)}
            />
            <line x1={xl} y1={Y(it.previous)} x2={xr} y2={Y(it.current)} stroke={col} strokeWidth={2} strokeLinecap="round" pointerEvents="none" />
            <circle cx={xl} cy={Y(it.previous)} r={4} fill={col} stroke={C.surface} strokeWidth={2} pointerEvents="none" />
            <circle cx={xr} cy={Y(it.current)} r={4.5} fill={col} stroke={C.surface} strokeWidth={2} pointerEvents="none" />
          </g>
        );
      })}

      {labels.map(({ i, y }) => {
        const it = items[i];
        const on = i === best;
        const d = it.current - it.previous;
        return (
          <text key={it.label} x={xr + 12} y={y + 4} className={on ? 'val' : 'lab'}>
            {it.current} · {it.label}
            {on ? `  (${d >= 0 ? '+' : ''}${d})` : ''}
          </text>
        );
      })}
    </svg>
  );
}
