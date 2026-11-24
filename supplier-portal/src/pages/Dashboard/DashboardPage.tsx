import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Segmented, Select } from 'antd';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { FilterBar, NeedCard } from '../../components/blocks/Blocks';
import { usePortal } from '../../state/hooks';
import { activeAssignments, funnelStages, needs, supplierById } from '../../domain/selectors';
import type { Tier } from '../../domain/types';
import {
  AreaTrendCard,
  FlagCausesCard,
  FunnelCard,
  HeatmapCard,
  MaterialityCard,
  MaturityCard,
  RiskMatrixCard,
} from '../../features/insights/InsightCards';

type TierFilter = 'all' | Tier;

export default function DashboardPage() {
  const data = usePortal();
  // Filters are kept in the URL so they survive Back and can be shared
  const [params, setParams] = useSearchParams();
  const tier: TierFilter = params.get('tier') === '1' ? 1 : params.get('tier') === '2' ? 2 : 'all';
  const facility = params.get('facility') ?? 'all';
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const view = useMemo(() => {
    const keep = (supplierId: string) => {
      const s = supplierById(data, supplierId);
      return !!s && (tier === 'all' || s.tier === tier) && (facility === 'all' || s.facility === facility);
    };
    const suppliers = data.suppliers.filter((s) => keep(s.id));
    const assignments = activeAssignments(data).filter((a) => keep(a.supplierId));
    return {
      scored: suppliers.filter((s) => s.score != null),
      stages: funnelStages(data, assignments),
      notInvited: assignments.filter((a) => a.status === 'not_invited').length,
      flags: data.flags.filter((f) => f.status !== 'Closed' && keep(f.supplierId)),
    };
  }, [data, tier, facility]);

  const n = needs(data);

  return (
    <>
      <PageHeader title="Supplier ESG Dashboard" subtitle={`${data.org.name} · Supplier ESG Programme ${data.programmeYears[0]} · Performance, risk and compliance overview`} />

      <div className="needs-row">
        <NeedCard count={n.review} title="Pending Reviews" detail="Submitted assessments awaiting verification" to="/reviews/responses" />
        <NeedCard count={n.overdue + n.notInvited} title="Overdue & Uninvited" detail={`${n.overdue} past due · ${n.notInvited} pending invitation`} to="/assessments" />
        <NeedCard count={n.flags} title="Open Critical Findings" detail={`${n.flagsAll - n.flags} further under corrective action`} to="/reviews/flags" />
        <NeedCard
          count={n.evidence + n.questions}
          title="Evidence & Clarifications"
          detail={`${n.evidence} ${n.evidence === 1 ? 'document' : 'documents'} to verify · ${n.questions} supplier ${n.questions === 1 ? 'query' : 'queries'}`}
          to="/reviews/evidence"
        />
      </div>

      <FilterBar>
        <span className="filter-bar__label">Supplier tier</span>
        <Segmented<TierFilter>
          value={tier}
          onChange={(v) => setFilter('tier', String(v))}
          options={[
            { value: 'all', label: 'All tiers' },
            { value: 1, label: 'Tier 1' },
            { value: 2, label: 'Tier 2' },
          ]}
        />
        <Select
          value={facility}
          onChange={(v) => setFilter('facility', v)}
          style={{ minWidth: 170 }}
          aria-label="Facility"
          options={[{ value: 'all', label: 'All facilities' }, ...data.facilities.map((f) => ({ value: f.name, label: f.name }))]}
        />
        <span className="filter-bar__hint">Hover for detail · select a supplier to view its profile</span>
      </FilterBar>

      {/* Two independent columns, so cards of different heights don't leave gaps */}
      <div className="dashboard-columns">
        <div className="stack">
          <FunnelCard stages={view.stages} single={tier !== 'all'} notInvited={view.notInvited} />
          <HeatmapCard suppliers={view.scored} />
          <AreaTrendCard data={data} suppliers={view.scored} />
        </div>
        <div className="stack">
          <RiskMatrixCard data={data} suppliers={view.scored} />
          <MaturityCard data={data} tiers={tier === 'all' ? [1, 2] : [tier]} suppliers={view.scored} />
          <FlagCausesCard flags={view.flags} />
          <MaterialityCard data={data} />
        </div>
      </div>
    </>
  );
}
