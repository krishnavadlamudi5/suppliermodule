import { Link } from 'react-router-dom';
import { NAV } from '../app/nav';
import { NavIcon } from '../components/icons/NavIcon';
import type { PortalData } from '../domain/types';
import logo from '../assets/bharat-carbon-logo.jpg';

export function Sidebar({
  active,
  org,
  inboxCount,
  onNavigate,
}: {
  active: string;
  org: PortalData['org'];
  inboxCount: number;
  /** Called when a link is followed (closes the phone menu) */
  onNavigate?: () => void;
}) {
  return (
    <aside className="sidebar" aria-label="Main navigation" onClick={(e) => (e.target as Element).closest('a') && onNavigate?.()}>
      <Link to="/dashboard" className="sidebar__brand" aria-label="Bharat Carbon · go to dashboard">
        <img src={logo} alt="Bharat Carbon" />
      </Link>
      <div className="sidebar__org" title={`${org.name} · ${org.programme}`}>
        <span className="sidebar__org-av" aria-hidden="true">
          {org.initials}
        </span>
        <span className="sidebar__org-text">
          <b>{org.name}</b>
          <small>{org.programme}</small>
        </span>
      </div>

      {NAV.map((g) => (
        <div key={g.title}>
          <div className="sidebar__grp">{g.title}</div>
          <nav className="sidebar__nav" aria-label={g.title}>
            {g.items.map((it) => {
              const on = active === it.key;
              return (
                <Link
                  key={it.key}
                  to={`/${it.key}`}
                  className={`sidebar__link${on ? ' is-active' : ''}`}
                  aria-current={on ? 'page' : undefined}
                  title={it.label}
                >
                  <NavIcon name={it.icon} />
                  <span className="sidebar__label">{it.label}</span>
                  {it.count && inboxCount > 0 && (
                    <span className="sidebar__count" aria-label={`${inboxCount} waiting`}>
                      {inboxCount}
                    </span>
                  )}
                  {it.isNew && <span className="sidebar__new">New</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="sidebar__foot">
        {import.meta.env.DEV && (
          <Link to="/design-system" className={`sidebar__link sidebar__link--quiet${active === 'design-system' ? ' is-active' : ''}`} title="Design system (development only)">
            <NavIcon name="palette" size={16} />
            <span className="sidebar__label">Design system</span>
          </Link>
        )}
        <div className="sidebar__powered">
          <Link to="/questionnaires/scoring">How scoring works</Link>
        </div>
      </div>
    </aside>
  );
}
