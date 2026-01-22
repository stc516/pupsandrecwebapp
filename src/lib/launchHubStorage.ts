import type { GrowthExperiment, LaunchTask } from '../types';
import { buildGrowthExperiments, buildLaunchTasks } from './launchHubSeeds';

const TASKS_KEY = 'launchTasks:v1';
const EXPERIMENTS_KEY = 'growthExperiments:v1';

export const loadLaunchTasks = (): LaunchTask[] => {
  if (typeof window === 'undefined') return buildLaunchTasks();
  try {
    const stored = window.localStorage.getItem(TASKS_KEY);
    if (!stored) return buildLaunchTasks();
    const parsed = JSON.parse(stored) as LaunchTask[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : buildLaunchTasks();
  } catch (error) {
    console.warn('Failed to parse launch tasks', error);
    return buildLaunchTasks();
  }
};

export const saveLaunchTasks = (tasks: LaunchTask[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const loadGrowthExperiments = (): GrowthExperiment[] => {
  if (typeof window === 'undefined') return buildGrowthExperiments();
  try {
    const stored = window.localStorage.getItem(EXPERIMENTS_KEY);
    if (!stored) return buildGrowthExperiments();
    const parsed = JSON.parse(stored) as GrowthExperiment[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : buildGrowthExperiments();
  } catch (error) {
    console.warn('Failed to parse growth experiments', error);
    return buildGrowthExperiments();
  }
};

export const saveGrowthExperiments = (experiments: GrowthExperiment[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EXPERIMENTS_KEY, JSON.stringify(experiments));
};
