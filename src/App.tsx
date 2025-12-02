import { Outlet } from 'react-router-dom';

import { BottomNav } from './components/layout/BottomNav';
import { SidebarNav } from './components/layout/SidebarNav';
import { TopBar } from './components/layout/TopBar';
import { InstallPrompt } from './components/ui/InstallPrompt';

export const AppLayout = () => (
  <div className="relative flex min-h-screen flex-col bg-brand-subtle/60 text-slate-900">
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
      <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(47,115,255,0.08),_transparent_55%)]" />
    </div>
    <TopBar />
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-4 pb-24 sm:py-6 md:px-6 md:pb-8">
      <SidebarNav />
      <main className="flex-1 pb-6">
        <Outlet />
      </main>
    </div>
    <BottomNav />
    <InstallPrompt />
  </div>
);

export default AppLayout;
