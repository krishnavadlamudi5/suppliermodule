import type { ReactNode } from 'react';
import './Callout.scss';

export type CalloutTone = 'info' | 'warning' | 'error' | 'success';

interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

/** Inline message box for page-level nudges ("3 suppliers were never invited"). */
export function Callout({ tone = 'info', title, action, children }: CalloutProps) {
  return (
    <div className={`callout callout--${tone}`} role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}>
      <div className="callout__body">
        {title && <b>{title} </b>}
        {children}
      </div>
      {action && <div className="callout__action">{action}</div>}
    </div>
  );
}
