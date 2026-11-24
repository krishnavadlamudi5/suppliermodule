/**
 * Insight cards shared by the Dashboard and the Insights pages.
 * Each card takes the (already filtered) slice of data it should show.
 */
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card/Card';
import { ChartFigure, Legend } from '../../components/charts/ChartFigure';
import { C } from '../../components/charts/chartKit';
import { FunnelChart } from '../../components/charts/FunnelChart';
import { HBarChart } from '../../components/charts/HBarChart';
import { Heatmap } from '../../components/charts/Heatmap';
import { MaterialityMatrix } from '../../components/charts/MaterialityMatrix';
import { MaturityBars } from '../../components/charts/MaturityBars';
import { RiskMatrix } from '../../components/charts/RiskMatrix';
import { SlopeChart } from '../../components/charts/SlopeChart';
import { MATURITY_LEVELS, heatLegend, isDoubleMaterial } from '../../components/charts/scales';
import { AREAS, AREA_SHORT, FLAG_CAUSES, RISK_RULES } from '../../domain/constants';
import { areaAverages, biggestDrop, engageFirst, maturityCounts } from '../../domain/selectors';
import type { FunnelStageData } from '../../domain/selectors';
import type { PortalData, RedFlag, Supplier, Tier } from '../../domain/types';
import { maturityRamp } from '../../theme/tokens';
import { formatInr } from '../../lib/format';

const total = (s: FunnelStageData) => s.tier1 + s.tier2;

export function FunnelCard({ stages, single, notInvited, footerLink = true }: { stages: FunnelStageData[]; single?: boolean; notInvited?: number; footerLink?: boolean }) {
  const drop = biggestDrop(stages);
  return (
    <Card
      title={`${total(stages[4])} of ${total(stages[0])} supplier assessments reviewed${drop.lost > 0 ? `; biggest drop at “${drop.name}”` : ''}`}
      question="Where are suppliers stuck before they submit?"
      footnote={notInvited != null ? `${notInvited} supplier assessment${notInvited === 1 ? ' was' : 's were'} added but never invited` : undefined}
      footerLink={footerLink ? { to: '/assessments', label: 'Open assessments' } : undefined}
    >
      {!single && <Legend items={[{ label: 'Tier 1', color: C.series1 }, { label: 'Tier 2', color: C.series2 }]} />}
      <ChartFigure table={{ columns: ['Stage', 'Tier 1', 'Tier 2', 'Total'], numeric: [1, 2, 3], rows: stages.map((s) => [s.name, s.tier1, s.tier2, total(s)]) }}>
        <FunnelChart stages={stages} single={single} />
      </ChartFigure>
    </Card>
  );
}

export function RiskMatrixCard({ data, suppliers, footerLink = true }: { data: PortalData; suppliers: Supplier[]; footerLink?: boolean }) {
  const navigate = useNavigate();
  const engage = engageFirst(data, suppliers);
  return (
    <Card
      title={`${engage.length} high-spend supplier${engage.length === 1 ? '' : 's'} score${engage.length === 1 ? 's' : ''} below ${RISK_RULES.engageBelow}`}
      question="Which suppliers should procurement engage first? Spend × ESG performance score."
      footnote={`High spend = ${formatInr(data.settings.highSpend)} or more (change in Settings)`}
      footerLink={footerLink ? { to: '/risk/matrix', label: 'Open risk matrix' } : undefined}
    >
      <ChartFigure
        table={{ columns: ['Supplier', 'Tier', 'Score', 'Spend'], numeric: [2], rows: suppliers.map((s) => [s.name, `Tier ${s.tier}`, s.score, formatInr(s.spend)]) }}
      >
        <RiskMatrix
          points={suppliers.map((s) => ({ id: s.id, name: s.name, tier: s.tier, score: s.score ?? 0, spend: s.spend, confidence: s.confidence }))}
          highSpend={data.settings.highSpend}
          onSelect={(id) => navigate(`/suppliers/${id}`)}
        />
      </ChartFigure>
    </Card>
  );
}

export function HeatmapCard({ suppliers, footerLink = true, title }: { suppliers: Supplier[]; footerLink?: boolean; title?: string }) {
  const navigate = useNavigate();
  const avgs = areaAverages(suppliers);
  let weakest = 0;
  avgs.forEach((v, i) => {
    if (v != null && (avgs[weakest] == null || v < (avgs[weakest] as number))) weakest = i;
  });
  const bySpend = [...suppliers].sort((a, b) => b.spend - a.spend);
  return (
    <Card
      title={title ?? (avgs[weakest] != null ? `${AREAS[weakest]} is the weakest area, averaging ${Math.round(avgs[weakest] as number)}` : 'No area scores yet')}
      question="Which supplier is weak in which area? Sorted by spend."
      footnote="Same 7 areas as the scoring methodology"
      footerLink={footerLink ? { to: '/risk/heatmap', label: 'Open heatmap' } : undefined}
    >
      <Legend items={heatLegend} />
      <ChartFigure table={{ columns: ['Supplier', ...AREA_SHORT], numeric: [1, 2, 3, 4, 5, 6, 7], rows: bySpend.map((s) => [s.name, ...(s.areaScores ?? [])]) }}>
        <Heatmap
          rows={bySpend.map((s) => ({ id: s.id, name: s.name, scores: s.areaScores ?? [] }))}
          columns={AREA_SHORT}
          columnNames={AREAS}
          emptyNote="Not scored (Scope 3 is Tier 1 only)"
          onSelect={(id) => navigate(`/suppliers/${id}`)}
        />
      </ChartFigure>
    </Card>
  );
}

