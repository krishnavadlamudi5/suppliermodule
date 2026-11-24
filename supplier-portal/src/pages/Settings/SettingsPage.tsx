import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Checkbox, Input, InputNumber, Table } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { RouteTabs } from '../../components/RouteTabs/RouteTabs';
import { Card, CardGrid } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Pill } from '../../components/Pill/Pill';
import { CellTitle, FormField, KeyValue, ListRow } from '../../components/blocks/Blocks';
import { useToast } from '../../components/useToast';
import { usePortal, usePortalActions } from '../../state/hooks';
import type { Facility, PortalData } from '../../domain/types';
import { formatInr } from '../../lib/format';

const TABS = ['org', 'tiers', 'users', 'reminders', 'emails'] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsPage() {
  const { tab = 'org' } = useParams();
  const data = usePortal();
  if (!(TABS as readonly string[]).includes(tab)) return <Navigate to="/settings/org" replace />;
  return (
    <>
      <PageHeader title="Programme Settings" subtitle="Organisation profile, supplier segmentation, user access and communication rules" />
      <RouteTabs
        base="/settings"
        active={tab}
        tabs={[
          { key: 'org', label: 'Organisation & Facilities' },
          { key: 'tiers', label: 'Supplier Segmentation' },
          { key: 'users', label: 'Users & Roles' },
          { key: 'reminders', label: 'Reminders & Escalation' },
          { key: 'emails', label: 'Communication Templates' },
        ]}
      />
      {tab === 'org' && <OrgTab data={data} />}
      {tab === 'tiers' && <TiersTab data={data} />}
      {tab === 'users' && <UsersTab data={data} />}
      {tab === 'reminders' && <RemindersTab data={data} />}
      {tab === 'emails' && <EmailsTab />}
    </>
  );
}

function OrgTab({ data }: { data: PortalData }) {
  const { updateOrg } = usePortalActions();
  const toast = useToast();
  const [name, setName] = useState(data.org.name);
  const [email, setEmail] = useState(data.org.contactEmail);
  const emailOk = EMAIL.test(email.trim());
  const dirty = name !== data.org.name || email !== data.org.contactEmail;

  return (
    <CardGrid cols={2}>
      <Card title="Organisation Profile" question="Displayed to suppliers on assessment invitations">
        <FormField label="Organisation name" htmlFor="org-name">
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Programme contact email" htmlFor="org-email" hint={email && !emailOk ? 'Enter a valid email address.' : undefined}>
          <Input id="org-email" type="email" value={email} status={email && !emailOk ? 'error' : undefined} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <Button
          size="sm"
          variant="primary"
          disabled={!dirty || !name.trim() || !emailOk}
          onClick={async () => {
            await updateOrg(name, email);
            toast.success('Organisation details saved');
          }}
        >
          Save
        </Button>
      </Card>
      <Card title="Facilities" question="Suppliers are mapped to the facilities they serve">
        <Table<Facility>
          className="data-table"
          rowKey="name"
          size="small"
          pagination={false}
          dataSource={data.facilities}
          columns={[
            { title: 'Facility', key: 'n', render: (_, f) => <b>{f.name}</b> },
            { title: 'City', dataIndex: 'city' },
            { title: 'Suppliers', key: 's', align: 'right', render: (_, f) => <span className="tabular">{data.suppliers.filter((s) => s.facility === f.name).length}</span> },
          ]}
        />
        <div style={{ marginTop: 10 }}>
          <Button size="sm" icon={<PlusOutlined />} onClick={() => toast.notYet('Adding facilities')}>
            Add facility
          </Button>
        </div>
      </Card>
    </CardGrid>
  );
}

function TiersTab({ data }: { data: PortalData }) {
  const { updateSettings } = usePortalActions();
  const toast = useToast();
  const [tier1Spend, setTier1Spend] = useState<number | null>(data.settings.tier1Spend);
  const [highSpend, setHighSpend] = useState<number | null>(data.settings.highSpend);
  const valid = (tier1Spend ?? 0) > 0 && (highSpend ?? 0) > 0;
  const dirty = tier1Spend !== data.settings.tier1Spend || highSpend !== data.settings.highSpend;

  return (
    <CardGrid cols={2}>
      <Card title="Segmentation Criteria" question="Applied when onboarding new suppliers and in the risk matrix">
        <FormField label="Suggest Tier 1 when annual spend is at least (₹ lakh)" htmlFor="t1" hint={tier1Spend ? `= ${formatInr(tier1Spend)}` : undefined}>
          <InputNumber id="t1" min={1} style={{ width: 200 }} value={tier1Spend} onChange={(v) => setTier1Spend(v)} />
        </FormField>
        <FormField label="…or the supplied category is classified as critical" htmlFor="t-crit">
          <Input id="t-crit" value="Chemicals, castings, polymers, PCBs, batteries" disabled />
        </FormField>
        <FormField label="High-spend threshold for the risk matrix (₹ lakh)" htmlFor="hs" hint={highSpend ? `= ${formatInr(highSpend)}` : undefined}>
          <InputNumber id="hs" min={1} style={{ width: 200 }} value={highSpend} onChange={(v) => setHighSpend(v)} />
        </FormField>
        <Button
          size="sm"
          variant="primary"
          disabled={!valid || !dirty}
          onClick={async () => {
            await updateSettings({ tier1Spend: tier1Spend ?? undefined, highSpend: highSpend ?? undefined });
            toast.success('Segmentation criteria saved and applied');
          }}
        >
          Save
        </Button>
      </Card>
      <Card title="Assessment Requirements by Tier" question="Assigned automatically at onboarding">
        <KeyValue
          plain
          items={[
            ['Tier 1 · critical', 'Onboarding (10 questions) + Annual ESG (50) + Scope 3 questions'],
            ['Tier 2 · other', 'Onboarding (5 questions) + Annual ESG (25)'],
          ]}
        />
      </Card>
    </CardGrid>
  );
}

