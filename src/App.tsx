import { Outlet } from 'react-router-dom';

import { BottomNav } from './components/layout/BottomNav';
import { SidebarNav } from './components/layout/SidebarNav';
import { TopBar } from './components/layout/TopBar';

export const AppLayout = () => (
  <div className="flex min-h-screen flex-col bg-brand-subtle text-slate-900">
    <TopBar />
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-4 pb-24 sm:py-6 md:px-6 md:pb-8">
      <SidebarNav />
      <main className="flex-1 pb-6">
        <Outlet />
      </main>
    </div>
    <BottomNav />
  </div>
);

export default AppLayout;
