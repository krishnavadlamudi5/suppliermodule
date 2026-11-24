import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RouteTabs } from '../../components/RouteTabs/RouteTabs';
import { Card, CardGrid } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Callout } from '../../components/Callout/Callout';
import { CellTitle, KeyValue, ProgressBar, Timeline } from '../../components/blocks/Blocks';
import { RiskBadge } from '../../components/Badges/Badges';
import { AssignmentStatusPill } from '../../components/domain/DomainBits';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ChartFigure, Legend } from '../../components/charts/ChartFigure';
import { HBarChart } from '../../components/charts/HBarChart';
import { C } from '../../components/charts/chartKit';
import { MATURITY_LEVELS } from '../../components/charts/scales';
import { useToast } from '../../components/useToast';
import { FunnelCard } from '../../features/insights/InsightCards';
import { AddSuppliersModal } from '../../features/assessments/AddSuppliersModal';
import { usePortal, usePortalActions } from '../../state/hooks';
import { AREAS } from '../../domain/constants';
import {
  addDays,
  areaAverages,
  assessmentById,
  assignmentsFor,
  average,
  funnelStages,
  isOverdue,
  isSubmitted,
  maturityIndex,
  openFlags,
  openItemCount,
  riskOf,
  supplierById,
} from '../../domain/selectors';
import type { Assessment, Assignment, PortalData } from '../../domain/types';
import { formatDate, formatDateShort } from '../../lib/format';
import { maturityRamp } from '../../theme/tokens';

const TABS = ['progress', 'suppliers', 'results', 'settings'] as const;
type Tab = (typeof TABS)[number];

export default function AssessmentDetailPage() {
  const { assessmentId = '', tab: rawTab } = useParams();
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? '') ? (rawTab as Tab) : 'progress';
  const data = usePortal();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const a = assessmentById(data, assessmentId);

  if (!a) {
    return (
      <>
        <PageHeader title="Assessment not found" crumbs={[{ label: 'Assessments', to: '/assessments' }, { label: assessmentId }]} />
        <Card>
          <EmptyState action={<Link to="/assessments">Back to assessments</Link>}>There's no assessment with ID {assessmentId}.</EmptyState>
        </Card>
      </>
    );
  }
  if (a.type === 'Materiality') return <Navigate to="/materiality/survey" replace />;

  const list = assignmentsFor(data, a.id);
  const base = `/assessments/detail/${a.id}`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Assessments', to: '/assessments' }, { label: a.title }]}
        title={a.title}
        subtitle={`${a.type} · ${a.period}${a.tier ? ` · Tier ${a.tier}` : ''} · due ${formatDate(a.dueDate)}`}
        actions={
          a.status === 'Active' && (
            <>
              <Button onClick={() => toast.success("Reminder sent to suppliers who haven't submitted")}>Send reminder now</Button>
              <Button variant="primary" icon={<PlusOutlined />} onClick={() => setAdding(true)}>
                Add suppliers
              </Button>
            </>
          )
        }
      />
      <RouteTabs
        base={base}
        active={tab}
        tabs={[
          { key: 'progress', label: 'Progress' },
          { key: 'suppliers', label: 'Suppliers', count: list.length },
          { key: 'results', label: 'Results' },
          { key: 'settings', label: 'Settings' },
        ]}
      />
      {tab === 'progress' && <ProgressTab data={data} a={a} list={list} />}
      {tab === 'suppliers' && <SuppliersTab data={data} a={a} list={list} onAdd={() => setAdding(true)} />}
      {tab === 'results' && <ResultsTab data={data} a={a} list={list} />}
      {tab === 'settings' && <SettingsTab data={data} a={a} />}
      <AddSuppliersModal assessment={a} open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

/* ---------------- Progress ---------------- */

