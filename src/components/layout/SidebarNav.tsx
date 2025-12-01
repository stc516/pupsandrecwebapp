import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

import { navItems } from './navItems';

export const SidebarNav = () => (
  <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-60 flex-shrink-0 rounded-3xl border border-brand-border bg-white p-4 shadow-card md:flex md:flex-col">
    <div className="mb-4 text-sm font-semibold text-text-muted">Navigate</div>
    <nav className="space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-brand-subtle',
              isActive && 'bg-brand-accent/10 text-brand-accent'
            )
          }
        >
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);
