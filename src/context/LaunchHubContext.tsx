import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { nanoid } from 'nanoid';

import type {
  GrowthExperiment,
  GrowthExperimentStatus,
  LaunchTask,
  LaunchTaskPriority,
  LaunchTaskStatus,
} from '../types';
import { loadGrowthExperiments, loadLaunchTasks, saveGrowthExperiments, saveLaunchTasks } from '../lib/launchHubStorage';

interface LaunchHubContextValue {
  tasks: LaunchTask[];
  experiments: GrowthExperiment[];
  updateTask: (id: string, updates: Partial<LaunchTask>) => void;
  updateExperiment: (id: string, updates: Partial<GrowthExperiment>) => void;
  setTaskStatus: (id: string, status: LaunchTaskStatus) => void;
  setExperimentStatus: (id: string, status: GrowthExperimentStatus) => void;
  duplicateTask: (id: string) => void;
  duplicateExperiment: (id: string) => void;
  archiveTask: (id: string) => void;
  archiveExperiment: (id: string) => void;
  getNextTask: () => LaunchTask | null;
}

const LaunchHubContext = createContext<LaunchHubContextValue | undefined>(undefined);

const priorityRank: Record<LaunchTaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export const LaunchHubProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<LaunchTask[]>(() => loadLaunchTasks());
  const [experiments, setExperiments] = useState<GrowthExperiment[]>(() => loadGrowthExperiments());

  useEffect(() => {
    saveLaunchTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveGrowthExperiments(experiments);
  }, [experiments]);

  const updateTask = useCallback((id: string, updates: Partial<LaunchTask>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));
  }, []);

  const updateExperiment = useCallback((id: string, updates: Partial<GrowthExperiment>) => {
    setExperiments((prev) => prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)));
  }, []);

  const setTaskStatus = useCallback((id: string, status: LaunchTaskStatus) => {
    updateTask(id, { status });
  }, [updateTask]);

  const setExperimentStatus = useCallback((id: string, status: GrowthExperimentStatus) => {
    updateExperiment(id, { status });
  }, [updateExperiment]);

  const duplicateTask = useCallback((id: string) => {
    setTasks((prev) => {
      const original = prev.find((task) => task.id === id);
      if (!original) return prev;
      const clone: LaunchTask = {
        ...original,
        id: nanoid(),
        status: 'todo',
        createdAtISO: new Date().toISOString(),
      };
      return [clone, ...prev];
    });
  }, []);

  const duplicateExperiment = useCallback((id: string) => {
    setExperiments((prev) => {
      const original = prev.find((exp) => exp.id === id);
      if (!original) return prev;
      const clone: GrowthExperiment = {
        ...original,
        id: nanoid(),
        status: 'idea',
        startISO: new Date().toISOString(),
        endISO: undefined,
        results: undefined,
      };
      return [clone, ...prev];
    });
  }, []);

  const archiveTask = useCallback((id: string) => {
    setTaskStatus(id, 'archived');
  }, [setTaskStatus]);

  const archiveExperiment = useCallback((id: string) => {
    setExperimentStatus(id, 'archived');
  }, [setExperimentStatus]);

  const getNextTask = useCallback(() => {
    const candidates = tasks.filter((task) => task.status === 'todo' || task.status === 'doing');
    if (candidates.length === 0) return null;
    return candidates
      .slice()
      .sort((a, b) => {
        if (priorityRank[b.priority] !== priorityRank[a.priority]) {
          return priorityRank[b.priority] - priorityRank[a.priority];
        }
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.createdAtISO.localeCompare(b.createdAtISO);
      })[0];
  }, [tasks]);

  const value = useMemo<LaunchHubContextValue>(
    () => ({
      tasks,
      experiments,
      updateTask,
      updateExperiment,
      setTaskStatus,
      setExperimentStatus,
      duplicateTask,
      duplicateExperiment,
      archiveTask,
      archiveExperiment,
      getNextTask,
    }),
    [
      archiveExperiment,
      archiveTask,
      duplicateExperiment,
      duplicateTask,
      experiments,
      getNextTask,
      setExperimentStatus,
      setTaskStatus,
      tasks,
      updateExperiment,
      updateTask,
    ],
  );

  return <LaunchHubContext.Provider value={value}>{children}</LaunchHubContext.Provider>;
};

export const useLaunchHub = () => {
  const context = useContext(LaunchHubContext);
  if (!context) {
    throw new Error('useLaunchHub must be used within a LaunchHubProvider');
  }
  return context;
};
