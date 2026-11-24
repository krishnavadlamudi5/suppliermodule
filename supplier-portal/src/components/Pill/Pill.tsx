import type { ReactNode } from 'react';
import './Pill.scss';

export type PillTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand';

export function Pill({ tone = 'neutral', children, title }: { tone?: PillTone; children: ReactNode; title?: string }) {
  return (
    <span className={`pill pill--${tone}`} title={title}>
      {children}
    </span>
  );
}
