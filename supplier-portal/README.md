# Supplier ESG portal (Bharat Carbon)

React + TypeScript + Vite + Ant Design + SCSS, built from `../supplier-esg-portal-redesign.html`
in the Bharat Carbon color schema.

```
npm install
npm run dev      # regenerates tokens, then starts Vite on :5173
npm run build
```

## Design tokens

- `src/theme/tokens.ts` is the **single source of truth** (palette → semantic tokens → chart ramps).
- `npm run tokens` generates `src/styles/_tokens.generated.scss` (CSS variables on `:root`). Don't edit it by hand.
- `src/theme/antdTheme.ts` feeds the same tokens into Ant Design's `ConfigProvider`, so there are no `!important` overrides.
- Components use semantic variables (`var(--text-secondary)`, `var(--action-primary)`), never raw hex.

## Buttons

Use `src/components/Button` only: `variant` = primary | secondary | ghost | danger | accept | reject,
`size` = sm (32) | md (36) | lg (44).

## Data layer

```
src/domain/types.ts        domain model (Supplier, Assessment, Assignment, RedFlag, …)
src/domain/constants.ts    scoring areas, maturity levels, risk thresholds, status labels
src/domain/selectors.ts    pure business rules: riskOf, needs, funnelStages, maturityCounts…
src/domain/commands.ts     every change as data + applyCommand() reducer
src/data/repository.ts     PortalRepository interface: load() + execute(command)
src/data/mockRepository.ts in-memory implementation over fixtures/sampleData.ts
src/state/                 PortalStore (optimistic updates + rollback) and React hooks
```

Screens read with `usePortal()` and change things with `usePortalActions()`
(`invite`, `raiseAction`, `setEvidenceStatus`, `addSupplier`, `launchAssessment`, …).

**Connecting a backend:** write an HTTP `PortalRepository` (GET the programme in `load`,
map each `PortalCommand` type to an endpoint in `execute`) and pass it to `PortalProvider`
in `main.tsx`. Nothing else changes.

```
npm test         # selector, command and store tests (vitest)
```

## Screens

| Route | Screen |
|---|---|
| `/dashboard` | Needs-you tiles, tier/facility filters, 7 insight cards |
| `/suppliers`, `/suppliers/:id/:tab` | Supplier list (search, filters, bulk invite) and profile (overview, assessments, evidence, flags & actions, Q&A, activity) |
| `/assessments/:tab`, `/assessments/detail/:id/:tab` | Assessment list and detail (progress, suppliers, results, settings) |
| `/reviews/:tab`, `/response/:assessmentId/:supplierId` | Review inbox and the answer-by-answer response review |
| `/actions` | Improvement-action board |
| `/risk/:tab` | Risk matrix, heatmap, area deep-dive, trends |
| `/materiality/:tab` | Matrix, topics, stakeholder survey |
| `/quality`, `/reports` | Data confidence; framework exports |
| `/questionnaires/:tab` | Templates, question bank, scoring rules |
| `/settings/:tab` | Organisation, tier rules, users, reminders, email templates |
| `/design-system` | Tokens, components and charts reference |

Buttons that need a backend service that doesn't exist yet (exports, email sends,
template editors, file uploads) show a confirmation toast instead of acting.

## Accessibility & responsive

- **Contrast is tested:** `src/theme/contrast.test.ts` checks every text/background pair the UI uses
  (WCAG AA 4.5:1 for text, 3:1 for chart marks and icons). Change a token and `npm test` tells you
  if anything drops below the line. Rule: `--text-muted` (#677489) only on white/app backgrounds —
  use `--text-secondary` on grey fills.
- **axe scan in development:** run `await window.__axe()` in the browser console on any page.
  Dev builds only; never shipped.
- Skip link, focus moves to the page on navigation, visible focus rings, `prefers-reduced-motion` respected.
- Charts: every chart has a "View as table" toggle; risk is shape + label, never color alone.
- Layout: full sidebar ≥ 1025px, icon rail 641–1024px, slide-out menu (☰) at phone widths.
