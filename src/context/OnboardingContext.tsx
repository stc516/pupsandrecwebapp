import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export type TourStatus = 'idle' | 'waitingForTarget' | 'active' | 'paused';

export type OnboardingProgress = {
  completed: boolean;
  introSeen: boolean;
  skipped: boolean;
  lastStepIndex: number;
};

export type OnboardingState = OnboardingProgress & {
  checklist: {
    petAdded: boolean;
    avatarUploaded: boolean;
    activityLogged: boolean;
    journalWritten: boolean;
    reminderAdded: boolean;
  };
};

const defaultState: OnboardingState = {
  completed: false,
  introSeen: false,
  skipped: false,
  lastStepIndex: 0,
  checklist: {
    petAdded: false,
    avatarUploaded: false,
    activityLogged: false,
    journalWritten: false,
    reminderAdded: false,
  },
};

interface OnboardingContextValue {
  state: OnboardingState;
  status: TourStatus;
  isOpen: boolean;
  dismissIntro: () => Promise<void>;
  startTour: (reset?: boolean) => Promise<void>;
  restartTour: () => Promise<void>;
  closeTour: (reason: string, updates?: Partial<OnboardingProgress>, nextStatus?: TourStatus) => Promise<void>;
  nextStep: (maxStep: number) => Promise<void>;
  setLastStepIndex: (index: number) => Promise<void>;
  setTourStatus: (status: TourStatus) => void;
  setChecklist: (next: Partial<OnboardingState['checklist']>) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [status, setStatus] = useState<TourStatus>('idle');
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      lastUserIdRef.current = null;
      setState(defaultState);
      setStatus('idle');
      return;
    }
    if (lastUserIdRef.current === user.id) return;
    lastUserIdRef.current = user.id;
    const next = normalizeState(user.onboarding ?? {});
    setState(next);
    setStatus('idle');
  }, [user]);

  const persistProgress = useCallback((next: OnboardingState) => {
    if (!user) return;
    void supabase.auth
      .updateUser({ data: { onboarding: pickProgress(next) } })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('Onboarding metadata update failed', error);
        }
      });
  }, [user]);

  const updateProgress = useCallback(async (updater: (prev: OnboardingState) => OnboardingState) => {
    let nextState: OnboardingState | null = null;
    setState((prev) => {
      nextState = updater(prev);
      return nextState;
    });
    if (nextState) persistProgress(nextState);
  }, [persistProgress]);

  const dismissIntro = useCallback(async () => {
    await updateProgress((prev) => ({
      ...prev,
      introSeen: true,
    }));
  }, [updateProgress]);

  const startTour = useCallback(async (reset = false) => {
    setStatus('waitingForTarget');
    await updateProgress((prev) => ({
      ...prev,
      introSeen: true,
      skipped: false,
      lastStepIndex: reset ? 0 : sanitizeStepIndex(prev.lastStepIndex),
    }));
  }, [updateProgress]);

  const restartTour = useCallback(async () => {
    setStatus('idle');
    await updateProgress((prev) => ({
      ...prev,
      completed: false,
      introSeen: false,
      skipped: false,
      lastStepIndex: 0,
    }));
  }, [updateProgress]);

  const closeTour = useCallback(async (reason: string, updates: Partial<OnboardingProgress> = {}, nextStatus: TourStatus = 'idle') => {
    setStatus(nextStatus);
    await updateProgress((prev) => ({
      ...prev,
      ...updates,
      lastStepIndex: sanitizeStepIndex(updates.lastStepIndex ?? prev.lastStepIndex),
    }));
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[Tour] close (${reason})`);
    }
  }, [updateProgress]);

  const nextStep = useCallback(async (maxStep: number) => {
    await updateProgress((prev) => {
      const nextIndex = prev.lastStepIndex + 1;
      if (nextIndex > maxStep) {
        return {
          ...prev,
          completed: true,
          introSeen: true,
          skipped: false,
          lastStepIndex: 0,
        };
      }
      return {
        ...prev,
        lastStepIndex: nextIndex,
      };
    });
    setStatus('waitingForTarget');
  }, [updateProgress]);

  const setLastStepIndex = useCallback(async (index: number) => {
    await updateProgress((prev) => ({
      ...prev,
      lastStepIndex: sanitizeStepIndex(index),
    }));
  }, [updateProgress]);

  const setTourStatus = useCallback((nextStatus: TourStatus) => {
    setStatus(nextStatus);
  }, []);

  const setChecklist = useCallback(async (next: Partial<OnboardingState['checklist']>) => {
    setState((prev) => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        ...next,
      },
    }));
  }, []);

  const resetOnboarding = useCallback(async () => {
    setStatus('idle');
    await updateProgress(() => ({
      ...defaultState,
      checklist: {
        ...defaultState.checklist,
      },
    }));
  }, [updateProgress]);

  const value = useMemo<OnboardingContextValue>(() => ({
    state,
    status,
    isOpen: status === 'waitingForTarget' || status === 'active',
    dismissIntro,
    startTour,
    restartTour,
    closeTour,
    nextStep,
    setLastStepIndex,
    setTourStatus,
    setChecklist,
    resetOnboarding,
  }), [closeTour, dismissIntro, nextStep, resetOnboarding, restartTour, setChecklist, setLastStepIndex, setTourStatus, startTour, state, status]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

const pickProgress = (next: OnboardingState): OnboardingProgress => ({
  completed: next.completed,
  introSeen: next.introSeen,
  skipped: next.skipped,
  lastStepIndex: sanitizeStepIndex(next.lastStepIndex),
});

const normalizeState = (raw: Partial<OnboardingProgress>) => ({
  ...defaultState,
  completed: Boolean(raw.completed),
  introSeen: Boolean(raw.introSeen),
  skipped: Boolean(raw.skipped),
  lastStepIndex: sanitizeStepIndex(raw.lastStepIndex),
});

const sanitizeStepIndex = (index: unknown) => {
  if (typeof index !== 'number' || Number.isNaN(index)) return 0;
  return Math.max(0, Math.floor(index));
};
