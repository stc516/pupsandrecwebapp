import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import type { TrainingSession } from '../../types';
import {
  trainingFrequencyOptions,
  weekDayOptions,
  type TrainingFrequency,
  type TrainingSchedule,
} from './trainingUtils';

export type TrainingPreset = {
  id: string;
  title: string;
  durationMin?: number;
  distanceMi?: number;
  type: TrainingSession['type'];
  icon: ReactNode;
};

const defaultTime = '18:00';

export const ScheduleTrainingModal = ({
  open,
  preset,
  onClose,
  onSchedule,
}: {
  open: boolean;
  preset: TrainingPreset | null;
  onClose: () => void;
  onSchedule: (schedule: Omit<TrainingSchedule, 'petId'>) => void;
}) => {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState<number | ''>('');
  const [distanceMi, setDistanceMi] = useState<number | ''>('');
  const [frequency, setFrequency] = useState<TrainingFrequency>('once');
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(defaultTime);

  useEffect(() => {
    if (!preset) return;
    setTitle(preset.title);
    setDurationMin(preset.durationMin ?? '');
    setDistanceMi(preset.distanceMi ?? '');
    setFrequency('once');
    setDays([1, 3, 5]);
    setStartDate(new Date().toISOString().slice(0, 10));
    setTime(defaultTime);
  }, [preset]);

  const showCustomDays = frequency === 'custom';
  const showDistance = Boolean(preset?.distanceMi);
  const showDuration = !showDistance;

  const toggleDay = (value: number) => {
    setDays((prev) =>
      prev.includes(value) ? prev.filter((day) => day !== value) : [...prev, value],
    );
  };

  const canSubmit = title.trim().length > 0;

  const summary = useMemo(() => {
    if (showDistance && distanceMi) return `${distanceMi} mi`;
    if (!showDistance && durationMin) return `${durationMin} min`;
    return 'Custom';
  }, [distanceMi, durationMin, showDistance]);

  if (!open || !preset) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
      <Card padding="lg" className="w-full max-w-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Training</p>
            <h3 className="text-xl font-semibold text-brand-primary">Schedule this session</h3>
            <p className="text-sm text-text-secondary">Set a quick plan for the next week.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-text-secondary hover:bg-brand-subtle">
            <X size={16} />
          </button>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3 text-sm text-brand-primary">
          <span className="font-semibold">{title || preset.title}</span> · {summary}
        </div>

        <label className="block text-sm font-medium text-brand-primary/90">
          Session name
          <input
            className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        {showDuration && (
          <label className="block text-sm font-medium text-brand-primary/90">
            Duration (min)
            <input
              type="number"
              min={5}
              className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              value={durationMin}
              onChange={(event) => setDurationMin(event.target.value ? Number(event.target.value) : '')}
            />
          </label>
        )}

        {showDistance && (
          <label className="block text-sm font-medium text-brand-primary/90">
            Distance (mi)
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              value={distanceMi}
              onChange={(event) => setDistanceMi(event.target.value ? Number(event.target.value) : '')}
            />
          </label>
        )}

        <div>
          <p className="text-sm font-semibold text-brand-primary/80">Frequency</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {trainingFrequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFrequency(option.value)}
                className={clsx(
                  'rounded-full px-3 py-1 text-xs font-semibold transition',
                  frequency === option.value
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-subtle text-brand-primary hover:bg-brand-primary/10',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {showCustomDays && (
          <div>
            <p className="text-sm font-semibold text-brand-primary/80">Pick days</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {weekDayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={clsx(
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    days.includes(day.value)
                      ? 'bg-brand-accent text-white'
                      : 'border border-brand-border text-brand-primary hover:bg-brand-subtle',
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-brand-primary/90">
            Start date
            <input
              type="date"
              className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-brand-primary/90">
            Time
            <input
              type="time"
              className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!preset) return;
              onSchedule({
                title: title.trim() || preset.title,
                durationMin: typeof durationMin === 'number' ? durationMin : undefined,
                distanceMi: typeof distanceMi === 'number' ? distanceMi : undefined,
                type: preset.type,
                frequency,
                days,
                startDate,
                time,
              });
            }}
          >
            Add to calendar
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
};
