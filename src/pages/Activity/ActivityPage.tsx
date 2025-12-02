import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import clsx from 'clsx';

import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { TagChip } from '../../components/ui/Tag';
import { PageLayout } from '../../components/layout/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate, formatTime } from '../../utils/dates';
import { getXpForActivity } from '../../utils/xp';
import { useToast } from '../../components/ui/ToastProvider';
import { isValidUrl } from '../../utils/validation';
import type { Activity } from '../../types';

const typeOptions = ['walk', 'park', 'training', 'play', 'other'] as const;
type ActivityTypeOption = (typeof typeOptions)[number];

export const ActivityPage = () => {
  const {
    activities,
    selectedPetId,
    pets,
    addActivity,
    updateActivity,
    deleteActivity,
  } = useAppState();
  const { pushToast } = useToast();
  const [formState, setFormState] = useState({
    petId: selectedPetId,
    type: 'walk' as ActivityTypeOption,
    date: new Date().toISOString().slice(0, 16),
    durationMinutes: 30,
    distanceKm: 3,
    notes: '',
    photoUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editState, setEditState] = useState({
    petId: selectedPetId,
    type: 'walk' as ActivityTypeOption,
    date: new Date().toISOString().slice(0, 16),
    durationMinutes: 0,
    distanceKm: 0,
    notes: '',
    photoUrl: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const selectedActivities = useMemo(
    () => activities.filter((activity) => activity.petId === selectedPetId),
    [activities, selectedPetId],
  );

  useEffect(() => {
    setFormState((prev) => ({ ...prev, petId: selectedPetId }));
  }, [selectedPetId]);

  const validateForm = (stateToValidate: typeof formState) => {
    const nextErrors: Record<string, string> = {};
    if (!stateToValidate.petId) {
      nextErrors.petId = 'Choose a pet.';
    }
    if (!stateToValidate.date) {
      nextErrors.date = 'Pick a date and time.';
    }
    if (!stateToValidate.type) {
      nextErrors.type = 'Choose an activity type.';
    }
    if (stateToValidate.durationMinutes < 0) {
      nextErrors.durationMinutes = 'Duration must be zero or more.';
    }
    if (stateToValidate.distanceKm < 0) {
      nextErrors.distanceKm = 'Distance must be zero or more.';
    }
    if (stateToValidate.photoUrl && !isValidUrl(stateToValidate.photoUrl)) {
      nextErrors.photoUrl = 'Enter a valid URL.';
    }
    return nextErrors;
  };

  const fieldClasses = (hasError: boolean) =>
    clsx(
      'mt-1 rounded-2xl border border-brand-border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent',
      hasError && 'border-red-300 focus-visible:outline-red-400',
    );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(formState);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      pushToast({ tone: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    addActivity({
      petId: formState.petId ?? selectedPetId,
      type: formState.type,
      date: new Date(formState.date).toISOString(),
      durationMinutes: Number(formState.durationMinutes) || undefined,
      distanceKm: Number(formState.distanceKm) || undefined,
      notes: formState.notes,
      photoUrl: formState.photoUrl,
    });
    setFormState((prev) => ({ ...prev, notes: '', photoUrl: '' }));
    setErrors({});
    pushToast({ tone: 'success', message: 'Activity saved.' });
  };

  const startEditing = (activity: Activity) => {
    setEditingActivity(activity);
    setEditErrors({});
    setEditState({
      petId: activity.petId,
      type: activity.type,
      date: new Date(activity.date).toISOString().slice(0, 16),
      durationMinutes: activity.durationMinutes ?? 0,
      distanceKm: activity.distanceKm ?? 0,
      notes: activity.notes ?? '',
      photoUrl: activity.photoUrl ?? '',
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingActivity) return;
    const nextErrors = validateForm(editState);
    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      pushToast({ tone: 'error', message: 'Fix the highlighted fields before saving.' });
      return;
    }
    updateActivity({
      id: editingActivity.id,
      updates: {
        petId: editState.petId,
        type: editState.type,
        date: new Date(editState.date).toISOString(),
        durationMinutes: Number(editState.durationMinutes) || undefined,
        distanceKm: Number(editState.distanceKm) || undefined,
        notes: editState.notes,
        photoUrl: editState.photoUrl,
      },
    });
    setEditingActivity(null);
    setEditErrors({});
    pushToast({ tone: 'success', message: 'Activity updated.' });
  };

  const handleDeleteActivity = (activity: Activity) => {
    if (!window.confirm('Delete this activity?')) return;
    deleteActivity(activity.id);
    if (editingActivity?.id === activity.id) {
      setEditingActivity(null);
      setEditErrors({});
    }
    pushToast({ tone: 'success', message: 'Activity deleted.' });
  };

  return (
    <PageLayout
      title="Activity Hub"
      subtitle="Track walks, playdates, and milestones"
      actions={
        <SecondaryButton
          type="button"
          onClick={() => setFormState((prev) => ({ ...prev, date: new Date().toISOString().slice(0, 16) }))}
        >
          Now
        </SecondaryButton>
      }
    >
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-2" padding="lg">
          <h3 className="text-lg font-semibold text-brand-primary">Add Activity</h3>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Pet
              <select
                className={fieldClasses(Boolean(errors.petId))}
                value={formState.petId}
                onChange={(event) => setFormState((prev) => ({ ...prev, petId: event.target.value }))}
                aria-invalid={Boolean(errors.petId)}
              >
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
              {errors.petId && <p className="mt-1 text-xs text-red-500">{errors.petId}</p>}
            </label>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Type
              <select
                className={fieldClasses(Boolean(errors.type))}
                aria-invalid={Boolean(errors.type)}
                value={formState.type}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, type: event.target.value as ActivityTypeOption }))
                }
              >
                {typeOptions.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
            </label>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Date & Time
              <input
                type="datetime-local"
                className={fieldClasses(Boolean(errors.date))}
                value={formState.date}
                onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                aria-invalid={Boolean(errors.date)}
              />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Duration (min)
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={fieldClasses(Boolean(errors.durationMinutes))}
                  value={formState.durationMinutes}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, durationMinutes: Number(event.target.value) }))
                  }
                  aria-invalid={Boolean(errors.durationMinutes)}
                />
                {errors.durationMinutes && (
                  <p className="mt-1 text-xs text-red-500">{errors.durationMinutes}</p>
                )}
              </label>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Distance (km)
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  inputMode="decimal"
                  className={fieldClasses(Boolean(errors.distanceKm))}
                  value={formState.distanceKm}
                  onChange={(event) => setFormState((prev) => ({ ...prev, distanceKm: Number(event.target.value) }))}
                  aria-invalid={Boolean(errors.distanceKm)}
                />
                {errors.distanceKm && <p className="mt-1 text-xs text-red-500">{errors.distanceKm}</p>}
              </label>
            </div>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Notes
              <textarea
                className={fieldClasses(false)}
                rows={3}
                value={formState.notes}
                onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Sunrise walk, met new friend, etc."
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-brand-primary/90">
              Photo URL
              <input
                type="url"
                className={fieldClasses(Boolean(errors.photoUrl))}
                value={formState.photoUrl}
                onChange={(event) => setFormState((prev) => ({ ...prev, photoUrl: event.target.value }))}
                aria-invalid={Boolean(errors.photoUrl)}
              />
              {errors.photoUrl && <p className="mt-1 text-xs text-red-500">{errors.photoUrl}</p>}
            </label>
            <PrimaryButton type="submit" startIcon={<PlusCircle size={16} />}>Save Activity</PrimaryButton>
          </form>
        </Card>
        {editingActivity && (
          <Card className="md:col-span-2" padding="lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-primary">Edit Activity</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingActivity(null);
                  setEditErrors({});
                }}
                className="text-sm font-semibold text-text-secondary"
              >
                Cancel
              </button>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleEditSubmit}>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Pet
                <select
                  className={fieldClasses(Boolean(editErrors.petId))}
                  value={editState.petId}
                  onChange={(event) => setEditState((prev) => ({ ...prev, petId: event.target.value }))}
                  aria-invalid={Boolean(editErrors.petId)}
                >
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
                {editErrors.petId && <p className="mt-1 text-xs text-red-500">{editErrors.petId}</p>}
              </label>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Type
                <select
                  className={fieldClasses(Boolean(editErrors.type))}
                  value={editState.type}
                  onChange={(event) => setEditState((prev) => ({ ...prev, type: event.target.value as ActivityTypeOption }))}
                >
                  {typeOptions.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                {editErrors.type && <p className="mt-1 text-xs text-red-500">{editErrors.type}</p>}
              </label>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Date & Time
                <input
                  type="datetime-local"
                  className={fieldClasses(Boolean(editErrors.date))}
                  value={editState.date}
                  onChange={(event) => setEditState((prev) => ({ ...prev, date: event.target.value }))}
                />
                {editErrors.date && <p className="mt-1 text-xs text-red-500">{editErrors.date}</p>}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Duration (min)
                  <input
                    type="number"
                    min={0}
                    className={fieldClasses(Boolean(editErrors.durationMinutes))}
                    value={editState.durationMinutes}
                    onChange={(event) =>
                      setEditState((prev) => ({ ...prev, durationMinutes: Number(event.target.value) }))
                    }
                  />
                  {editErrors.durationMinutes && (
                    <p className="mt-1 text-xs text-red-500">{editErrors.durationMinutes}</p>
                  )}
                </label>
                <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                  Distance (km)
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    className={fieldClasses(Boolean(editErrors.distanceKm))}
                    value={editState.distanceKm}
                    onChange={(event) => setEditState((prev) => ({ ...prev, distanceKm: Number(event.target.value) }))}
                  />
                  {editErrors.distanceKm && <p className="mt-1 text-xs text-red-500">{editErrors.distanceKm}</p>}
                </label>
              </div>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Notes
                <textarea
                  className={fieldClasses(false)}
                  rows={3}
                  value={editState.notes}
                  onChange={(event) => setEditState((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-brand-primary/90">
                Photo URL
                <input
                  type="url"
                  className={fieldClasses(Boolean(editErrors.photoUrl))}
                  value={editState.photoUrl}
                  onChange={(event) => setEditState((prev) => ({ ...prev, photoUrl: event.target.value }))}
                />
                {editErrors.photoUrl && <p className="mt-1 text-xs text-red-500">{editErrors.photoUrl}</p>}
              </label>
              <PrimaryButton type="submit" startIcon={<Pencil size={16} />}>
                Save changes
              </PrimaryButton>
            </form>
          </Card>
        )}
        <Card className="md:col-span-3" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-primary">Recent Logs</h3>
            <TagChip variant="accent">{selectedActivities.length} total</TagChip>
          </div>
          <div className="mt-4 space-y-3">
            {selectedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-3 rounded-3xl border border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold capitalize text-brand-primary">{activity.type}</p>
                    <span className="text-xs text-text-muted">
                      {formatDate(activity.date)} · {formatTime(activity.date)}
                    </span>
                  </div>
                  {activity.notes && <p className="mt-2 text-sm text-text-secondary">{activity.notes}</p>}
                </div>
                <div className="flex flex-col items-start gap-1 text-sm text-text-secondary sm:items-end">
                  {activity.durationMinutes && <span>{activity.durationMinutes} min</span>}
                  {activity.distanceKm && <span>{activity.distanceKm} km</span>}
                  <span className="font-semibold text-brand-accent">+{getXpForActivity(activity.type)} XP</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(activity)}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteActivity(activity)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-100 px-3 py-1 text-xs font-semibold text-red-600"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {selectedActivities.length === 0 && (
              <p className="rounded-2xl bg-brand-subtle p-4 text-sm text-text-secondary">No activities yet for this pup. Start one today!</p>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
