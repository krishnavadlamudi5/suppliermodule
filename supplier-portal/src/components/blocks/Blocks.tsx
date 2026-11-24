import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './Blocks.scss';

/* ---------- Stat tile ("lens") ---------- */

interface StatTileProps {
  label: string;
  value: ReactNode;
  suffix?: string;
  /** 0–100 progress under the value */
  bar?: { pct: number; color: string };
  note?: ReactNode;
  children?: ReactNode;
}

export function StatTile({ label, value, suffix, bar, note, children }: StatTileProps) {
  return (
    <div className="stat-tile">
      <small className="stat-tile__label">{label}</small>
      <b className="stat-tile__value">
        {value}
        {suffix && <span className="stat-tile__suffix">{suffix}</span>}
      </b>
      {bar && <ProgressBar segments={[{ pct: bar.pct, color: bar.color }]} label={`${label}: ${Math.round(bar.pct)}%`} />}
      {children}
      {note && <small className="stat-tile__note">{note}</small>}
    </div>
  );
}

/* ---------- Progress bar ---------- */

export function ProgressBar({ segments, height = 6, label }: { segments: { pct: number; color: string }[]; height?: number; label?: string }) {
  return (
    <div className="progress-bar" style={{ height }} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      {segments
        .filter((s) => s.pct > 0)
        .map((s, i) => (
          <span key={i} style={{ width: `${Math.min(100, s.pct)}%`, background: s.color }} />
        ))}
    </div>
  );
}

/* ---------- "Needs you" card ---------- */

export function NeedCard({ count, title, detail, to }: { count: number; title: string; detail: string; to: string }) {
  return (
    <Link to={to} className={`need-card${count ? '' : ' is-zero'}`}>
      <span className="need-card__num">{count}</span>
      <span>
        <b>{title}</b>
        <small>{detail}</small>
      </span>
    </Link>
  );
}

/* ---------- List row ---------- */

export function ListRow({ icon, title, meta, action }: { icon?: ReactNode; title: ReactNode; meta?: ReactNode; action?: ReactNode }) {
  return (
    <div className="list-row">
      {icon && <span className="list-row__icon">{icon}</span>}
      <span className="list-row__body">
        <b>{title}</b>
        {meta && <small>{meta}</small>}
      </span>
      {action && <span className="list-row__action">{action}</span>}
    </div>
  );
}

/* ---------- Key / value ---------- */

export function KeyValue({ items, plain }: { items: [ReactNode, ReactNode][]; plain?: boolean }) {
  return (
    <dl className={`key-value${plain ? ' key-value--plain' : ''}`}>
      {items.map(([k, v], i) => (
        <div key={i} className="key-value__row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Timeline ---------- */

export function Timeline({ items }: { items: { title: ReactNode; meta?: ReactNode }[] }) {
  return (
    <ul className="timeline">
      {items.map((it, i) => (
        <li key={i}>
          {it.title}
          {it.meta && <small>{it.meta}</small>}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Filter bar ---------- */

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

/* ---------- Two-line table cell ---------- */

export function CellTitle({ to, title, sub }: { to?: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="cell-title">
      {to ? (
        <Link to={to} className="cell-title__link">
          {title}
        </Link>
      ) : (
        <b>{title}</b>
      )}
      {sub && <small>{sub}</small>}
    </div>
  );
}

/* ---------- Document chip ---------- */

export function DocChip({ name }: { name: string }) {
  return (
    <span className="doc-chip">
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path d="M14 3H6v18h12V7zM14 3v4h4" />
      </svg>
      {name}
    </span>
  );
}

/* ---------- Form field ---------- */

export function FormField({ label, hint, htmlFor, children }: { label: string; hint?: ReactNode; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <div className="form-field__hint">{hint}</div>}
    </div>
  );
}

/* ---------- Choice cards (radio-like) ---------- */

export function ChoiceCards<T extends string | number>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; title: ReactNode; detail?: ReactNode }[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="choice-cards" role="radiogroup" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`choice-card${value === o.value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          <b>{o.title}</b>
          {o.detail && <small>{o.detail}</small>}
        </button>
      ))}
    </div>
  );
}
