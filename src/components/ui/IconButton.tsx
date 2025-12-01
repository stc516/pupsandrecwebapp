import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label?: string;
}

export const IconButton = ({ icon, label, className, ...props }: IconButtonProps) => (
  <button
    className={clsx(
      'flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-accent hover:text-brand-primary',
      className,
    )}
    {...props}
  >
    {icon}
    {label}
  </button>
);
