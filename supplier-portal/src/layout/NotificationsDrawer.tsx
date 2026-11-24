import { Link } from 'react-router-dom';
import { SideDrawer } from '../components/SideDrawer/SideDrawer';
import { Button } from '../components/Button/Button';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { useToast } from '../components/useToast';
import { formatDate } from '../lib/format';
import type { Notification } from '../domain/types';

interface Props {
  open: boolean;
  items: Notification[];
  onClose: () => void;
  onReadAll: () => void;
}

export function NotificationsDrawer({ open, items, onClose, onReadAll }: Props) {
  const toast = useToast();
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Notifications"
      width={460}
      footer={
        <>
          <Button size="sm" onClick={onReadAll} disabled={!items.some((n) => n.unread)}>
            Mark all read
          </Button>
          <span className="spacer" />
          <Button size="sm" variant="ghost" onClick={() => toast.info('Daily digest settings are in Settings → Reminders & automation')}>
            Email me a daily digest
          </Button>
        </>
      }
    >
      {items.length === 0 ? (
        <EmptyState>You're all caught up.</EmptyState>
      ) : (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n.id}>
              <Link to={n.to} onClick={onClose} className={`notif-list__item${n.unread ? ' is-unread' : ''}`}>
                {n.unread && <span className="notif-list__dot" aria-label="Unread" />}
                <span>
                  <b>{n.title}</b>
                  <small>
                    {n.detail} · {formatDate(n.at)}
                  </small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SideDrawer>
  );
}
