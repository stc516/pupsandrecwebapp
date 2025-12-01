import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { PlusCircle } from 'lucide-react';
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

const typeOptions = ['walk', 'park', 'training', 'play', 'other'] as const;
type ActivityTypeOption = (typeof typeOptions)[number];

export const ActivityPage = () => {
  const { activities, selectedPetId, pets, addActivity, setSelectedPet } = useAppState();
  const { pushToast } = useToast();
  const [formState, setFormState] = useState({
    type: 'walk' as ActivityTypeOption,
    date: new Date().toISOString().slice(0, 16),
    durationMinutes: 30,
    distanceKm: 3,
    notes: '',
    photoUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedActivities = useMemo(
    () => activities.filter((activity) => activity.petId === selectedPetId),
    [activities, selectedPetId],
  );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formState.date) {
      nextErrors.date = 'Pick a date and time.';
    }
    if (!formState.type) {
      nextErrors.type = 'Choose an activity type.';
    }
    if (formState.durationMinutes < 0) {
      nextErrors.durationMinutes = 'Duration must be zero or more.';
    }
    if (formState.distanceKm < 0) {
      nextErrors.distanceKm = 'Distance must be zero or more.';
    }
    if (formState.photoUrl && !isValidUrl(formState.photoUrl)) {
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
    if (!selectedPetId) return;
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      pushToast({ tone: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }
    addActivity({
      petId: selectedPetId,
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
                className={fieldClasses(false)}
                value={selectedPetId}
                onChange={(event) => setSelectedPet(event.target.value)}
              >
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
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
        <Card className="md:col-span-3" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-primary">Recent Logs</h3>
            <TagChip variant="accent">{selectedActivities.length} total</TagChip>
          </div>
          <div className="mt-4 space-y-3">
            {selectedActivities.map((activity) => (
              <div key={activity.id} className="flex flex-col gap-2 rounded-3xl border border-brand-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold capitalize text-brand-primary">{activity.type}</p>
                  <p className="text-xs text-text-muted">
                    {formatDate(activity.date)} · {formatTime(activity.date)}
                  </p>
                  {activity.notes && <p className="mt-2 text-sm text-text-secondary">{activity.notes}</p>}
                </div>
                <div className="flex flex-col items-start gap-1 text-sm text-text-secondary md:items-end">
                  {activity.durationMinutes && <span>{activity.durationMinutes} min</span>}
                  {activity.distanceKm && <span>{activity.distanceKm} km</span>}
                  <span className="font-semibold text-brand-accent">+{getXpForActivity(activity.type)} XP</span>
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
