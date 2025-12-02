import { addMonths, subMonths } from 'date-fns';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';

import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { TagChip } from '../../components/ui/Tag';
import { PageLayout } from '../../components/layout/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { buildMonthMatrix, formatDate, formatTime, sameDay } from '../../utils/dates';
import { useToast } from '../../components/ui/ToastProvider';

const reminderTypes = ['walk', 'vet-appointment', 'medication', 'grooming', 'other'] as const;
type ReminderType = (typeof reminderTypes)[number];

export const CalendarPage = () => {
  const {
    reminders,
    selectedPetId,
    addReminder,
    updateReminder,
    deleteReminder,
  } = useAppState();
  const { pushToast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formState, setFormState] = useState({
    type: 'walk' as ReminderType,
    title: '',
    dateTime: new Date().toISOString().slice(0, 16),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editState, setEditState] = useState({
    type: 'walk' as ReminderType,
    title: '',
    dateTime: new Date().toISOString().slice(0, 16),
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const monthMatrix = useMemo(() => buildMonthMatrix(currentMonth), [currentMonth]);
  const dayReminders = reminders.filter(
    (reminder) => reminder.petId === selectedPetId && sameDay(reminder.dateTime, selectedDate),
  );

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
    });
    setFormState((prev) => ({ ...prev, title: '' }));
    setErrors({});
    pushToast({ tone: 'success', message: 'Reminder added.' });
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
      },
    });
    setEditingReminderId(null);
    pushToast({ tone: 'success', message: 'Reminder updated.' });
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
              <p className="text-xs text-text-muted">Tap a day to view reminders</p>
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
            <div className="min-w-[28rem]">
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-text-secondary">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {monthMatrix.flat().map((day) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isSelected = sameDay(day, selectedDate);
                  const matches = reminders.filter(
                    (reminder) => reminder.petId === selectedPetId && sameDay(reminder.dateTime, day),
                  );
                  return (
                    <button
                      key={day.toISOString()}
                      className={`flex h-16 flex-col items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                        isSelected
                          ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                          : 'border-brand-border bg-white text-brand-primary'
                      } ${isCurrentMonth ? '' : 'text-text-muted'}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <span>{day.getDate()}</span>
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
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-brand-primary">Reminders on {formatDate(selectedDate)}</h3>
            <div className="mt-3 space-y-3">
              {dayReminders.map((reminder) => (
                <div key={reminder.id} className="rounded-2xl border border-brand-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-brand-primary">{reminder.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                        <Clock size={14} /> {formatTime(reminder.dateTime)}
                      </p>
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
                </div>
              ))}
              {dayReminders.length === 0 && (
                <p className="rounded-2xl bg-brand-subtle p-4 text-sm text-text-secondary">No reminders for this date.</p>
              )}
            </div>
          </Card>
          {editingReminderId && (
            <Card padding="lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-primary">Edit Reminder</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingReminderId(null);
                    setEditErrors({});
                  }}
                  className="text-sm font-semibold text-text-secondary"
                >
                  Cancel
                </button>
              </div>
              <form className="mt-4 space-y-4" onSubmit={handleEditSubmit}>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Title
                  <input
                    className={fieldClasses(Boolean(editErrors.title))}
                    value={editState.title}
                    onChange={(event) => setEditState((prev) => ({ ...prev, title: event.target.value }))}
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
                      setEditState((prev) => ({ ...prev, type: event.target.value as ReminderType }))
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
                    className={fieldClasses(Boolean(editErrors.dateTime))}
                    value={editState.dateTime}
                    onChange={(event) => setEditState((prev) => ({ ...prev, dateTime: event.target.value }))}
                    aria-invalid={Boolean(editErrors.dateTime)}
                  />
                  {editErrors.dateTime && <p className="mt-1 text-xs text-red-500">{editErrors.dateTime}</p>}
                </label>
                <PrimaryButton type="submit" startIcon={<CalendarDays size={16} />}>Save changes</PrimaryButton>
              </form>
            </Card>
          )}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-brand-primary">Add Reminder</h3>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
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
              <PrimaryButton type="submit" startIcon={<CalendarDays size={16} />}>Save Reminder</PrimaryButton>
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
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
