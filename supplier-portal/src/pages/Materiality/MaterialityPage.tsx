import { Navigate, useParams } from 'react-router-dom';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RouteTabs } from '../../components/RouteTabs/RouteTabs';
import { Card, CardGrid } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Pill } from '../../components/Pill/Pill';
import { ChartFigure } from '../../components/charts/ChartFigure';
import { HBarChart } from '../../components/charts/HBarChart';
import { C } from '../../components/charts/chartKit';
import { isDoubleMaterial, isMaterial } from '../../components/charts/scales';
import { useToast } from '../../components/useToast';
import { useDrawers } from '../../features/drawers/DrawerContext';
import { MaterialityCard } from '../../features/insights/InsightCards';
import { usePortal } from '../../state/hooks';
import { AREAS } from '../../domain/constants';
import type { MaterialityTopicRecord, PortalData } from '../../domain/types';
import { formatDate } from '../../lib/format';
import './MaterialityPage.scss';

const TABS = ['matrix', 'topics', 'survey'] as const;

export default function MaterialityPage() {
  const { tab = 'matrix' } = useParams();
  const data = usePortal();
  const toast = useToast();
  const { openNewAssessment } = useDrawers();
  if (!(TABS as readonly string[]).includes(tab)) return <Navigate to="/materiality/matrix" replace />;

  return (
    <>
      <PageHeader
        title="Materiality"
        subtitle="Double materiality: impact on people and planet × financial importance to the business"
        actions={
          <>
            <Button onClick={() => toast.info('Matrix exported')}>Export matrix</Button>
            <Button variant="primary" icon={<PlusOutlined />} onClick={() => openNewAssessment({ type: 'Materiality' })}>
              New materiality assessment
            </Button>
          </>
        }
      />
      <RouteTabs
        base="/materiality"
        active={tab}
        tabs={[
          { key: 'matrix', label: 'Matrix' },
          { key: 'topics', label: 'Topics', count: data.topics.length },
          { key: 'survey', label: 'Stakeholder survey' },
        ]}
      />
      {tab === 'matrix' && <MatrixTab data={data} />}
      {tab === 'topics' && <TopicsTab data={data} />}
      {tab === 'survey' && <SurveyTab data={data} />}
    </>
  );
}

function TopicDot({ t }: { t: MaterialityTopicRecord }) {
  return (
    <span className={`topic-dot${isMaterial(t) ? ' is-material' : ''}`} aria-hidden="true">
      {t.n}
    </span>
  );
}

function MatrixTab({ data }: { data: PortalData }) {
  return (
    <div className="split-layout">
      <MaterialityCard data={data} large footerLink={false} />
      <Card title="Topics" question="Numbers match the dots">
        <ul className="topic-list">
          {data.topics.map((t) => (
            <li key={t.n}>
              <TopicDot t={t} />
              <span>{t.title}</span>
              {isDoubleMaterial(t) && <Pill tone="brand">Double</Pill>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function TopicsTab({ data }: { data: PortalData }) {
  const columns: TableColumnsType<MaterialityTopicRecord> = [
    { title: '#', key: 'n', width: 50, render: (_, t) => <TopicDot t={t} /> },
    { title: 'Topic', key: 't', render: (_, t) => <b>{t.title}</b> },
    { title: 'Impact', key: 'i', align: 'right', sorter: (a, b) => a.impact - b.impact, render: (_, t) => <span className="tabular">{t.impact.toFixed(1)}</span> },
    { title: 'Financial', key: 'f', align: 'right', sorter: (a, b) => a.financial - b.financial, render: (_, t) => <span className="tabular">{t.financial.toFixed(1)}</span> },
    {
      title: 'Result',
      key: 'r',
      render: (_, t) =>
        isDoubleMaterial(t) ? <Pill tone="brand">Double material</Pill> : isMaterial(t) ? <Pill tone="neutral">Material</Pill> : <span className="muted">Monitor</span>,
    },
    { title: 'Scoring area it drives', key: 'a', render: (_, t) => AREAS[t.areaIndex] },
    { title: 'Effect on Annual ESG', key: 'e', render: (_, t) => (isMaterial(t) ? 'Weight ×1.5; questions required' : 'Standard weight') },
  ];
  return (
    <>
      <Table<MaterialityTopicRecord> className="data-table" rowKey="n" size="middle" pagination={false} columns={columns} dataSource={data.topics} scroll={{ x: 900 }} />
      <p className="form-field__hint" style={{ marginTop: 10 }}>
        Weights are a proposal for the scoring engine; you confirm them in Questionnaires → Scoring rules before they apply.
      </p>
    </>
  );
}

function SurveyTab({ data }: { data: PortalData }) {
  const toast = useToast();
  const mat = data.assessments.find((a) => a.type === 'Materiality' && a.status === 'Active');
  const done = data.survey.reduce((s, g) => s + g.responded, 0);
  const total = data.survey.reduce((s, g) => s + g.invited, 0);
  const lagging = data.survey.filter((g) => g.responded / g.invited < 0.5);

  return (
    <CardGrid cols={2}>
      <Card
        title={`${done} of ${total} stakeholders have responded`}
        question={`${mat ? `${mat.title} · due ${formatDate(mat.dueDate)}` : 'No active survey'} · groups under 50% are highlighted`}
      >
        <ChartFigure table={{ columns: ['Group', 'Responded', 'Invited', 'Rate'], numeric: [1, 2], rows: data.survey.map((g) => [g.group, g.responded, g.invited, `${Math.round((g.responded / g.invited) * 100)}%`]) }}>
          <HBarChart
            rows={data.survey.map((g) => {
              const pct = Math.round((g.responded / g.invited) * 100);
              return { label: g.group, value: pct, valueLabel: `${g.responded}/${g.invited}`, color: pct < 50 ? C.series1 : undefined, tip: `${g.group}: ${g.responded} of ${g.invited} responded (${pct}%)` };
            })}
            max={100}
            labelWidth={160}
            ariaLabel="Response rate by stakeholder group"
          />
        </ChartFigure>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" onClick={() => toast.success(`Reminder sent to ${total - done} stakeholders who haven't responded`)}>
            Remind non-responders
          </Button>
          <Button size="sm" onClick={() => toast.info('Add stakeholders opens here')}>
            + Add stakeholders
          </Button>
        </div>
        {lagging.length > 0 && (
          <p className="form-field__hint" style={{ marginTop: 10 }}>
            Lagging: {lagging.map((g) => g.group).join(', ')}.
          </p>
        )}
      </Card>
      <Card title="How it works">
        <ol className="how-list">
          <li>Pick topics: the 7 scoring areas plus sector topics.</li>
          <li>Invite stakeholders: internal teams, selected suppliers, customers.</li>
          <li>Each rates every topic for impact and for financial importance, 1–5.</li>
          <li>The matrix updates as responses arrive.</li>
          <li>Material topics weigh more in Annual ESG scoring and export to BRSR.</li>
        </ol>
      </Card>
    </CardGrid>
  );
}
