import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

interface TagChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent';
}

export const TagChip = ({ className, children, variant = 'default', ...props }: TagChipProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
      variant === 'default' && 'bg-brand-subtle text-text-secondary',
      variant === 'accent' && 'bg-brand-accent/15 text-brand-accent',
      className,
    )}
    {...props}
  >
    {children}
  </span>
);
