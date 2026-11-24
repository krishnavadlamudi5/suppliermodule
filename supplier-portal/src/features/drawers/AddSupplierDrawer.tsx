import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox, Input, InputNumber, Select } from 'antd';
import { SideDrawer } from '../../components/SideDrawer/SideDrawer';
import { Button } from '../../components/Button/Button';
import { Callout } from '../../components/Callout/Callout';
import { ChoiceCards, FormField, KeyValue } from '../../components/blocks/Blocks';
import { useToast } from '../../components/useToast';
import { usePortal, usePortalActions } from '../../state/hooks';
import { addDays, suggestTier } from '../../domain/selectors';
import type { SupplierDraft, Tier } from '../../domain/types';
import { formatDate, formatInr } from '../../lib/format';

const STEPS = ['Basics', 'Classify', 'Assign', 'Send'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AddSupplierDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = usePortal();
  const { addSupplier } = usePortalActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [tierTouched, setTierTouched] = useState(false);
  const [s, setS] = useState<SupplierDraft>({
    name: '',
    contact: '',
    mobile: '',
    email: '',
    spend: 0,
    city: '',
    category: '',
    facility: data.facilities[0]?.name ?? '',
    tier: 2,
    dueDate: addDays(data.asOf, data.settings.onboardingDays),
    addToAnnual: false,
    inviteToMateriality: false,
    sendNow: true,
  });
  const set = <K extends keyof SupplierDraft>(k: K, v: SupplierDraft[K]) => setS((p) => ({ ...p, [k]: v }));

  const suggested = suggestTier(data, s.spend, s.category);
  const tier: Tier = tierTouched ? s.tier : suggested;
  const draft: SupplierDraft = { ...s, tier };
  const annual = data.assessments.find((a) => a.status === 'Active' && a.type === 'Annual ESG' && a.tier === tier);
  const materiality = data.assessments.find((a) => a.status === 'Active' && a.type === 'Materiality');

  const valid =
    step === 0 ? !!s.name.trim() && !!s.contact.trim() && EMAIL.test(s.email.trim()) : step === 1 ? s.spend > 0 && !!s.category.trim() : true;

  const finish = async () => {
    setBusy(true);
    try {
      const id = await addSupplier(draft);
      toast.success(s.sendNow ? `${s.name} added and invited · onboarding due ${formatDate(s.dueDate)}` : `${s.name} added · invite not sent yet`);
      onClose();
      navigate(`/suppliers/${id}/assessments`);
    } catch (e) {
      toast.error(`Couldn't add the supplier: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Add supplier"
      steps={STEPS}
      step={step}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <span className="spacer" />
          {step > 0 && <Button onClick={() => setStep(step - 1)}>← Back</Button>}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" disabled={!valid} onClick={() => setStep(step + 1)}>
              Next →
            </Button>
          ) : (
            <Button variant="primary" loading={busy} onClick={finish}>
              {s.sendNow ? 'Add and send invite' : 'Add without inviting'}
            </Button>
          )}
        </>
      }
    >
      {step === 0 && (
        <>
          <FormField label="Company name *" htmlFor="as-name">
            <Input id="as-name" value={s.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Nirmal Packaging" autoFocus />
          </FormField>
          <div className="form-row">
            <FormField label="Contact person *" htmlFor="as-contact">
              <Input id="as-contact" value={s.contact} onChange={(e) => set('contact', e.target.value)} />
            </FormField>
            <FormField label="Mobile" htmlFor="as-mobile">
              <Input id="as-mobile" value={s.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="+91" />
            </FormField>
          </div>
          <FormField
            label="Contact email *"
            htmlFor="as-email"
            hint={s.email && !EMAIL.test(s.email.trim()) ? 'Enter a valid email address.' : 'The invitation goes to this address. They set their own password.'}
          >
            <Input
              id="as-email"
              type="email"
              value={s.email}
              status={s.email && !EMAIL.test(s.email.trim()) ? 'error' : undefined}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@company.com"
            />
          </FormField>
        </>
      )}

      {step === 1 && (
        <>
          <div className="form-row">
            <FormField label="Annual spend (₹ lakh) *" htmlFor="as-spend">
              <InputNumber id="as-spend" min={0} style={{ width: '100%' }} value={s.spend || null} onChange={(v) => set('spend', Number(v) || 0)} />
            </FormField>
            <FormField label="City" htmlFor="as-city">
              <Input id="as-city" value={s.city} onChange={(e) => set('city', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Products or services supplied *" htmlFor="as-cat">
            <Input id="as-cat" value={s.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Process chemicals" />
          </FormField>
          <FormField label="Facility it supplies" htmlFor="as-fac">
            <Select
              id="as-fac"
              style={{ width: '100%' }}
              value={s.facility}
              onChange={(v) => set('facility', v)}
              options={data.facilities.map((f) => ({ value: f.name, label: f.name }))}
            />
          </FormField>
          <FormField
            label="Tier *"
            hint={`Suggested from spend ≥ ${formatInr(data.settings.tier1Spend)} or a critical category. The full address is collected from the supplier during onboarding.`}
          >
            <ChoiceCards<Tier>
              value={tier}
              onChange={(v) => {
                setTierTouched(true);
                set('tier', v);
              }}
              options={[1, 2].map((t) => ({
                value: t as Tier,
                title: `Tier ${t}${t === suggested ? ' · suggested' : ''}`,
                detail: t === 1 ? 'Critical: onboarding (10) + annual ESG (50)' : 'Other: onboarding (5) + annual ESG (25)',
              }))}
            />
          </FormField>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>Choose what {s.name || 'this supplier'} is asked to complete.</p>
          <Checkbox className="check-row" checked disabled>
<span>
              <b>Supplier Onboarding — Tier {tier}</b>
              <small>Compulsory for every supplier · {tier === 1 ? 10 : 5} questions</small>
            </span>
</Checkbox>
          <div className="form-row" style={{ margin: '0 0 14px 28px' }}>
            <FormField label="Onboarding due date" htmlFor="as-due">
              <Input id="as-due" type="date" value={s.dueDate} min={data.asOf} onChange={(e) => set('dueDate', e.target.value)} />
            </FormField>
            <div className="form-field__hint" style={{ alignSelf: 'center' }}>
              Default: {data.settings.onboardingDays} days after the invite (Settings)
            </div>
          </div>
          {annual && (
            <Checkbox className="check-row" checked={s.addToAnnual} onChange={(e) => set('addToAnnual', e.target.checked)}>
<span>
                <b>
                  Also add to {annual.title} {annual.period}
                </b>
                <small>
                  Due {formatDate(annual.dueDate)} · {annual.questionCount} questions · opens after onboarding is submitted
                </small>
              </span>
</Checkbox>
          )}
          {materiality && (
            <Checkbox className="check-row" checked={s.inviteToMateriality} onChange={(e) => set('inviteToMateriality', e.target.checked)}>
<span>
                <b>Invite as a stakeholder to the Materiality Assessment</b>
                <small>
                  {data.topics.length} topic ratings · due {formatDate(materiality.dueDate)}
                </small>
              </span>
</Checkbox>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ marginBottom: 14 }}>
            <Callout tone="info">
              {s.sendNow ? (
                <>
                  <b>{s.contact}</b> at <b>{s.name}</b> will get an email at <b>{s.email}</b> with a link to create a login and start Supplier Onboarding —
                  Tier {tier}, due <b>{formatDate(s.dueDate)}</b>.
                </>
              ) : (
                <>
                  <b>{s.name}</b> will be added without an invitation. They'll show as <b>Not invited</b> until you send it from the supplier list.
                </>
              )}
            </Callout>
          </div>
          <KeyValue
            items={[
              ['Tier', `Tier ${tier}`],
              ['Annual spend', formatInr(s.spend)],
              ['Assessments', `Onboarding${s.addToAnnual ? ' + Annual ESG' : ''}${s.inviteToMateriality ? ' + Materiality survey' : ''}`],
              ['Reminders', `${data.settings.reminderDays.join(', ')} days before the due date`],
            ]}
          />
          <div style={{ height: 16 }} />
          <FormField label="When to send">
            <div>
              <ChoiceCards<'now' | 'later'>
                value={s.sendNow ? 'now' : 'later'}
                onChange={(v) => set('sendNow', v === 'now')}
                options={[
                  { value: 'now', title: 'Invite now', detail: 'Email goes out immediately' },
                  { value: 'later', title: 'Not yet', detail: 'Add now, invite later from the list' },
                ]}
              />
            </div>
          </FormField>
        </>
      )}
    </SideDrawer>
  );
}
