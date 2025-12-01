import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'success' | 'info' | 'warning';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  info: 'bg-brand-accent/15 text-brand-accent',
  warning: 'bg-amber-50 text-amber-700',
};

export const Badge = ({ className, tone = 'info', children, ...props }: BadgeProps) => (
  <span
    className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', toneClasses[tone], className)}
    {...props}
  >
    {children}
  </span>
);
