import { useState } from 'react';
import type { ReactNode } from 'react';

export interface ChartTable {
  columns: string[];
  /** Indexes of numeric columns (right-aligned) */
  numeric?: number[];
  rows: (string | number | null)[][];
}

/**
 * Wraps a chart with a "View as table" toggle, so no value is only readable
 * from color or position.
 */
export function ChartFigure({ table, children }: { table?: ChartTable; children: ReactNode }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className="chart-figure" style={{ margin: 0 }}>
      {table && (
        <div className="chart-figure__toggle">
          <button type="button" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
            {asTable ? 'View as chart' : 'View as table'}
          </button>
        </div>
      )}
      {asTable && table ? (
        <table className="chart-figure__table">
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th key={c} className={table.numeric?.includes(i) ? 'num' : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((v, i) => (
                  <td key={i} className={table.numeric?.includes(i) ? 'num' : undefined}>
                    {v ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        children
      )}
    </figure>
  );
}

export interface LegendItem {
  label: string;
  color: string;
  /** e.g. dashed border for "not scored" */
  style?: React.CSSProperties;
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="chart-legend">
      {items.map((it) => (
        <span key={it.label}>
          <i style={{ background: it.color, ...it.style }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
