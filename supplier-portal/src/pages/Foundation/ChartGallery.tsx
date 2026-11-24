import { Card, CardGrid } from '../../components/Card/Card';
import { ChartFigure, Legend } from '../../components/charts/ChartFigure';
import { C } from '../../components/charts/chartKit';
import { FunnelChart } from '../../components/charts/FunnelChart';
import type { FunnelStage } from '../../components/charts/FunnelChart';
import { HBarChart } from '../../components/charts/HBarChart';
import { MaturityBars } from '../../components/charts/MaturityBars';
import { MATURITY_LEVELS, heatLegend, isDoubleMaterial } from '../../components/charts/scales';
import { RiskMatrix } from '../../components/charts/RiskMatrix';
import { MaterialityMatrix } from '../../components/charts/MaterialityMatrix';
import { Heatmap } from '../../components/charts/Heatmap';
import { SlopeChart } from '../../components/charts/SlopeChart';
import { maturityRamp } from '../../theme/tokens';
import { formatInr } from '../../lib/format';
import { useToast } from '../../components/useToast';

import { usePortal } from '../../state/hooks';
import { AREAS, AREA_SHORT, FLAG_CAUSES } from '../../domain/constants';
import {
  activeAssignments,
  areaAverages,
  biggestDrop,
  engageFirst,
  funnelStages,
  maturityCounts,
  scoredSuppliers,
} from '../../domain/selectors';

