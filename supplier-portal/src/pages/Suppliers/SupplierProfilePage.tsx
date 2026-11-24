import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RouteTabs } from '../../components/RouteTabs/RouteTabs';
import { Card, CardGrid } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { RiskBadge, TierBadge } from '../../components/Badges/Badges';
import { CellTitle, DocChip, KeyValue, ListRow, StatTile, Timeline } from '../../components/blocks/Blocks';
import { AssignmentStatusPill, MaturityPill, MessageList } from '../../components/domain/DomainBits';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { HBarChart } from '../../components/charts/HBarChart';
import { ChartFigure } from '../../components/charts/ChartFigure';
import { C } from '../../components/charts/chartKit';
import { Pill } from '../../components/Pill/Pill';
import { useToast } from '../../components/useToast';
import { useDrawers } from '../../features/drawers/DrawerContext';
import { EditSupplierModal } from '../../features/suppliers/EditSupplierModal';
import { usePortal, usePortalActions } from '../../state/hooks';
import { AREAS, ASSIGNMENT_LABEL, RISK_RULES } from '../../domain/constants';
import {
  areaAverages,
  assessmentById,
  assignmentsOfSupplier,
  isSubmitted,
  riskOf,
  strongestAndWeakestArea,
  supplierById,
} from '../../domain/selectors';
import type { Assignment, PortalData, Supplier } from '../../domain/types';
import { formatDate, formatInr, initials } from '../../lib/format';
import { color } from '../../theme/tokens';
import './SupplierProfile.scss';

const TABS = ['overview', 'assessments', 'evidence', 'flags', 'qa', 'activity'] as const;
type Tab = (typeof TABS)[number];

