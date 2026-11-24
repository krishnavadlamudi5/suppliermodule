import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Dropdown, Input, Select } from 'antd';
import { DownOutlined, MenuOutlined } from '@ant-design/icons';
import { NavIcon } from '../components/icons/NavIcon';
import type { PortalData } from '../domain/types';
import { useToast } from '../components/useToast';

interface TopBarProps {
  user: PortalData['user'];
  years: string[];
  unread: number;
  onOpenNotifications: () => void;
  onOpenMenu: () => void;
}

export function TopBar({ user, years, unread, onOpenNotifications, onOpenMenu }: TopBarProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');

  return (
    <header className="topbar">
      <button type="button" className="topbar__iconbtn topbar__menu" onClick={onOpenMenu} aria-label="Open menu">
        <MenuOutlined />
      </button>
      <Input
        className="topbar__search"
        prefix={<NavIcon name="search" size={16} />}
        placeholder="Search suppliers, assessments, questions"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onPressEnter={() => navigate(`/suppliers?q=${encodeURIComponent(q)}`)}
        allowClear
        aria-label="Search"
      />
      <span className="topbar__sample" title="This prototype uses sample data">
        Prototype · sample data
      </span>
      <span className="topbar__spacer" />
      <Select
        className="topbar__year"
        defaultValue={years[0]}
        options={years.map((y) => ({ value: y, label: `Programme ${y}` }))}
        aria-label="Programme year"
      />
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
            { key: 'signout', label: 'Sign out', onClick: () => toast.info('Signed out (prototype)') },
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
