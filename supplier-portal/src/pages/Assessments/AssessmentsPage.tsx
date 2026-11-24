import { Link, Navigate, useParams } from 'react-router-dom';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RouteTabs } from '../../components/RouteTabs/RouteTabs';
import { Button } from '../../components/Button/Button';
import { Pill } from '../../components/Pill/Pill';
import { CellTitle, ProgressBar } from '../../components/blocks/Blocks';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { Legend } from '../../components/charts/ChartFigure';
import { useDrawers } from '../../features/drawers/DrawerContext';
import { usePortal } from '../../state/hooks';
import { assessmentProgress, isOverdue } from '../../domain/selectors';
import type { Assessment, AssessmentStatus } from '../../domain/types';
import { TYPE_TONE, assessmentHref } from '../../features/assessments/helpers';
import { formatDate } from '../../lib/format';
import { color } from '../../theme/tokens';

const TAB_STATUS: Record<string, AssessmentStatus> = { active: 'Active', drafts: 'Draft', closed: 'Closed' };

export default function AssessmentsPage() {
  const { tab = 'active' } = useParams();
  const data = usePortal();
  const { openNewAssessment } = useDrawers();
  if (!TAB_STATUS[tab]) return <Navigate to="/assessments/active" replace />;

  const count = (st: AssessmentStatus) => data.assessments.filter((a) => a.status === st).length;
  const list = data.assessments.filter((a) => a.status === TAB_STATUS[tab]);

  const columns: TableColumnsType<Assessment> = [
    {
      title: 'Assessment',
      key: 'title',
      render: (_, a) => (
        <CellTitle
          to={assessmentHref(a)}
          title={a.title}
          sub={`${a.period}${a.tier ? ` · Tier ${a.tier}` : a.type === 'Materiality' ? ' · Stakeholders' : ''} · ${a.questionCount} questions`}
        />
      ),
    },
    { title: 'Type', key: 'type', render: (_, a) => <Pill tone={TYPE_TONE[a.type]}>{a.type}</Pill> },
    {
      title: 'Progress',
      key: 'progress',
      width: 260,
      render: (_, a) => {
        const p = assessmentProgress(data, a);
        if (!p.total) return <small className="muted">No suppliers yet</small>;
        const mat = a.type === 'Materiality';
        return (
          <div>
            <ProgressBar
              height={8}
              label={`${p.submitted} of ${p.total} ${mat ? 'responses' : 'submitted'}`}
              segments={[
                { pct: mat ? 0 : (p.reviewed / p.total) * 100, color: color('chart-series-1') },
                { pct: ((p.submitted - (mat ? 0 : p.reviewed)) / p.total) * 100, color: color('chart-series-2') },
              ]}
            />
            <small className="muted" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              {p.submitted} of {p.total} {mat ? 'responses' : 'submitted'}
              {!mat && p.reviewed ? ` · ${p.reviewed} reviewed` : ''}
              {p.notInvited ? <span style={{ color: 'var(--status-error-text)' }}> · {p.notInvited} not invited</span> : null}
            </small>
          </div>
        );
      },
    },
    {
      title: 'Due',
      key: 'due',
      render: (_, a) => (
        <span className="status-pills">
          {formatDate(a.dueDate)}
          {a.status === 'Active' && isOverdue(data.asOf, a.dueDate) && <Pill tone="error">Past due</Pill>}
        </span>
      ),
    },
    {
      title: 'Avg. ESG score',
      key: 'avg',
      align: 'right',
      render: (_, a) => {
        const v = assessmentProgress(data, a).averageScore;
        return <span className="tabular">{v != null ? Math.round(v) : '—'}</span>;
      },
    },
    { title: 'Critical findings', key: 'flags', align: 'right', render: (_, a) => <span className="tabular">{assessmentProgress(data, a).openFlags || '—'}</span> },
    { title: <span className="sr-only">Actions</span>, key: 'open', align: 'right', render: (_, a) => <Link to={assessmentHref(a)}>Open</Link> },
  ];

  return (
    <>
      <PageHeader
        title="ESG Assessments"
        subtitle="Onboarding due diligence, annual ESG assessments and materiality consultations across the supplier programme"
        actions={
          <Button variant="primary" icon={<PlusOutlined />} onClick={() => openNewAssessment()}>
            Launch Assessment
          </Button>
        }
      />
      <RouteTabs
        base="/assessments"
        active={tab}
        tabs={[
          { key: 'active', label: 'Active', count: count('Active') },
          { key: 'drafts', label: 'Drafts', count: count('Draft') },
          { key: 'closed', label: 'Closed', count: count('Closed') },
        ]}
      />
      <Legend
        items={[
          { label: 'Reviewed', color: color('chart-series-1') },
          { label: 'Submitted, under review', color: color('chart-series-2') },
        ]}
      />
      <Table<Assessment>
        className="data-table"
        rowKey="id"
        size="middle"
        pagination={false}
        columns={columns}
        dataSource={list}
        locale={{ emptyText: <EmptyState>No assessments in this category.</EmptyState> }}
        scroll={{ x: 900 }}
      />
    </>
  );
}
