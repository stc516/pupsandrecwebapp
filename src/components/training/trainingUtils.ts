import { addDays } from 'date-fns';
import { nanoid } from 'nanoid';

import type { PetId, TrainingSession } from '../../types';

export type TrainingFrequency = 'once' | 'three' | 'weekday' | 'daily' | 'custom';

export const trainingFrequencyOptions: { value: TrainingFrequency; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'three', label: '3x this week' },
  { value: 'weekday', label: 'Every weekday' },
  { value: 'daily', label: 'Daily' },
  { value: 'custom', label: 'Custom…' },
];

export const weekDayOptions = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

export type TrainingSchedule = {
  petId: PetId;
  title: string;
  type: TrainingSession['type'];
  durationMin?: number;
  distanceMi?: number;
  frequency: TrainingFrequency;
  days: number[];
  startDate: string;
  time: string;
  notes?: string;
};

const toLocalDateTime = (dateValue: string, timeValue: string) => {
  const [year, month, day] = dateValue.split('-').map((part) => Number(part));
  const [hours, minutes] = timeValue.split(':').map((part) => Number(part));
  return new Date(year, month - 1, day, hours, minutes || 0, 0, 0);
};

export const buildTrainingSessions = (schedule: TrainingSchedule): TrainingSession[] => {
  const baseDate = toLocalDateTime(schedule.startDate, schedule.time);
  const dates: Date[] = [];
  const horizonDays = 7;

  if (schedule.frequency === 'once') {
    dates.push(baseDate);
  } else {
    for (let offset = 0; offset < horizonDays; offset += 1) {
      const candidate = addDays(baseDate, offset);
      const day = candidate.getDay();
      if (schedule.frequency === 'daily') {
        dates.push(candidate);
      } else if (schedule.frequency === 'weekday' && day >= 1 && day <= 5) {
        dates.push(candidate);
      } else if (schedule.frequency === 'three' && dates.length < 3) {
        dates.push(candidate);
      } else if (schedule.frequency === 'custom' && schedule.days.includes(day)) {
        dates.push(candidate);
      }
    }
  }

  return dates.map((date) => ({
    id: nanoid(),
    petId: schedule.petId,
    title: schedule.title,
    dateTimeISO: date.toISOString(),
    durationMin: schedule.durationMin,
    distanceMi: schedule.distanceMi,
    type: schedule.type,
    notes: schedule.notes,
    createdAt: new Date().toISOString(),
  }));
};
