import clsx from 'clsx';
import type { ReactNode } from 'react';

interface StatPillProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: 'sky' | 'slate' | 'emerald';
}

const accentClasses: Record<NonNullable<StatPillProps['accent']>, string> = {
  sky: 'bg-brand-accentSoft text-brand-accent',
  slate: 'bg-brand-subtle text-brand-primary',
  emerald: 'bg-emerald-50 text-emerald-800',
};

export const StatPill = ({ label, value, icon, accent = 'sky' }: StatPillProps) => (
  <div className={clsx('flex flex-col rounded-2xl px-4 py-3', accentClasses[accent])}>
    <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
    <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
      {icon}
      {value}
    </div>
  </div>
);
