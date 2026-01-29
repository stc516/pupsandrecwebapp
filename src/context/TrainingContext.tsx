import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { TrainingSession } from '../types';
import { loadTrainingSessions, saveTrainingSessions } from '../lib/trainingStorage';

interface TrainingContextValue {
  sessions: TrainingSession[];
  addSessions: (sessions: TrainingSession[]) => void;
  removeSession: (sessionId: string) => void;
}

const TrainingContext = createContext<TrainingContextValue | undefined>(undefined);

export const TrainingProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<TrainingSession[]>(() => loadTrainingSessions());

  useEffect(() => {
    saveTrainingSessions(sessions);
  }, [sessions]);

  const addSessions = (nextSessions: TrainingSession[]) => {
    setSessions((prev) => [...nextSessions, ...prev]);
  };

  const removeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
  };

  const value = useMemo(
    () => ({
      sessions,
      addSessions,
      removeSession,
    }),
    [sessions],
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
