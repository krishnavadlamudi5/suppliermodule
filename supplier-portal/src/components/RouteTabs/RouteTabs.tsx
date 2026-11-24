import { Link } from 'react-router-dom';
import './RouteTabs.scss';

export interface RouteTab {
  key: string;
  label: string;
  count?: number;
}

interface RouteTabsProps {
  /** Path the tab key is appended to, e.g. "/reviews" → "/reviews/evidence" */
  base: string;
  tabs: RouteTab[];
  active: string;
}

/** Tabs that are real links, so each tab has its own URL (back button, deep links). */
export function RouteTabs({ base, tabs, active }: RouteTabsProps) {
  return (
    <nav className="route-tabs" aria-label="Sections">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link key={t.key} to={`${base}/${t.key}`} className={`route-tabs__tab${on ? ' is-active' : ''}`} aria-current={on ? 'page' : undefined}>
            {t.label}
            {t.count != null && <span className="route-tabs__count">{t.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
