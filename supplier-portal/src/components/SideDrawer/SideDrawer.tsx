import type { ReactNode } from 'react';
import { Drawer } from 'antd';
import './SideDrawer.scss';

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Optional wizard steps shown under the title */
  steps?: string[];
  step?: number;
  footer?: ReactNode;
  width?: number;
  children: ReactNode;
}

/** Right-hand panel for create flows and lists (Add supplier, New assessment, Notifications). */
export function SideDrawer({ open, onClose, title, steps, step = 0, footer, width = 620, children }: SideDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={width}
      placement="right"
      destroyOnHidden
      rootClassName="side-drawer"
      title={
        <div>
          <div className="side-drawer__title">{title}</div>
          {steps && <StepBar steps={steps} current={step} />}
        </div>
      }
      footer={footer ? <div className="side-drawer__footer">{footer}</div> : undefined}
    >
      {children}
    </Drawer>
  );
}

/** Numbered progress bar for multi-step flows. */
export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="step-bar" aria-label="Progress">
      {steps.map((s, i) => {
        const state = i === current ? 'is-current' : i < current ? 'is-done' : '';
        return (
          <li key={s} className={`step-bar__step ${state}`} aria-current={i === current ? 'step' : undefined}>
            {i + 1}. {s}
          </li>
        );
      })}
    </ol>
  );
}