export default function SupplierProfilePage() {
  const { supplierId = '', tab: rawTab } = useParams();
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? '') ? (rawTab as Tab) : 'overview';
  const data = usePortal();
  const navigate = useNavigate();
  const toast = useToast();
  const { openNewAssessment } = useDrawers();
  const s = supplierById(data, supplierId);
  const [editing, setEditing] = useState(false);

  if (!s) {
    return (
      <>
        <PageHeader title="Supplier not found" crumbs={[{ label: 'Suppliers', to: '/suppliers' }, { label: supplierId }]} />
        <Card>
          <EmptyState action={<Link to="/suppliers">Back to suppliers</Link>}>There's no supplier with ID {supplierId}.</EmptyState>
        </Card>
      </>
    );
  }

  const assigns = assignmentsOfSupplier(data, s.id);
  const flags = data.flags.filter((f) => f.supplierId === s.id);
  const actions = data.actions.filter((a) => a.supplierId === s.id);
  const threads = data.threads.filter((t) => t.supplierId === s.id);
  const base = `/suppliers/${s.id}`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Suppliers', to: '/suppliers' }, { label: s.name }]}
        title={
          <span className="supplier-head">
            <span className="supplier-head__avatar" aria-hidden="true">
              {initials(s.name)}
            </span>
            <span>
              {s.name} <TierBadge tier={s.tier} />
              <span className="supplier-head__meta">
                {s.id} · {s.category} · {s.city} · spend {formatInr(s.spend)} · <RiskBadge level={riskOf(data, s)} />
              </span>
            </span>
          </span>
        }
        actions={
          <>
            <Button onClick={() => setEditing(true)}>Edit</Button>
            <Button
              onClick={() => {
                navigate(`${base}/qa`);
                toast.info('Open a response and use “Ask supplier” on the answer you have a question about');
              }}
            >
              Ask a question
            </Button>
            <Button variant="primary" onClick={() => openNewAssessment({ supplierIds: [s.id], tier: s.tier })}>
              Add to assessment
            </Button>
          </>
        }
      />
      <RouteTabs
        base={base}
        active={tab}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'assessments', label: 'Assessments', count: assigns.length },
          { key: 'evidence', label: 'Answers & evidence' },
          { key: 'flags', label: 'Red flags & actions', count: flags.length + actions.length },
          { key: 'qa', label: 'Q&A', count: threads.length },
          { key: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'overview' && <Overview data={data} s={s} />}
      {tab === 'assessments' && <AssessmentsTab data={data} s={s} assigns={assigns} />}
      {tab === 'evidence' && <EvidenceTab data={data} s={s} assigns={assigns} />}
      {tab === 'flags' && <FlagsTab data={data} s={s} />}
      {tab === 'qa' && <QaTab data={data} s={s} />}
      {tab === 'activity' && <ActivityTab data={data} s={s} assigns={assigns} />}
      <EditSupplierModal key={editing ? 'open' : 'closed'} supplier={s} open={editing} onClose={() => setEditing(false)} />
    </>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ data, s }: { data: PortalData; s: Supplier }) {
  const tierAvg = areaAverages(data.suppliers.filter((x) => x.tier === s.tier && x.score != null));
  const sw = strongestAndWeakestArea(s);
  const flags = data.flags.filter((f) => f.supplierId === s.id);
  const yoy = s.score != null && s.previousScore != null ? s.score - s.previousScore : null;
  const conf = s.confidence;

  return (
    <>
      <div className="stat-row">
        <StatTile
          label="Basic compliance"
          value={s.compliance != null ? `${s.compliance}%` : '—'}
          bar={{ pct: s.compliance ?? 0, color: (s.compliance ?? 0) < 100 ? color('status-warning-accent') : color('chart-series-1') }}
          note="Permits and red-flag checks passed"
        />
        <StatTile label="ESG performance" value={s.score ?? '—'} suffix=" /100">
          <div style={{ marginTop: 6 }}>
            <MaturityPill score={s.score} />
          </div>
        </StatTile>
        <StatTile
          label="Year on year"
          value={yoy == null ? '—' : `${yoy >= 0 ? '+' : '−'}${Math.abs(yoy)}`}
          note={s.previousScore != null ? `2025 score ${s.previousScore}` : 'Baseline year'}
        />
        <StatTile
          label="Data confidence"
          value={conf != null ? `${conf}%` : '—'}
          bar={{ pct: conf ?? 0, color: color('chart-series-1') }}
          note={
            conf == null
              ? 'No evidence yet'
              : conf < RISK_RULES.confidenceMedium
                ? 'Low · scores lean on unverified claims'
                : conf < RISK_RULES.confidenceHigh
                  ? 'Medium'
                  : 'High'
          }
        />
      </div>

      <CardGrid cols={2}>
        <Card
          title={sw ? `Strongest in ${AREAS[sw.strongest]}, weakest in ${AREAS[sw.weakest]}` : 'No scored annual assessment yet'}
          question={`Score by area · black tick = Tier ${s.tier} average`}
        >
          {s.areaScores ? (
            <ChartFigure
              table={{
                columns: ['Area', 'Score', `Tier ${s.tier} average`],
                numeric: [1, 2],
                rows: AREAS.map((a, i) => [a, s.areaScores?.[i] ?? 'n/a', tierAvg[i] != null ? Math.round(tierAvg[i] as number) : '—']),
              }}
            >
              <HBarChart
                rows={AREAS.map((a, i) => {
                  const v = s.areaScores?.[i] ?? null;
                  return {
                    label: a,
                    value: v ?? 0,
                    valueLabel: v ?? 'n/a',
                    color: v == null ? C.inactive : C.series1,
                    mark: v == null ? null : tierAvg[i],
                    tip: `${a}: ${v ?? 'not scored'}`,
                  };
                })}
                max={100}
                labelWidth={180}
                markLabel={`Tier ${s.tier} average`}
                ariaLabel="Score by area"
              />
            </ChartFigure>
          ) : (
            <EmptyState>Scores appear after the first Annual ESG Assessment is submitted.</EmptyState>
          )}
        </Card>

        <Card title="Red flags and compliance" question="A check passes only with accepted evidence">
          {flags.length ? (
            flags.map((f) => (
              <ListRow
                key={f.id}
                icon={<RiskBadge level="High" />}
                title={f.text}
                meta={`${f.cause} · ${assessmentById(data, f.assessmentId)?.title ?? ''} · ${f.status}`}
              />
            ))
          ) : (
            <EmptyState>No red flags.</EmptyState>
          )}
          <div style={{ marginTop: 14 }}>
            <KeyValue
              items={[
                ['Contact', `${s.contact} · ${s.email}`],
                ['Facility', s.facility],
                ['Products / services', s.category],
                ['Added', formatDate(s.addedOn)],
              ]}
            />
          </div>
        </Card>
      </CardGrid>
    </>
  );
}

