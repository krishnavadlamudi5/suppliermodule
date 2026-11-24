import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Checkbox, Input, Segmented, Select } from 'antd';
import { SideDrawer } from '../../components/SideDrawer/SideDrawer';
import { Button } from '../../components/Button/Button';
import { Callout } from '../../components/Callout/Callout';
import { ChoiceCards, FormField, KeyValue } from '../../components/blocks/Blocks';
import { useToast } from '../../components/useToast';
import { usePortal, usePortalActions } from '../../state/hooks';
import { addDays, assessmentById, riskOf } from '../../domain/selectors';
import { findDuplicateAssessment } from '../../domain/commands';
import { AREAS } from '../../domain/constants';
import type { AssessmentDraft, AssessmentType, Tier } from '../../domain/types';
import { formatDate, formatDateShort, formatInr } from '../../lib/format';

const STEPS = ['Type', 'Questions', 'Suppliers & dates', 'Review & launch'];
const TYPES: { value: AssessmentType; detail: string }[] = [
  { value: 'Onboarding', detail: 'Company, permits and policy checks' },
  { value: 'Annual ESG', detail: 'Yearly review across 7 scoring areas' },
  { value: 'Materiality', detail: 'Stakeholder ratings of ESG topics' },
  { value: 'Follow-up', detail: 'Targeted re-check after a red flag' },
];
const PERIODS = ['2026', '2027', 'Q1 2027'];

const defaultTitle = (type: AssessmentType, tier: Tier) =>
  type === 'Materiality' ? 'Materiality Assessment — Stakeholders' : type === 'Follow-up' ? 'Follow-up review' : `${type === 'Annual ESG' ? 'Annual ESG Assessment' : 'Supplier Onboarding'} — Tier ${tier}`;

interface Props {
  open: boolean;
  preset: Partial<AssessmentDraft>;
  onClose: () => void;
}

