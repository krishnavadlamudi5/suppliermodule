/**
 * Bharat Carbon design tokens — the single source of truth for color, type,
 * radius, spacing and elevation in the Supplier ESG portal.
 *
 * Derived from COLOR_SCHEMA.md (Bharat Carbon Customers v2), with the drift
 * listed in §11 of that document resolved: one hex per token name, no Material
 * blues, no teal-era legacy colors, one button system.
 *
 * `scripts/build-tokens.ts` turns this file into `src/styles/_tokens.generated.scss`
 * (CSS custom properties on :root). It runs automatically before `dev` and `build`.
 * Never hand-edit the generated file; edit this one.
 */

/* ------------------------------------------------------------------ */
/* 1. Palette — raw values. Components should prefer the semantic layer. */
/* ------------------------------------------------------------------ */
export const palette = {
  // Brand — forest green (schema §1)
  'brand-800': '#2E3D26', // pressed state; darkened #435B37 (new, needed for :active)
  'brand-700': '#3A4F30', // hover; from .btn-confirm (schema §9.4)
  'brand-600': '#435B37', // primary brand green
  'brand-500': '#719A5D', // gradient partner, secondary emphasis
  'brand-200': '#D3EEC6', // hover on tinted surfaces
  'brand-100': '#E1F3D9', // selected background
  'brand-50': '#F5FBF3', // subtle section background

  // Green scale (schema §2) — one hex per step
  'green-50': '#EEF8ED',
  'green-100': '#D9EFD8',
  'green-200': '#C5E4C3',
  'green-400': '#7BC47A',
  'green-500': '#5BA85A',
  'green-600': '#4A9C49',
  'green-700': '#3F8F3D',
  'green-800': '#2F6F2E',
  'green-900': '#1F4F1F',

  // Neutrals (schema §3) — one hex per step
  'neutral-0': '#FFFFFF',
  'neutral-25': '#F8FAFF', // app background
  'neutral-50': '#F8F9FC',
  'neutral-100': '#F3F4F8', // table header, quiet fills
  'neutral-150': '#E6ECF0', // secondary button background
  'neutral-175': '#D9E0E6', // secondary button hover (new, darkened neutral-150)
  'neutral-200': '#E5E9F2', // dividers, card borders
  'neutral-250': '#D2D4DA', // input borders
  'neutral-300': '#D2D8E6', // stronger borders, chart axes
  'neutral-400': '#ADB6CB', // disabled text, placeholders, inactive chart marks
  'neutral-500': '#8E99B1', // decorative only — fails AA for text
  'neutral-550': '#677489', // muted body text (AA on white)
  'neutral-600': '#5C6070',
  'neutral-700': '#4D5269', // secondary text
  'neutral-800': '#282A3A', // headings
  'neutral-900': '#101223', // primary text

  // Success (schema §4)
  'success-700': '#3D8B55',
  'success-400': '#91C577',
  'success-50': '#F0FAF2',

  // Warning / amber (schema §4)
  'warning-800': '#7A5200', // text on amber tints (new — #FF983F fails AA as text)
  'warning-500': '#FF983F',
  'warning-200': '#F2D38A',
  'warning-50': '#FFF6DE',

  // Error / danger (schema §4) — #DA1E28 chosen over #D93025 / #D64545
  'error-800': '#A63232', // text on red tints
  'error-600': '#DA1E28',
  'error-200': '#F4B9BC',
  'error-50': '#FFF0F0',

  // Info (schema §4) — navy, not Material blue
  'info-900': '#012D47',

  // Data-viz extras (schema §6 Net-Zero pairsOfColour)
  'viz-blue-500': '#5697F8', // second categorical series
  'info-200': '#B9D7F3', // border on info tints (new)
  'info-100': '#E0EFFD',
} as const;

export type PaletteKey = keyof typeof palette;

