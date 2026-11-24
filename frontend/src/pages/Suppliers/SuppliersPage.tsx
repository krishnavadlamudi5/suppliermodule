import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dropdown, Input, Segmented, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Button } from '../../components/Button/Button';
import { Callout } from '../../components/Callout/Callout';
import { CellTitle, FilterBar } from '../../components/blocks/Blocks';
import { RiskBadge, TierBadge } from '../../components/Badges/Badges';
import { AssignmentStatusPill, MaturityPill } from '../../components/domain/DomainBits';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useToast } from '../../components/useToast';
import { useDrawers } from '../../features/drawers/DrawerContext';
import { usePortal, usePortalActions } from '../../state/hooks';
import { onboardingAssignment, openItemCount, riskOf } from '@shared/domain/selectors';
import type { RiskLevel } from '@shared/domain/selectors';
import type { Supplier, Tier } from '@shared/domain/types';
import { formatInr } from '../../lib/format';

type RiskFilter = 'all' | RiskLevel | 'none';

export default function SuppliersPage() {
  const data = usePortal();
  const { inviteAllNotInvited } = usePortalActions();
  const { openAddSupplier, openNewAssessment } = useDrawers();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const tier: 'all' | Tier = params.get('tier') === '1' ? 1 : params.get('tier') === '2' ? 2 : 'all';
  const risk = (params.get('risk') ?? 'all') as RiskFilter;
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.suppliers.filter(
      (s) =>
        (tier === 'all' || s.tier === tier) &&
        (risk === 'all' || (riskOf(data, s) ?? 'none') === risk) &&
        (!needle || `${s.name} ${s.category} ${s.city} ${s.id}`.toLowerCase().includes(needle)),
    );
  }, [data, q, tier, risk]);

  const neverInvited = data.suppliers.filter((s) => onboardingAssignment(data, s.id)?.status === 'not_invited');
  const t1 = data.suppliers.filter((s) => s.tier === 1).length;

  const inviteNeverInvited = async () => {
    const n = await inviteAllNotInvited({ supplierIds: neverInvited.map((s) => s.id) });
    toast.success(`${n} supplier${n === 1 ? '' : 's'} invited`);
  };

  const inviteSelected = async () => {
    const n = await inviteAllNotInvited({ supplierIds: selected });
    setSelected([]);
    toast.success(n ? `${n} supplier${n === 1 ? '' : 's'} invited` : 'Everyone selected is already invited');
  };

  const addSelectedToAssessment = () => {
    const tiers = new Set(selected.map((id) => data.suppliers.find((s) => s.id === id)?.tier));
    openNewAssessment({ supplierIds: selected, tier: tiers.size === 1 ? ([...tiers][0] as Tier) : 1 });
  };

  const columns: TableColumnsType<Supplier> = [
    {
      title: 'Supplier',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, s) => <CellTitle to={`/suppliers/${s.id}`} title={s.name} sub={`${s.category} · ${s.city}`} />,
    },
    { title: 'Tier', key: 'tier', render: (_, s) => <TierBadge tier={s.tier} />, sorter: (a, b) => a.tier - b.tier },
    {
      title: 'Annual spend',
      key: 'spend',
      align: 'right',
      sorter: (a, b) => a.spend - b.spend,
      defaultSortOrder: 'descend',
      render: (_, s) => <span className="tabular">{formatInr(s.spend)}</span>,
    },
    {
      title: 'Onboarding status',
      key: 'onb',
      render: (_, s) => {
        const o = onboardingAssignment(data, s.id);
        return o ? <AssignmentStatusPill a={o} asOf={data.asOf} /> : '—';
      },
    },
    { title: 'ESG score', key: 'score', align: 'right', sorter: (a, b) => (a.score ?? -1) - (b.score ?? -1), render: (_, s) => <span className="tabular">{s.score ?? '—'}</span> },
    { title: 'ESG maturity', key: 'mat', render: (_, s) => <MaturityPill score={s.score} /> },
    { title: 'Risk rating', key: 'risk', render: (_, s) => <RiskBadge level={riskOf(data, s)} /> },
    { title: 'Open issues', key: 'open', align: 'right', render: (_, s) => <span className="tabular">{openItemCount(data, s.id) || '—'}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Supplier Register"
        subtitle={`${data.suppliers.length} suppliers under ESG due diligence · ${t1} Tier 1 (critical) · ${data.suppliers.length - t1} Tier 2`}
        actions={
          <>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'csv', label: 'Upload a CSV or Excel file', onClick: () => toast.notYet('Importing from a file') },
                  { key: 'tpl', label: 'Download the template', onClick: () => toast.notYet('The import template') },
                  { key: 'bc', label: 'Import from Bharat Carbon', onClick: () => toast.notYet('Importing from Bharat Carbon') },
                ],
              }}
            >
              <Button>
                Import <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
            <Button variant="primary" icon={<PlusOutlined />} onClick={openAddSupplier}>
              Add supplier
            </Button>
          </>
        }
      />

      {neverInvited.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <Callout
            tone="warning"
            title={`${neverInvited.length} ${neverInvited.length > 1 ? 'suppliers are' : 'supplier is'} pending onboarding invitation.`}
            action={
              <Button size="sm" variant="primary" onClick={inviteNeverInvited}>
                Invite {neverInvited.length} now
              </Button>
            }
          >
            Onboarding due diligence cannot begin until the invitation is issued.
          </Callout>
        </div>
      )}

      <FilterBar>
        <Input prefix={<SearchOutlined aria-hidden="true" />}
          allowClear
          style={{ width: 260 }}
          placeholder="Search by supplier, category or location"
          value={q}
          onChange={(e) => setFilter('q', e.target.value)}
          aria-label="Search suppliers"
        />
        <Segmented<'all' | Tier>
          value={tier}
          onChange={(v) => setFilter('tier', String(v))}
          options={[
            { value: 'all', label: 'All tiers' },
            { value: 1, label: 'Tier 1' },
            { value: 2, label: 'Tier 2' },
          ]}
        />
        <Segmented<RiskFilter>
          value={risk}
          onChange={(v) => setFilter('risk', v)}
          options={[
            { value: 'all', label: 'All risk levels' },
            { value: 'High', label: 'High' },
            { value: 'Medium', label: 'Medium' },
            { value: 'Low', label: 'Low' },
            { value: 'none', label: 'Not assessed' },
          ]}
        />
        {selected.length > 0 && (
          <span className="filter-bar__end">
            <b>{selected.length} selected</b>
            <Button size="sm" onClick={addSelectedToAssessment}>
              Add to assessment
            </Button>
            <Button size="sm" variant="primary" onClick={inviteSelected}>
              Invite to onboarding
            </Button>
          </span>
        )}
      </FilterBar>

      <div className="table-scroll">
      <Table<Supplier>
        className="data-table"
        rowKey="id"
        size="middle"
        pagination={false}
        columns={columns}
        dataSource={rows}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
        locale={{ emptyText: <EmptyState>No suppliers match the selected criteria.</EmptyState> }}
      />
      </div>
    </>
  );
}
