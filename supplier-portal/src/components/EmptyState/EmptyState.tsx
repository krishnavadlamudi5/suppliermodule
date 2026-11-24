import type { ReactNode } from 'react';
import './EmptyState.scss';

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div>{children}</div>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
