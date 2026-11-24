import type { ReactNode } from 'react';
import './Pill.scss';

import type { StatusTone } from '@shared/domain/types';

export type PillTone = StatusTone;

export function Pill({ tone = 'neutral', children, title }: { tone?: PillTone; children: ReactNode; title?: string }) {
  return (
    <span className={`pill pill--${tone}`} title={title}>
      {children}
    </span>
  );
}