function ProgressTab({ data, a, list }: { data: PortalData; a: Assessment; list: Assignment[] }) {
  const { inviteAllNotInvited } = usePortalActions();
  const toast = useToast();
  const notInvited = list.filter((x) => x.status === 'not_invited');
  const defaultDue = addDays(data.asOf, data.settings.onboardingDays);

  const dates: { title: React.ReactNode; meta: string }[] = [];
  if (a.startedOn) dates.push({ title: 'Started', meta: formatDate(a.startedOn) });
  if (a.dueDate) {
    data.settings.reminderDays.forEach((d) => {
      const at = addDays(a.dueDate as string, -d);
      dates.push({ title: `Reminder, ${d} day${d > 1 ? 's' : ''} before`, meta: `${formatDate(at)}${at < data.asOf ? ' · sent' : ''}` });
    });
    dates.push({ title: <b>Due</b>, meta: `${formatDate(a.dueDate)}${isOverdue(data.asOf, a.dueDate) ? ' · past due' : ''}` });
  }
  dates.push({ title: 'Escalation to admins', meta: `${data.settings.escalateAfterDays} days after the due date` });

  return (
    <CardGrid cols={2}>
      <FunnelCard stages={funnelStages(data, list)} single footerLink={false} />
      <div className="stack">
        {notInvited.length > 0 && (
          <Callout
            tone="error"
            title={`${notInvited.length} supplier${notInvited.length > 1 ? 's have' : ' has'} not been invited.`}
            action={
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  const n = await inviteAllNotInvited({ assessmentId: a.id });
                  toast.success(`${n} invitation${n === 1 ? '' : 's'} sent`);
                }}
              >
                Invite {notInvited.length}, due {formatDateShort(defaultDue)}
              </Button>
            }
          >
            {notInvited.map((x) => supplierById(data, x.supplierId)?.name).join(', ')} won't hear from you until you send the invite.
          </Callout>
        )}
        <Card title="Key dates" question="Reminders go out on these dates to suppliers who haven't submitted">
          <Timeline items={dates} />
        </Card>
      </div>
    </CardGrid>
  );
}

/* ---------------- Suppliers ---------------- */

