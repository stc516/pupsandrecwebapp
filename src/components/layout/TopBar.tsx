import { Sparkles } from 'lucide-react';

import { useAppState } from '../../hooks/useAppState';
import { calculateLevel, nextLevelProgress, XP_PER_LEVEL } from '../../utils/xp';
import { PetSwitcher } from './pet-switcher';

export const TopBar = () => {
  const { xp } = useAppState();
  const level = calculateLevel(xp);
  const currentProgress = nextLevelProgress(xp);

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
        <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-accent to-brand-accentDeep px-3 py-1 text-sm font-semibold text-white shadow">
          <Sparkles size={16} />
          <span>{xp} XP</span>
        </div>
        <PetSwitcher />
      </div>
    </header>
  );
};
