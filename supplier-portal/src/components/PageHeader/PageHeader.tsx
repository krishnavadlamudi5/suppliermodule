import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './PageHeader.scss';

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  crumbs?: Crumb[];
}

export function PageHeader({ title, subtitle, actions, crumbs }: PageHeaderProps) {
  return (
    <div className="page-header">
      {crumbs && crumbs.length > 0 && (
        <nav className="page-header__crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="page-header__sep">/</span>}
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="page-header__row">
        <div className="page-header__text">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </div>
  );
}