/* ---------------- Assessments ---------------- */

function AssessmentsTab({ data, s, assigns }: { data: PortalData; s: Supplier; assigns: Assignment[] }) {
  const { invite } = usePortalActions();
  const toast = useToast();

  const columns: TableColumnsType<Assignment> = [
    {
      title: 'Assessment',
      key: 'a',
      render: (_, x) => {
        const a = assessmentById(data, x.assessmentId);
        return <CellTitle to={`/assessments/detail/${x.assessmentId}`} title={a?.title} sub={a?.type} />;
      },
    },
    { title: 'Period', key: 'p', render: (_, x) => assessmentById(data, x.assessmentId)?.period },
    { title: 'Status', key: 's', render: (_, x) => <AssignmentStatusPill a={x} asOf={data.asOf} /> },
    { title: 'Due', key: 'd', render: (_, x) => formatDate(x.dueDate) },
    {
      title: 'Answered',
      key: 'n',
      align: 'right',
      render: (_, x) => (
        <span className="tabular">
          {x.answered}/{assessmentById(data, x.assessmentId)?.questionCount}
        </span>
      ),
    },
    {
      title: <span className="sr-only">Actions</span>,
      key: 'act',
      align: 'right',
      render: (_, x) =>
        isSubmitted(x) ? (
          <Link to={`/response/${x.assessmentId}/${s.id}`}>Open response</Link>
        ) : x.status === 'not_invited' ? (
          <Button
            size="sm"
            variant="primary"
            onClick={async () => {
              await invite([{ assessmentId: x.assessmentId, supplierId: s.id }]);
              toast.success(`${s.name} invited`);
            }}
          >
            Invite
          </Button>
        ) : null,
    },
  ];

  return (
    <Table<Assignment>
      className="data-table"
      rowKey={(x) => x.assessmentId}
      size="middle"
      pagination={false}
      columns={columns}
      dataSource={assigns}
      locale={{ emptyText: <EmptyState>Not in any assessment yet.</EmptyState> }}
    />
  );
}

/* ---------------- Evidence ---------------- */

function EvidenceTab({ data, s, assigns }: { data: PortalData; s: Supplier; assigns: Assignment[] }) {
  const ev = data.evidence.filter((e) => e.supplierId === s.id);
  const latest = assigns.filter(isSubmitted).sort((a, b) => (b.submittedOn ?? '').localeCompare(a.submittedOn ?? ''))[0];
  return (
    <Card
      title="Documents and answers"
      question="Evidence uploaded with each assessment. Review it on the response page, next to the answer it supports."
      extra={
        latest && (
          <Link to={`/response/${latest.assessmentId}/${s.id}`}>
            <Button size="sm">Open latest response →</Button>
          </Link>
        )
      }
    >
      {ev.length ? (
        ev.map((e) => (
          <ListRow
            key={e.id}
            icon={<DocChip name={e.fileName} />}
            title={e.question}
            meta={
              <>
                {assessmentById(data, e.assessmentId)?.title} · uploaded {formatDate(e.uploadedOn)} ·{' '}
                <Pill tone={e.status === 'Pending' ? 'warning' : e.status === 'Accepted' ? 'success' : 'error'}>{e.status}</Pill>
              </>
            }
            action={<Link to={`/response/${e.assessmentId}/${s.id}`}>Review</Link>}
          />
        ))
      ) : (
        <EmptyState>No documents uploaded yet.</EmptyState>
      )}
    </Card>
  );
}

