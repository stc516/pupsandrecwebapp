import { Sparkles } from 'lucide-react';

import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../hooks/useAuth';
import { calculateLevel, nextLevelProgress, XP_PER_LEVEL } from '../utils/xp';
import { PetSwitcher } from './pet-switcher';

export const TopBar = () => {
  const { xp } = useAppState();
  const { logout, isLoading } = useAuth();
  const level = calculateLevel(xp);
  const currentProgress = nextLevelProgress(xp);

  const handleLogout = () => {
    logout().catch((error: unknown) => {
      console.error('Failed to log out', error);
    });
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-border/70 bg-white/85 px-4 pb-3 pt-[calc(0.75rem+var(--safe-area-top))] shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">Pups & Rec</p>
        <h1 className="text-base font-semibold text-brand-primary sm:text-lg">Daily Companion</h1>
        <div className="mt-1 h-1 w-20 rounded-full bg-gradient-to-r from-brand-accent to-brand-blush" />
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right text-xs text-text-muted">
          <span className="font-semibold text-brand-primary">Level {level}</span>
          <span>
            {currentProgress}/{XP_PER_LEVEL} XP
          </span>
          <div className="mt-1 h-1.5 w-28 rounded-full bg-brand-border">
            <div
              className="h-full rounded-full bg-brand-accent"
              style={{ width: `${(currentProgress / XP_PER_LEVEL) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-accent to-brand-accentDeep px-3 py-1 text-sm font-semibold text-white shadow-sm">
          <Sparkles size={16} />
          <span>{xp} XP</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="hidden rounded-full border border-brand-border px-3 py-1 text-sm font-semibold text-brand-primary transition hover:bg-brand-subtle disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
          >
            Log out
          </button>
          <PetSwitcher />
        </div>
      </div>
    </header>
  );
};
