import { useState } from 'react';
import { Table, Input, Checkbox } from 'antd';
import { Card, CardGrid } from '../../components/Card/Card';
import { Pill } from '../../components/Pill/Pill';
import { RiskBadge, TierBadge, CodeTag } from '../../components/Badges/Badges';
import { Callout } from '../../components/Callout/Callout';
import { Button } from '../../components/Button/Button';
import { SideDrawer } from '../../components/SideDrawer/SideDrawer';
import { useToast } from '../../components/useToast';
import { formatInr } from '../../lib/format';

const ROWS = [
  { key: 'SUP-009', name: 'Sharda Polymers', cat: 'Medical-grade polymers · Vapi', tier: 1 as const, spend: 320, score: 74, risk: 'Low' as const, onb: 'Reviewed' },
  { key: 'SUP-008', name: 'Kavya Castings', cat: 'Metal castings · Kolhapur', tier: 1 as const, spend: 240, score: 48, risk: 'High' as const, onb: 'Reviewed' },
  { key: 'SUP-015', name: 'Deccan Forge Works', cat: 'Forged parts · Satara', tier: 2 as const, spend: 28, score: 44, risk: 'Medium' as const, onb: 'Reopened' },
  { key: 'SUP-007', name: 'Amaraja Batteries', cat: 'Primary cells & batteries · Bhusawal', tier: 1 as const, spend: 180, score: null, risk: null, onb: 'Not invited' },
];

const ONB_TONE = { Reviewed: 'success', Reopened: 'error', 'Not invited': 'warning' } as const;
const STEPS = ['Basics', 'Classify', 'Assign', 'Send'];

/** Phase 2 shared pieces, shown with sample content from the portal. */
export function ComponentGallery() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  return (
    <section className="fd-card">
      <h2>Shared components</h2>
      <p className="fd-q">The building blocks every screen in Phase 5 is assembled from.</p>

      <CardGrid cols={2}>
        <Card
          title="3 high-spend suppliers score below 60"
          question="Insight card: the title states the finding, the line under it states the question."
          footnote="High spend = ₹1 Cr or more"
          footerLink={{ to: '/risk/matrix', label: 'Open risk matrix' }}
        >
          <div className="fd-chart-stub">Chart goes here (Phase 3)</div>
        </Card>

        <Card title="Status, risk and tier" question="Shape + label for risk, never color alone">
          <div className="fd-stack">
            <div className="fd-pills">
              <Pill tone="success">Reviewed</Pill>
              <Pill tone="brand">Awaiting review</Pill>
              <Pill tone="neutral">Invited</Pill>
              <Pill tone="info">In progress</Pill>
              <Pill tone="warning">Not invited</Pill>
              <Pill tone="error">Overdue</Pill>
            </div>
            <div className="fd-pills">
              <RiskBadge level="High" />
              <RiskBadge level="Medium" />
              <RiskBadge level="Low" />
              <RiskBadge level={null} />
            </div>
            <div className="fd-pills">
              <TierBadge tier={1} />
              <TierBadge tier={2} />
              <CodeTag code="OB-05" />
            </div>
          </div>
        </Card>
      </CardGrid>

      <div className="fd-stack" style={{ marginTop: 16 }}>
        <Callout tone="warning" title="2 suppliers were added but never invited to onboarding." action={<Button size="sm" variant="primary">Invite 2 now</Button>}>
          They won't hear from you until you invite them.
        </Callout>
        <Callout tone="error" title="1 supplier has not been invited.">Amaraja Batteries won't hear from you until you send the invite.</Callout>
        <Callout tone="info">Reminders go out on <b>8 Dec</b>, <b>12 Dec</b> and <b>14 Dec</b> to suppliers who haven't submitted.</Callout>
      </div>

      <div style={{ marginTop: 16 }}>
        <Table
          size="middle"
          pagination={false}
          rowSelection={{}}
          dataSource={ROWS}
          columns={[
            {
              title: 'Supplier',
              dataIndex: 'name',
              render: (n, r) => (
                <div>
                  <a href="#supplier" className="fd-name">{n}</a>
                  <small className="fd-sub">{r.cat}</small>
                </div>
              ),
            },
            { title: 'Tier', dataIndex: 'tier', render: (t) => <TierBadge tier={t} /> },
            { title: 'Annual spend', dataIndex: 'spend', align: 'right', render: (v) => <span className="tabular">{formatInr(v)}</span> },
            { title: 'Onboarding', dataIndex: 'onb', render: (v: keyof typeof ONB_TONE) => <Pill tone={ONB_TONE[v]}>{v}</Pill> },
            { title: 'ESG score', dataIndex: 'score', align: 'right', render: (v) => <span className="tabular">{v ?? '—'}</span> },
            { title: 'Risk', dataIndex: 'risk', render: (v) => <RiskBadge level={v} /> },
          ]}
        />
      </div>

      <div className="fd-controls" style={{ marginTop: 16 }}>
        <Button variant="primary" onClick={() => { setStep(0); setOpen(true); }}>Open a multi-step panel</Button>
        <Button onClick={() => toast.success('Invitation sent to Amaraja Batteries · due 15 Dec 2026')}>Show a toast</Button>
      </div>

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Add supplier"
        steps={STEPS}
        step={step}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <span className="spacer" />
            {step > 0 && <Button onClick={() => setStep(step - 1)}>← Back</Button>}
            {step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={() => setStep(step + 1)}>Next →</Button>
            ) : (
              <Button variant="primary" onClick={() => { setOpen(false); toast.success('Supplier added and invited'); }}>Add and send invite</Button>
            )}
          </>
        }
      >
        <label className="fd-label">Company name *</label>
        <Input placeholder="e.g. Nirmal Packaging" style={{ marginBottom: 14 }} />
        <label className="fd-label">Contact email *</label>
        <Input placeholder="name@company.com" />
        <p className="fd-sub" style={{ marginTop: 6 }}>The invitation goes to this address. They set their own password.</p>
        <Checkbox style={{ marginTop: 10 }}>Also invite as a stakeholder to the Materiality Assessment</Checkbox>
      </SideDrawer>
    </section>
  );
}
