import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoComplete, Badge, Dropdown, Input } from 'antd';
import { CheckCircleFilled, DownOutlined, ExclamationCircleFilled, LoadingOutlined, MenuOutlined } from '@ant-design/icons';
import { NavIcon } from '../components/icons/NavIcon';
import type { PortalData } from '@shared/domain/types';
import { useToast } from '../components/useToast';
import { usePortalSnapshot } from '../state/hooks';
import { assessmentHref } from '../features/assessments/helpers';

interface TopBarProps {
  data: PortalData;
  unread: number;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
}

export function TopBar({ data, unread, onOpenNotifications, onOpenMenu }: TopBarProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const user = data.user;

  // Live results across suppliers, assessments and questions
  const options = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return [];
    const hit = (...parts: (string | null | undefined)[]) => parts.join(' ').toLowerCase().includes(n);
    const group = (label: string, items: { value: string; label: React.ReactNode }[]) => (items.length ? [{ label, options: items.slice(0, 5) }] : []);
    return [
      ...group(
        'Suppliers',
        data.suppliers.filter((s) => hit(s.name, s.category, s.city, s.id)).map((s) => ({ value: `/suppliers/${s.id}`, label: <SearchRow title={s.name} sub={`${s.category} · ${s.city}`} /> })),
      ),
      ...group(
        'Assessments',
        data.assessments.filter((a) => hit(a.title, a.type, a.period)).map((a) => ({ value: assessmentHref(a), label: <SearchRow title={a.title} sub={`${a.type} · ${a.period} · ${a.status}`} /> })),
      ),
      ...group(
        'Questions',
        data.questions.filter((x) => hit(x.code, x.text)).map((x) => ({ value: `/questionnaires/bank?q=${encodeURIComponent(x.code)}`, label: <SearchRow title={x.text} sub={`${x.code} · ${x.template}`} /> })),
      ),
    ];
  }, [q, data]);

  return (
    <header className="topbar">
      <button type="button" className="topbar__iconbtn topbar__menu" onClick={onOpenMenu} aria-label="Open menu">
        <MenuOutlined />
      </button>
      <AutoComplete
        className="topbar__search"
        value={q}
        options={options}
        onChange={setQ}
        onSelect={(to: string) => {
          setQ('');
          navigate(to);
        }}
        notFoundContent={q.trim().length >= 2 ? 'No matches' : null}
        popupMatchSelectWidth={420}
      >
        <Input
          prefix={<NavIcon name="search" size={16} />}
          placeholder="Search suppliers, assessments, questions"
          allowClear
          aria-label="Search suppliers, assessments and questions"
          onPressEnter={() => {
            // Enter without picking a result: show matching suppliers
            if (q.trim() && !document.querySelector('.ant-select-item-option-active')) navigate(`/suppliers?q=${encodeURIComponent(q.trim())}`);
          }}
        />
      </AutoComplete>
      <span className="topbar__spacer" />
      <SaveStatus />
      <span className="topbar__programme" title="Programme year">
        Programme {data.programmeYears[0]}
      </span>
      <Badge count={unread} size="small" offset={[-4, 4]} color="var(--action-primary)">
        <button type="button" className="topbar__iconbtn" onClick={onOpenNotifications} aria-label={`Notifications, ${unread} unread`}>
          <NavIcon name="bell" />
        </button>
      </Badge>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: [
            { key: 'profile', label: 'My profile', onClick: () => navigate('/settings/users') },
            { key: 'settings', label: 'Settings', onClick: () => navigate('/settings') },
            { type: 'divider' },
            { key: 'signout', label: 'Sign out', onClick: () => toast.notYet('Sign-in and sign-out') },
          ],
        }}
      >
        <button type="button" className="topbar__me" aria-haspopup="menu">
          <span className="topbar__me-av">{user.initials}</span>
          <span className="topbar__me-text">
            <b>{user.name}</b>
            <small>{user.role}</small>
          </span>
          <DownOutlined className="topbar__me-caret" />
        </button>
      </Dropdown>
    </header>
  );
}

function SearchRow({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="search-row">
      <b>{title}</b>
      <small>{sub}</small>
    </div>
  );
}

/** Saving… / Saved / Not saved — so people know their changes reached the database. */
function SaveStatus() {
  const { saving, saveError } = usePortalSnapshot();
  // Demo builds run on in-browser sample data: say so instead of "All changes saved"
  if (import.meta.env.VITE_DATA_SOURCE === 'mock')
    return (
      <span className="save-status" role="status" title="Running on built-in sample data. Changes are kept only until the page is reloaded.">
        Demo mode · changes not saved
      </span>
    );
  if (saving > 0)
    return (
      <span className="save-status" role="status">
        <LoadingOutlined /> Saving…
      </span>
    );
  if (saveError)
    return (
      <span className="save-status save-status--error" role="status" title={saveError}>
        <ExclamationCircleFilled /> Not saved
      </span>
    );
  return (
    <span className="save-status save-status--ok" role="status">
      <CheckCircleFilled /> All changes saved
    </span>
  );
}
