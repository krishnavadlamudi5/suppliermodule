import { useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RouteTabs } from '../../components/RouteTabs/RouteTabs';
import { Card, CardGrid } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Pill } from '../../components/Pill/Pill';
import { CodeTag } from '../../components/Badges/Badges';
import { CellTitle, FilterBar, KeyValue } from '../../components/blocks/Blocks';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/useToast';
import { useDrawers } from '../../features/drawers/DrawerContext';
import { usePortal } from '../../state/hooks';
import { AREAS, MATURITY, RISK_RULES } from '../../domain/constants';
import type { AssessmentType, PortalData, Question } from '../../domain/types';
import { maturityRamp } from '../../theme/tokens';

const TABS = ['templates', 'bank', 'scoring'] as const;

export default function QuestionnairesPage() {
  const { tab = 'templates' } = useParams();
  const data = usePortal();
  if (!(TABS as readonly string[]).includes(tab)) return <Navigate to="/questionnaires/templates" replace />;
  return (
    <>
      <PageHeader title="Questionnaire Library" subtitle="Assessment templates, question bank and scoring methodology" />
      <RouteTabs
        base="/questionnaires"
        active={tab}
        tabs={[
          { key: 'templates', label: 'Templates' },
          { key: 'bank', label: 'Question Bank', count: data.questions.length },
          { key: 'scoring', label: 'Scoring Methodology' },
        ]}
      />
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'bank' && <BankTab data={data} />}
      {tab === 'scoring' && <ScoringTab />}
    </>
  );
}

const TEMPLATES: { type: AssessmentType; label?: string; scope: string; questions: number; description: string }[] = [
  { type: 'Onboarding', scope: 'Tier 1', questions: 10, description: 'Corporate profile, statutory permits and policies. Mandatory for all suppliers.' },
  { type: 'Onboarding', scope: 'Tier 2', questions: 5, description: 'Core statutory compliance checks. Mandatory for all suppliers.' },
  { type: 'Annual ESG', scope: 'Tier 1', questions: 50, description: 'Comprehensive assessment across all seven impact areas, including Scope 3 emissions.' },
  { type: 'Annual ESG', scope: 'Tier 2', questions: 25, description: 'Proportionate annual assessment across the core impact areas.' },
  { type: 'Materiality', scope: 'Stakeholders', questions: 12, description: 'Stakeholder rating of sustainability topics for impact and financial materiality.' },
  { type: 'Follow-up', label: 'Follow-up review', scope: 'Any', questions: 8, description: 'Targeted verification following a critical finding or corrective action.' },
  { type: 'Follow-up', label: 'Custom', scope: 'Any', questions: 0, description: 'Bespoke questionnaire assembled from the Question Bank.' },
];

function TemplatesTab() {
  const toast = useToast();
  const { openNewAssessment } = useDrawers();
  return (
    <CardGrid cols={3}>
      {TEMPLATES.map((t) => (
        <Card key={`${t.label ?? t.type}-${t.scope}`} title={t.label ?? t.type} extra={<Pill tone="neutral">{t.scope}</Pill>} question={t.description}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="muted" style={{ fontSize: 13 }}>
              {t.questions ? `${t.questions} questions` : 'No questions yet'}
            </span>
            <span style={{ flex: 1 }} />
            <Button size="sm" onClick={() => toast.notYet('The template editor')}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => openNewAssessment({ type: t.type, tier: t.scope === 'Tier 2' ? 2 : 1 })}
            >
              Use
            </Button>
          </div>
        </Card>
      ))}
    </CardGrid>
  );
}

function BankTab({ data }: { data: PortalData }) {
  const toast = useToast();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [section, setSection] = useState('all');
  const sections = [...new Set(data.questions.map((x) => x.section))];
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return data.questions.filter((x) => (section === 'all' || x.section === section) && (!n || `${x.code} ${x.text}`.toLowerCase().includes(n)));
  }, [data.questions, q, section]);

  const columns: TableColumnsType<Question> = [
    {
      title: 'Question',
      key: 'q',
      render: (_, x) => (
        <CellTitle
          title={<span style={{ fontWeight: 500 }}>{x.text}</span>}
          sub={
            <>
              <CodeTag code={x.code} /> · {x.template}
            </>
          }
        />
      ),
    },
    { title: 'Impact area', key: 'a', render: (_, x) => (x.areaIndex != null ? AREAS[x.areaIndex] : <span className="muted">Not scored</span>) },
    { title: 'Answer type', dataIndex: 'answerType' },
    { title: 'Evidence', key: 'e', render: (_, x) => (x.evidenceRequired ? 'Required' : '—') },
    { title: 'Critical compliance', key: 'r', render: (_, x) => (x.redFlag ? <span className="risk risk--high"><i aria-hidden="true" />Yes</span> : '—') },
    { title: 'Applicable tiers', key: 't', render: (_, x) => x.tiers.map((t) => `Tier ${t}`).join(', ') },
    {
      title: <span className="sr-only">Actions</span>,
      key: 'edit',
      align: 'right',
      render: () => (
        <Button size="sm" variant="ghost" onClick={() => toast.notYet('Editing questions')}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <Input prefix={<SearchOutlined aria-hidden="true" />} allowClear style={{ width: 280 }} placeholder="Search questions or IDs" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
        <Select
          value={section}
          onChange={setSection}
          style={{ minWidth: 180 }}
          aria-label="Section"
          options={[{ value: 'all', label: 'All sections' }, ...sections.map((s) => ({ value: s, label: s }))]}
        />
        <span className="filter-bar__end">
          <Button size="sm" variant="primary" icon={<PlusOutlined />} onClick={() => toast.notYet('Adding questions')}>
            Add Question
          </Button>
        </span>
      </FilterBar>
      <Table<Question>
        className="data-table"
        rowKey="code"
        size="middle"
        pagination={false}
        columns={columns}
        dataSource={rows}
        locale={{ emptyText: <EmptyState>No questions match the search criteria.</EmptyState> }}
        scroll={{ x: 1000 }}
      />
    </>
  );
}

function ScoringTab() {
  return (
    <CardGrid cols={2}>
      <Card title="ESG Maturity Levels" question="Derived from the ESG performance score">
        <table className="chart-figure__table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Score</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {MATURITY.map((m, i) => (
              <tr key={m.name}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: maturityRamp[i], marginRight: 8 }} />
                  <b>{m.name}</b>
                </td>
                <td className="tabular" style={{ whiteSpace: 'nowrap' }}>
                  {m.min}–{i < MATURITY.length - 1 ? MATURITY[i + 1].min - 1 : 100}
                </td>
                <td>{m.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Scoring Framework" question="Three outcome measures per supplier, plus a data confidence rating">
        <KeyValue
          plain
          items={[
            ['Impact-area score', 'Points achieved ÷ maximum available for the impact area × 100'],
            ['ESG performance score', 'Average of impact-area scores; material topics weighted 1.5×'],
            ['Compliance rate', 'Compliance checks passed ÷ applicable checks'],
            ['Year-on-year change', `Change vs the same type and tier last period (±${RISK_RULES.yoyBand} = improved / declined)`],
            ['Risk rating: High', `Any unresolved critical finding, or ESG performance below ${RISK_RULES.highBelow}`],
            ['Risk rating: Medium', `Compliance below 100%, or performance ${RISK_RULES.highBelow}–${RISK_RULES.mediumBelow - 1}`],
            ['Risk rating: Low', `Full compliance and performance ${RISK_RULES.mediumBelow}+`],
          ]}
        />
      </Card>
    </CardGrid>
  );
}
