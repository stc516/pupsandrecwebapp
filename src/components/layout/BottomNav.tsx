import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

import { navItems } from './navItems';

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-brand-border bg-white/90 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <ul className="flex items-center justify-between px-4 pb-[calc(0.65rem+var(--safe-area-bottom))] pt-2">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center rounded-xl px-3 py-2 text-xs font-medium text-text-secondary transition',
                  isActive && 'text-brand-accent'
                )
              }
            >
              <item.icon size={22} />
              <span className="mt-1">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
