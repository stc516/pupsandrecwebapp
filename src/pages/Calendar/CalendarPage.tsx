import { addDays, addMonths, differenceInCalendarDays, differenceInCalendarMonths, startOfDay, subMonths } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Dumbbell, NotebookPen, Pencil, Repeat, Sparkles, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { TagChip } from '../../components/ui/Tag';
import { PageLayout } from '../../layouts/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { buildMonthMatrix, formatDate, formatTime, sameDay } from '../../utils/dates';
import { useToast } from '../../components/ui/ToastProvider';
import type { Reminder } from '../../types';

const reminderTypes = ['walk', 'vet-appointment', 'medication', 'grooming', 'other'] as const;
type ReminderType = (typeof reminderTypes)[number];
type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly';

const defaultRecurrence = { frequency: 'none' as RecurrenceFrequency, interval: 1, until: '' };

const occursOnDate = (reminder: Reminder, date: Date) => {
  const start = new Date(reminder.dateTime);
  const normalizedDate = startOfDay(date);
  const normalizedStart = startOfDay(start);

  if (sameDay(normalizedStart, normalizedDate)) return true;

  const recurrence = reminder.recurrence;
  if (!recurrence || recurrence.frequency === 'none') return false;
  if (recurrence.until) {
    const until = startOfDay(new Date(recurrence.until));
    if (normalizedDate.getTime() > until.getTime()) return false;
  }

  const interval = recurrence.interval ?? 1;
  switch (recurrence.frequency) {
    case 'daily': {
      const diffDays = differenceInCalendarDays(normalizedDate, normalizedStart);
      return diffDays >= 0 && diffDays % interval === 0;
    }
    case 'weekly': {
      const diffDays = differenceInCalendarDays(normalizedDate, normalizedStart);
      return (
        diffDays >= 0 &&
        normalizedDate.getDay() === normalizedStart.getDay() &&
        Math.floor(diffDays / 7) % interval === 0
      );
    }
    case 'monthly': {
      const diffMonths = differenceInCalendarMonths(normalizedDate, normalizedStart);
      return diffMonths >= 0 && normalizedDate.getDate() === normalizedStart.getDate() && diffMonths % interval === 0;
    }
    default:
      return false;
  }
};

const recurrenceLabel = (recurrence?: Reminder['recurrence']) => {
  if (!recurrence || recurrence.frequency === 'none') return null;
  const { frequency, interval = 1, until } = recurrence;
  const freqLabel =
    frequency === 'daily' ? 'Daily' : frequency === 'weekly' ? 'Weekly' : frequency === 'monthly' ? 'Monthly' : '';
  const label = interval > 1 ? `${freqLabel} · every ${interval}` : freqLabel;
  const untilLabel = until ? ` until ${formatDate(new Date(until))}` : '';
  return `${label}${untilLabel}`;
};

