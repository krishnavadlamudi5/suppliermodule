import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Card, CardGrid } from '../../components/Card/Card';
import { ChartFigure } from '../../components/charts/ChartFigure';
import { HBarChart } from '../../components/charts/HBarChart';
import { C } from '../../components/charts/chartKit';
import { usePortal } from '../../state/hooks';
import { needs } from '../../domain/selectors';
import { RISK_RULES } from '../../domain/constants';

const band = (v: number) => (v < RISK_RULES.confidenceMedium ? 'Low' : v < RISK_RULES.confidenceHigh ? 'Medium' : 'High');

export default function QualityPage() {
  const data = usePortal();
  const list = data.suppliers.filter((s) => s.confidence != null).sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0));
  const low = list.filter((s) => (s.confidence ?? 0) < RISK_RULES.confidenceMedium);
  const checks = data.qualityChecks;
  // The check that costs the most confidence points: (100 − average) × weight
  const lost = (c: (typeof checks)[number]) => (100 - c.average) * c.weight;
  const weakest = checks.reduce((a, b) => (lost(b) > lost(a) ? b : a), checks[0]);
  const pending = needs(data).evidence;

  return (
    <>
      <PageHeader title="Data quality" subtitle="How far the scores can be relied on" />
      <CardGrid cols={2}>
        <Card
          title={`${low.length} supplier${low.length === 1 ? ' has' : 's have'} low data confidence (below ${RISK_RULES.confidenceMedium}%)`}
          question={`Data confidence by supplier, lowest first. Dashed lines = Medium (${RISK_RULES.confidenceMedium}) and High (${RISK_RULES.confidenceHigh}) bands.`}
        >
          <ChartFigure table={{ columns: ['Supplier', 'Confidence', 'Band'], numeric: [1], rows: list.map((s) => [s.name, `${s.confidence}%`, band(s.confidence ?? 0)]) }}>
            <HBarChart
              rows={list.map((s) => ({
                label: s.name,
                value: s.confidence ?? 0,
                valueLabel: `${s.confidence}%`,
                color: (s.confidence ?? 0) < RISK_RULES.confidenceMedium ? C.series1 : undefined,
                tip: `${s.name}: ${s.confidence}% · ${band(s.confidence ?? 0)}`,
              }))}
              max={100}
              refs={[
                { value: RISK_RULES.confidenceMedium, label: `Medium ${RISK_RULES.confidenceMedium}` },
                { value: RISK_RULES.confidenceHigh, label: `High ${RISK_RULES.confidenceHigh}` },
              ]}
              ariaLabel="Data confidence by supplier"
            />
          </ChartFigure>
        </Card>
        <Card
          title={`${weakest?.name ?? 'Verification'} holds confidence back most`}
          question="Average result of each check across suppliers · weight in brackets"
          footnote={`${pending} document${pending === 1 ? '' : 's'} waiting to be verified`}
          footerLink={{ to: '/reviews/evidence', label: 'Verify in Reviews' }}
        >
          <ChartFigure table={{ columns: ['Check', 'What it measures', 'Weight', 'Average'], numeric: [2, 3], rows: checks.map((c) => [c.name, c.detail, `${c.weight}%`, `${c.average}%`]) }}>
            <HBarChart
              rows={checks.map((c) => ({
                label: `${c.name} (${c.weight}%)`,
                value: c.average,
                valueLabel: `${c.average}%`,
                color: c.average < 70 ? C.series1 : undefined,
                tip: `${c.name} · ${c.detail}\nAverage ${c.average}% · weight ${c.weight}%`,
              }))}
              max={100}
              labelWidth={170}
              ariaLabel="Confidence checks"
            />
          </ChartFigure>
          <p className="form-field__hint">Confidence = {checks.map((c) => `${c.weight}% ${c.name.toLowerCase()}`).join(' + ')}.</p>
        </Card>
      </CardGrid>
    </>
  );
}