/* ---------------- Red flags & actions ---------------- */

function FlagsTab({ data, s }: { data: PortalData; s: Supplier }) {
  const { raiseAction } = usePortalActions();
  const toast = useToast();
  const flags = data.flags.filter((f) => f.supplierId === s.id);
  const actions = data.actions.filter((a) => a.supplierId === s.id);
  return (
    <CardGrid cols={2}>
      <Card title="Red flags" question="Each red flag links to its improvement action">
        {flags.length ? (
          flags.map((f) => (
            <ListRow
              key={f.id}
              icon={<RiskBadge level="High" />}
              title={f.text}
              meta={`${f.cause} · ${f.status}`}
              action={
                f.status === 'Open' && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await raiseAction(f.id);
                      toast.success('Improvement action raised');
                    }}
                  >
                    Raise action
                  </Button>
                )
              }
            />
          ))
        ) : (
          <EmptyState>No red flags.</EmptyState>
        )}
      </Card>
      <Card title="Improvement actions" question="Tracked into next year's score" footerLink={{ to: '/actions', label: 'Open the action board' }}>
        {actions.length ? (
          actions.map((a) => <ListRow key={a.id} title={a.title} meta={`${a.status} · due ${formatDate(a.dueDate)} · owner ${a.owner}`} />)
        ) : (
          <EmptyState>No actions.</EmptyState>
        )}
      </Card>
    </CardGrid>
  );
}

/* ---------------- Q&A ---------------- */

function QaTab({ data, s }: { data: PortalData; s: Supplier }) {
  const threads = data.threads.filter((t) => t.supplierId === s.id);
  return (
    <Card title="Questions and answers" question="Every thread with this supplier, on any answer">
      {threads.length ? (
        threads.map((t) => {
          const q = data.questions.find((x) => x.code === t.questionCode);
          return (
            <div key={`${t.assessmentId}|${t.questionCode}`} className="qa-thread">
              <div className="qa-thread__head">
                <b>{q?.text ?? t.questionCode}</b>
                <Link to={`/response/${t.assessmentId}/${s.id}`}>Open in response →</Link>
              </div>
              <MessageList messages={t.messages} />
            </div>
          );
        })
      ) : (
        <EmptyState>No questions yet. Ask one from any answer on the response page.</EmptyState>
      )}
    </Card>
  );
}

/* ---------------- Activity ---------------- */

function ActivityTab({ data, s, assigns }: { data: PortalData; s: Supplier; assigns: Assignment[] }) {
  const events: { at: string; title: string }[] = [{ at: s.addedOn, title: 'Supplier added' }];
  assigns.forEach((x) => {
    const a = assessmentById(data, x.assessmentId);
    if (x.submittedOn) events.push({ at: x.submittedOn, title: `Submitted · ${a?.title}` });
    if (x.status !== 'not_invited' && a?.startedOn) events.push({ at: a.startedOn, title: `Invited · ${a.title}` });
    if (x.status === 'reviewed' || x.status === 'reopened') events.push({ at: x.submittedOn ?? data.asOf, title: `${ASSIGNMENT_LABEL[x.status]} · ${a?.title}` });
  });
  data.flags.filter((f) => f.supplierId === s.id).forEach((f) => events.push({ at: f.raisedOn, title: `Red flag raised: ${f.text}` }));
  events.sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Card>
      <Timeline items={events.map((e) => ({ title: e.title, meta: formatDate(e.at) }))} />
    </Card>
  );
}
