import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

import type { PetId, TrainingPlan } from '../types';
import { loadTrainingPlanState, saveTrainingPlanState } from '../lib/trainingPlanStorage';
import { TRAINING_PLANS } from '../lib/trainingPlans';

export type TrainingPlanStreak = {
  current: number;
  best: number;
  lastCompletedISO: string | null;
};

export type TrainingPlanPetState = {
  activePlanId: string | null;
  startDateISO: string | null;
  completedDayNumbers: number[];
  completedTaskIds: string[];
  streak: TrainingPlanStreak;
};

export type TrainingPlanState = Record<PetId, TrainingPlanPetState>;

interface TrainingPlanContextValue {
  plans: TrainingPlan[];
  state: TrainingPlanState;
  getPetState: (petId: PetId | null | undefined) => TrainingPlanPetState;
  startPlan: (petId: PetId, planId: string, startDateISO: string) => void;
  resetPlan: (petId: PetId) => void;
  restartPlan: (petId: PetId) => void;
  toggleTask: (petId: PetId, taskId: string) => void;
  completeDay: (petId: PetId, dayNumber: number, dayDateISO: string, taskIds: string[]) => boolean;
}

const createEmptyPetState = (): TrainingPlanPetState => ({
  activePlanId: null,
  startDateISO: null,
  completedDayNumbers: [],
  completedTaskIds: [],
  streak: {
    current: 0,
    best: 0,
    lastCompletedISO: null,
  },
});

const TrainingPlanContext = createContext<TrainingPlanContextValue | undefined>(undefined);

export const TrainingPlanProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<TrainingPlanState>(() => loadTrainingPlanState());

  useEffect(() => {
    saveTrainingPlanState(state);
  }, [state]);

  const getPetState = useCallback(
    (petId: PetId | null | undefined) => {
      if (!petId) return createEmptyPetState();
      return state[petId] ?? createEmptyPetState();
    },
    [state],
  );

  const updatePetState = useCallback((petId: PetId, updater: (prev: TrainingPlanPetState) => TrainingPlanPetState) => {
    setState((prev) => ({
      ...prev,
      [petId]: updater(prev[petId] ?? createEmptyPetState()),
    }));
  }, []);

  const startPlan = useCallback((petId: PetId, planId: string, startDateISO: string) => {
    updatePetState(petId, () => ({
      activePlanId: planId,
      startDateISO,
      completedDayNumbers: [],
      completedTaskIds: [],
      streak: { current: 0, best: 0, lastCompletedISO: null },
    }));
  }, [updatePetState]);

  const resetPlan = useCallback((petId: PetId) => {
    updatePetState(petId, () => createEmptyPetState());
  }, [updatePetState]);

  const restartPlan = useCallback((petId: PetId) => {
    const planId = state[petId]?.activePlanId;
    if (!planId) return;
    startPlan(petId, planId, new Date().toISOString());
  }, [startPlan, state]);

  const toggleTask = useCallback((petId: PetId, taskId: string) => {
    updatePetState(petId, (prev) => {
      const exists = prev.completedTaskIds.includes(taskId);
      return {
        ...prev,
        completedTaskIds: exists
          ? prev.completedTaskIds.filter((id) => id !== taskId)
          : [...prev.completedTaskIds, taskId],
      };
    });
  }, [updatePetState]);

  const completeDay = useCallback(
    (petId: PetId, dayNumber: number, dayDateISO: string, taskIds: string[]) => {
      let allowed = false;
      updatePetState(petId, (prev) => {
        const allTasksComplete = taskIds.every((id) => prev.completedTaskIds.includes(id));
        if (!allTasksComplete) return prev;
        allowed = true;
        if (prev.completedDayNumbers.includes(dayNumber)) {
          return { ...prev, completedTaskIds: [] };
        }
        const lastCompleted = prev.streak.lastCompletedISO ? new Date(prev.streak.lastCompletedISO) : null;
        const currentDate = startOfDay(new Date(dayDateISO));
        let currentStreak = 1;
        if (lastCompleted) {
          const diff = differenceInCalendarDays(currentDate, startOfDay(lastCompleted));
          if (diff === 1) currentStreak = prev.streak.current + 1;
          if (diff === 0) currentStreak = prev.streak.current;
        }
        const best = Math.max(prev.streak.best, currentStreak);
        return {
          ...prev,
          completedDayNumbers: [...prev.completedDayNumbers, dayNumber],
          completedTaskIds: [],
          streak: {
            current: currentStreak,
            best,
            lastCompletedISO: currentDate.toISOString(),
          },
        };
      });
      return allowed;
    },
    [updatePetState],
  );

  const value = useMemo<TrainingPlanContextValue>(
    () => ({
      plans: TRAINING_PLANS,
      state,
      getPetState,
      startPlan,
      resetPlan,
      restartPlan,
      toggleTask,
      completeDay,
    }),
    [completeDay, getPetState, resetPlan, restartPlan, startPlan, state, toggleTask],
  );

  return <TrainingPlanContext.Provider value={value}>{children}</TrainingPlanContext.Provider>;
};

export const useTrainingPlan = () => {
  const context = useContext(TrainingPlanContext);
  if (!context) {
    throw new Error('useTrainingPlan must be used within a TrainingPlanProvider');
  }
  return context;
};
