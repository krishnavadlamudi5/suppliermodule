import { heatRamp, palette } from '../../theme/tokens';
import type { LegendItem } from './ChartFigure';
import type { MaterialityTopic } from './MaterialityMatrix';

/** Shared chart scales and classifiers (kept out of component files for fast refresh). */
export const MATURITY_LEVELS = ['Nascent', 'Emerging', 'Developing', 'Progressive', 'Transformative'] as const;

export const heatColor = (v: number) => heatRamp.find((h) => v <= h.max) ?? heatRamp[heatRamp.length - 1];

export const heatLegend: LegendItem[] = [
  ...heatRamp.map((h) => ({ label: h.label, color: h.fill })),
  { label: 'Not scored', color: palette['neutral-50'], style: { border: `1px dashed ${palette['neutral-300']}` } },
];

export const isMaterial = (t: MaterialityTopic, th = 3.5) => t.impact >= th || t.financial >= th;
export const isDoubleMaterial = (t: MaterialityTopic, th = 3.5) => t.impact >= th && t.financial >= th;