export function MaturityCard({ data, tiers, suppliers = data.suppliers }: { data: PortalData; tiers: Tier[]; suppliers?: Supplier[] }) {
  const rows = tiers.map((t) => ({
    label: `Tier ${t}`,
    current: maturityCounts(suppliers.filter((s) => s.tier === t)),
    previous: data.previousMaturity[t],
    previousLabel: '2025',
  }));
  const first = rows[0].current;
  const pct = Math.round(((first[2] + first[3] + first[4]) / (first.reduce((a, b) => a + b, 0) || 1)) * 100);
  return (
    <Card
      title={`${pct}% of ${rows[0].label} suppliers are Developing or better`}
      question="How mature is each tier, and is it improving? Thin bar = 2025."
      footnote="Suppliers without a scored annual assessment are left out"
      footerLink={{ to: '/questionnaires/scoring', label: 'How maturity is scored' }}
    >
      <Legend items={MATURITY_LEVELS.map((l, i) => ({ label: l, color: maturityRamp[i] }))} />
      <ChartFigure table={{ columns: ['Tier', ...MATURITY_LEVELS], numeric: [1, 2, 3, 4, 5], rows: rows.map((r) => [r.label, ...r.current]) }}>
        <MaturityBars rows={rows} />
      </ChartFigure>
    </Card>
  );
}

export function FlagCausesCard({ flags }: { flags: RedFlag[] }) {
  const rows = FLAG_CAUSES.map((l) => ({ l, v: flags.filter((f) => f.cause === l).length }));
  const top = rows.reduce((a, b) => (b.v > a.v ? b : a));
  const suppliers = new Set(flags.map((f) => f.supplierId)).size;
  return (
    <Card
      title={
        flags.length
          ? `${flags.length} red flag${flags.length === 1 ? '' : 's'} across ${suppliers} supplier${suppliers === 1 ? '' : 's'}; most common: ${top.l.charAt(0).toLowerCase()}${top.l.slice(1)}`
          : 'No open red flags'
      }
      question="Which red-flag causes come up most? Open and with an action raised."
      footnote="Work the list in Reviews → Red flags"
      footerLink={{ to: '/reviews/flags', label: 'Open red flags' }}
    >
      <ChartFigure table={{ columns: ['Cause', 'Flags'], numeric: [1], rows: rows.map((r) => [r.l, r.v]) }}>
        <HBarChart rows={rows.map((r) => ({ label: r.l, value: r.v, color: r === top && r.v ? C.series1 : undefined }))} ariaLabel="Red flags by cause" />
      </ChartFigure>
    </Card>
  );
}

export function AreaTrendCard({ data, suppliers, footerLink = true }: { data: PortalData; suppliers: Supplier[]; footerLink?: boolean }) {
  const now = areaAverages(suppliers).map((v) => (v == null ? null : Math.round(v)));
  const items = AREAS.map((label, i) => ({ label, i, current: now[i], previous: now[i] == null ? null : (now[i] as number) - data.areaDeltas[i] })).filter(
    (x): x is { label: (typeof AREAS)[number]; i: number; current: number; previous: number } => x.current != null,
  );
  if (!items.length) return <Card title="No area scores yet" />;
  const best = items.reduce((a, b) => (b.current - b.previous > a.current - a.previous ? b : a));
  const d = best.current - best.previous;
  return (
    <Card
      title={`${best.label} improved most, ${d >= 0 ? '+' : ''}${d} points`}
      question="Is each area better than last year? Average area score, suppliers scored in both years."
      footnote="Year-on-year links assessments by type and tier, not by title"
      footerLink={footerLink ? { to: '/risk/trends', label: 'Open trends' } : undefined}
    >
      <ChartFigure table={{ columns: ['Area', '2025', '2026', 'Change'], numeric: [1, 2, 3], rows: items.map((s) => [s.label, s.previous, s.current, s.current - s.previous]) }}>
        <SlopeChart items={items} previousLabel="2025" currentLabel="2026" />
      </ChartFigure>
    </Card>
  );
}

export function MaterialityCard({ data, large, footerLink = true }: { data: PortalData; large?: boolean; footerLink?: boolean }) {
  const doubles = data.topics.filter((t) => isDoubleMaterial(t)).length;
  return (
    <Card
      title={`${doubles} topics are double material`}
      question="Which ESG topics matter most to stakeholders and to the business? Materiality Assessment 2026, survey in progress."
      footnote="Material topics weigh more in Annual ESG scoring"
      footerLink={footerLink ? { to: '/materiality', label: 'Open materiality' } : undefined}
    >
      <ChartFigure table={{ columns: ['#', 'Topic', 'Impact', 'Financial'], numeric: [2, 3], rows: data.topics.map((t) => [t.n, t.title, t.impact, t.financial]) }}>
        <MaterialityMatrix topics={data.topics} large={large} />
      </ChartFigure>
    </Card>
  );
}
