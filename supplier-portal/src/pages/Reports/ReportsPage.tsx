import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Card, CardGrid } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { ProgressBar } from '../../components/blocks/Blocks';
import { useToast } from '../../components/useToast';
import { usePortal } from '../../state/hooks';
import { color } from '../../theme/tokens';

export default function ReportsPage() {
  const data = usePortal();
  const toast = useToast();
  return (
    <>
      <PageHeader title="Reports & exports" subtitle="Framework mappings live here, not on the dashboards" />
      <CardGrid cols={2}>
        {data.reports.map((r) => (
          <Card key={r.id} title={r.title} question={r.description}>
            {r.coverage != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar height={8} segments={[{ pct: r.coverage, color: color('chart-series-1') }]} label={`${r.coverage}% of fields covered`} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.coverage}% of fields covered</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="primary" onClick={() => toast.info(`${r.title}: export started`)}>
                Export
              </Button>
              {r.coverage != null && (
                <Button size="sm" onClick={() => toast.info('Field mapping opens here')}>
                  View field mapping
                </Button>
              )}
            </div>
          </Card>
        ))}
      </CardGrid>
    </>
  );
}
