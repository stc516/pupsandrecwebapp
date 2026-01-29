import { differenceInCalendarDays, startOfDay } from 'date-fns';
import type { PlanDay, TrainingPlan } from '../../types';

export const getPlanDayNumberForDate = (
  plan: TrainingPlan,
  startDateISO: string | null,
  date: Date,
): number | null => {
  if (!startDateISO) return null;
  const diff = differenceInCalendarDays(startOfDay(date), startOfDay(new Date(startDateISO)));
  const dayNumber = diff + 1;
  if (dayNumber < 1 || dayNumber > plan.durationDays) return null;
  return dayNumber;
};

export const getPlanDayForDate = (
  plan: TrainingPlan,
  startDateISO: string | null,
  date: Date,
): PlanDay | null => {
  const dayNumber = getPlanDayNumberForDate(plan, startDateISO, date);
  if (!dayNumber) return null;
  return plan.days.find((day) => day.day === dayNumber) ?? null;
};