function SuppliersTab({ data, a, list, onAdd }: { data: PortalData; a: Assessment; list: Assignment[]; onAdd: () => void }) {
  const { invite } = usePortalActions();
  const toast = useToast();

  const columns: TableColumnsType<Assignment> = [
    {
      title: 'Supplier',
      key: 's',
      render: (_, x) => {
        const s = supplierById(data, x.supplierId);
        return <CellTitle to={`/suppliers/${x.supplierId}`} title={s?.name} sub={`Tier ${s?.tier}`} />;
      },
    },
    { title: 'Status', key: 'st', render: (_, x) => <AssignmentStatusPill a={x} asOf={data.asOf} /> },
    { title: 'Due', key: 'due', render: (_, x) => formatDate(x.dueDate) },
    {
      title: 'Progress',
      key: 'p',
      width: 150,
      render: (_, x) => (
        <div>
          <ProgressBar segments={[{ pct: (x.answered / a.questionCount) * 100, color: C.series1 }]} label={`${x.answered} of ${a.questionCount} answered`} />
          <small className="muted" style={{ fontSize: 12 }}>
            {x.answered}/{a.questionCount} answered
          </small>
        </div>
      ),
    },
    {
      title: 'Score',
      key: 'sc',
      align: 'right',
      render: (_, x) => <span className="tabular">{a.type === 'Annual ESG' && (x.status === 'submitted' || x.status === 'reviewed') ? supplierById(data, x.supplierId)?.score ?? '—' : '—'}</span>,
    },
    { title: 'Risk', key: 'r', render: (_, x) => <RiskBadge level={riskOf(data, supplierById(data, x.supplierId)!)} /> },
    { title: 'Open items', key: 'o', align: 'right', render: (_, x) => <span className="tabular">{openItemCount(data, x.supplierId) || '—'}</span> },
    {
      title: <span className="sr-only">Actions</span>,
      key: 'act',
      align: 'right',
      render: (_, x) => {
        const name = supplierById(data, x.supplierId)?.name;
        if (x.status === 'not_invited')
          return (
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                await invite([{ assessmentId: a.id, supplierId: x.supplierId }]);
                toast.success(`Invitation sent to ${name}`);
              }}
            >
              Invite
            </Button>
          );
        if (isSubmitted(x))
          return (
            <Link to={`/response/${a.id}/${x.supplierId}`}>
              <Button size="sm" variant={x.status === 'submitted' ? 'primary' : 'secondary'}>
                {x.status === 'submitted' ? 'Review' : 'Open'}
              </Button>
            </Link>
          );
        return (
          <Button size="sm" onClick={() => toast.success(`Reminder sent to ${name}`)}>
            Remind
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <div className="filter-bar">
        <span className="filter-bar__label">
          {list.length} supplier{list.length === 1 ? '' : 's'} in this assessment
        </span>
        {a.status === 'Active' && (
          <span className="filter-bar__end">
            <Button size="sm" icon={<PlusOutlined />} onClick={onAdd}>
              Add suppliers
            </Button>
          </span>
        )}
      </div>
      <Table<Assignment>
        className="data-table"
        rowKey="supplierId"
        size="middle"
        pagination={false}
        columns={columns}
        dataSource={list}
        locale={{ emptyText: <EmptyState>No suppliers in this assessment yet.</EmptyState> }}
        scroll={{ x: 900 }}
      />
    </>
  );
}

/* ---------------- Results ---------------- */

function ResultsTab({ data, a, list }: { data: PortalData; a: Assessment; list: Assignment[] }) {
  if (a.type !== 'Annual ESG') {
    const flagged = new Set(data.flags.filter((f) => f.assessmentId === a.id).map((f) => f.supplierId)).size;
    const rows = [
      { l: 'Passed all checks', v: list.filter((x) => x.status === 'reviewed' && !openFlags(data, x.supplierId).length).length, c: C.series1 },
      { l: 'Red flag raised', v: flagged, c: undefined },
      { l: 'Not submitted yet', v: list.filter((x) => !isSubmitted(x)).length, c: undefined },
    ];
    return (
      <Card title="Onboarding checks" question="Onboarding is pass/fail on compliance; it isn't scored for maturity.">
        <ChartFigure table={{ columns: ['Outcome', 'Suppliers'], numeric: [1], rows: rows.map((r) => [r.l, r.v]) }}>
          <HBarChart rows={rows.map((r) => ({ label: r.l, value: r.v, color: r.c }))} ariaLabel="Onboarding outcomes" />
        </ChartFigure>
      </Card>
    );
  }

  const scored = list
    .filter((x) => x.status === 'submitted' || x.status === 'reviewed')
    .map((x) => supplierById(data, x.supplierId)!)
    .filter((s) => s.score != null)
    .sort((p, q) => (q.score ?? 0) - (p.score ?? 0));
  if (!scored.length) return <Card><EmptyState>Results appear once suppliers submit.</EmptyState></Card>;
  const avg = Math.round(average(scored.map((s) => s.score)) ?? 0);
  const areas = areaAverages(scored);

  return (
    <CardGrid cols={2}>
      <Card title={`Average score ${avg} across ${scored.length} supplier${scored.length === 1 ? '' : 's'}`} question="Score by supplier, highest first · colored by maturity level">
        <Legend items={MATURITY_LEVELS.map((l, i) => ({ label: l, color: maturityRamp[i] }))} />
        <ChartFigure table={{ columns: ['Supplier', 'Score', 'Maturity'], numeric: [1], rows: scored.map((s) => [s.name, s.score, MATURITY_LEVELS[maturityIndex(s.score) ?? 0]]) }}>
          <HBarChart
            rows={scored.map((s) => ({
              label: s.name,
              value: s.score ?? 0,
              color: maturityRamp[maturityIndex(s.score) ?? 0],
              tip: `${s.name}: ${s.score} · ${MATURITY_LEVELS[maturityIndex(s.score) ?? 0]}`,
            }))}
            max={100}
            ariaLabel="Score by supplier"
          />
        </ChartFigure>
      </Card>
      <Card title="Average by area" question="Where this group is strong and weak">
        <ChartFigure
          table={{ columns: ['Area', 'Average'], numeric: [1], rows: AREAS.map((l, i) => [l, areas[i] == null ? 'n/a' : Math.round(areas[i] as number)]) }}
        >
          <HBarChart
            rows={AREAS.map((l, i) => ({ label: l, value: Math.round(areas[i] ?? 0), valueLabel: areas[i] == null ? 'n/a' : Math.round(areas[i] as number) }))}
            max={100}
            labelWidth={180}
            ariaLabel="Average by area"
          />
        </ChartFigure>
      </Card>
    </CardGrid>
  );
}

/* ---------------- Settings ---------------- */

function SettingsTab({ data, a }: { data: PortalData; a: Assessment }) {
  const toast = useToast();
  return (
    <CardGrid cols={2}>
      <Card title="Questions" question={`${a.questionCount} questions from the ${a.type} template${a.tier ? ` for Tier ${a.tier}` : ''}`}>
        <KeyValue
          items={[
            ['Required', 'All red-flag and evidence questions'],
            ['Questionnaire', <Link key="q" to="/questionnaires/bank">View in question bank</Link>],
            ['Compared with', `${a.type}${a.tier ? ` · Tier ${a.tier}` : ''} · previous period (automatic)`],
          ]}
        />
      </Card>
      <Card title="Reminders and message" question="Applies to every supplier in this assessment">
        <KeyValue
          items={[
            ['Reminders', `${data.settings.reminderDays.join(', ')} days before the due date`],
            ['Escalation', `${data.settings.escalateAfterDays} days overdue → client admins`],
            ['Message', <span key="m" style={{ fontWeight: 400 }}>Please complete this assessment by the due date. Use the question icon on any answer if something is unclear.</span>],
          ]}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Button size="sm" onClick={() => toast.info('Export started')}>
            Export responses
          </Button>
          {a.status === 'Active' && (
            <Button size="sm" variant="danger" onClick={() => toast.info('Closing an assessment asks for confirmation here')}>
              Close assessment
            </Button>
          )}
        </div>
      </Card>
    </CardGrid>
  );
}
