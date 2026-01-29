import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import type { TrainingSession } from '../../types';
import { trainingFrequencyOptions, weekDayOptions, type TrainingFrequency, type TrainingSchedule, buildTrainingSessions } from './trainingUtils';

export type TrainingPreset = {
  id: string;
  title: string;
  type: TrainingSession['type'];
  durationMin?: number;
  distanceMi?: number;
  icon: ReactNode;
};

export const ScheduleTrainingModal = ({
  open,
  preset,
  petId,
  onClose,
  onSchedule,
}: {
  open: boolean;
  preset: TrainingPreset | null;
  petId: string;
  onClose: () => void;
  onSchedule: (sessions: TrainingSession[]) => void;
}) => {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState<string>('');
  const [distanceMi, setDistanceMi] = useState<string>('');
  const [frequency, setFrequency] = useState<TrainingFrequency>('once');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [timeOfDay, setTimeOfDay] = useState('18:00');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open || !preset) return;
    setTitle(preset.title);
    setDurationMin(preset.durationMin ? String(preset.durationMin) : '');
    setDistanceMi(preset.distanceMi ? String(preset.distanceMi) : '');
    setFrequency('once');
    setDaysOfWeek([]);
    setTimeOfDay('18:00');
    setStartDate(new Date().toISOString().slice(0, 10));
  }, [open, preset]);

  const schedule = useMemo<TrainingSchedule | null>(() => {
    if (!preset) return null;
    return {
      petId,
      title: title.trim() || preset.title,
      type: preset.type,
      durationMin: durationMin ? Number(durationMin) : preset.durationMin,
      distanceMi: distanceMi ? Number(distanceMi) : preset.distanceMi,
      frequency,
      daysOfWeek,
      timeOfDay,
      startDateISO: startDate,
    };
  }, [daysOfWeek, distanceMi, durationMin, frequency, petId, preset, startDate, timeOfDay, title]);

  const handleSubmit = () => {
    if (!schedule) return;
    const sessions = buildTrainingSessions(schedule);
    onSchedule(sessions);
    onClose();
  };

  if (!open || !preset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <Card padding="lg" className="w-full max-w-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Schedule this session</p>
            <h3 className="text-lg font-semibold text-brand-primary">{preset.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-brand-border p-2">
            <X size={14} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Session name
            <input
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Time
            <input
              type="time"
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={timeOfDay}
              onChange={(event) => setTimeOfDay(event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Duration (min)
            <input
              type="number"
              min={0}
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={durationMin}
              onChange={(event) => setDurationMin(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Distance (mi)
            <input
              type="number"
              min={0}
              step={0.1}
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={distanceMi}
              onChange={(event) => setDistanceMi(event.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
          Start date
          <input
            type="date"
            className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary">Frequency</p>
          <div className="flex flex-wrap gap-2">
            {trainingFrequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFrequency(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  frequency === option.value
                    ? 'bg-brand-accent text-white'
                    : 'border border-brand-border bg-white text-brand-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {frequency === 'custom' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary">Pick days</p>
            <div className="flex flex-wrap gap-2">
              {weekDayOptions.map((day) => {
                const isSelected = daysOfWeek.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      setDaysOfWeek((prev) =>
                        prev.includes(day.value) ? prev.filter((item) => item !== day.value) : [...prev, day.value],
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isSelected
                        ? 'bg-brand-accent text-white'
                        : 'border border-brand-border bg-white text-brand-primary'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={handleSubmit}>Add to calendar</PrimaryButton>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        </div>
      </Card>
    </div>
  );
};
