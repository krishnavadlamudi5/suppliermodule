import { Link, Navigate, useParams } from 'react-router-dom';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RouteTabs } from '../../components/RouteTabs/RouteTabs';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Pill } from '../../components/Pill/Pill';
import { RiskBadge } from '../../components/Badges/Badges';
import { CellTitle, DocChip } from '../../components/blocks/Blocks';
import { MessageList } from '../../components/domain/DomainBits';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/useToast';
import { useConfirm } from '../../components/useConfirm';
import { FLAG_CAUSE_LABEL } from '../../domain/constants';
import { usePortal, usePortalActions } from '../../state/hooks';
import { activeAssignments, assessmentById, needs, riskOf, supplierById } from '../../domain/selectors';
import type { Assignment, Evidence, PortalData, RedFlag } from '../../domain/types';
import { formatDate } from '../../lib/format';

const TABS = ['responses', 'evidence', 'clarifications', 'flags'] as const;

export default function ReviewsPage() {
  const { tab = 'responses' } = useParams();
  const data = usePortal();
  if (!(TABS as readonly string[]).includes(tab)) return <Navigate to="/reviews/responses" replace />;
  const n = needs(data);

  return (
    <>
      <PageHeader title="Reviews" subtitle="Everything waiting on your team, in one inbox" />
      <RouteTabs
        base="/reviews"
        active={tab}
        tabs={[
          { key: 'responses', label: 'Responses', count: n.review },
          { key: 'evidence', label: 'Evidence', count: n.evidence },
          { key: 'clarifications', label: 'Clarifications', count: n.questions },
          { key: 'flags', label: 'Red flags', count: n.flags },
        ]}
      />
      {tab === 'responses' && <ResponsesTab data={data} />}
      {tab === 'evidence' && <EvidenceTab data={data} />}
      {tab === 'clarifications' && <ClarificationsTab data={data} />}
      {tab === 'flags' && <FlagsTab data={data} />}
    </>
  );
}

