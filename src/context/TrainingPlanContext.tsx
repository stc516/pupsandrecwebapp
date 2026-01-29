import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { PetId, TrainingPlan } from '../types';
import { loadTrainingPlanState, saveTrainingPlanState } from '../lib/trainingPlanStorage';
import { TRAINING_PLANS } from '../lib/trainingPlans';

export type TrainingPlanPetState = {
  activePlanId: string | null;
  startDateISO: string | null;
  completedDayNumbers: number[];
  completedTaskIds: string[];
  streak: {
    current: number;
    best: number;
    lastCompletedISO: string | null;
  };
};

export type TrainingPlanState = Record<PetId, TrainingPlanPetState>;

interface TrainingPlanContextValue {
  state: TrainingPlanState;
  startPlan: (petId: PetId, planId: string) => void;
  resetPlan: (petId: PetId) => void;
  restartPlan: (petId: PetId) => void;
  toggleTask: (petId: PetId, taskId: string) => void;
  completeDay: (petId: PetId, dayNumber: number, totalDays: number, allTasksDone: boolean) => void;
  getPlanForPet: (petId: PetId) => { plan: TrainingPlan | null; petState: TrainingPlanPetState };
}

const defaultPetState = (): TrainingPlanPetState => ({
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

  const startPlan = useCallback((petId: PetId, planId: string) => {
    setState((prev) => ({
      ...prev,
      [petId]: {
        ...defaultPetState(),
        activePlanId: planId,
        startDateISO: startOfDay(new Date()).toISOString(),
      },
    }));
  }, []);

  const resetPlan = useCallback((petId: PetId) => {
    setState((prev) => ({
      ...prev,
      [petId]: defaultPetState(),
    }));
  }, []);

  const restartPlan = useCallback((petId: PetId) => {
    setState((prev) => {
      const current = prev[petId];
      if (!current?.activePlanId) return prev;
      return {
        ...prev,
        [petId]: {
          ...defaultPetState(),
          activePlanId: current.activePlanId,
          startDateISO: startOfDay(new Date()).toISOString(),
        },
      };
    });
  }, []);

  const toggleTask = useCallback((petId: PetId, taskId: string) => {
    setState((prev) => {
      const current = prev[petId] ?? defaultPetState();
      const nextTaskIds = current.completedTaskIds.includes(taskId)
        ? current.completedTaskIds.filter((id) => id !== taskId)
        : [...current.completedTaskIds, taskId];
      return {
        ...prev,
        [petId]: {
          ...current,
          completedTaskIds: nextTaskIds,
        },
      };
    });
  }, []);

  const completeDay = useCallback(
    (petId: PetId, dayNumber: number, totalDays: number, allTasksDone: boolean) => {
      if (!allTasksDone) return;
      setState((prev) => {
        const current = prev[petId] ?? defaultPetState();
        if (current.completedDayNumbers.includes(dayNumber)) return prev;
        const today = startOfDay(new Date());
        const lastCompleted = current.streak.lastCompletedISO
          ? startOfDay(new Date(current.streak.lastCompletedISO))
          : null;
        const diff = lastCompleted ? differenceInCalendarDays(today, lastCompleted) : null;
        const nextCurrent = diff === 1 ? current.streak.current + 1 : 1;
        const nextBest = Math.max(current.streak.best, nextCurrent);
        return {
          ...prev,
          [petId]: {
            ...current,
            completedDayNumbers: [...current.completedDayNumbers, dayNumber],
            completedTaskIds: [],
            streak: {
              current: dayNumber >= totalDays ? nextCurrent : nextCurrent,
              best: nextBest,
              lastCompletedISO: today.toISOString(),
            },
          },
        };
      });
    },
    [],
  );

  const getPlanForPet = useCallback(
    (petId: PetId) => {
      const petState = state[petId] ?? defaultPetState();
      const plan = petState.activePlanId
        ? TRAINING_PLANS.find((item) => item.id === petState.activePlanId) ?? null
        : null;
      return { plan, petState };
    },
    [state],
  );

  const value = useMemo<TrainingPlanContextValue>(
    () => ({
      state,
      startPlan,
      resetPlan,
      restartPlan,
      toggleTask,
      completeDay,
      getPlanForPet,
    }),
    [completeDay, getPlanForPet, resetPlan, restartPlan, startPlan, state, toggleTask],
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