function UsersTab({ data }: { data: PortalData }) {
  const toast = useToast();
  return (
    <Card
      title="Users & Roles"
      question="Administrators manage the programme; reviewers verify submissions and evidence; viewers have read-only access"
      extra={
        <Button size="sm" variant="primary" icon={<PlusOutlined />} onClick={() => toast.notYet('Adding users')}>
          Add user
        </Button>
      }
    >
      <Table
        className="data-table"
        rowKey="email"
        size="middle"
        pagination={false}
        dataSource={[data.user]}
        columns={[
          { title: 'User', key: 'u', render: () => <CellTitle title={`${data.user.name} (you)`} sub={data.user.email} /> },
          { title: 'Role', key: 'r', render: () => 'Admin' },
          { title: 'Status', key: 's', render: () => <Pill tone="success">Active</Pill> },
        ]}
      />
    </Card>
  );
}

function RemindersTab({ data }: { data: PortalData }) {
  const { updateSettings } = usePortalActions();
  const toast = useToast();
  const s = data.settings;
  const [onb, setOnb] = useState<number | null>(s.onboardingDays);
  const [rem, setRem] = useState(s.reminderDays.join(', '));
  const [esc, setEsc] = useState<number | null>(s.escalateAfterDays);
  const [auto, setAuto] = useState([true, true, true, false]);

  const remDays = rem
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number);
  const remOk = remDays.length > 0 && remDays.every((n) => Number.isInteger(n) && n > 0);
  const valid = (onb ?? 0) > 0 && (esc ?? 0) >= 0 && remOk;

  const AUTOMATION = [
    'Raise a corrective action for every critical finding',
    'Remind suppliers of corrective actions due in 7, 3 and 1 days',
    'Send administrators a daily digest of items requiring attention',
    'Notify supplier team members assigned by the supplier administrator',
  ];

  return (
    <CardGrid cols={2}>
      <Card title="Deadlines & Reminders" question="Default settings for new assessments and supplier onboarding">
        <FormField label="Default onboarding due date (days after invite)" htmlFor="r-onb">
          <InputNumber id="r-onb" min={1} style={{ width: 160 }} value={onb} onChange={(v) => setOnb(v)} />
        </FormField>
        <FormField label="Reminders before the due date (days)" htmlFor="r-rem" hint={remOk ? 'Comma-separated, e.g. 7, 3, 1' : 'Use whole numbers separated by commas, e.g. 7, 3, 1'}>
          <Input id="r-rem" value={rem} status={remOk ? undefined : 'error'} onChange={(e) => setRem(e.target.value)} style={{ maxWidth: 200 }} />
        </FormField>
        <FormField label="Escalate to programme administrators after (days overdue)" htmlFor="r-esc">
          <InputNumber id="r-esc" min={0} style={{ width: 160 }} value={esc} onChange={(v) => setEsc(v)} />
        </FormField>
        <Button
          size="sm"
          variant="primary"
          disabled={!valid}
          onClick={async () => {
            await updateSettings({
              onboardingDays: onb ?? s.onboardingDays,
              reminderDays: [...new Set(remDays)].sort((a, b) => b - a),
              escalateAfterDays: esc ?? s.escalateAfterDays,
            });
            toast.success('Reminder and escalation rules saved');
          }}
        >
          Save
        </Button>
      </Card>
      <Card title="Workflow Automation" question="Actions performed automatically by the platform">
        {AUTOMATION.map((t, i) => (
          <Checkbox key={t} className="check-row" checked={auto[i]} onChange={(e) => setAuto((a) => a.map((v, k) => (k === i ? e.target.checked : v)))}>
<span>
              <b>{t}</b>
            </span>
</Checkbox>
        ))}
      </Card>
    </CardGrid>
  );
}

function EmailsTab() {
  const toast = useToast();
  const TEMPLATES = ['Assessment invitation', 'Pre-deadline reminder', 'Overdue notice', 'Clarification request', 'Submission returned for revision'];
  return (
    <Card title="Communication Templates" question="Standard communications issued to suppliers">
      {TEMPLATES.map((t) => (
        <ListRow
          key={t}
          title={t}
          meta="Maintained by Bharat Carbon"
          action={
            <Button size="sm" onClick={() => toast.notYet('Editing email templates')}>
              Edit
            </Button>
          }
        />
      ))}
    </Card>
  );
}
