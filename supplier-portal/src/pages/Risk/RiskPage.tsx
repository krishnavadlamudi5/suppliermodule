import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RouteTabs } from '../../components/RouteTabs/RouteTabs';
import { Card, CardGrid } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { ListRow } from '../../components/blocks/Blocks';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ChartFigure, Legend } from '../../components/charts/ChartFigure';
import { HBarChart } from '../../components/charts/HBarChart';
import { C } from '../../components/charts/chartKit';
import { heatColor, heatLegend } from '../../components/charts/scales';
import { AreaTrendCard, HeatmapCard, RiskMatrixCard } from '../../features/insights/InsightCards';
import { usePortal } from '../../state/hooks';
import { AREAS, AREA_DESCRIPTIONS, RISK_RULES, SCOPE3_AREA } from '../../domain/constants';
import { average, engageFirst, scoredSuppliers, strongestAndWeakestArea } from '../../domain/selectors';
import type { PortalData } from '../../domain/types';
import { formatInr } from '../../lib/format';
import { palette } from '../../theme/tokens';

const TABS = ['matrix', 'heatmap', 'areas', 'trends'] as const;

export default function RiskPage() {
  const { tab = 'matrix' } = useParams();
  const data = usePortal();
  if (!(TABS as readonly string[]).includes(tab)) return <Navigate to="/risk/matrix" replace />;
  const scored = scoredSuppliers(data);

  return (
    <>
      <PageHeader title="Risk & Performance" subtitle="Supplier ESG risk exposure and performance, by supplier and impact area" />
      <RouteTabs
        base="/risk"
        active={tab}
        tabs={[
          { key: 'matrix', label: 'Risk Matrix' },
          { key: 'heatmap', label: 'Impact Area Heatmap' },
          { key: 'areas', label: 'Impact Area Analysis' },
          { key: 'trends', label: 'Performance Trends' },
        ]}
      />
      {tab === 'matrix' && <MatrixTab data={data} />}
      {tab === 'heatmap' && (
        <div style={{ maxWidth: 820 }}>
          <HeatmapCard suppliers={scored} footerLink={false} title="Supplier Performance by Impact Area" />
        </div>
      )}
      {tab === 'areas' && <AreasTab data={data} />}
      {tab === 'trends' && <TrendsTab data={data} />}
    </>
  );
}

