import { useEffect } from 'react';

import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingIntro } from './OnboardingIntro';
import { TourManager } from './OnboardingTour';

export const OnboardingOverlayRoot = () => {
  const { state, status, isOpen, dismissIntro, closeTour } = useOnboarding();
  const showIntro = !state.completed && !state.introSeen && status === 'idle';
  const lockBody = showIntro;

  useEffect(() => {
    if (!lockBody) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lockBody]);

  useEffect(() => {
    if (!showIntro && !isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showIntro) void dismissIntro();
      if (isOpen) void closeTour('escape');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeTour, dismissIntro, isOpen, showIntro]);

  if (!showIntro && !isOpen) return null;

  return (
    <>
      {showIntro && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur onboarding-backdrop" />
          <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
            <OnboardingIntro />
          </div>
        </div>
      )}
      {isOpen && <TourManager />}
    </>
  );
};
