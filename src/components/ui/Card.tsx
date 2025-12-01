import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = ({ children, className, padding = 'md', ...props }: CardProps) => (
  <div
    className={clsx(
      'rounded-[28px] border border-brand-border bg-white shadow-card',
      paddingMap[padding],
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
