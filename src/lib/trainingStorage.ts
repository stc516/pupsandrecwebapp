import type { TrainingSession } from '../types';

const STORAGE_KEY = 'trainingSessions';

export const loadTrainingSessions = (): TrainingSession[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as TrainingSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load training sessions', error);
    return [];
  }
};

export const saveTrainingSessions = (sessions: TrainingSession[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};