function MatrixTab({ data }: { data: PortalData }) {
  const scored = scoredSuppliers(data);
  const engage = engageFirst(data, scored);
  const unscored = data.suppliers.filter((s) => s.score == null).sort((a, b) => b.spend - a.spend);
  return (
    <div className="split-layout">
      <RiskMatrixCard data={data} suppliers={scored} footerLink={false} />
      <Card title="Priority Engagement List" question="High-spend suppliers below the ESG performance threshold (score < 60), ranked by spend">
        {engage.length ? (
          engage.map((s) => {
            const sw = strongestAndWeakestArea(s);
            return (
              <ListRow
                key={s.id}
                title={<Link to={`/suppliers/${s.id}`}>{s.name}</Link>}
                meta={`Score ${s.score} · ${formatInr(s.spend)}${sw ? ` · priority area: ${AREAS[sw.weakest]}` : ''}`}
              />
            );
          })
        ) : (
          <EmptyState>No high-spend supplier falls below the performance threshold.</EmptyState>
        )}
        <h3 className="card__title" style={{ marginTop: 16 }}>
          Pending Baseline Assessment
        </h3>
        <p className="card__question">Not yet scored, so not plotted on the matrix</p>
        {unscored.map((s) => (
          <div key={s.id} style={{ fontSize: 13, padding: '3px 0' }}>
            <Link to={`/suppliers/${s.id}`}>{s.name}</Link> <span className="muted">· {formatInr(s.spend)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AreasTab({ data }: { data: PortalData }) {
  const [params, setParams] = useSearchParams();
  const i = Math.min(AREAS.length - 1, Math.max(0, Number(params.get('area')) || 0));
  const rows = scoredSuppliers(data)
    .filter((s) => s.areaScores?.[i] != null)
    .map((s) => ({ s, v: s.areaScores?.[i] as number }))
    .sort((a, b) => b.v - a.v);
  const avg = average(rows.map((r) => r.v));
  const weak = rows.filter((r) => r.v < 50).sort((a, b) => a.v - b.v);

  return (
    <>
      <div className="filter-bar" role="tablist" aria-label="Scoring area">
        {AREAS.map((a, k) => (
          <Button key={a} size="sm" variant={k === i ? 'primary' : 'secondary'} role="tab" aria-selected={k === i} onClick={() => setParams({ area: String(k) }, { replace: true })}>
            {a}
          </Button>
        ))}
      </div>
      <CardGrid cols={2}>
        <Card
          title={`${AREAS[i]}: Supplier Performance`}
          question={rows.length ? `Average score ${Math.round(avg ?? 0)} across ${rows.length} suppliers, ranked highest first${i === SCOPE3_AREA ? ' (assessed for Tier 1 only)' : ''}.` : 'No scores recorded for this impact area yet.'}
        >
          <Legend items={heatLegend.slice(0, 5)} />
          <ChartFigure table={{ columns: ['Supplier', 'Score'], numeric: [1], rows: rows.map((r) => [r.s.name, r.v]) }}>
            <HBarChart
              rows={rows.map((r) => ({ label: r.s.name, value: r.v, color: heatColor(r.v).fill, tip: `${r.s.name} · ${AREAS[i]}: ${r.v}` }))}
              max={100}
              ariaLabel={`${AREAS[i]} by supplier`}
            />
          </ChartFigure>
        </Card>
        <Card title="Impact Area Scope" question="As defined in the scoring methodology">
          <p style={{ margin: '0 0 12px' }}>{AREA_DESCRIPTIONS[i]}</p>
          <h3 style={{ fontSize: 13, marginBottom: 6 }}>Suppliers requiring engagement (score below 50)</h3>
          {weak.length ? (
            weak.map((r) => (
              <div key={r.s.id} style={{ fontSize: 13, padding: '3px 0' }}>
                <Link to={`/suppliers/${r.s.id}`}>{r.s.name}</Link> · {r.v}
              </div>
            ))
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>
              No supplier scores below 50.
            </div>
          )}
          <p className="form-field__hint" style={{ marginTop: 12 }}>
            Framework mappings (BRSR, EcoVadis, GHG Protocol Scope 3) for this area are available in <Link to="/reports">Disclosures &amp; Reports</Link>.
          </p>
        </Card>
      </CardGrid>
    </>
  );
}

function TrendsTab({ data }: { data: PortalData }) {
  const scored = scoredSuppliers(data);
  const band = RISK_RULES.yoyBand;
  const yoy = scored
    .filter((s) => s.previousScore != null)
    .map((s) => ({ s, d: (s.score as number) - (s.previousScore as number) }))
    .sort((a, b) => b.d - a.d);
  const up = yoy.filter((r) => r.d >= band).length;
  const down = yoy.filter((r) => r.d <= -band).length;
  const declined = palette['error-600'];

  return (
    <CardGrid cols={2}>
      <AreaTrendCard data={data} suppliers={scored} footerLink={false} />
      <Card
        title="Supplier Score Movement"
        question={`${up} ${up === 1 ? 'supplier' : 'suppliers'} improved by ${band}+ points and ${down} declined versus the 2025 baseline (±${band} threshold). Suppliers without a prior-year score are excluded.`}
      >
        <Legend
          items={[
            { label: '▲ Improved', color: C.series1 },
            { label: 'Steady', color: C.inactive },
            { label: '▼ Declined', color: declined },
          ]}
        />
        <ChartFigure table={{ columns: ['Supplier', '2025', '2026', 'Change'], numeric: [1, 2, 3], rows: yoy.map((r) => [r.s.name, r.s.previousScore, r.s.score, r.d]) }}>
          <HBarChart
            rows={yoy.map((r) => ({
              label: r.s.name,
              value: Math.abs(r.d),
              valueLabel: `${r.d >= 0 ? '+' : '−'}${Math.abs(r.d)}${r.d >= band ? ' ▲' : r.d <= -band ? ' ▼' : ''}`,
              color: r.d >= band ? C.series1 : r.d <= -band ? declined : C.inactive,
              tip: `${r.s.name}: ${r.s.previousScore} → ${r.s.score} (${r.d >= 0 ? '+' : ''}${r.d})`,
            }))}
            max={Math.max(10, ...yoy.map((r) => Math.abs(r.d)))}
            ariaLabel="Year-on-year score change"
          />
        </ChartFigure>
      </Card>
    </CardGrid>
  );
}
