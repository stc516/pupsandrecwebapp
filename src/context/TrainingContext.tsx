import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { TrainingSession } from '../types';
import { loadTrainingSessions, saveTrainingSessions } from '../lib/trainingStorage';

interface TrainingContextValue {
  sessions: TrainingSession[];
  addSessions: (sessions: TrainingSession[]) => void;
  removeSession: (id: string) => void;
}

const TrainingContext = createContext<TrainingContextValue | undefined>(undefined);

export const TrainingProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<TrainingSession[]>(() => loadTrainingSessions());

  useEffect(() => {
    saveTrainingSessions(sessions);
  }, [sessions]);

  const addSessions = useCallback((next: TrainingSession[]) => {
    setSessions((prev) => [...next, ...prev]);
  }, []);

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  }, []);

  const value = useMemo<TrainingContextValue>(
    () => ({
      sessions,
      addSessions,
      removeSession,
    }),
    [addSessions, removeSession, sessions],
  );

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
};

export const useTraining = () => {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};