/* ------------------------------------------------------------------ */
/* 2. Semantic tokens — what components actually use.                  */
/* ------------------------------------------------------------------ */
export const semantic = {
  // Surfaces
  'bg-app': 'neutral-25',
  'bg-surface': 'neutral-0',
  'bg-subtle': 'neutral-50',
  'bg-muted': 'neutral-100',
  'bg-brand-subtle': 'brand-50',
  'bg-selected': 'brand-100',
  'bg-selected-hover': 'brand-200',

  // Text
  'text-primary': 'neutral-900',
  'text-heading': 'neutral-800',
  'text-secondary': 'neutral-700',
  'text-muted': 'neutral-550',
  'text-disabled': 'neutral-400',
  'text-on-brand': 'neutral-0',
  'text-brand': 'brand-600',
  'text-link': 'brand-600',
  'text-link-hover': 'brand-700',

  // Borders
  'border-subtle': 'neutral-200',
  'border-default': 'neutral-250',
  'border-strong': 'neutral-300',
  'border-brand': 'brand-600',
  'focus-ring': 'brand-200',

  // Actions
  'action-primary': 'brand-600',
  'action-primary-hover': 'brand-700',
  'action-primary-active': 'brand-800',
  'action-secondary': 'neutral-150',
  'action-secondary-hover': 'neutral-175',
  'action-disabled-bg': 'neutral-100',
  'action-disabled-text': 'neutral-400',

  // Status (pill = background + text + border triplets)
  'status-success-bg': 'success-50',
  'status-success-text': 'green-800', // success-700 is 3.96:1 on success-50 — too low for pill text
  'status-success-border': 'green-200',
  'status-warning-bg': 'warning-50',
  'status-warning-text': 'warning-800',
  'status-warning-border': 'warning-200',
  'status-warning-accent': 'warning-500',
  'status-error-bg': 'error-50',
  'status-error-text': 'error-800',
  'status-error-border': 'error-200',
  'status-error-accent': 'error-600',
  'status-info-bg': 'info-100',
  'status-info-text': 'info-900',
  'status-info-border': 'info-200',
  'status-neutral-bg': 'neutral-100',
  'status-neutral-text': 'neutral-700',

  // Data viz chrome
  'chart-series-1': 'green-600', // brand-600 fails the chroma floor (reads gray next to inactive)
  'chart-series-2': 'viz-blue-500', // CVD ΔE 33 vs series-1 (validated)
  'chart-inactive': 'neutral-400',
  'chart-grid': 'neutral-200',
  'chart-axis': 'neutral-300',
  'chart-track': 'neutral-100',
  'chart-highlight-zone': 'brand-50',
} as const satisfies Record<string, PaletteKey>;

export type SemanticKey = keyof typeof semantic;

/** Resolve a semantic token to its hex (for antd theme config and SVG charts). */
export const color = (key: SemanticKey): string => palette[semantic[key]];

/* ------------------------------------------------------------------ */
/* 3. Data-visualization ramps                                         */
/* ------------------------------------------------------------------ */

/** Maturity levels, light → dark (Nascent → Transformative). Green scale §2. */
export const maturityRamp = [
  palette['green-200'],
  palette['green-400'],
  palette['green-600'],
  palette['green-800'],
  palette['green-900'],
] as const;

/** Text color that passes AA on each maturity step. */
export const maturityInk = [
  palette['neutral-900'],
  palette['neutral-900'],
  palette['neutral-900'], // white on green-600 is only 3.4:1
  palette['neutral-0'],
  palette['neutral-0'],
] as const;

/** Heatmap, poor → strong: <40, 40–59, 60–69, 70–79, 80+. */
export const heatRamp = [
  { max: 39, fill: palette['error-600'], ink: palette['neutral-0'], label: 'Below 40' },
  { max: 59, fill: palette['error-200'], ink: palette['neutral-900'], label: '40–59' },
  { max: 69, fill: palette['neutral-300'], ink: palette['neutral-900'], label: '60–69' }, // neutral-100 vanished as a bar on white
  { max: 79, fill: palette['success-400'], ink: palette['neutral-900'], label: '70–79' },
  { max: 100, fill: palette['brand-600'], ink: palette['neutral-0'], label: '80+' },
] as const;

/** Risk markers. */
export const riskColor = {
  High: palette['error-600'],
  Medium: palette['warning-500'],
  Low: palette['success-700'],
  none: palette['neutral-300'],
} as const;

/* ------------------------------------------------------------------ */
/* 4. Non-color tokens                                                 */
/* ------------------------------------------------------------------ */
export const font = {
  family: "'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

export const fontSize = {
  xs: '11px',
  sm: '12px',
  md: '13px',
  base: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '22px',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  pill: '999px',
} as const;

export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(16, 18, 35, 0.06)',
  md: '0 8px 24px rgba(16, 18, 35, 0.08)',
  lg: '-12px 0 32px rgba(16, 18, 35, 0.12)',
} as const;

/** Control heights — the one shared sizing scale for buttons and inputs. */
export const controlHeight = {
  sm: 32,
  md: 36,
  lg: 44,
} as const;
