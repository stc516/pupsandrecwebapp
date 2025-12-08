import type { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const PageLayout = ({ title, subtitle, actions, children }: PageLayoutProps) => (
  <section className="flex flex-col gap-4">
    <header className="flex flex-col gap-2.5 border-b border-brand-border pb-4 text-brand-primary md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-balance sm:text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary text-balance">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
    <div className="space-y-4 pb-20 sm:pb-10 md:pb-6">{children}</div>
  </section>
);
