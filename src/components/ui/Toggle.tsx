import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
}

export const ToggleSwitch = ({ checked, className, ...props }: ToggleProps) => (
  <button
    role="switch"
    aria-checked={checked}
    className={clsx(
      'relative inline-flex h-7 w-12 items-center rounded-full border border-transparent transition',
      checked ? 'bg-brand-accent' : 'bg-brand-border',
      className,
    )}
    {...props}
  >
    <span
      className={clsx(
        'inline-block h-5 w-5 transform rounded-full bg-white transition',
        checked ? 'translate-x-5' : 'translate-x-1',
      )}
    />
  </button>
);
