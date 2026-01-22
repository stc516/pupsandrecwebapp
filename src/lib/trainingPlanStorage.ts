import type { TrainingPlanState } from '../context/TrainingPlanContext';

const STORAGE_KEY = 'trainingPlanState:v1';

export const loadTrainingPlanState = (): TrainingPlanState => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as TrainingPlanState;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch (error) {
    console.warn('Failed to parse training plan state', error);
    return {};
  }
};

export const saveTrainingPlanState = (state: TrainingPlanState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
