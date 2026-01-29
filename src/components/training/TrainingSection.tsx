import { CalendarClock, CalendarPlus, Dumbbell, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import { TagChip } from '../ui/Tag';
import { useTraining } from '../../context/TrainingContext';
import { useAppState } from '../../hooks/useAppState';
import { useToast } from '../ui/ToastProvider';
import type { TrainingSession } from '../../types';
import { ScheduleTrainingModal, type TrainingPreset } from './ScheduleTrainingModal';
import { buildTrainingSessions, trainingFrequencyOptions, weekDayOptions, type TrainingFrequency } from './trainingUtils';

const presets: TrainingPreset[] = [
  { id: 'obedience', title: '20 min Obedience', type: 'obedience', durationMin: 20, icon: <Dumbbell size={16} /> },
  { id: 'offleash', title: '15 min Off-Leash Training', type: 'offleash', durationMin: 15, icon: <Dumbbell size={16} /> },
  { id: 'walk', title: '2 Mile Walk (Training Walk)', type: 'walk', distanceMi: 2, icon: <MapPin size={16} /> },
  { id: 'recall', title: '10 min Recall + Focus', type: 'recall', durationMin: 10, icon: <Dumbbell size={16} /> },
  { id: 'puppy', title: '5 min Puppy Basics (Sit/Down/Stay)', type: 'puppy', durationMin: 5, icon: <Dumbbell size={16} /> },
];

export const TrainingSection = () => {
  const { sessions, addSessions, removeSession } = useTraining();
  const { selectedPetId, selectedPet } = useAppState();
  const { pushToast } = useToast();
  const canSchedule = Boolean(selectedPetId);
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [activePreset, setActivePreset] = useState<TrainingPreset | null>(null);

  const [customTitle, setCustomTitle] = useState('');
  const [customDuration, setCustomDuration] = useState('15');
  const [customDistance, setCustomDistance] = useState('');
  const [customFrequency, setCustomFrequency] = useState<TrainingFrequency>('once');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [customTime, setCustomTime] = useState('18:00');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().slice(0, 10));

  const upcomingSessions = useMemo(() => {
    const now = new Date();
    const oneWeek = new Date();
    oneWeek.setDate(oneWeek.getDate() + 7);
    return sessions
      .filter((session) => session.petId === selectedPetId)
      .filter((session) => new Date(session.dateTimeISO) >= now && new Date(session.dateTimeISO) <= oneWeek)
      .sort((a, b) => new Date(a.dateTimeISO).getTime() - new Date(b.dateTimeISO).getTime());
  }, [selectedPetId, sessions]);

  const handleSchedule = (newSessions: TrainingSession[]) => {
    if (newSessions.length === 0) return;
    addSessions(newSessions);
    pushToast({ tone: 'success', message: `Added ${newSessions.length} session${newSessions.length === 1 ? '' : 's'}.` });
  };

  const handleCustomSchedule = () => {
    if (!selectedPetId) return;
    const sessions = buildTrainingSessions({
      petId: selectedPetId,
      title: customTitle.trim() || 'Custom training',
      type: 'custom',
      durationMin: customDuration ? Number(customDuration) : undefined,
      distanceMi: customDistance ? Number(customDistance) : undefined,
      frequency: customFrequency,
      daysOfWeek: customDays,
      timeOfDay: customTime,
      startDateISO: customStartDate,
    });
    handleSchedule(sessions);
  };

  return (
    <Card padding="lg" className="border border-brand-border bg-white/90">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Training sessions</p>
          <h3 className="text-lg font-semibold text-brand-primary">Quick presets or build your own</h3>
          <p className="text-sm text-text-secondary">
            Schedule short sessions that keep {selectedPet?.name ?? 'your pup'} engaged.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              mode === 'quick' ? 'bg-brand-accent text-white' : 'border border-brand-border text-brand-primary'
            }`}
          >
            Quick Add
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              mode === 'custom' ? 'bg-brand-accent text-white' : 'border border-brand-border text-brand-primary'
            }`}
          >
            Custom Plan
          </button>
        </div>
      </div>

      {mode === 'quick' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setActivePreset(preset)}
              disabled={!canSchedule}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                canSchedule
                  ? 'border-brand-border bg-brand-subtle/60 text-brand-primary hover:border-brand-accent'
                  : 'border-brand-border/60 bg-slate-50 text-text-muted cursor-not-allowed'
              }`}
            >
              <span className="rounded-full bg-white p-2 text-brand-primary">{preset.icon}</span>
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      )}

      {mode === 'custom' && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Session title
              <input
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Start date
              <input
                type="date"
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={customStartDate}
                onChange={(event) => setCustomStartDate(event.target.value)}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Duration (min)
              <input
                type="number"
                min={0}
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={customDuration}
                onChange={(event) => setCustomDuration(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Distance (mi)
              <input
                type="number"
                min={0}
                step={0.1}
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={customDistance}
                onChange={(event) => setCustomDistance(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Time
              <input
                type="time"
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={customTime}
                onChange={(event) => setCustomTime(event.target.value)}
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary">Frequency</p>
            <div className="flex flex-wrap gap-2">
              {trainingFrequencyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCustomFrequency(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    customFrequency === option.value
                      ? 'bg-brand-accent text-white'
                      : 'border border-brand-border text-brand-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {customFrequency === 'custom' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-secondary">Pick days</p>
              <div className="flex flex-wrap gap-2">
                {weekDayOptions.map((day) => {
                  const isSelected = customDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() =>
                        setCustomDays((prev) =>
                          prev.includes(day.value) ? prev.filter((item) => item !== day.value) : [...prev, day.value],
                        )
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isSelected
                          ? 'bg-brand-accent text-white'
                          : 'border border-brand-border text-brand-primary'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <PrimaryButton onClick={handleCustomSchedule} startIcon={<CalendarPlus size={16} />} disabled={!canSchedule}>
            Add to calendar
          </PrimaryButton>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-primary">Upcoming training</p>
          <CalendarClock size={16} className="text-brand-accent" />
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-border bg-white/70 p-4 text-sm text-text-secondary">
            No sessions scheduled yet.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white/80 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-brand-primary">{session.title}</p>
                  <p className="text-xs text-text-secondary">{new Date(session.dateTimeISO).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  {session.durationMin ? <TagChip>{session.durationMin} min</TagChip> : null}
                  {session.distanceMi ? <TagChip>{session.distanceMi} mi</TagChip> : null}
                  <SecondaryButton
                    className="px-3 py-1 text-xs"
                    onClick={() => removeSession(session.id)}
                  >
                    Remove
                  </SecondaryButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScheduleTrainingModal
        open={Boolean(activePreset)}
        preset={activePreset}
        petId={selectedPetId ?? ''}
        onClose={() => setActivePreset(null)}
        onSchedule={handleSchedule}
      />
    </Card>
  );
};
