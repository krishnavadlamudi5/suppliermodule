import { color, palette } from '../../theme/tokens';

/** Chart colors, resolved to hex for SVG attributes. */
export const C = {
  series1: color('chart-series-1'),
  series2: color('chart-series-2'),
  inactive: color('chart-inactive'),
  grid: color('chart-grid'),
  axis: color('chart-axis'),
  track: color('chart-track'),
  zone: color('chart-highlight-zone'),
  surface: palette['neutral-0'],
  ink: color('text-primary'),
  ink2: color('text-secondary'),
  muted: color('text-muted'),
  alert: color('status-error-text'),
} as const;

/** Bar thickness cap and surface gap (dataviz mark spec). */
export const BAR_MAX = 20;
export const GAP = 2;
export const END_RADIUS = 4;

/**
 * Horizontal bar path: square at the baseline (left), rounded data-end (right).
 * Pass `roundEnd=false` for interior stacked segments.
 */
export function hBarPath(x: number, y: number, w: number, h: number, roundEnd = true): string {
  const r = roundEnd ? Math.min(END_RADIUS, w / 2, h / 2) : 0;
  if (w <= 0) return '';
  return [
    `M${x},${y}`,
    `H${x + w - r}`,
    r ? `Q${x + w},${y} ${x + w},${y + r}` : '',
    `V${y + h - r}`,
    r ? `Q${x + w},${y + h} ${x + w - r},${y + h}` : '',
    `H${x}`,
    'Z',
  ].join(' ');
}

/**
 * Tooltip attribute for a mark. Screen readers get the same values from the
 * chart's "View as table" toggle (ChartFigure), not from individual shapes.
 */
export function tip(text: string) {
  return { 'data-tip': text } as const;
}

/** Attributes that make an SVG mark behave as a link (click + Enter). */
export function linkAttrs(go: () => void) {
  return {
    role: 'link',
    tabIndex: 0,
    style: { cursor: 'pointer' },
    onClick: go,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') go();
    },
  } as const;
}

export const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