export const CalendarPage = () => {
  const {
    reminders,
    activities,
    selectedPetId,
    pets,
    addReminder,
    updateReminder,
    deleteReminder,
  } = useAppState();
  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null;
  const { pushToast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formState, setFormState] = useState({
    type: 'walk' as ReminderType,
    title: '',
    dateTime: new Date().toISOString().slice(0, 16),
    recurrence: { ...defaultRecurrence },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editState, setEditState] = useState({
    type: 'walk' as ReminderType,
    title: '',
    dateTime: new Date().toISOString().slice(0, 16),
    recurrence: { ...defaultRecurrence },
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const monthMatrix = useMemo(() => buildMonthMatrix(currentMonth), [currentMonth]);
  const dayReminders = reminders.filter(
    (reminder) => reminder.petId === selectedPetId && occursOnDate(reminder, selectedDate),
  );
  const trainingActivities = useMemo(
    () => activities.filter((activity) => activity.petId === selectedPetId && activity.type === 'training'),
    [activities, selectedPetId],
  );
  const dayTraining = useMemo(
    () =>
      trainingActivities
        .filter((activity) => sameDay(activity.date, selectedDate))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [selectedDate, trainingActivities],
  );
  const trainingWeekSummary = useMemo(() => {
    const cutoff = addDays(startOfDay(new Date()), -6).getTime();
    let minutes = 0;
    const daySet = new Set<number>();
    trainingActivities.forEach((activity) => {
      const day = startOfDay(new Date(activity.date)).getTime();
      if (day >= cutoff) {
        daySet.add(day);
        minutes += activity.durationMinutes ?? 0;
      }
    });
    return { dayCount: daySet.size, minutes };
  }, [trainingActivities]);
  const trainingStreak = useMemo(() => {
    if (trainingActivities.length === 0) return 0;
    const daySet = new Set(trainingActivities.map((activity) => startOfDay(new Date(activity.date)).getTime()));
    let streak = 0;
    let cursor = startOfDay(new Date());
    while (daySet.has(cursor.getTime())) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }, [trainingActivities]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // eslint-disable-next-line no-console
    console.info(`[CalendarPage] selectedPetId=${selectedPetId} fetchedCount=${reminders.length}`);
  }, [reminders.length, selectedPetId]);

  const fieldClasses = (hasError: boolean) =>
    clsx(
      'mt-1 rounded-2xl border border-brand-border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent',
      hasError && 'border-red-300 focus-visible:outline-red-400',
    );

  const validateForm = (stateToValidate: typeof formState | typeof editState) => {
    const nextErrors: Record<string, string> = {};
    if (!stateToValidate.title.trim()) {
      nextErrors.title = 'Give the reminder a title.';
    }
    if (!stateToValidate.dateTime) {
      nextErrors.dateTime = 'Pick a date and time.';
    }
    return nextErrors;
  };

  const buildRecurrencePayload = (recurrenceState: typeof formState['recurrence']) => {
    if (!recurrenceState || recurrenceState.frequency === 'none') return undefined;
    const interval = Number(recurrenceState.interval) || 1;
    return {
      frequency: recurrenceState.frequency,
      interval,
      until: recurrenceState.until || undefined,
    } satisfies Reminder['recurrence'];
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPetId) return;
    const nextErrors = validateForm(formState);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      pushToast({ tone: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    addReminder({
      petId: selectedPetId,
      type: formState.type,
      title: formState.title,
      dateTime: new Date(formState.dateTime).toISOString(),
      recurrence: buildRecurrencePayload(formState.recurrence),
    })
      .then(() => {
        setFormState((prev) => ({ ...prev, title: '', recurrence: { ...defaultRecurrence } }));
        setErrors({});
        pushToast({ tone: 'success', message: 'Reminder added.' });
      })
      .catch((error: unknown) => {
        pushToast({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Select a pet first.',
        });
      });
  };

  const startEditingReminder = (reminderId: string) => {
    const reminder = reminders.find((item) => item.id === reminderId);
    if (!reminder) return;
    setEditingReminderId(reminderId);
    setEditErrors({});
    setEditState({
      type: reminder.type,
      title: reminder.title,
      dateTime: reminder.dateTime.slice(0, 16),
      recurrence: {
        frequency: reminder.recurrence?.frequency ?? 'none',
        interval: reminder.recurrence?.interval ?? 1,
        until: reminder.recurrence?.until ?? '',
      },
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingReminderId) return;
    const nextErrors = validateForm(editState);
    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      pushToast({ tone: 'error', message: 'Fix highlighted fields before saving.' });
      return;
    }
    updateReminder({
      id: editingReminderId,
      updates: {
        type: editState.type,
        title: editState.title,
        dateTime: new Date(editState.dateTime).toISOString(),
        recurrence: buildRecurrencePayload(editState.recurrence),
      },
    })
      .then(() => {
        setEditingReminderId(null);
        pushToast({ tone: 'success', message: 'Reminder updated.' });
      })
      .catch((error: unknown) => {
        pushToast({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Select a pet first.',
        });
      });
  };

  const handleDeleteReminder = (reminderId: string) => {
    if (!window.confirm('Delete this reminder?')) return;
    deleteReminder(reminderId);
    if (editingReminderId === reminderId) {
      setEditingReminderId(null);
      setEditErrors({});
    }
    pushToast({ tone: 'success', message: 'Reminder deleted.' });
  };

  return (
    <PageLayout title="Calendar" subtitle="Plan your walks, vet visits, and reminders">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="lg">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              className="rounded-full border border-brand-border p-2"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 text-center">
              <p className="text-lg font-semibold text-brand-primary">{formatDate(currentMonth, 'MMMM yyyy')}</p>
              <p className="text-xs text-text-muted">Pick a day to plan training and reminders</p>
            </div>
            <button
              className="rounded-full border border-brand-border p-2"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto pb-2 sm:pb-0">
            <div className="min-w-full sm:min-w-[26rem]">
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-text-secondary">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {monthMatrix.flat().map((day) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isSelected = sameDay(day, selectedDate);
                  const isToday = sameDay(day, new Date());
                  const matches = reminders.filter((reminder) => reminder.petId === selectedPetId && occursOnDate(reminder, day));
                  const hasRecurring = matches.some(
                    (reminder) => reminder.recurrence && reminder.recurrence.frequency !== 'none',
                  );
                  return (
                    <button
                      key={day.toISOString()}
                      className={`flex h-14 sm:h-16 flex-col items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                        isSelected
                          ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                          : 'border-brand-border bg-white text-brand-primary'
                      } ${isCurrentMonth ? '' : 'text-text-muted'} ${isToday ? 'ring-1 ring-brand-accent/30' : ''}`}
                      onClick={() => setSelectedDate(day)}
                      aria-label={`${formatDate(day)}${matches.length ? `, ${matches.length} reminder${matches.length === 1 ? '' : 's'}` : ''}${
                        hasRecurring ? ', repeating reminders present' : ''
                      }${isToday ? ', today' : ''}`}
                    >
                      <span className="flex items-center gap-1">
                        <span>{day.getDate()}</span>
                        {hasRecurring && <Repeat size={12} className="text-brand-accent" aria-hidden />}
                      </span>
                      {matches.length > 0 && (
                        <span className="mt-1 rounded-full bg-brand-accent/20 px-2 text-xs text-brand-primary">
                          {matches.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <Card padding="lg" className="border border-brand-accent/15 bg-gradient-to-br from-brand-accent/10 via-white to-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Training</p>
                <h3 className="text-lg font-semibold text-brand-primary">
                  Training on {formatDate(selectedDate)}
                </h3>
                <p className="text-xs text-text-secondary">
                  Streak {trainingStreak} day{trainingStreak === 1 ? '' : 's'} · {trainingWeekSummary.dayCount} training days this week
                </p>
              </div>
              <Link
                to="/activity"
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
              >
                Log training
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {dayTraining.length > 0 ? (
                dayTraining.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white/80 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-brand-primary">Training session</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                        <Clock size={12} /> {formatTime(activity.date)}
                      </p>
                      {activity.notes && <p className="mt-1 text-xs text-text-muted">{activity.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      {activity.durationMinutes ? <TagChip>{activity.durationMinutes} min</TagChip> : null}
                      <span className="flex items-center gap-1 text-emerald-600">
                        <span className="relative flex h-4 w-4 items-center justify-center">
                          <span className="absolute h-4 w-4 animate-ping rounded-full bg-emerald-300/40" />
                          <CheckCircle2 size={14} className="relative" />
                        </span>
                        Done
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2 rounded-2xl border border-dashed border-brand-border bg-white/60 p-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Dumbbell size={16} />
                    <span className="text-sm font-semibold">No training logged yet.</span>
                  </div>
                  <p>Keep the rhythm — even 10 minutes counts.</p>
                </div>
              )}
            </div>
          </Card>
          <Card padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-brand-primary">Reminders</h3>
              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector('form[data-reminder-form="add"]') as HTMLFormElement | null;
                  if (form) {
                    form.scrollIntoView({ behavior: 'smooth' });
                    const input = form.querySelector('input, select, textarea') as HTMLElement | null;
                    if (input) input.focus();
                  }
                }}
                className="inline-flex items-center gap-1 rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary"
              >
                <CalendarDays size={12} />
                Add reminder
              </button>
            </div>
            <p className="mt-1 text-xs text-text-secondary">For {formatDate(selectedDate)}</p>
            <div className="mt-3 space-y-3">
              {dayReminders.map((reminder) => {
                const isEditing = editingReminderId === reminder.id;
                return (
                  <div key={reminder.id} className="rounded-2xl border border-brand-border p-4">
                    {isEditing ? (
                      <form className="space-y-3" onSubmit={handleEditSubmit}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                            Title
                            <input
                              className={fieldClasses(Boolean(editErrors.title))}
                              value={editState.title}
                              onChange={(event) =>
                                setEditState((prev) => ({ ...prev, title: event.target.value }))
                              }
                              aria-invalid={Boolean(editErrors.title)}
                            />
                            {editErrors.title && <p className="mt-1 text-xs text-red-500">{editErrors.title}</p>}
                          </label>
                          <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                            Type
                            <select
                              className={fieldClasses(false)}
                              value={editState.type}
                              onChange={(event) =>
                                setEditState((prev) => ({
                                  ...prev,
                                  type: event.target.value as ReminderType,
                                }))
                              }
                            >
                              {reminderTypes.map((type) => (
                                <option key={type}>{type}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                          When
                          <input
                            type="datetime-local"
                            className={fieldClasses(Boolean(editErrors.dateTime))}
                            value={editState.dateTime}
                            onChange={(event) => setEditState((prev) => ({ ...prev, dateTime: event.target.value }))}
                            aria-invalid={Boolean(editErrors.dateTime)}
                          />
                          {editErrors.dateTime && <p className="mt-1 text-xs text-red-500">{editErrors.dateTime}</p>}
                        </label>
                        <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                          Repeats
                          <select
                            className={fieldClasses(false)}
                            value={editState.recurrence.frequency}
                            onChange={(event) =>
                              setEditState((prev) => ({
                                ...prev,
                                recurrence: { ...prev.recurrence, frequency: event.target.value as RecurrenceFrequency },
                              }))
                            }
                          >
                            <option value="none">Does not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </label>
                        {editState.recurrence.frequency !== 'none' && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                              Every
                              <input
                                type="number"
                                min={1}
                                className={fieldClasses(false)}
                                value={editState.recurrence.interval}
                                onChange={(event) =>
                                  setEditState((prev) => ({
                                    ...prev,
                                    recurrence: { ...prev.recurrence, interval: Number(event.target.value) || 1 },
                                  }))
                                }
                              />
                            </label>
                            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                              Ends (optional)
                              <input
                                type="date"
                                className={fieldClasses(false)}
                                value={editState.recurrence.until}
                                onChange={(event) =>
                                  setEditState((prev) => ({
                                    ...prev,
                                    recurrence: { ...prev.recurrence, until: event.target.value },
                                  }))
                                }
                              />
                            </label>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <PrimaryButton type="submit" startIcon={<Pencil size={14} />}>
                            Save
                          </PrimaryButton>
                          <SecondaryButton
                            type="button"
                            onClick={() => {
                              setEditingReminderId(null);
                              setEditErrors({});
                            }}
                          >
                            Cancel
                          </SecondaryButton>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-brand-primary">{reminder.title}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                            <Clock size={14} /> {formatTime(reminder.dateTime)}
                          </p>
                          {reminder.recurrence?.frequency && reminder.recurrence.frequency !== 'none' && (
                            <p className="mt-1 text-xs text-brand-primary">{recurrenceLabel(reminder.recurrence)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <TagChip>{reminder.type}</TagChip>
                          <button
                            type="button"
                            onClick={() => startEditingReminder(reminder.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-brand-border px-2.5 py-1 text-xs font-semibold text-brand-primary"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-100 px-2.5 py-1 text-xs font-semibold text-red-600"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {dayReminders.length === 0 && (
                <div className="space-y-2 rounded-2xl bg-brand-subtle p-4 text-sm text-text-secondary">
                  <p className="font-semibold text-brand-primary">
                    No reminders yet for {selectedPet?.name ?? 'this pet'}.
                  </p>
                  <p>Add one so today stays smooth and predictable.</p>
                  <button
                    type="button"
                    onClick={() => {
                      const form = document.querySelector('form[data-reminder-form="add"]') as HTMLFormElement | null;
                      if (form) {
                        form.scrollIntoView({ behavior: 'smooth' });
                        const input = form.querySelector('input, select, textarea') as HTMLElement | null;
                        if (input) input.focus();
                      }
                    }}
                    className="inline-flex w-fit items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
                  >
                    Add reminder
                  </button>
                </div>
              )}
            </div>
            <div className="mt-6 border-t border-brand-border pt-6">
              <h4 className="text-base font-semibold text-brand-primary">Add a reminder</h4>
              <form className="mt-4 space-y-4" data-reminder-form="add" onSubmit={handleSubmit}>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Title
                  <input
                    className={fieldClasses(Boolean(errors.title))}
                    value={formState.title}
                    onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                    aria-invalid={Boolean(errors.title)}
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                </label>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Type
                  <select
                    className={fieldClasses(false)}
                    value={formState.type}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, type: event.target.value as ReminderType }))
                    }
                  >
                    {reminderTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  When
                  <input
                    type="datetime-local"
                    className={fieldClasses(Boolean(errors.dateTime))}
                    value={formState.dateTime}
                    onChange={(event) => setFormState((prev) => ({ ...prev, dateTime: event.target.value }))}
                    aria-invalid={Boolean(errors.dateTime)}
                  />
                  {errors.dateTime && <p className="mt-1 text-xs text-red-500">{errors.dateTime}</p>}
                </label>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Repeats
                  <select
                    className={fieldClasses(false)}
                    value={formState.recurrence.frequency}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        recurrence: { ...prev.recurrence, frequency: event.target.value as RecurrenceFrequency },
                      }))
                    }
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                {formState.recurrence.frequency !== 'none' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                      Every
                      <input
                        type="number"
                        min={1}
                        className={fieldClasses(false)}
                        value={formState.recurrence.interval}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            recurrence: { ...prev.recurrence, interval: Number(event.target.value) || 1 },
                          }))
                        }
                      />
                    </label>
                    <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                      Ends (optional)
                      <input
                        type="date"
                        className={fieldClasses(false)}
                        value={formState.recurrence.until}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            recurrence: { ...prev.recurrence, until: event.target.value },
                          }))
                        }
                      />
                    </label>
                  </div>
                )}
                <PrimaryButton type="submit" startIcon={<CalendarDays size={16} />}>
                  Save reminder
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setSelectedDate(now);
                    setCurrentMonth(now);
                  }}
                >
                  Jump to today
                </SecondaryButton>
              </form>
            </div>
          </Card>
          <Card padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-brand-primary">Actions</h3>
                <p className="text-xs text-text-secondary">Keep the loop moving with one clear next step.</p>
              </div>
              <Sparkles size={18} className="text-brand-accent" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="grid gap-2 text-xs text-text-secondary sm:grid-cols-2">
                <Link
                  to="/activity"
                  className="flex items-center gap-2 rounded-2xl border border-brand-border bg-brand-subtle/60 px-3 py-2 text-sm font-semibold text-brand-primary"
                >
                  <Dumbbell size={14} />
                  Log training
                </Link>
                <Link
                  to="/journal"
                  className="flex items-center gap-2 rounded-2xl border border-brand-border bg-brand-subtle/60 px-3 py-2 text-sm font-semibold text-brand-primary"
                >
                  <NotebookPen size={14} />
                  Write journal
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const form = document.querySelector('form[data-reminder-form="add"]') as HTMLFormElement | null;
                    if (form) {
                      form.scrollIntoView({ behavior: 'smooth' });
                      const input = form.querySelector('input, select, textarea') as HTMLElement | null;
                      if (input) input.focus();
                    }
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-primary"
                >
                  <CalendarDays size={14} />
                  Add reminder
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