const avg = (a: (number | null)[]) => {
  const v = a.filter((x): x is number => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
};

export function ChartGallery() {
  const toast = useToast();
  const data = usePortal();
  const SCORED = scoredSuppliers(data).map((s) => ({
    id: s.id, name: s.name, tier: s.tier, spend: s.spend, score: s.score as number, conf: s.confidence ?? 0, areas: s.areaScores ?? [],
  }));
  const AREA_DELTA = data.areaDeltas;
  const FUNNEL: FunnelStage[] = funnelStages(data, activeAssignments(data));
  const drop = biggestDrop(FUNNEL);
  const MATURITY = ([1, 2] as const).map((t) => ({
    label: `Tier ${t}`,
    current: maturityCounts(data.suppliers.filter((s) => s.tier === t)),
    previous: data.previousMaturity[t],
    previousLabel: '2025',
  }));
  const t1 = MATURITY[0].current;
  const t1DevPct = Math.round(((t1[2] + t1[3] + t1[4]) / (t1.reduce((a, b) => a + b, 0) || 1)) * 100);
  const liveFlags = data.flags.filter((f) => f.status !== 'Closed');
  const FLAG_ROWS = FLAG_CAUSES.map((l) => ({ l, v: liveFlags.filter((f) => f.cause === l).length }));
  const TOPICS = data.topics;
  const engage = engageFirst(data);
  const bySpend = [...SCORED].sort((a, b) => b.spend - a.spend);
  const areaNow = areaAverages(scoredSuppliers(data)).map((v) => Math.round(v ?? 0));
  const slope = AREAS.map((label, i) => ({ label, current: areaNow[i], previous: areaNow[i] - AREA_DELTA[i] }));
  const weakest = areaNow.indexOf(Math.min(...areaNow));
  const topFlag = FLAG_ROWS.reduce((a, b) => (b.v > a.v ? b : a));
  const kavya = SCORED.find((s) => s.id === 'SUP-008') ?? SCORED[0];
  const tier1Avg = AREAS.map((_, i) => avg(SCORED.filter((s) => s.tier === 1).map((s) => s.areas[i])));
  const go = (id: string) => toast.info(`Would open supplier ${id}`);

  return (
    <section className="fd-card">
      <h2>Charts</h2>
      <p className="fd-q">
        Hand-built SVG in the brand palette. Hover any mark for detail. Every chart has a table view. Tier 1 / Tier 2 colors validated for colorblind safety
        (ΔE 33).
      </p>

      <CardGrid cols={2}>
        <Card
          title={`${FUNNEL[4].tier1 + FUNNEL[4].tier2} of ${FUNNEL[0].tier1 + FUNNEL[0].tier2} supplier assessments reviewed; biggest drop at “${drop.name}”`}
          question="Funnel · where are suppliers stuck before they submit?"
        >
          <Legend items={[{ label: 'Tier 1', color: C.series1 }, { label: 'Tier 2', color: C.series2 }]} />
          <ChartFigure
            table={{ columns: ['Stage', 'Tier 1', 'Tier 2', 'Total'], numeric: [1, 2, 3], rows: FUNNEL.map((s) => [s.name, s.tier1, s.tier2, s.tier1 + s.tier2]) }}
          >
            <FunnelChart stages={FUNNEL} />
          </ChartFigure>
        </Card>

        <Card title={`${engage.length} high-spend suppliers score below 60`} question="Risk matrix · spend × ESG performance score">
          <ChartFigure
            table={{
              columns: ['Supplier', 'Tier', 'Score', 'Spend'],
              numeric: [2],
              rows: SCORED.map((s) => [s.name, `Tier ${s.tier}`, s.score, formatInr(s.spend)]),
            }}
          >
            <RiskMatrix
              points={SCORED.map((s) => ({ id: s.id, name: s.name, tier: s.tier, score: s.score, spend: s.spend, confidence: s.conf }))}
              highSpend={data.settings.highSpend}
              onSelect={go}
            />
          </ChartFigure>
        </Card>

        <Card title={`${AREAS[weakest]} is the weakest area, averaging ${areaNow[weakest]}`} question="Heatmap · which supplier is weak in which area? Sorted by spend.">
          <Legend items={heatLegend} />
          <ChartFigure
            table={{ columns: ['Supplier', ...AREA_SHORT], numeric: [1, 2, 3, 4, 5, 6, 7], rows: bySpend.map((s) => [s.name, ...s.areas]) }}
          >
            <Heatmap
              rows={bySpend.map((s) => ({ id: s.id, name: s.name, scores: s.areas }))}
              columns={AREA_SHORT}
              columnNames={AREAS}
              emptyNote="Not scored (Scope 3 is Tier 1 only)"
              onSelect={go}
            />
          </ChartFigure>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title={`${t1DevPct}% of Tier 1 suppliers are Developing or better`} question="Maturity · thin bar = 2025">
            <Legend items={MATURITY_LEVELS.map((l, i) => ({ label: l, color: maturityRamp[i] }))} />
            <ChartFigure
              table={{ columns: ['Tier', ...MATURITY_LEVELS], numeric: [1, 2, 3, 4, 5], rows: MATURITY.map((r) => [r.label, ...r.current]) }}
            >
              <MaturityBars rows={MATURITY} />
            </ChartFigure>
          </Card>
          <Card title={`${liveFlags.length} red flags across ${new Set(liveFlags.map((f) => f.supplierId)).size} suppliers; most common: ${topFlag.l.toLowerCase()}`} question="Ranked bars · only the top cause is colored">
            <ChartFigure table={{ columns: ['Cause', 'Open flags'], numeric: [1], rows: FLAG_ROWS.map((f) => [f.l, f.v]) }}>
              <HBarChart rows={FLAG_ROWS.map((f) => ({ label: f.l, value: f.v, color: f === topFlag ? C.series1 : undefined }))} ariaLabel="Red flags by cause" />
            </ChartFigure>
          </Card>
        </div>

        <Card title={`${AREAS[AREA_DELTA.indexOf(Math.max(...AREA_DELTA))]} improved most, +${Math.max(...AREA_DELTA)} points`} question="Slope · average area score, 2025 → 2026">
          <ChartFigure
            table={{ columns: ['Area', '2025', '2026', 'Change'], numeric: [1, 2, 3], rows: slope.map((s) => [s.label, s.previous, s.current, s.current - s.previous]) }}
          >
            <SlopeChart items={slope} previousLabel="2025" currentLabel="2026" />
          </ChartFigure>
        </Card>

        <Card title={`${TOPICS.filter((t) => isDoubleMaterial(t)).length} topics are double material`} question="Materiality matrix · impact × financial importance">
          <ChartFigure
            table={{ columns: ['#', 'Topic', 'Impact', 'Financial'], numeric: [2, 3], rows: TOPICS.map((t) => [t.n, t.title, t.impact, t.financial]) }}
          >
            <MaterialityMatrix topics={TOPICS} />
          </ChartFigure>
        </Card>

        <Card
          title={`${kavya.name}: strongest in ${AREAS[kavya.areas.indexOf(Math.max(...(kavya.areas as number[])))]}, weakest in ${AREAS[kavya.areas.indexOf(Math.min(...(kavya.areas as number[])))]}`} question="Bars with a reference tick · black tick = Tier 1 average">
          <ChartFigure
            table={{
              columns: ['Area', 'Score', 'Tier 1 average'],
              numeric: [1, 2],
              rows: AREAS.map((a, i) => [a, kavya.areas[i], Math.round(tier1Avg[i])]),
            }}
          >
            <HBarChart
              rows={AREAS.map((a, i) => ({ label: a, value: kavya.areas[i] ?? 0, color: C.series1, mark: tier1Avg[i] }))}
              max={100}
              labelWidth={180}
              markLabel="Tier 1 average"
              ariaLabel="Score by area"
            />
          </ChartFigure>
        </Card>

        <Card
          title={`${SCORED.filter((s) => s.conf < 60).length} suppliers have low data confidence (below 60%)`} question="Bars with reference lines · dashed = Medium (60) and High (80)">
          <ChartFigure table={{ columns: ['Supplier', 'Confidence'], numeric: [1], rows: [...SCORED].sort((a, b) => a.conf - b.conf).map((s) => [s.name, `${s.conf}%`]) }}>
            <HBarChart
              rows={[...SCORED]
                .sort((a, b) => a.conf - b.conf)
                .map((s) => ({ label: s.name, value: s.conf, valueLabel: `${s.conf}%`, color: s.conf < 60 ? C.series1 : undefined }))}
              max={100}
              refs={[
                { value: 60, label: 'Medium 60' },
                { value: 80, label: 'High 80' },
              ]}
              ariaLabel="Data confidence by supplier"
            />
          </ChartFigure>
        </Card>
      </CardGrid>
    </section>
  );
}
