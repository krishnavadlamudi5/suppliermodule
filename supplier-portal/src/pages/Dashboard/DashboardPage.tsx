import { useMemo, useState } from 'react';
import { Segmented, Select } from 'antd';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { CardGrid } from '../../components/Card/Card';
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
  const [tier, setTier] = useState<TierFilter>('all');
  const [facility, setFacility] = useState('all');

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
      <PageHeader title="Dashboard" subtitle={`${data.org.programme} · ${data.programmeYears[0]} · red flags count across all assessments`} />

      <div className="needs-row">
        <NeedCard count={n.review} title="Responses to review" detail="Opens Reviews" to="/reviews/responses" />
        <NeedCard count={n.overdue + n.notInvited} title="Overdue or not invited" detail={`${n.overdue} overdue · ${n.notInvited} never invited`} to="/assessments" />
        <NeedCard count={n.flags} title="Open red flags" detail={`${n.flagsAll} incl. those with actions`} to="/reviews/flags" />
        <NeedCard
          count={n.evidence + n.questions}
          title="Evidence & questions"
          detail={`${n.evidence} document${n.evidence === 1 ? '' : 's'} · ${n.questions} supplier question${n.questions === 1 ? '' : 's'}`}
          to="/reviews/evidence"
        />
      </div>

      <FilterBar>
        <span className="filter-bar__label">Show</span>
        <Segmented<TierFilter>
          value={tier}
          onChange={setTier}
          options={[
            { value: 'all', label: 'All tiers' },
            { value: 1, label: 'Tier 1' },
            { value: 2, label: 'Tier 2' },
          ]}
        />
        <Select
          value={facility}
          onChange={setFacility}
          style={{ minWidth: 170 }}
          aria-label="Facility"
          options={[{ value: 'all', label: 'All facilities' }, ...data.facilities.map((f) => ({ value: f.name, label: f.name }))]}
        />
        <span className="filter-bar__hint">Hover any mark for detail · click a supplier to open it</span>
      </FilterBar>

      <CardGrid cols={2}>
        <FunnelCard stages={view.stages} single={tier !== 'all'} notInvited={view.notInvited} />
        <RiskMatrixCard data={data} suppliers={view.scored} />
        <HeatmapCard suppliers={view.scored} />
        <div className="stack">
          <MaturityCard data={data} tiers={tier === 'all' ? [1, 2] : [tier]} suppliers={view.scored} />
          <FlagCausesCard flags={view.flags} />
        </div>
        <AreaTrendCard data={data} suppliers={view.scored} />
        <MaterialityCard data={data} />
      </CardGrid>
    </>
  );
}
