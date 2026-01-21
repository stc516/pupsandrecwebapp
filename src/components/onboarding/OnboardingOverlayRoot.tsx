import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingIntro } from './OnboardingIntro';
import { TourManager } from './OnboardingTour';

export const OnboardingOverlayRoot = () => {
  const { state, status, isOpen, dismissIntro, closeTour } = useOnboarding();
  const showIntro = !state.completed && !state.introSeen && status === 'idle';
  const lockBody = showIntro;
  const portalRootRef = useRef<HTMLDivElement | null>(null);
  const bodyOverflowRef = useRef<string | null>(null);

  if ((showIntro || isOpen) && typeof document !== 'undefined' && !portalRootRef.current) {
    const existing = Array.from(document.querySelectorAll('[data-onboarding-overlay-root="true"]')) as HTMLDivElement[];
    if (existing.length > 1) {
      existing.slice(1).forEach((node) => node.remove());
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[Onboarding] Multiple overlay roots detected. Removed extras.');
      }
    }
    portalRootRef.current = existing[0] ?? document.createElement('div');
    portalRootRef.current.setAttribute('data-onboarding-overlay-root', 'true');
    if (!portalRootRef.current.parentElement) {
      document.body.appendChild(portalRootRef.current);
    }
  }

  useEffect(() => {
    if (!lockBody) return;
    if (bodyOverflowRef.current === null) {
      bodyOverflowRef.current = document.body.style.overflow;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
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

  useEffect(() => {
    if (!showIntro && !isOpen) {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
      if (portalRootRef.current) {
        portalRootRef.current.remove();
        portalRootRef.current = null;
      }
      const orphaned = document.querySelectorAll('[data-onboarding-overlay-root], [data-onboarding-overlay]');
      if (orphaned.length > 0) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('[Onboarding] Overlay still mounted while idle. Removing.', orphaned);
        }
        orphaned.forEach((node) => node.remove());
      }
      return;
    }

    if (!portalRootRef.current) {
      return;
    }
  }, [isOpen, showIntro]);

  useEffect(() => {
    return () => {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
      if (portalRootRef.current) {
        portalRootRef.current.remove();
        portalRootRef.current = null;
      }
      const orphaned = document.querySelectorAll('[data-onboarding-overlay-root], [data-onboarding-overlay]');
      orphaned.forEach((node) => node.remove());
    };
  }, []);

  if (!showIntro && !isOpen) return null;

  return createPortal(
    <>
      {showIntro && (
        <div className="fixed inset-0 z-50" data-onboarding-overlay="intro">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur onboarding-backdrop"
            data-onboarding-overlay="backdrop"
          />
          <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
            <OnboardingIntro />
          </div>
        </div>
      )}
      {isOpen && <TourManager />}
    </>,
    portalRootRef.current ?? document.body,
  );
};
