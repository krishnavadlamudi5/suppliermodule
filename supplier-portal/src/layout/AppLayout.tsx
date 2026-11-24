import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Drawer } from 'antd';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NotificationsDrawer } from './NotificationsDrawer';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { usePortal, usePortalActions } from '../state/hooks';
import { reviewInboxCount } from '../domain/selectors';
import { PAGE_TITLES } from '../app/nav';
import { DrawerHost } from '../features/drawers/DrawerHost';
import './AppLayout.scss';

export function AppLayout() {
  const { pathname } = useLocation();
  const section = pathname.split('/')[1] || 'dashboard';
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const data = usePortal();
  const { markAllNotificationsRead } = usePortalActions();

  const mainRef = useRef<HTMLElement>(null);
  const lastPath = useRef(pathname);

  useEffect(() => {
    document.title = `${PAGE_TITLES[section] ?? 'Dashboard'} · Supplier ESG Assessment`;
    window.scrollTo(0, 0);
    // After in-app navigation, move focus to the new page so keyboard and
    // screen-reader users start at its content rather than the old position.
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [pathname, section]);

  return (
    <DrawerHost>
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar active={section === 'response' ? 'reviews' : section} org={data.org} inboxCount={reviewInboxCount(data)} />
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
          org={data.org}
          inboxCount={reviewInboxCount(data)}
          onNavigate={() => setMenuOpen(false)}
        />
      </Drawer>
      <div className="app-shell__main">
        <TopBar
          user={data.user}
          years={data.programmeYears}
          unread={data.notifications.filter((n) => n.unread).length}
          onOpenNotifications={() => setNotifOpen(true)}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main className="app-shell__page" id="main" ref={mainRef} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <ChartTooltip />
      <NotificationsDrawer
        open={notifOpen}
        items={data.notifications}
        onClose={() => setNotifOpen(false)}
        onReadAll={markAllNotificationsRead}
      />
    </div>
    </DrawerHost>
  );
}
