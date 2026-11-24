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
import { AREAS, ASSIGNMENT_LABEL, RISK_RULES, FLAG_CAUSE_LABEL } from '../../domain/constants';
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
          { key: 'evidence', label: 'Evidence' },
          { key: 'flags', label: 'Findings & Actions', count: flags.length + actions.length },
          { key: 'qa', label: 'Clarifications', count: threads.length },
          { key: 'activity', label: 'Audit Trail' },
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
          label="Compliance rate"
          value={s.compliance != null ? `${s.compliance}%` : '—'}
          bar={{ pct: s.compliance ?? 0, color: (s.compliance ?? 0) < 100 ? color('status-warning-accent') : color('chart-series-1') }}
          note="Statutory and critical compliance checks passed"
        />
        <StatTile label="ESG performance score" value={s.score ?? '—'} suffix=" /100">
          <div style={{ marginTop: 6 }}>
            <MaturityPill score={s.score} />
          </div>
        </StatTile>
        <StatTile
          label="Change vs 2025"
          value={yoy == null ? '—' : `${yoy >= 0 ? '+' : '−'}${Math.abs(yoy)}`}
          note={s.previousScore != null ? `2025 baseline: ${s.previousScore}` : 'Baseline assessment year'}
        />
        <StatTile
          label="Data confidence"
          value={conf != null ? `${conf}%` : '—'}
          bar={{ pct: conf ?? 0, color: color('chart-series-1') }}
          note={
            conf == null
              ? 'No evidence yet'
              : conf < RISK_RULES.confidenceMedium
                ? 'Low · scores rely largely on unverified disclosures'
                : conf < RISK_RULES.confidenceHigh
                  ? 'Medium'
                  : 'High'
          }
        />
      </div>

      <CardGrid cols={2}>
        <Card
          title="Performance by Impact Area"
          question={sw ? `Strongest: ${AREAS[sw.strongest]}. Priority for improvement: ${AREAS[sw.weakest]}. Marker shows the Tier ${s.tier} average.` : 'No scored Annual ESG Assessment on record.'}
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
            <EmptyState>Impact-area scores are published once the first Annual ESG Assessment is submitted and reviewed.</EmptyState>
          )}
        </Card>

        <Card title="Compliance Status" question="A compliance check is passed only on verified evidence">
          {flags.length ? (
            flags.map((f) => (
              <ListRow
                key={f.id}
                icon={<RiskBadge level="High" />}
                title={f.text}
                meta={`${FLAG_CAUSE_LABEL[f.cause]} · ${assessmentById(data, f.assessmentId)?.title ?? ''} · ${f.status}`}
              />
            ))
          ) : (
            <EmptyState>No critical findings on record.</EmptyState>
          )}
          <div style={{ marginTop: 14 }}>
            <KeyValue
              items={[
                ['Contact', `${s.contact} · ${s.email}`],
                ['Facility', s.facility],
                ['Goods / services supplied', s.category],
                ['Onboarded to programme', formatDate(s.addedOn)],
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
      locale={{ emptyText: <EmptyState>Not yet enrolled in an assessment.</EmptyState> }}
    />
  );
}

/* ---------------- Evidence ---------------- */

function EvidenceTab({ data, s, assigns }: { data: PortalData; s: Supplier; assigns: Assignment[] }) {
  const ev = data.evidence.filter((e) => e.supplierId === s.id);
  const latest = assigns.filter(isSubmitted).sort((a, b) => (b.submittedOn ?? '').localeCompare(a.submittedOn ?? ''))[0];
  return (
    <Card
      title="Evidence Register"
      question="Supporting documentation submitted with each assessment. Verify each item against the disclosure it supports."
      extra={
        latest && (
          <Link to={`/response/${latest.assessmentId}/${s.id}`}>
            <Button size="sm">View latest submission →</Button>
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
        <EmptyState>No supporting evidence submitted yet.</EmptyState>
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
      <Card title="Critical Findings" question="Each finding is linked to its corrective action plan">
        {flags.length ? (
          flags.map((f) => (
            <ListRow
              key={f.id}
              icon={<RiskBadge level="High" />}
              title={f.text}
              meta={`${FLAG_CAUSE_LABEL[f.cause]} · ${f.status}`}
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
          <EmptyState>No critical findings on record.</EmptyState>
        )}
      </Card>
      <Card title="Corrective Actions" question="Progress is reflected in the next assessment cycle" footerLink={{ to: '/actions', label: 'View corrective actions' }}>
        {actions.length ? (
          actions.map((a) => <ListRow key={a.id} title={a.title} meta={`${a.status} · due ${formatDate(a.dueDate)} · owner ${a.owner}`} />)
        ) : (
          <EmptyState>No corrective actions on record.</EmptyState>
        )}
      </Card>
    </CardGrid>
  );
}

/* ---------------- Q&A ---------------- */

function QaTab({ data, s }: { data: PortalData; s: Supplier }) {
  const threads = data.threads.filter((t) => t.supplierId === s.id);
  return (
    <Card title="Clarification Log" question="All clarification requests exchanged with this supplier">
      {threads.length ? (
        threads.map((t) => {
          const q = data.questions.find((x) => x.code === t.questionCode);
          return (
            <div key={`${t.assessmentId}|${t.questionCode}`} className="qa-thread">
              <div className="qa-thread__head">
                <b>{q?.text ?? t.questionCode}</b>
                <Link to={`/response/${t.assessmentId}/${s.id}`}>View in submission →</Link>
              </div>
              <MessageList messages={t.messages} />
            </div>
          );
        })
      ) : (
        <EmptyState>No clarification requests on record. Raise one against any disclosure in the submission review.</EmptyState>
      )}
    </Card>
  );
}

/* ---------------- Activity ---------------- */

function ActivityTab({ data, s, assigns }: { data: PortalData; s: Supplier; assigns: Assignment[] }) {
  const events: { at: string; title: string }[] = [{ at: s.addedOn, title: 'Onboarded to supplier programme' }];
  assigns.forEach((x) => {
    const a = assessmentById(data, x.assessmentId);
    if (x.submittedOn) events.push({ at: x.submittedOn, title: `Submitted · ${a?.title}` });
    if (x.status !== 'not_invited' && a?.startedOn) events.push({ at: a.startedOn, title: `Invited · ${a.title}` });
    if (x.status === 'reviewed' || x.status === 'reopened') events.push({ at: x.submittedOn ?? data.asOf, title: `${ASSIGNMENT_LABEL[x.status]} · ${a?.title}` });
  });
  data.flags.filter((f) => f.supplierId === s.id).forEach((f) => events.push({ at: f.raisedOn, title: `Critical finding raised: ${f.text}` }));
  events.sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Card>
      <Timeline items={events.map((e) => ({ title: e.title, meta: formatDate(e.at) }))} />
    </Card>
  );
}