function ResponsesTab({ data }: { data: PortalData }) {
  const rows = activeAssignments(data)
    .filter((a) => a.status === 'submitted')
    .sort((a, b) => (a.submittedOn ?? '').localeCompare(b.submittedOn ?? ''));

  const columns: TableColumnsType<Assignment> = [
    {
      title: 'Supplier',
      key: 's',
      render: (_, x) => {
        const s = supplierById(data, x.supplierId);
        return <CellTitle to={`/suppliers/${x.supplierId}`} title={s?.name} sub={`Tier ${s?.tier}`} />;
      },
    },
    { title: 'Assessment', key: 'a', render: (_, x) => assessmentById(data, x.assessmentId)?.title },
    { title: 'Submitted', key: 'd', render: (_, x) => formatDate(x.submittedOn) },
    { title: 'Score', key: 'sc', align: 'right', render: (_, x) => <span className="tabular">{supplierById(data, x.supplierId)?.score ?? '—'}</span> },
    { title: 'Risk', key: 'r', render: (_, x) => <RiskBadge level={riskOf(data, supplierById(data, x.supplierId)!)} /> },
    {
      title: 'Waiting on',
      key: 'w',
      render: (_, x) => {
        const docs = data.evidence.filter((e) => e.supplierId === x.supplierId && e.assessmentId === x.assessmentId && e.status === 'Pending').length;
        return docs ? `${docs} document${docs > 1 ? 's' : ''} to verify` : 'Your review';
      },
    },
    {
      title: <span className="sr-only">Actions</span>,
      key: 'go',
      align: 'right',
      render: (_, x) => (
        <Link to={`/response/${x.assessmentId}/${x.supplierId}`}>
          <Button size="sm" variant="primary">
            Review
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <Table<Assignment>
      className="data-table"
      rowKey={(x) => `${x.assessmentId}|${x.supplierId}`}
      size="middle"
      pagination={false}
      columns={columns}
      dataSource={rows}
      locale={{ emptyText: <EmptyState>Nothing waiting for review.</EmptyState> }}
      scroll={{ x: 900 }}
    />
  );
}

function EvidenceTab({ data }: { data: PortalData }) {
  const { setEvidenceStatus } = usePortalActions();
  const toast = useToast();
  const rows = data.evidence.filter((e) => e.status === 'Pending');

  const confirm = useConfirm();
  const decide = async (e: Evidence, status: 'Accepted' | 'Rejected') => {
    if (
      status === 'Rejected' &&
      !(await confirm({
        title: `Reject ${e.fileName}?`,
        content: `${supplierById(data, e.supplierId)?.name} will need to upload a new document for “${e.question}”.`,
        okText: 'Reject document',
        danger: true,
      }))
    )
      return;
    await setEvidenceStatus(e.id, status);
    toast.success(`${e.fileName} ${status.toLowerCase()}`);
  };

  const columns: TableColumnsType<Evidence> = [
    { title: 'Document', key: 'f', render: (_, e) => <DocChip name={e.fileName} /> },
    { title: 'Supplier', key: 's', render: (_, e) => <CellTitle to={`/suppliers/${e.supplierId}`} title={supplierById(data, e.supplierId)?.name} /> },
    { title: 'Supports the answer to', key: 'q', render: (_, e) => <CellTitle title={<span style={{ fontWeight: 500 }}>{e.question}</span>} sub={assessmentById(data, e.assessmentId)?.title} /> },
    { title: 'Uploaded', key: 'd', render: (_, e) => formatDate(e.uploadedOn) },
    {
      title: <span className="sr-only">Actions</span>,
      key: 'act',
      align: 'right',
      render: (_, e) => (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
          <Button size="sm" variant="accept" onClick={() => decide(e, 'Accepted')}>
            Accept
          </Button>
          <Button size="sm" variant="reject" onClick={() => decide(e, 'Rejected')}>
            Reject
          </Button>
          <Link to={`/response/${e.assessmentId}/${e.supplierId}`} style={{ marginLeft: 6 }}>
            In context
          </Link>
        </span>
      ),
    },
  ];

  return (
    <>
      <Table<Evidence>
        className="data-table"
        rowKey="id"
        size="middle"
        pagination={false}
        columns={columns}
        dataSource={rows}
        locale={{ emptyText: <EmptyState>No documents to verify.</EmptyState> }}
        scroll={{ x: 900 }}
      />
      <p className="form-field__hint" style={{ marginTop: 10 }}>
        Accept only if the document is valid, legible, in the supplier's name, in date, and supports the answer. Accepted documents raise data confidence.
      </p>
    </>
  );
}

function ClarificationsTab({ data }: { data: PortalData }) {
  // Supplier-waiting threads first
  const threads = [...data.threads].sort((a, b) => Number(b.messages.at(-1)?.from === 'supplier') - Number(a.messages.at(-1)?.from === 'supplier'));
  if (!threads.length) return <Card><EmptyState>No questions yet.</EmptyState></Card>;
  return (
    <div className="stack">
      {threads.map((t) => {
        const q = data.questions.find((x) => x.code === t.questionCode);
        const waiting = t.messages.at(-1)?.from === 'supplier';
        return (
          <Card
            key={`${t.assessmentId}|${t.supplierId}|${t.questionCode}`}
            title={
              <>
                {supplierById(data, t.supplierId)?.name} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>on “{q?.text ?? t.questionCode}”</span>
              </>
            }
            extra={<Pill tone={waiting ? 'brand' : 'neutral'}>{waiting ? 'Awaiting your reply' : 'Awaiting supplier'}</Pill>}
            footerLink={{ to: `/response/${t.assessmentId}/${t.supplierId}#q-${t.questionCode}`, label: 'Reply in the response' }}
          >
            <div style={{ marginTop: 10 }}>
              <MessageList messages={t.messages} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function FlagsTab({ data }: { data: PortalData }) {
  const { raiseAction } = usePortalActions();
  const toast = useToast();
  const rows = data.flags.filter((f) => f.status !== 'Closed').sort((a, b) => Number(b.status === 'Open') - Number(a.status === 'Open'));

  const columns: TableColumnsType<RedFlag> = [
    {
      title: 'Red flag',
      key: 't',
      render: (_, f) => (
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline' }}>
          <RiskBadge level="High" />
          <span>{f.text}</span>
        </span>
      ),
    },
    { title: 'Supplier', key: 's', render: (_, f) => <CellTitle to={`/suppliers/${f.supplierId}`} title={supplierById(data, f.supplierId)?.name} /> },
    { title: 'Finding type', key: 'cause', render: (_, f) => FLAG_CAUSE_LABEL[f.cause] },
    { title: 'Assessment', key: 'a', render: (_, f) => assessmentById(data, f.assessmentId)?.title },
    { title: 'Status', key: 'st', render: (_, f) => <Pill tone={f.status === 'Open' ? 'error' : 'neutral'}>{f.status}</Pill> },
    {
      title: <span className="sr-only">Actions</span>,
      key: 'act',
      align: 'right',
      render: (_, f) =>
        f.status === 'Open' ? (
          <Button
            size="sm"
            variant="primary"
            onClick={async () => {
              await raiseAction(f.id);
              toast.success('Improvement action raised');
            }}
          >
            Raise action
          </Button>
        ) : (
          <Link to="/actions">View action</Link>
        ),
    },
  ];

  return (
    <Table<RedFlag>
      className="data-table"
      rowKey="id"
      size="middle"
      pagination={false}
      columns={columns}
      dataSource={rows}
      locale={{ emptyText: <EmptyState>No open red flags.</EmptyState> }}
      scroll={{ x: 1000 }}
    />
  );
}
