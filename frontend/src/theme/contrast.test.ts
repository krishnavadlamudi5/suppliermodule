import { describe, expect, it } from 'vitest';
import { color, heatRamp, maturityInk, maturityRamp, palette } from './tokens';
import type { SemanticKey } from './tokens';

/* WCAG 2.x relative-luminance contrast */
function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const c = (k: SemanticKey) => color(k);
const AA = 4.5;
const AA_UI = 3; // non-text: icons, borders that carry meaning, chart marks

/** Every text-on-background pair the UI actually renders. */
const TEXT_PAIRS: [string, string, string][] = [
  // body text on each surface
  ...(['text-primary', 'text-heading', 'text-secondary', 'text-link'] as const).flatMap((t) =>
    (['bg-surface', 'bg-app', 'bg-subtle', 'bg-muted', 'bg-brand-subtle'] as const).map((bg) => [`${t} on ${bg}`, c(t), c(bg)] as [string, string, string]),
  ),
  // --text-muted (#677489, the schema's muted grey) is AA only on white-ish surfaces.
  // Rule: never put it on bg-subtle / bg-muted — use --text-secondary there.
  ...(['bg-surface', 'bg-app', 'bg-brand-subtle'] as const).map((bg) => [`text-muted on ${bg}`, c('text-muted'), c(bg)] as [string, string, string]),
  ['link hover on surface', c('text-link-hover'), c('bg-surface')],
  ['active nav text', c('text-brand'), c('bg-selected')],
  ['table header', c('text-secondary'), c('bg-muted')],
  ['primary button', c('text-on-brand'), c('action-primary')],
  ['primary button hover', c('text-on-brand'), c('action-primary-hover')],
  ['secondary button', c('text-primary'), c('action-secondary')],
  ['secondary button hover', c('text-primary'), c('action-secondary-hover')],
  ['ghost button', c('text-brand'), c('bg-surface')],
  ['danger button', palette['error-600'], c('bg-surface')],
  // pills
  ['pill success', c('status-success-text'), c('status-success-bg')],
  ['pill warning', c('status-warning-text'), c('status-warning-bg')],
  ['pill error', c('status-error-text'), c('status-error-bg')],
  ['pill info', c('status-info-text'), c('status-info-bg')],
  ['pill neutral', c('status-neutral-text'), c('status-neutral-bg')],
  ['pill brand', c('text-brand'), c('bg-selected')],
  ['tier 1 badge', c('text-brand'), c('bg-brand-subtle')],
  // callouts (primary text on tinted backgrounds)
  ['callout warning', c('text-primary'), c('status-warning-bg')],
  ['callout error', c('text-primary'), c('status-error-bg')],
  ['callout info', c('text-primary'), c('status-info-bg')],
  // chart text and tooltip
  ['tooltip', palette['neutral-0'], palette['neutral-900']],
  ['chart alert text', c('status-error-text'), c('bg-surface')],
  // labels inside chart marks
  ...maturityRamp.map((bg, i) => [`maturity ${i} label`, maturityInk[i], bg] as [string, string, string]),
  ...heatRamp.map((h) => [`heat ${h.label} label`, h.ink, h.fill] as [string, string, string]),
  ['materiality dot number', c('text-primary'), c('chart-series-1')],
];

/** Non-text marks that carry meaning must reach 3:1 against the surface. */
const UI_PAIRS: [string, string, string][] = [
  ['chart series 1', c('chart-series-1'), c('bg-surface')],
  ['risk High marker', c('status-error-accent'), c('bg-surface')],
  ['risk Low marker', palette['success-700'], c('bg-surface')],
  ['focus ring', c('action-primary'), c('bg-surface')],
  ['input border (error)', palette['error-600'], c('bg-surface')],
];

describe('color contrast (WCAG AA)', () => {
  it.each(TEXT_PAIRS)('%s reaches 4.5:1', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it.each(UI_PAIRS)('%s reaches 3:1', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA_UI);
  });
});
