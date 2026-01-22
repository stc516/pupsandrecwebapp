import { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Dog,
  Flag,
  MapPinned,
  Sparkles,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { addDays, endOfDay, isWithinInterval, startOfDay } from 'date-fns';

import { Card } from '../ui/Card';
import { PrimaryButton } from '../ui/Button';
import { TagChip } from '../ui/Tag';
import { useToast } from '../ui/ToastProvider';
import { useAppState } from '../../hooks/useAppState';
import { useTraining } from '../../context/TrainingContext';
import type { TrainingSession } from '../../types';
import { formatDate, formatTime } from '../../utils/dates';
import { ScheduleTrainingModal, type TrainingPreset } from './ScheduleTrainingModal';
import {
  buildTrainingSessions,
  trainingFrequencyOptions,
  type TrainingFrequency,
  weekDayOptions,
} from './trainingUtils';

const presets: TrainingPreset[] = [
  {
    id: 'obedience',
    title: '20 min obedience',
    durationMin: 20,
    type: 'obedience',
    icon: <ClipboardCheck size={18} />,
  },
  {
    id: 'offleash',
    title: '15 min off-leash training',
    durationMin: 15,
    type: 'offleash',
    icon: <Flag size={18} />,
  },
  {
    id: 'walk',
    title: '2 mile walk',
    distanceMi: 2,
    type: 'walk',
    icon: <MapPinned size={18} />,
  },
  {
    id: 'recall',
    title: '10 min recall + focus',
    durationMin: 10,
    type: 'recall',
    icon: <Sparkles size={18} />,
  },
  {
    id: 'puppy',
    title: 'Puppy basics (5 min)',
    durationMin: 5,
    type: 'puppy',
    icon: <Dog size={18} />,
  },
];

const defaultTime = '18:00';

export const TrainingSection = () => {
  const { sessions, addSessions, removeSession } = useTraining();
  const { selectedPetId, selectedPet } = useAppState();
  const { pushToast } = useToast();
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [selectedPreset, setSelectedPreset] = useState<TrainingPreset | null>(null);

  const [customName, setCustomName] = useState('Training session');
  const [customDuration, setCustomDuration] = useState<number | ''>(20);
  const [customFrequency, setCustomFrequency] = useState<TrainingFrequency>('once');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [customStartDate, setCustomStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customTime, setCustomTime] = useState(defaultTime);

  const petLabel = selectedPet?.name ? `${selectedPet.name}'s sessions` : 'Training sessions';

  const upcomingSessions = useMemo(() => {
    if (!selectedPetId) return [];
    const start = startOfDay(new Date());
    const end = endOfDay(addDays(start, 6));
    return sessions
      .filter((session) => session.petId === selectedPetId)
      .filter((session) =>
        isWithinInterval(new Date(session.dateTimeISO), { start, end }),
      )
      .sort((a, b) => new Date(a.dateTimeISO).getTime() - new Date(b.dateTimeISO).getTime());
  }, [selectedPetId, sessions]);

  const handlePresetSchedule = (schedule: {
    title: string;
    durationMin?: number;
    distanceMi?: number;
    type: TrainingSession['type'];
    frequency: TrainingFrequency;
    days: number[];
    startDate: string;
    time: string;
  }) => {
    if (!selectedPetId) {
      pushToast({ tone: 'error', message: 'Select a pet first.' });
      return;
    }
    const sessionsToAdd = buildTrainingSessions({
      petId: selectedPetId,
      ...schedule,
    });
    if (sessionsToAdd.length === 0) {
      pushToast({ tone: 'error', message: 'Choose at least one day.' });
      return;
    }
    addSessions(sessionsToAdd);
    pushToast({ tone: 'success', message: `Added ${sessionsToAdd.length} sessions to your calendar` });
  };

  const toggleDay = (value: number) => {
    setCustomDays((prev) =>
      prev.includes(value) ? prev.filter((day) => day !== value) : [...prev, value],
    );
  };

  const showCustomDays = customFrequency === 'custom';

  return (
    <Card padding="lg" className="border border-brand-border bg-gradient-to-br from-brand-subtle/80 to-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-primary/70">Training sessions</p>
          <h2 className="mt-2 text-2xl font-semibold text-brand-primary">{petLabel}</h2>
          <p className="mt-1 text-sm text-text-secondary">One-off sessions you can schedule fast.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-semibold transition',
              mode === 'quick'
                ? 'bg-brand-primary text-white'
                : 'bg-white text-brand-primary shadow-sm hover:bg-brand-subtle',
            )}
          >
            Quick add
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-semibold transition',
              mode === 'custom'
                ? 'bg-brand-primary text-white'
                : 'bg-white text-brand-primary shadow-sm hover:bg-brand-subtle',
            )}
          >
            Custom plan
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-brand-border/60 bg-brand-ice/60 p-4">
        {mode === 'quick' ? (
          <>
            <p className="text-sm font-semibold text-brand-primary">Quick presets</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-brand-border bg-white/90 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary"
                >
                  <span className="rounded-2xl bg-brand-subtle p-2 text-brand-primary">{preset.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-brand-primary">{preset.title}</p>
                    <p className="text-xs text-text-muted">
                      {preset.durationMin ? `${preset.durationMin} min` : `${preset.distanceMi} mi`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-brand-primary">Build your plan</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-brand-primary/90">
                Session name
                <input
                  className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium text-brand-primary/90">
                Duration (min)
                <input
                  type="number"
                  min={5}
                  className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                  value={customDuration}
                  onChange={(event) => setCustomDuration(event.target.value ? Number(event.target.value) : '')}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-primary/80">Frequency</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {trainingFrequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCustomFrequency(option.value)}
                    className={clsx(
                      'rounded-full px-3 py-1 text-xs font-semibold transition',
                      customFrequency === option.value
                        ? 'bg-brand-primary text-white'
                        : 'bg-white text-brand-primary shadow-sm hover:bg-brand-subtle',
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
                        customDays.includes(day.value)
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
              <label className="text-sm font-medium text-brand-primary/90">
                Start date
                <input
                  type="date"
                  className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium text-brand-primary/90">
                Time
                <input
                  type="time"
                  className="mt-1 w-full rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
                  value={customTime}
                  onChange={(event) => setCustomTime(event.target.value)}
                />
              </label>
            </div>

            <PrimaryButton
              type="button"
              onClick={() =>
                handlePresetSchedule({
                  title: customName.trim() || 'Training session',
                  durationMin: typeof customDuration === 'number' ? customDuration : undefined,
                  type: 'custom',
                  distanceMi: undefined,
                  frequency: customFrequency,
                  days: customDays,
                  startDate: customStartDate,
                  time: customTime,
                })
              }
            >
              Add to calendar
            </PrimaryButton>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-primary">Upcoming training (next 7 days)</p>
          {upcomingSessions.length > 0 && (
            <TagChip variant="accent">{upcomingSessions.length} sessions</TagChip>
          )}
        </div>
        {upcomingSessions.length === 0 && (
          <Card padding="md" className="border border-dashed border-brand-border bg-white/70 text-sm text-text-secondary">
            No training sessions scheduled yet.
          </Card>
        )}
        {upcomingSessions.map((session) => (
          <div
            key={session.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white/90 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold text-brand-primary">{session.title}</p>
              <p className="text-xs text-text-muted">
                {formatDate(session.dateTimeISO, 'EEE, MMM d')} · {formatTime(session.dateTimeISO)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {session.durationMin && <TagChip>{session.durationMin} min</TagChip>}
              {session.distanceMi && <TagChip>{session.distanceMi} mi</TagChip>}
              <button
                type="button"
                onClick={() => removeSession(session.id)}
                className="inline-flex items-center gap-1 rounded-full border border-brand-border px-2.5 py-1 text-xs font-semibold text-brand-primary hover:border-brand-primary"
              >
                <X size={12} />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-brand-border bg-white/80 px-4 py-3 text-xs font-semibold text-brand-primary/70">
        Coming soon: skill plans &amp; streaks
      </div>

      <ScheduleTrainingModal
        open={Boolean(selectedPreset)}
        preset={selectedPreset}
        onClose={() => setSelectedPreset(null)}
        onSchedule={(schedule) => {
          handlePresetSchedule(schedule);
          setSelectedPreset(null);
        }}
      />
    </Card>
  );
};
