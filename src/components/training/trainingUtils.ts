import { addDays, isSameDay, startOfDay } from 'date-fns';
import { nanoid } from 'nanoid';

import type { PetId, TrainingSession } from '../../types';

export type TrainingFrequency = 'once' | 'three-per-week' | 'weekday' | 'daily' | 'custom';

export const trainingFrequencyOptions: Array<{ value: TrainingFrequency; label: string }> = [
  { value: 'once', label: 'Once' },
  { value: 'three-per-week', label: '3x/week' },
  { value: 'weekday', label: 'Every weekday' },
  { value: 'daily', label: 'Daily' },
  { value: 'custom', label: 'Custom' },
];

export const weekDayOptions = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export type TrainingSchedule = {
  petId: PetId;
  title: string;
  type: TrainingSession['type'];
  durationMin?: number;
  distanceMi?: number;
  frequency: TrainingFrequency;
  daysOfWeek?: number[];
  timeOfDay: string;
  startDateISO: string;
};

const buildDateWithTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(date);
  next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return next;
};

const getWeekDaysForFrequency = (frequency: TrainingFrequency) => {
  if (frequency === 'three-per-week') return [1, 3, 5];
  if (frequency === 'weekday') return [1, 2, 3, 4, 5];
  if (frequency === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  return [];
};

export const buildTrainingSessions = (schedule: TrainingSchedule): TrainingSession[] => {
  const startDate = startOfDay(new Date(schedule.startDateISO));
  const horizonDays = 7;
  const sessions: TrainingSession[] = [];
  const today = startOfDay(new Date());

  if (schedule.frequency === 'once') {
    const dateTime = buildDateWithTime(startDate, schedule.timeOfDay).toISOString();
    sessions.push({
      id: nanoid(),
      petId: schedule.petId,
      title: schedule.title,
      dateTimeISO: dateTime,
      durationMin: schedule.durationMin,
      distanceMi: schedule.distanceMi,
      type: schedule.type,
      createdAt: new Date().toISOString(),
    });
    return sessions;
  }

  const weekDays =
    schedule.frequency === 'custom' ? schedule.daysOfWeek ?? [] : getWeekDaysForFrequency(schedule.frequency);

  for (let i = 0; i < horizonDays; i += 1) {
    const candidate = addDays(startDate, i);
    if (candidate.getTime() < today.getTime()) continue;
    if (!weekDays.includes(candidate.getDay())) continue;
    if (schedule.frequency === 'three-per-week' && sessions.length >= 3) break;
    const dateTime = buildDateWithTime(candidate, schedule.timeOfDay).toISOString();
    sessions.push({
      id: nanoid(),
      petId: schedule.petId,
      title: schedule.title,
      dateTimeISO: dateTime,
      durationMin: schedule.durationMin,
      distanceMi: schedule.distanceMi,
      type: schedule.type,
      createdAt: new Date().toISOString(),
    });
  }

  if (schedule.frequency === 'daily' && sessions.length === 0) {
    const dateTime = buildDateWithTime(startDate, schedule.timeOfDay).toISOString();
    sessions.push({
      id: nanoid(),
      petId: schedule.petId,
      title: schedule.title,
      dateTimeISO: dateTime,
      durationMin: schedule.durationMin,
      distanceMi: schedule.distanceMi,
      type: schedule.type,
      createdAt: new Date().toISOString(),
    });
  }

  return sessions;
};

export const isSameISODate = (value: string, date: Date) => isSameDay(new Date(value), date);