export function NewAssessmentDrawer({ open, preset, onClose }: Props) {
  const data = usePortal();
  const { launchAssessment } = usePortalActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [a, setA] = useState<AssessmentDraft>({
    type: preset.type ?? 'Annual ESG',
    tier: preset.tier ?? 1,
    period: preset.period ?? '2026',
    title: preset.title ?? '',
    dueDate: preset.dueDate ?? addDays(data.asOf, 30),
    supplierIds: preset.supplierIds ?? [],
  });
  const set = <K extends keyof AssessmentDraft>(k: K, v: AssessmentDraft[K]) => setA((p) => ({ ...p, [k]: v }));
  const isMat = a.type === 'Materiality';
  const title = a.title.trim() || defaultTitle(a.type, a.tier);

  const questions = useMemo(
    () =>
      data.questions.filter((q) => (a.type === 'Follow-up' ? true : q.template === a.type) && q.tiers.includes(a.tier)),
    [data.questions, a.type, a.tier],
  );
  const pool = isMat || a.type === 'Follow-up' ? data.suppliers : data.suppliers.filter((s) => s.tier === a.tier);
  const already = (sid: string) =>
    data.assignments.some((x) => {
      const as = assessmentById(data, x.assessmentId);
      return x.supplierId === sid && as?.type === a.type && as.period === a.period && as.status !== 'Closed';
    });
  const dup = findDuplicateAssessment(data, a);
  const reminders = data.settings.reminderDays.map((d) => formatDateShort(addDays(a.dueDate, -d)));

  const toggle = (sid: string, on: boolean) => set('supplierIds', on ? [...a.supplierIds, sid] : a.supplierIds.filter((x) => x !== sid));
  const canLaunch = isMat || a.supplierIds.length > 0;

  const launch = async () => {
    setBusy(true);
    try {
      const id = await launchAssessment({ ...a, title });
      toast.success(isMat ? 'Materiality assessment launched' : `Launched · ${a.supplierIds.length} invitation${a.supplierIds.length === 1 ? '' : 's'} sent`);
      onClose();
      navigate(isMat ? '/materiality/survey' : `/assessments/detail/${id}`);
    } catch (e) {
      toast.error(`Couldn't launch: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="New assessment"
      steps={STEPS}
      step={step}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <span className="spacer" />
          {step > 0 && <Button onClick={() => setStep(step - 1)}>← Back</Button>}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              Next →
            </Button>
          ) : (
            <Button variant="primary" loading={busy} disabled={!canLaunch} onClick={launch}>
              {isMat ? 'Launch survey' : `Launch and invite ${a.supplierIds.length}`}
            </Button>
          )}
        </>
      }
    >
      {step === 0 && (
        <>
          <FormField label="Assessment type">
            <ChoiceCards<AssessmentType>
              value={a.type}
              onChange={(v) => setA((p) => ({ ...p, type: v, title: '', supplierIds: [] }))}
              options={TYPES.map((t) => ({ value: t.value, title: t.value, detail: t.detail }))}
            />
          </FormField>
          {!isMat && a.type !== 'Follow-up' && (
            <FormField label="For">
              <Segmented<Tier>
                value={a.tier}
                onChange={(v) => setA((p) => ({ ...p, tier: v, title: '', supplierIds: [] }))}
                options={[
                  { value: 1, label: 'Tier 1' },
                  { value: 2, label: 'Tier 2' },
                ]}
              />
            </FormField>
          )}
          <div className="form-row">
            <FormField label="Period" htmlFor="na-period">
              <Select id="na-period" style={{ width: '100%' }} value={a.period} onChange={(v) => set('period', v)} options={PERIODS.map((p) => ({ value: p, label: p }))} />
            </FormField>
            <FormField label="Title" htmlFor="na-title">
              <Input id="na-title" value={a.title} placeholder={defaultTitle(a.type, a.tier)} onChange={(e) => set('title', e.target.value)} />
            </FormField>
          </div>
        </>
      )}

      {step === 1 &&
        (isMat ? (
          <>
            <p style={{ marginTop: 0 }}>Stakeholders rate each topic 1–5 for impact and for financial importance.</p>
            {data.topics.map((t) => (
              <Checkbox key={t.n} className="check-row" defaultChecked>
<span>
                  <b>{t.title}</b>
                  <small>Linked area: {AREAS[t.areaIndex]}</small>
                </span>
</Checkbox>
            ))}
          </>
        ) : (
          <>
            <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
              {a.type === 'Follow-up' ? 'Pick questions from the bank.' : `Starting from the ${a.type} · Tier ${a.tier} template (sample shown).`} Red-flag and
              evidence questions are required by default.
            </p>
            {questions.map((q) => (
              <Checkbox key={q.code} className="check-row" defaultChecked={a.type !== 'Follow-up'}>
<span>
                  <b style={{ fontWeight: 500 }}>{q.text}</b>
                  <small>
                    {q.areaIndex != null ? AREAS[q.areaIndex] : 'General'}
                    {q.redFlag ? ' · red flag' : ''}
                    {q.redFlag || q.evidenceRequired ? ' · required' : ''}
                  </small>
                </span>
</Checkbox>
            ))}
          </>
        ))}

      {step === 2 && (
        <>
          {!isMat && (
            <FormField label={`Suppliers (${pool.length} in ${a.type === 'Follow-up' ? 'all tiers' : `Tier ${a.tier}`})`}>
              {pool.map((s) => (
                <Checkbox key={s.id} className="check-row" checked={a.supplierIds.includes(s.id)} onChange={(e) => toggle(s.id, e.target.checked)}>
<span>
                    <b>{s.name}</b>
                    <small>
                      {riskOf(data, s) ?? 'Not assessed'} risk · {formatInr(s.spend)}
                      {already(s.id) ? ` · already in a ${a.type} for ${a.period}` : ''}
                    </small>
                  </span>
</Checkbox>
              ))}
            </FormField>
          )}
          <div className="form-row">
            <FormField label="Due date" htmlFor="na-due">
              <Input id="na-due" type="date" min={data.asOf} value={a.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </FormField>
            <FormField label="Send invitations" htmlFor="na-send">
              <Select id="na-send" aria-label="Send invitations" style={{ width: '100%' }} defaultValue="now" options={[{ value: 'now', label: 'Now, when launched' }]} />
            </FormField>
          </div>
          <Callout tone="info">
            Reminders go out on <b>{reminders.join(', ')}</b> to {isMat ? 'stakeholders' : 'suppliers'} who haven't submitted. You can add more later with their own due
            date.
          </Callout>
        </>
      )}

      {step === 3 && (
        <>
          {dup && (
            <div style={{ marginBottom: 14 }}>
              <Callout tone="warning" title="An assessment like this already exists:">
                {dup.title} · {dup.period} ({dup.status}).{' '}
                <Link to={`/assessments/detail/${dup.id}`} onClick={onClose}>
                  Add suppliers to it instead
                </Link>
                , or launch anyway.
              </Callout>
            </div>
          )}
          <KeyValue
            items={[
              ['Title', title],
              ['Type', `${a.type}${!isMat && a.type !== 'Follow-up' ? ` · Tier ${a.tier}` : ''}`],
              ['Period', a.period],
              ...(isMat ? [] : ([['Suppliers', `${a.supplierIds.length} selected`]] as [string, string][])),
              ['Due', formatDate(a.dueDate)],
              ['Compared with', `${a.type} · ${isMat ? 'stakeholders' : `Tier ${a.tier}`} · previous period (automatic)`],
            ]}
          />
          {!canLaunch && (
            <div style={{ marginTop: 14 }}>
              <Callout tone="warning">Pick at least one supplier in step 3 to launch.</Callout>
            </div>
          )}
        </>
      )}
    </SideDrawer>
  );
}
