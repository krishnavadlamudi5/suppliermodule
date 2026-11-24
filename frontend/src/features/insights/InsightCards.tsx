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
import { AREAS, AREA_SHORT, FLAG_CAUSES, FLAG_CAUSE_LABEL, RISK_RULES } from '@shared/domain/constants';
import { areaAverages, biggestDrop, engageFirst, maturityCounts } from '@shared/domain/selectors';
import type { FunnelStageData } from '@shared/domain/selectors';
import type { PortalData, RedFlag, Supplier, Tier } from '@shared/domain/types';
import { maturityRamp } from '../../theme/tokens';
import { formatInr } from '../../lib/format';

const total = (s: FunnelStageData) => s.tier1 + s.tier2;
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

function pipelineFinding(stages: FunnelStageData[]): string {
  const done = total(stages[stages.length - 1]);
  const all = total(stages[0]);
  const drop = biggestDrop(stages);
  const i = stages.findIndex((s) => s.name === drop.name);
  const base = `${done} of ${all} supplier assessments reviewed (${pct(done, all)}% completion).`;
  return drop.lost > 0 && i > 0 ? `${base} Largest attrition: ${stages[i - 1].name} → ${drop.name} (−${drop.lost}).` : base;
}

export function FunnelCard({ stages, single, notInvited, footerLink = true }: { stages: FunnelStageData[]; single?: boolean; notInvited?: number; footerLink?: boolean }) {
  return (
    <Card
      title="Assessment Completion Pipeline"
      question={pipelineFinding(stages)}
      footnote={notInvited != null ? `${notInvited} ${notInvited === 1 ? 'assessment' : 'assessments'} pending supplier invitation` : undefined}
      footerLink={footerLink ? { to: '/assessments', label: 'View assessments' } : undefined}
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
      title="Supplier ESG Risk Matrix"
      question={
        engage.length
          ? `${engage.length} high-spend ${engage.length === 1 ? 'supplier falls' : 'suppliers fall'} below the ESG performance threshold (score < ${RISK_RULES.engageBelow}) and ${engage.length === 1 ? 'is' : 'are'} prioritised for engagement.`
          : `No high-spend supplier falls below the ESG performance threshold (score < ${RISK_RULES.engageBelow}).`
      }
      footnote={`High spend: annual spend of ${formatInr(data.settings.highSpend)} or more (configurable in Settings)`}
      footerLink={footerLink ? { to: '/risk/matrix', label: 'View risk matrix' } : undefined}
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
      title={title ?? 'ESG Performance by Impact Area'}
      question={
        avgs[weakest] != null
          ? `${AREAS[weakest]} is the lowest-performing impact area (average score ${Math.round(avgs[weakest] as number)}). Suppliers ranked by annual spend.`
          : 'No impact-area scores recorded yet.'
      }
      footnote="Aligned to the seven impact areas of the scoring methodology"
      footerLink={footerLink ? { to: '/risk/heatmap', label: 'View heatmap' } : undefined}
    >
      <Legend items={heatLegend} />
      <ChartFigure table={{ columns: ['Supplier', ...AREA_SHORT], numeric: [1, 2, 3, 4, 5, 6, 7], rows: bySpend.map((s) => [s.name, ...(s.areaScores ?? [])]) }}>
        <Heatmap
          rows={bySpend.map((s) => ({ id: s.id, name: s.name, scores: s.areaScores ?? [] }))}
          columns={AREA_SHORT}
          columnNames={AREAS}
          emptyNote="Not applicable (Scope 3 assessed for Tier 1 only)"
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
  const devPct = Math.round(((first[2] + first[3] + first[4]) / (first.reduce((a, b) => a + b, 0) || 1)) * 100);
  return (
    <Card
      title="ESG Maturity Distribution"
      question={`${devPct}% of ${rows[0].label} suppliers have reached Developing maturity or above. Lower bar shows the 2025 baseline.`}
      footnote="Covers suppliers with a scored Annual ESG Assessment"
      footerLink={{ to: '/questionnaires/scoring', label: 'Maturity methodology' }}
    >
      <Legend items={MATURITY_LEVELS.map((l, i) => ({ label: l, color: maturityRamp[i] }))} />
      <ChartFigure table={{ columns: ['Tier', ...MATURITY_LEVELS], numeric: [1, 2, 3, 4, 5], rows: rows.map((r) => [r.label, ...r.current]) }}>
        <MaturityBars rows={rows} />
      </ChartFigure>
    </Card>
  );
}

export function FlagCausesCard({ flags }: { flags: RedFlag[] }) {
  const rows = FLAG_CAUSES.map((c) => ({ l: FLAG_CAUSE_LABEL[c], v: flags.filter((f) => f.cause === c).length }));
  const top = rows.reduce((a, b) => (b.v > a.v ? b : a));
  const suppliers = new Set(flags.map((f) => f.supplierId)).size;
  // Name every type tied for the highest count, not just the first one
  const leaders = rows.filter((r) => r.v === top.v && r.v > 0).map((r) => r.l);
  const leadText = leaders.length > 1 ? `${leaders.slice(0, -1).join(', ')} and ${leaders.at(-1)} (${top.v} each)` : (leaders[0] ?? '');
  return (
    <Card
      title="Critical Compliance Findings"
      question={
        flags.length
          ? `${flags.length} open ${flags.length === 1 ? 'finding' : 'findings'} across ${suppliers} ${suppliers === 1 ? 'supplier' : 'suppliers'}. Most frequent: ${leadText}.`
          : 'No open critical findings.'
      }
      footnote="Includes findings with corrective actions in progress"
      footerLink={{ to: '/reviews/flags', label: 'View findings' }}
    >
      <ChartFigure table={{ columns: ['Finding', 'Open'], numeric: [1], rows: rows.map((r) => [r.l, r.v]) }}>
        <HBarChart rows={rows.map((r) => ({ label: r.l, value: r.v, color: leaders.includes(r.l) ? C.series1 : undefined }))} labelWidth={255} ariaLabel="Open critical findings by type" />
      </ChartFigure>
    </Card>
  );
}

export function AreaTrendCard({ data, suppliers, footerLink = true }: { data: PortalData; suppliers: Supplier[]; footerLink?: boolean }) {
  const now = areaAverages(suppliers).map((v) => (v == null ? null : Math.round(v)));
  const items = AREAS.map((label, i) => ({ label, i, current: now[i], previous: now[i] == null ? null : (now[i] as number) - data.areaDeltas[i] })).filter(
    (x): x is { label: (typeof AREAS)[number]; i: number; current: number; previous: number } => x.current != null,
  );
  if (!items.length) return <Card title="Year-on-Year ESG Performance" question="No comparable scores across both periods yet." />;
  const best = items.reduce((a, b) => (b.current - b.previous > a.current - a.previous ? b : a));
  const d = best.current - best.previous;
  return (
    <Card
      title="Year-on-Year ESG Performance"
      question={`${best.label} shows the strongest improvement (${d >= 0 ? '+' : ''}${d} points vs 2025). Average impact-area scores for suppliers assessed in both periods.`}
      footnote="Like-for-like comparison by assessment type and tier"
      footerLink={footerLink ? { to: '/risk/trends', label: 'View trends' } : undefined}
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
      title="Double Materiality Assessment"
      question={`${doubles} of ${data.topics.length} sustainability topics are material from both an impact and a financial perspective. 2026 stakeholder consultation in progress.`}
      footnote="Material topics carry a 1.5× weighting in Annual ESG scoring"
      footerLink={footerLink ? { to: '/materiality', label: 'View materiality' } : undefined}
    >
      <ChartFigure table={{ columns: ['#', 'Topic', 'Impact', 'Financial'], numeric: [2, 3], rows: data.topics.map((t) => [t.n, t.title, t.impact, t.financial]) }}>
        <MaterialityMatrix topics={data.topics} large={large} />
      </ChartFigure>
    </Card>
  );
}
