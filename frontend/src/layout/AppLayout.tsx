import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Drawer } from 'antd';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NotificationsDrawer } from './NotificationsDrawer';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { usePortal, usePortalActions } from '../state/hooks';
import { reviewInboxCount } from '@shared/domain/selectors';
import { PAGE_TITLES } from '../app/nav';
import { DrawerHost } from '../features/drawers/DrawerHost';
import { ErrorBoundary } from '../components/ErrorBoundary';
import './AppLayout.scss';

export function AppLayout() {
  const { pathname } = useLocation();
  const section = pathname.split('/')[1] || 'dashboard';
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const data = usePortal();
  const { markAllNotificationsRead, markNotificationRead } = usePortalActions();

  const mainRef = useRef<HTMLElement>(null);
  const lastPath = useRef(pathname);

  useEffect(() => {
    const [, , id, id2] = pathname.split('/');
    const name =
      section === 'suppliers' && id
        ? data.suppliers.find((s) => s.id === id)?.name
        : section === 'assessments' && id === 'detail'
          ? data.assessments.find((a) => a.id === id2)?.title
          : section === 'response' && id2
            ? data.suppliers.find((s) => s.id === id2)?.name
            : null;
    document.title = `${name ? `${name} · ` : ''}${PAGE_TITLES[section] ?? 'Not found'} · Supplier ESG Assessment`;
    window.scrollTo(0, 0);
    // After in-app navigation, move focus to the new page so keyboard and
    // screen-reader users start at its content rather than the old position.
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [pathname, section, data]);

  return (
    <DrawerHost>
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar active={section === 'response' ? 'reviews' : section} inboxCount={reviewInboxCount(data)} />
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="left"
        size={272}
        closable={false}
        rootClassName="nav-drawer"
        title={null}
      >
        <Sidebar
          active={section === 'response' ? 'reviews' : section}
          inboxCount={reviewInboxCount(data)}
          onNavigate={() => setMenuOpen(false)}
        />
      </Drawer>
      <div className="app-shell__main">
        <TopBar
          data={data}
          unread={data.notifications.filter((n) => n.unread).length}
          onOpenNotifications={() => setNotifOpen(true)}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main className="app-shell__page" id="main" ref={mainRef} tabIndex={-1}>
          {/* keyed by path: going to another page clears a crash */}
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <ChartTooltip />
      <NotificationsDrawer
        open={notifOpen}
        items={data.notifications}
        onClose={() => setNotifOpen(false)}
        onReadAll={markAllNotificationsRead}
        onRead={markNotificationRead}
      />
    </div>
    </DrawerHost>
  );
}
