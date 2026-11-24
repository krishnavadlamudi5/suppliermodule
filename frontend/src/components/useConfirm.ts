import { App } from 'antd';
import type { ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  content?: ReactNode;
  okText: string;
  /** Red confirm button for actions that are hard to undo */
  danger?: boolean;
}

/** Ask before an action that can't easily be undone. Resolves true if confirmed. */
export function useConfirm() {
  const { modal } = App.useApp();
  return ({ title, content, okText, danger }: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      modal.confirm({
        title,
        content,
        okText,
        cancelText: 'Cancel',
        okButtonProps: danger ? { danger: true } : undefined,
        focusable: { autoFocusButton: 'cancel' },
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
}
