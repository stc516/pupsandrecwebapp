import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const PrimaryButton = ({ className, startIcon, endIcon, children, ...props }: ButtonProps) => (
  <button
    className={clsx(
      baseStyles,
      'bg-brand-accent text-white shadow-sm hover:bg-brand-accent/90 focus-visible:outline-brand-accent',
      className,
    )}
    {...props}
  >
    {startIcon}
    {children}
    {endIcon}
  </button>
);

export const SecondaryButton = ({ className, startIcon, endIcon, children, ...props }: ButtonProps) => (
  <button
    className={clsx(
      baseStyles,
      'border border-brand-border bg-white text-brand-primary hover:bg-brand-subtle focus-visible:outline-brand-accent',
      className,
    )}
    {...props}
  >
    {startIcon}
    {children}
    {endIcon}
  </button>
);
