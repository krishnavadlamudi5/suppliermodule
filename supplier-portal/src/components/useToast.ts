import { App } from 'antd';

/**
 * Toasts for confirmations ("Invitation sent", "Document accepted").
 * Thin wrapper over antd's message so pages never import antd's API directly.
 */
export function useToast() {
  const { message } = App.useApp();
  return {
    success: (text: string) => message.success(text),
    info: (text: string) => message.info(text),
    error: (text: string) => message.error(text),
    /** For buttons whose feature isn't built yet — says so plainly instead of pretending it worked. */
    notYet: (feature: string) => message.info({ content: `${feature} isn't available in this version yet.`, key: 'not-yet' }),
  };
}
