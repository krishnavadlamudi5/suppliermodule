import type { ThemeConfig } from 'antd';
import { color, palette, font, controlHeight } from './tokens';

/**
 * Ant Design theme built from our tokens. Colors flow in through the theme API
 * rather than `!important` overrides (schema §10).
 */
export const antdTheme: ThemeConfig = {
  token: {
    fontFamily: font.family,
    fontSize: 14,
    borderRadius: 8,
    borderRadiusSM: 4,
    borderRadiusLG: 12,
    controlHeight: controlHeight.md,
    controlHeightSM: controlHeight.sm,
    controlHeightLG: controlHeight.lg,

    colorPrimary: color('action-primary'),
    colorPrimaryHover: color('action-primary-hover'),
    colorPrimaryActive: color('action-primary-active'),
    colorPrimaryBg: color('bg-selected'),
    colorPrimaryBgHover: color('bg-selected-hover'),
    colorPrimaryBorder: palette['green-200'],

    colorSuccess: palette['success-700'],
    colorSuccessBg: palette['success-50'],
    colorWarning: palette['warning-500'],
    colorWarningBg: palette['warning-50'],
    colorError: palette['error-600'],
    colorErrorBg: palette['error-50'],
    colorInfo: palette['info-900'],
    colorInfoBg: palette['info-100'],

    colorLink: color('text-link'),
    colorLinkHover: color('text-link-hover'),
    colorLinkActive: color('action-primary-active'),

    colorText: color('text-primary'),
    colorTextHeading: color('text-heading'),
    colorTextSecondary: color('text-secondary'),
    colorTextTertiary: color('text-muted'),
    colorTextQuaternary: color('text-disabled'),
    colorTextPlaceholder: color('text-disabled'),
    colorTextDisabled: color('text-disabled'),

    colorBorder: color('border-default'),
    colorBorderSecondary: color('border-subtle'),
    colorSplit: color('border-subtle'),

    colorBgLayout: color('bg-app'),
    colorBgContainer: color('bg-surface'),
    colorBgElevated: color('bg-surface'),
    colorBgContainerDisabled: color('action-disabled-bg'),
    colorFillAlter: color('bg-muted'),

    controlOutline: color('focus-ring'),
    boxShadow: '0 8px 24px rgba(16, 18, 35, 0.08)',
    boxShadowSecondary: '0 8px 24px rgba(16, 18, 35, 0.08)',
  },
  components: {
    Button: {
      fontWeight: 600,
      borderRadiusLG: 8,
      borderRadiusSM: 6,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      paddingInline: 16,
      paddingInlineSM: 12,
      paddingInlineLG: 20,
      // "default" antd button = our Secondary
      defaultBg: color('action-secondary'),
      defaultColor: color('text-primary'),
      defaultBorderColor: color('border-default'),
      defaultHoverBg: color('action-secondary-hover'),
      defaultHoverColor: color('text-primary'),
      defaultHoverBorderColor: color('border-default'),
      defaultActiveBg: color('action-secondary-hover'),
      defaultActiveColor: color('text-primary'),
      defaultActiveBorderColor: color('border-strong'),
      textTextColor: color('text-brand'),
      textHoverBg: color('bg-brand-subtle'),
    },
    Input: {
      activeBorderColor: color('border-brand'),
      hoverBorderColor: color('border-strong'),
      activeShadow: `0 0 0 2px ${color('focus-ring')}`,
    },
    Select: {
      optionSelectedBg: color('bg-selected'),
      optionSelectedColor: color('text-primary'),
    },
    Table: {
      headerBg: color('bg-muted'),
      headerColor: color('text-secondary'),
      headerSplitColor: 'transparent',
      rowHoverBg: color('bg-brand-subtle'),
      rowSelectedBg: color('bg-selected'),
      rowSelectedHoverBg: color('bg-selected-hover'),
      borderColor: color('border-subtle'),
    },
    Menu: {
      itemSelectedBg: color('bg-selected'),
      itemSelectedColor: color('text-brand'),
      itemHoverBg: color('bg-muted'),
      itemColor: color('text-secondary'),
    },
    Tabs: {
      inkBarColor: color('action-primary'),
      itemSelectedColor: color('text-primary'),
      itemHoverColor: color('text-primary'),
      itemColor: color('text-secondary'),
    },
    Segmented: {
      itemSelectedBg: color('action-primary'),
      itemSelectedColor: color('text-on-brand'),
    },
    Checkbox: {
      colorPrimary: color('action-primary'),
    },
  },
};
