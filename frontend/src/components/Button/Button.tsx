import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import './Button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accept' | 'reject';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<AntButtonProps, 'type' | 'size' | 'variant' | 'color' | 'danger' | 'ghost'> {
  /** Visual role. Defaults to `secondary`. */
  variant?: ButtonVariant;
  /** 32 / 36 / 44 px. Defaults to `md`. */
  size?: ButtonSize;
}

const SIZE: Record<ButtonSize, AntButtonProps['size']> = { sm: 'small', md: 'middle', lg: 'large' };

const VARIANT: Record<ButtonVariant, Pick<AntButtonProps, 'type' | 'color' | 'variant'>> = {
  primary: { type: 'primary' },
  secondary: { type: 'default' },
  ghost: { type: 'text' },
  danger: { color: 'danger', variant: 'outlined' },
  accept: { type: 'default' },
  reject: { type: 'default' },
};

/**
 * The one button in the portal. Wraps antd `Button` so every variant gets its
 * colors from the theme (see `theme/antdTheme.ts`), with `accept` / `reject`
 * tints layered on in Button.scss.
 */
export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  const cls = ['bc-btn', `bc-btn--${variant}`, className].filter(Boolean).join(' ');
  return <AntButton {...VARIANT[variant]} size={SIZE[size]} className={cls} {...rest} />;
}
