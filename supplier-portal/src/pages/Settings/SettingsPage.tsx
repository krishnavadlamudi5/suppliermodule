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
      <PageHeader title="Settings" />
      <RouteTabs
        base="/settings"
        active={tab}
        tabs={[
          { key: 'org', label: 'Organisation & facilities' },
          { key: 'tiers', label: 'Tiers & spend rules' },
          { key: 'users', label: 'Users & roles' },
          { key: 'reminders', label: 'Reminders & automation' },
          { key: 'emails', label: 'Email templates' },
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
      <Card title="Organisation" question="Shown to suppliers on invitations">
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
      <Card title="Facilities" question="Suppliers are linked to the facility they supply">
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
          <Button size="sm" icon={<PlusOutlined />} onClick={() => toast.info('Add facility opens here')}>
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
      <Card title="Tier rules" question="Used to suggest a tier when you add a supplier, and by the risk matrix">
        <FormField label="Suggest Tier 1 when annual spend is at least (₹ lakh)" htmlFor="t1" hint={tier1Spend ? `= ${formatInr(tier1Spend)}` : undefined}>
          <InputNumber id="t1" min={1} style={{ width: 200 }} value={tier1Spend} onChange={(v) => setTier1Spend(v)} />
        </FormField>
        <FormField label="…or the category is critical" htmlFor="t-crit">
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
            toast.success('Tier rules saved — the dashboard and risk matrix use them now');
          }}
        >
          Save
        </Button>
      </Card>
      <Card title="What each tier gets" question="Assigned automatically when a supplier is added">
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
      title="Users and roles"
      question="Admins can make changes; reviewers can accept evidence; viewers can only look"
      extra={
        <Button size="sm" variant="primary" icon={<PlusOutlined />} onClick={() => toast.info('Invite user opens here')}>
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
    'Raise an improvement action for every red flag',
    'Remind suppliers about actions due in 7, 3 and 1 days',
    'Email admins a daily digest when something needs attention',
    'Also remind team users the supplier admin assigned',
  ];

  return (
    <CardGrid cols={2}>
      <Card title="Due dates and reminders" question="Defaults for new assessments and new suppliers">
        <FormField label="Default onboarding due date (days after invite)" htmlFor="r-onb">
          <InputNumber id="r-onb" min={1} style={{ width: 160 }} value={onb} onChange={(v) => setOnb(v)} />
        </FormField>
        <FormField label="Reminders before the due date (days)" htmlFor="r-rem" hint={remOk ? 'Comma-separated, e.g. 7, 3, 1' : 'Use whole numbers separated by commas, e.g. 7, 3, 1'}>
          <Input id="r-rem" value={rem} status={remOk ? undefined : 'error'} onChange={(e) => setRem(e.target.value)} style={{ maxWidth: 200 }} />
        </FormField>
        <FormField label="Escalate to admins after (days overdue)" htmlFor="r-esc">
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
            toast.success('Reminder rules saved');
          }}
        >
          Save
        </Button>
      </Card>
      <Card title="Automation" question="What happens without anyone clicking">
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
  const TEMPLATES = ['Invitation to an assessment', 'Reminder before due date', 'Overdue reminder', 'Question from the client', 'Response sent back for changes'];
  return (
    <Card title="Email templates" question="What suppliers receive">
      {TEMPLATES.map((t) => (
        <ListRow
          key={t}
          title={t}
          meta="Last edited by Bharat Carbon"
          action={
            <Button size="sm" onClick={() => toast.info('Template editor opens here')}>
              Edit
            </Button>
          }
        />
      ))}
    </Card>
  );
}
